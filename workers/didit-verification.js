/**
 * Yaqin — Didit verification Cloudflare Worker
 *
 * Routes:
 *   POST /api/didit/session  Authorization: Bearer <Firebase ID token>
 *   POST /api/didit/webhook  Didit V3 signed webhook
 *
 * Required Worker secrets/vars:
 *   DIDIT_API_KEY (Secret)
 *   DIDIT_WEBHOOK_SECRET (Secret; create Didit webhook destination first)
 *   DIDIT_WORKFLOW_ID (Text; workflow ID from Didit)
 *   FIREBASE_WEB_API_KEY (Text; public Firebase Web API key)
 *   FIREBASE_PROJECT_ID (Text: yaqin-3f9f9)
 *   FIREBASE_CLIENT_EMAIL (Secret: service account client_email)
 *   FIREBASE_PRIVATE_KEY (Secret: service account private_key, PEM)
 *
 * Never put secrets in browser code or commit them to Git.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://sardoryakubov94-source.github.io",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders }
  });
}

function b64url(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToArrayBuffer(pem) {
  pem = String(pem).replace(/\\\\n/g, "\\n");
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const raw = atob(body);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out.buffer;
}

async function serviceAccountToken(env) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: env.FIREBASE_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  }));
  const unsigned = header + "." + claim;
  const key = await crypto.subtle.importKey(
    "pkcs8", pemToArrayBuffer(env.FIREBASE_PRIVATE_KEY),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const assertion = unsigned + "." + b64url(new Uint8Array(signature));
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error("Firebase service account token olish muvaffaqiyatsiz.");
  return data.access_token;
}

async function firebaseUserFromIdToken(idToken, env) {
  const response = await fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(env.FIREBASE_WEB_API_KEY),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    }
  );
  const data = await response.json();
  const user = data.users && data.users[0];
  if (!response.ok || !user || !user.localId) return null;
  return { uid: user.localId, phoneNumber: user.phoneNumber || "" };
}

async function firestorePatch(uid, values, env) {
  const token = await serviceAccountToken(env);
  const fields = {};
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "boolean") fields[key] = { booleanValue: value };
    else if (typeof value === "number") fields[key] = { integerValue: String(value) };
    else if (value === null) fields[key] = { nullValue: null };
    else fields[key] = { stringValue: String(value) };
  }
  const mask = Object.keys(values).map(k => "updateMask.fieldPaths=" + encodeURIComponent(k)).join("&");
  const url = "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(env.FIREBASE_PROJECT_ID) +
    "/databases/(default)/documents/verification/" + encodeURIComponent(uid) + "?" + mask;
  const response = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ fields })
  });
  if (!response.ok) throw new Error("Firestore verification yozuvi yangilanmadi: " + (await response.text()).slice(0, 500));
}

async function webhookEventExists(eventId, env) {
  const token = await serviceAccountToken(env);
  const url = "https://firestore.googleapis.com/v1/projects/" +
    encodeURIComponent(env.FIREBASE_PROJECT_ID) +
    "/databases/(default)/documents/diditEvents/" + encodeURIComponent(eventId);
  const response = await fetch(url, { headers: { Authorization: "Bearer " + token } });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error("Webhook event tekshirilmadi: " + (await response.text()).slice(0, 400));
  return true;
}

async function saveWebhookEvent(eventId, env) {
  const token = await serviceAccountToken(env);
  const response = await fetch(
    "https://firestore.googleapis.com/v1/projects/" +
      encodeURIComponent(env.FIREBASE_PROJECT_ID) +
      "/databases/(default)/documents/diditEvents?documentId=" + encodeURIComponent(eventId),
    {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { createdAt: { integerValue: String(Date.now()) } } })
    }
  );
  if (response.status === 409) return false;
  if (!response.ok) throw new Error("Webhook event qaydi saqlanmadi: " + (await response.text()).slice(0, 400));
  return true;
}

function shortenFloats(value) {
  if (Array.isArray(value)) return value.map(shortenFloats);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shortenFloats(v)]));
  }
  if (typeof value === "number" && !Number.isInteger(value) && value % 1 === 0) return Math.trunc(value);
  return value;
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((out, key) => {
      out[key] = sortKeys(value[key]);
      return out;
    }, {});
  }
  return value;
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function validWebhookSignature(rawBody, signature, secret) {
  let parsed;
  try { parsed = JSON.parse(rawBody); } catch { return null; }
  const canonical = JSON.stringify(sortKeys(shortenFloats(parsed)));
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(canonical));
  const expected = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
  if (!constantTimeEqual(expected.toLowerCase(), String(signature || "").toLowerCase())) return null;
  const ts = Number(parsed.timestamp);
  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) return null;
  return parsed;
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const d = new Date(dateOfBirth);
  if (!Number.isFinite(d.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const beforeBirthday = now.getUTCMonth() < d.getUTCMonth() ||
    (now.getUTCMonth() === d.getUTCMonth() && now.getUTCDate() < d.getUTCDate());
  if (beforeBirthday) age--;
  return age;
}

function moduleApproved(items) {
  // Fail closed: an array being present is not proof that a check passed.
  // Didit V3 decision modules must explicitly report Approved.
  return Array.isArray(items) && items.length > 0 &&
    items.every(item => item && String(item.status || "").toLowerCase() === "approved");
}

function hasApprovedModules(decision) {
  // Require explicit successful ID, liveness and face-match decisions.
  // Missing, pending, declined or unknown module statuses never approve a user.
  return !!decision &&
    moduleApproved(decision.id_verifications) &&
    moduleApproved(decision.liveness_checks) &&
    moduleApproved(decision.face_matches);
}

async function handleSession(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return json({ error: "auth_required" }, 401);

  const user = await firebaseUserFromIdToken(match[1], env);
  if (!user) return json({ error: "invalid_firebase_token" }, 401);
  if (!user.phoneNumber) return json({ error: "phone_not_verified" }, 403);

  const response = await fetch("https://verification.didit.me/v3/session/", {
    method: "POST",
    headers: {
      "x-api-key": env.DIDIT_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      workflow_id: env.DIDIT_WORKFLOW_ID,
      vendor_data: user.uid,
      language: "uz"
    })
  });
  const data = await response.json();
  if (!response.ok || !data.url || !data.session_id) {
    return json({ error: "didit_session_failed", detail: data.detail || data.message || "Didit session yaratilmadi" }, 502);
  }
  return json({ url: data.url, session_id: data.session_id });
}

async function handleWebhook(request, env) {
  const raw = await request.text();
  const event = await validWebhookSignature(raw, request.headers.get("X-Signature-V2"), env.DIDIT_WEBHOOK_SECRET);
  if (!event) return new Response("Invalid signature or stale webhook", { status: 401 });

  if (!event.event_id || !event.vendor_data || !event.status) return new Response("Invalid event", { status: 400 });

  // Avoid processing webhook deliveries that have already been recorded.
  if (await webhookEventExists(String(event.event_id), env)) {
    return new Response("ok", { status: 200 });
  }

  const uid = String(event.vendor_data);
  const now = Date.now();

  if (event.status === "Approved") {
    const decision = event.decision || {};
    if (!hasApprovedModules(decision)) {
      await firestorePatch(uid, {
        status: "manual_review",
        provider: "didit",
        updatedAt: now
      }, env);
      return new Response("ok", { status: 200 });
    }
    const idv = decision.id_verifications[0];
    const age = calculateAge(idv.date_of_birth);
    if (!Number.isInteger(age) || age < 18 || age > 120) {
      await firestorePatch(uid, {
        status: "declined",
        identityVerified: false,
        selfieVerified: false,
        ageVerified: false,
        provider: "didit",
        updatedAt: now
      }, env);
      return new Response("ok", { status: 200 });
    }
    await firestorePatch(uid, {
      status: "approved",
      identityVerified: true,
      selfieVerified: true,
      ageVerified: true,
      verifiedAge: age,
      phoneVerified: true,
      provider: "didit",
      diditSessionId: String(event.session_id || ""),
      verifiedAt: now,
      updatedAt: now
    }, env);
  } else if (event.status === "Declined") {
    await firestorePatch(uid, {
      status: "declined",
      identityVerified: false,
      selfieVerified: false,
      ageVerified: false,
      provider: "didit",
      updatedAt: now
    }, env);
  } else if (event.status === "In Review") {
    await firestorePatch(uid, { status: "pending_review", provider: "didit", updatedAt: now }, env);
  } else if (event.status === "Kyc Expired") {
    await firestorePatch(uid, {
      status: "expired",
      identityVerified: false,
      selfieVerified: false,
      ageVerified: false,
      updatedAt: now
    }, env);
  } else if (event.status === "Resubmitted") {
    await firestorePatch(uid, { status: "pending", updatedAt: now }, env);
  } else if (["In Progress", "Awaiting User", "Abandoned", "Expired", "Not Started"].includes(event.status)) {
    await firestorePatch(uid, { status: "in_progress", provider: "didit", updatedAt: now }, env);
  }
  await saveWebhookEvent(String(event.event_id), env);
  return new Response("ok", { status: 200 });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/didit/session" && request.method === "POST") return await handleSession(request, env);
      if (url.pathname === "/api/didit/webhook" && request.method === "POST") return await handleWebhook(request, env);
      if (url.pathname === "/health") return json({ ok: true, service: "yaqin-didit-verification" });
      return json({ error: "not_found" }, 404);
    } catch (error) {
      // Do not log secrets or full webhook bodies.
      console.error("Didit Worker error:", error && error.message ? error.message : "unknown");
      return json({ error: "internal_error" }, 500);
    }
  }
};
