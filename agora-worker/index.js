// Yaqin Worker (Cloudflare, bepul, kutubxonasiz): Agora token (guruh + 1:1 qoʻngʻiroq) + Openinary yuklash imzosi.
// Secretlar: AGORA_APP_CERT, OPENINARY_API_KEY, FIREBASE_SA (kodga yozilmaydi).
const PROJECT = "yaqin-3f9f9";
const APP_ID = "868b06d16f0f43dc82dec0f4fefb23e9";
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const TOKEN_TTL = 3600; // soniya

// <token-builder> Agora AccessToken2 (007), RTC xizmati
const te = new TextEncoder();
const u16 = n => new Uint8Array([n & 255, (n >> 8) & 255]);
const u32 = n => new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]);
const cat = (...a) => { const o = new Uint8Array(a.reduce((s, x) => s + x.length, 0)); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; };
const pstr = s => { const b = te.encode(s); return cat(u16(b.length), b); };
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, msg));
}
async function deflate(bytes) {
  const cs = new CompressionStream("deflate"), w = cs.writable.getWriter();
  w.write(bytes); w.close();
  return new Uint8Array(await new Response(cs.readable).arrayBuffer());
}
async function rtcToken(appId, cert, channel, uid, ttl) {
  const ts = Math.floor(Date.now() / 1000), salt = 1 + Math.floor(Math.random() * 99999999);
  const key = await hmac(u32(salt), await hmac(u32(ts), te.encode(cert)));
  const service = cat(u16(1), u16(4), u16(1), u32(ttl), u16(2), u32(ttl), u16(3), u32(ttl), u16(4), u32(ttl), pstr(channel), pstr(String(uid)));
  const info = cat(pstr(appId), u32(ts), u32(ttl), u32(salt), u16(1), service);
  const sig = await hmac(key, info);
  const z = await deflate(cat(u16(sig.length), sig, info));
  let bin = ""; for (const b of z) bin += String.fromCharCode(b);
  return "007" + btoa(bin);
}
// </token-builder>

function jwtUid(t) {
  const p = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const j = JSON.parse(atob(p + "=".repeat((4 - (p.length % 4)) % 4)));
  return j.user_id || j.sub;
}
// js/agora-group-call.js dagi uidFor bilan bir xil bo'lishi shart.
function hashUid(v) {
  let h = 2166136261;
  for (let i = 0; i < v.length; i++) { h ^= v.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) || 1;
}

// <push> FCM HTTP v1: service account bilan OAuth tokeni (kutubxonasiz)
const b64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
let saTok = { v: "", exp: 0 };
async function saToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (saTok.v && saTok.exp - 60 > now) return saTok.v;
  const sa = JSON.parse(env.FIREBASE_SA);
  const der = Uint8Array.from(atob(sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "")), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const head = b64u(te.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claim = b64u(te.encode(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })));
  const sig = b64u(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, te.encode(head + "." + claim)));
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + head + "." + claim + "." + sig });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.access_token) throw new Error("Service account tokeni olinmadi: " + (d.error_description || d.error || r.status));
  saTok = { v: d.access_token, exp: now + (d.expires_in || 3600) };
  return saTok.v;
}
// </push>

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": /^https?:\/\/[^/]+$/.test(origin) ? origin : "https://yaqin-3f9f9.web.app",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
      "Content-Type": "application/json",
    };
    const out = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: cors });
    const fail = (e, s) => out({ error: e }, s);

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST") return fail("Method not allowed", 405);

    const idToken = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!idToken) return fail("Avval Yaqin hisobingizga kiring.", 401);
    let body; try { body = await req.json(); } catch { return fail("Notoʻgʻri soʻrov.", 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Notoʻgʻri soʻrov.", 400);
    let uid; try { uid = jwtUid(idToken); } catch { return fail("Token notoʻgʻri.", 401); }
    if (!uid || typeof uid !== "string") return fail("Token notoʻgʻri.", 401);

    // Firestore ID tokenni o'zi tekshiradi va rules bo'yicha ruxsat beradi.
    const fs = p => fetch(FS + p, { headers: { Authorization: "Bearer " + idToken, "User-Agent": "Yaqin-Worker/2" } });
    const enc = encodeURIComponent;
    // Guruh va aʼzolikni tekshiradi. Muvaffaqiyatda guruh maydonlarini qaytaradi.
    async function group(gid) {
      const [g, m] = await Promise.all([fs(`/groups/${enc(gid)}`), fs(`/groups/${enc(gid)}/members/${enc(uid)}`)]);
      if (g.status === 401 || g.status === 403) return { e: ["Sessiya yaroqsiz. Qayta kiring.", 401] };
      if (g.status === 404) return { e: ["Guruh topilmadi.", 404] };
      if (!g.ok) return { e: ["Guruhni tekshirib boʻlmadi.", 502] };
      if (m.status === 404 || m.status === 403) return { e: ["Faqat guruh aʼzolari kira oladi.", 403] };
      if (!m.ok) return { e: ["Aʼzolikni tekshirib boʻlmadi.", 502] };
      return { f: (await g.json()).fields || {} };
    }

    const path = new URL(req.url).pathname;

    // ---- Push bildirishnoma (FCM) ----
    if (path === "/api/push") {
      if (!env.FIREBASE_SA) return fail("FIREBASE_SA Worker siri sozlanmagan.", 500);
      const type = String(body.type || "");
      // ---- "Sizga eng mos inson yangi eʼlon joyladi" (ilovadagi score() formulasi bilan bir xil) ----
      if (type === "match") {
        const id = String(body.adId || "");
        if (!/^[A-Za-z0-9]{10,40}$/.test(id)) return fail("Soʻrov notoʻgʻri.", 400);
        const chk = await fs(`/users/${enc(uid)}`);                 // ID tokenni Firestore tekshiradi
        if (chk.status === 401 || chk.status === 403) return fail("Sessiya yaroqsiz.", 401);
        const str = v => v?.stringValue || "", num = v => Number(v?.integerValue ?? v?.doubleValue ?? 0);
        try {
          const sa = await saToken(env), H = { Authorization: "Bearer " + sa, "Content-Type": "application/json" };
          const DOCS = `projects/${PROJECT}/databases/(default)/documents`;
          const ar = await fetch(`${FS}/ads/${enc(id)}`, { headers: H });
          if (ar.status === 404) return fail("Eʼlon topilmadi.", 404);
          if (!ar.ok) return fail("Eʼlonni oʻqib boʻlmadi.", 502);
          const f = (await ar.json()).fields || {};
          const ad = { g: str(f.g), age: num(f.age), reg: str(f.reg), vil: str(f.vil), pur: str(f.pur), name: str(f.name), uid: str(f.uid), anon: !!f.anon?.booleanValue, ints: (f.ints?.arrayValue?.values || []).map(str) };
          if (str(f.status) !== "active" || f.isDemo?.booleanValue) return out({ sent: 0, skipped: "not-active" });
          if (Date.now() - num(f.t) > 6 * 3600 * 1000) return out({ sent: 0, skipped: "old" });
          if (ad.g !== "kelin" && ad.g !== "kuyov") return out({ sent: 0, skipped: "no-gender" });
          const dd = await fetch(`${FS}/pushLog?documentId=${enc("ad_" + id)}`, { method: "POST", headers: H, body: JSON.stringify({ fields: { t: { integerValue: String(Date.now()) }, from: { stringValue: uid } } }) });
          if (dd.status === 409) return out({ sent: 0, skipped: "duplicate" });
          if (!dd.ok) return fail("Navbatga qoʻyilmadi.", 502);

          // anketasi shu jinsni izlaydigan foydalanuvchilar
          const qr = await fetch(`${FS}:runQuery`, { method: "POST", headers: H, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "users" }], where: { fieldFilter: { field: { fieldPath: "prefs.g" }, op: "EQUAL", value: { stringValue: ad.g === "kelin" ? "erkak" : "ayol" } } }, select: { fields: [{ fieldPath: "prefs" }] }, limit: 500 } }) });
          if (!qr.ok) return fail("Nomzodlarni qidirib boʻlmadi.", 502);
          const cand = [];
          for (const row of await qr.json()) {
            if (!row.document) continue;
            const cu = row.document.name.split("/").pop(); if (cu === ad.uid) continue;
            const pr = row.document.fields?.prefs?.mapValue?.fields || {};
            const p = { reg: str(pr.reg), vil: str(pr.vil), pur: str(pr.pur), age: num(pr.age), ints: (pr.ints?.arrayValue?.values || []).map(str) };
            let sc = 0;
            if (ad.reg && ad.reg === p.reg) sc += 45; else if (ad.vil && ad.vil === p.vil) sc += 25;
            sc += ad.ints.filter(x => p.ints.includes(x)).length * 12;
            if (p.pur && ad.pur === p.pur) sc += 15;
            const dA = Math.abs((ad.age || 0) - (p.age || ad.age || 0)); sc += dA <= 3 ? 10 : dA <= 7 ? 5 : 0;
            if (sc >= 50) cand.push({ uid: cu, sc });
          }
          cand.sort((a, b) => b.sc - a.sc);
          const top = cand.slice(0, 60);
          if (!top.length) return out({ sent: 0, matched: 0 });

          const br = await fetch(`${FS}:batchGet`, { method: "POST", headers: H, body: JSON.stringify({ documents: top.map(c => `${DOCS}/fcm/${c.uid}`), mask: { fieldPaths: ["tokens", "noMatch", "mDay", "mCnt"] } }) });
          const info = {};
          if (br.ok) for (const r of await br.json()) if (r.found) info[r.found.name.split("/").pop()] = r.found.fields || {};
          const day = new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 10);   // Oʻzbekiston kuni
          const pick = [];
          for (const c of top) {
            const fi = info[c.uid] || {};
            if (fi.noMatch?.booleanValue) continue;
            const cnt = str(fi.mDay) === day ? num(fi.mCnt) : 0;
            if (cnt >= 2) continue;                                   // kuniga koʻpi bilan 2 ta
            pick.push({ uid: c.uid, cnt, tokens: (fi.tokens?.arrayValue?.values || []).map(str).filter(Boolean).slice(-2) });
            if (pick.length >= 25) break;
          }
          const title = "Sizga eng mos inson yangi eʼlon joyladi", text = `${ad.anon ? "Anonim nomzod" : ad.name}, ${ad.age} yosh${ad.reg ? " · " + ad.reg : ""}`;
          let sent = 0; const dead = {}; let budget = 38;
          await Promise.all(pick.flatMap(u => u.tokens.map(tk => ({ u, tk }))).slice(0, budget).map(async ({ u, tk }) => {
            const r = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT}/messages:send`, { method: "POST", headers: H, body: JSON.stringify({ message: { token: tk, notification: { title, body: text }, data: { kind: "match", chatId: "", tag: "match", adId: id }, webpush: { headers: { Urgency: "normal", TTL: "86400" } } } }) });
            if (r.ok) sent++; else if (r.status === 404 || /UNREGISTERED/.test(await r.text().catch(() => ""))) (dead[u.uid] = dead[u.uid] || []).push(tk);
          }));
          const now = Date.now(), writes = [];
          for (const u of pick) {
            const nid = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
            writes.push({ update: { name: `${DOCS}/notifs/${nid}`, fields: { to: { stringValue: u.uid }, type: { stringValue: "match" }, title: { stringValue: title }, text: { stringValue: text }, adId: { stringValue: id }, t: { integerValue: String(now) }, read: { booleanValue: false } } }, currentDocument: { exists: false } });
            writes.push({ update: { name: `${DOCS}/fcm/${u.uid}`, fields: { mDay: { stringValue: day }, mCnt: { integerValue: String(u.cnt + 1) } } }, updateMask: { fieldPaths: ["mDay", "mCnt"] } });
            if (dead[u.uid]) writes.push({ transform: { document: `${DOCS}/fcm/${u.uid}`, fieldTransforms: [{ fieldPath: "tokens", removeAllFromArray: { values: dead[u.uid].map(x => ({ stringValue: x })) } }] } });
          }
          if (writes.length) await fetch(`${FS}:commit`, { method: "POST", headers: H, body: JSON.stringify({ writes }) }).catch(() => {});
          return out({ matched: cand.length, notified: pick.length, sent });
        } catch (e) { return fail("Moslik xabari yuborilmadi: " + (e && e.message ? e.message : e), 502); }
      }
      let peer, title, text, kind = "", tag, dedupe, chatId = "";
      if (type === "chat") {
        const cid = String(body.chatId || ""), mid = String(body.msgId || "");
        if (!/^[A-Za-z0-9_-]{1,128}$/.test(cid) || !/^[A-Za-z0-9]{10,40}$/.test(mid)) return fail("Soʻrov notoʻgʻri.", 400);
        const [c, m] = await Promise.all([fs(`/chats/${enc(cid)}`), fs(`/chats/${enc(cid)}/msgs/${enc(mid)}`)]);
        if ([c.status, m.status].some(x => x === 401 || x === 403)) return fail("Ruxsat yoʻq.", 403);
        if (!c.ok || !m.ok) return fail("Xabar topilmadi.", 404);
        const cf = (await c.json()).fields || {}, mf = (await m.json()).fields || {};
        const members = (cf.members?.arrayValue?.values || []).map(v => v.stringValue);
        if (!members.includes(uid) || mf.from?.stringValue !== uid) return fail("Ruxsat yoʻq.", 403);
        if (Math.abs(Date.now() - Number(mf.t?.integerValue || 0)) > 120000) return fail("Xabar eski.", 409);
        kind = mf.kind?.stringValue || "";
        if (kind === "call") return out({ sent: 0, skipped: "call-log" });
        peer = members.find(x => x !== uid); chatId = cid; tag = "chat-" + cid; dedupe = "m_" + mid;
        title = mf.name?.stringValue || "Yaqin";
        const t = mf.text?.stringValue || "";
        text = kind === "media" ? "📷 Rasm" : kind === "voice" ? "🎤 Ovozli xabar" : kind === "sticker" ? "Stiker " + t : t;
      } else if (type === "call") {
        const id = String(body.callId || "");
        if (!/^[A-Za-z0-9]{10,40}$/.test(id)) return fail("Soʻrov notoʻgʻri.", 400);
        const c = await fs(`/calls/${enc(id)}`);
        if (c.status === 401 || c.status === 403) return fail("Ruxsat yoʻq.", 403);
        if (!c.ok) return fail("Qoʻngʻiroq topilmadi.", 404);
        const f = (await c.json()).fields || {};
        if (f.from?.stringValue !== uid || f.status?.stringValue !== "ringing") return fail("Ruxsat yoʻq.", 403);
        if (Math.abs(Date.now() - Number(f.t?.integerValue || 0)) > 90000) return fail("Qoʻngʻiroq eski.", 409);
        peer = f.to?.stringValue; kind = "call"; chatId = f.chatId?.stringValue || ""; tag = "call"; dedupe = "c_" + id;
        title = f.fromName?.stringValue || "Yaqin";
        text = f.mode?.stringValue === "video" ? "📹 Video qoʻngʻiroq qilmoqda…" : "📞 Qoʻngʻiroq qilmoqda…";
      } else return fail("Push turi notoʻgʻri.", 400);
      if (!peer) return fail("Qabul qiluvchi topilmadi.", 404);

      try {
        const sa = await saToken(env), H = { Authorization: "Bearer " + sa, "Content-Type": "application/json" };
        // bir xabarga bitta push (takror soʻrovlardan himoya)
        const dd = await fetch(`${FS}/pushLog?documentId=${enc(dedupe)}`, { method: "POST", headers: H, body: JSON.stringify({ fields: { t: { integerValue: String(Date.now()) }, from: { stringValue: uid } } }) });
        if (dd.status === 409) return out({ sent: 0, skipped: "duplicate" });
        if (!dd.ok) return fail("Push navbatga qoʻyilmadi.", 502);
        const fr = await fetch(`${FS}/fcm/${enc(peer)}`, { headers: H });
        if (fr.status === 404) return out({ sent: 0, skipped: "no-token" });
        if (!fr.ok) return fail("Qabul qiluvchi tokenlari oʻqilmadi.", 502);
        const tokens = ((await fr.json()).fields?.tokens?.arrayValue?.values || []).map(v => v.stringValue).filter(Boolean).slice(0, 5);
        const sa0 = JSON.parse(env.FIREBASE_SA); let sent = 0; const dead = [];
        await Promise.all(tokens.map(async tk => {
          const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa0.project_id || PROJECT}/messages:send`, {
            method: "POST", headers: H,
            body: JSON.stringify({ message: { token: tk, notification: { title, body: String(text).slice(0, 120) }, data: { kind, chatId, tag }, webpush: { headers: { Urgency: "high", TTL: kind === "call" ? "45" : "86400" } } } }),
          });
          if (r.ok) sent++; else if (r.status === 404 || /UNREGISTERED/.test(await r.text().catch(() => ""))) dead.push(tk);
        }));
        if (dead.length) await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:commit`, { method: "POST", headers: H, body: JSON.stringify({ writes: [{ transform: { document: `projects/${PROJECT}/databases/(default)/documents/fcm/${peer}`, fieldTransforms: [{ fieldPath: "tokens", removeAllFromArray: { values: dead.map(x => ({ stringValue: x })) } }] } }] }) }).catch(() => {});
        return out({ sent, removed: dead.length });
      } catch (e) { return fail("Push yuborilmadi: " + (e && e.message ? e.message : e), 502); }
    }

    // ---- Openinary: qisqa muddatli yuklash imzosi ----
    if (path === "/api/openinary/sign") {
      if (!env.OPENINARY_API_KEY) return fail("OPENINARY_API_KEY Worker Secret sifatida sozlanmagan.", 500);
      const scope = String(body.scope || "");
      let folder;
      if (scope === "profile" || scope === "ads" || scope === "private") {
        const u = await fs(`/users/${enc(uid)}`);
        if (u.status === 401 || u.status === 403) return fail("Sessiya yaroqsiz. Qayta kiring.", 401);
        if (!u.ok) return fail("Foydalanuvchi hisobini tekshirib boʻlmadi.", u.status === 404 ? 403 : 502);
        folder = `yaqin/users/${uid}/${scope}`;
      } else if (scope === "group") {
        const gid = String(body.groupId || "");
        if (!/^[A-Za-z0-9_-]{1,128}$/.test(gid)) return fail("Guruh ID notoʻgʻri.", 400);
        const r = await group(gid);
        if (r.e) return fail(...r.e);
        if ((r.f.owner?.stringValue || "") !== uid && (r.f.mediaUploadMode?.stringValue || "owner") !== "members")
          return fail("Guruh egasi media yuklashga ruxsat bermagan.", 403);
        folder = `yaqin/groups/${gid}/${uid}`;
      } else return fail("Yuklash turi notoʻgʻri.", 400);

      try {
        const sr = await fetch("https://cdn.openinary.dev/upload/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + env.OPENINARY_API_KEY, "User-Agent": "Yaqin-Worker/2" },
          body: JSON.stringify({ expiresIn: 300, folder }),
        });
        let sd = {}; try { sd = await sr.json(); } catch {}
        if (!sr.ok || !sd.success || !sd.signature || !sd.expires || !sd.folder) return fail(sd.error || "Openinary imzo bera olmadi.", sr.ok ? 502 : sr.status);
        return out({ signature: sd.signature, expires: sd.expires, folder: sd.folder });
      } catch { return fail("Openinary xizmatiga ulanib boʻlmadi.", 502); }
    }

    // ---- Agora: shaxsiy (1:1) qoʻngʻiroq tokeni ----
    if (path === "/api/call/token") {
      if (!env.AGORA_APP_CERT) return fail("AGORA_APP_CERT server siri sozlanmagan.", 500);
      const callId = String(body.callId || "");
      if (!/^[A-Za-z0-9]{10,40}$/.test(callId)) return fail("Qoʻngʻiroq ID notoʻgʻri.", 400);
      const c = await fs(`/calls/${enc(callId)}`);
      if (c.status === 401 || c.status === 403) return fail("Sessiya yaroqsiz yoki bu qoʻngʻiroqqa ruxsat yoʻq.", 401);
      if (c.status === 404) return fail("Qoʻngʻiroq topilmadi.", 404);
      if (!c.ok) return fail("Qoʻngʻiroqni tekshirib boʻlmadi.", 502);
      const f = (await c.json()).fields || {}, st = f.status?.stringValue || "";
      if (uid !== f.from?.stringValue && uid !== f.to?.stringValue) return fail("Bu qoʻngʻiroqqa ruxsat yoʻq.", 403);
      if (st !== "ringing" && st !== "accepted") return fail("Qoʻngʻiroq tugagan.", 403);
      const channel = "yc_" + callId, auid = hashUid(uid);
      const token = await rtcToken(APP_ID, env.AGORA_APP_CERT, channel, auid, TOKEN_TTL);
      return out({ appId: APP_ID, channel, uid: auid, token, expiresAt: Math.floor(Date.now() / 1000) + TOKEN_TTL });
    }

    // ---- Agora: guruh ovozli chat / video translatsiya tokeni ----
    if (!env.AGORA_APP_CERT) return fail("AGORA_APP_CERT server siri sozlanmagan.", 500);
    const channel = String(body.channel || ""), agoraUid = Number(body.uid);
    if (!/^yq_[A-Za-z0-9_-]{1,60}$/.test(channel) || !Number.isSafeInteger(agoraUid) || agoraUid < 1 || agoraUid > 4294967295)
      return fail("Kanal yoki foydalanuvchi ID notoʻgʻri.", 400);
    if (agoraUid !== hashUid(uid)) return fail("Foydalanuvchi ID mos kelmadi.", 403);
    const r = await group(channel.slice(3));
    if (r.e) return fail(...r.e);
    const pu = r.f.premiumUntil || {};
    if (!(Number(pu.integerValue ?? pu.doubleValue ?? 0) > Date.now())) return fail("Guruh Premium muddati tugagan.", 403);
    const token = await rtcToken(APP_ID, env.AGORA_APP_CERT, channel, agoraUid, TOKEN_TTL);
    return out({ appId: APP_ID, channel, uid: agoraUid, token, expiresAt: Math.floor(Date.now() / 1000) + TOKEN_TTL });
  },
};
