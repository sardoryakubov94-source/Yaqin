// Yaqin Worker (Cloudflare, bepul, kutubxonasiz): Agora token (guruh + 1:1 qoʻngʻiroq) + Openinary yuklash imzosi.
// Secretlar: AGORA_APP_CERT, OPENINARY_API_KEY (kodga yozilmaydi).
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
