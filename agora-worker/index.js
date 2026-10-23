// Yaqin Agora token Worker (Cloudflare, bepul). Certificate faqat Worker secretida turadi.
import { RtcTokenBuilder, RtcRole } from "agora-token";

const PROJECT = "yaqin-3f9f9";
const APP_ID = "868b06d16f0f43dc82dec0f4fefb23e9";
const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
// Faqat shu saytlardan so'rov qabul qilinadi. O'z domeningiz bo'lsa shu yerga qo'shing.
const ORIGINS = [
  "https://yaqin-3f9f9.web.app",
  "https://yaqin-3f9f9.firebaseapp.com",
  "http://localhost:5000",
  "http://localhost:8080",
];

export default {
  async fetch(req, env) {
    const reqOrigin = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ORIGINS.includes(reqOrigin) ? reqOrigin : ORIGINS[0],
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
      "Content-Type": "application/json",
    };
    const out = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: cors });
    const fail = (error, status) => out({ error }, status);

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST") return fail("Method not allowed", 405);
    if (!env.AGORA_APP_CERT) return fail("AGORA_APP_CERT server siri sozlanmagan.", 500);

    const idToken = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!idToken) return fail("Avval Yaqin hisobingizga kiring.", 401);

    let body;
    try { body = await req.json(); } catch { return fail("Notoʻgʻri soʻrov.", 400); }
    const channel = String(body.channel || "");
    const uid = Number(body.uid);
    if (!/^yq_[A-Za-z0-9_-]{1,60}$/.test(channel) || !Number.isSafeInteger(uid) || uid < 1 || uid > 4294967295)
      return fail("Kanal yoki foydalanuvchi ID notoʻgʻri.", 400);

    const gid = channel.slice(3);
    const h = { Authorization: "Bearer " + idToken };

    // 1) Guruh hujjati. Firestore ID tokenni o'zi tekshiradi (soxta bo'lsa 401/403 qaytaradi).
    const g = await fetch(`${FS}/groups/${encodeURIComponent(gid)}`, { headers: h });
    if (g.status === 401 || g.status === 403) return fail("Sessiya yaroqsiz. Qayta kiring.", 401);
    if (g.status === 404) return fail("Guruh topilmadi.", 404);
    if (!g.ok) return fail("Guruhni tekshirib boʻlmadi.", 502);

    // Token Firestore tomonidan tasdiqlandi, endi undan uid olish xavfsiz.
    let fbUid;
    try { fbUid = jwtUid(idToken); } catch { return fail("Token notoʻgʻri.", 401); }
    if (!fbUid) return fail("Token notoʻgʻri.", 401);

    // 2) Agora UID Firebase UID bilan bog'langan bo'lishi shart.
    if (uid !== hashUid(fbUid)) return fail("Foydalanuvchi ID mos kelmadi.", 403);

    // 3) Guruh aʼzoligi.
    const m = await fetch(`${FS}/groups/${encodeURIComponent(gid)}/members/${encodeURIComponent(fbUid)}`, { headers: h });
    if (m.status === 404 || m.status === 403) return fail("Faqat guruh aʼzolari qoʻngʻiroqqa kira oladi.", 403);
    if (!m.ok) return fail("Aʼzolikni tekshirib boʻlmadi.", 502);

    // 4) Premium muddati.
    const f = (await g.json()).fields || {};
    const pu = f.premiumUntil || {};
    const premiumUntil = Number(pu.integerValue ?? pu.doubleValue ?? 0);
    if (!(premiumUntil > Date.now())) return fail("Guruh Premium muddati tugagan.", 403);

    const expire = Math.floor(Date.now() / 1000) + 3600;
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID, env.AGORA_APP_CERT, channel, uid, RtcRole.PUBLISHER, expire, expire
    );
    return out({ appId: APP_ID, channel, uid, token, expiresAt: expire });
  },
};

function jwtUid(t) {
  const p = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = JSON.parse(atob(p + "=".repeat((4 - (p.length % 4)) % 4)));
  return json.user_id || json.sub;
}
// js/agora-group-call.js dagi uidFor bilan bir xil bo'lishi shart.
function hashUid(v) {
  let h = 2166136261;
  for (let i = 0; i < v.length; i++) { h ^= v.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) || 1;
}
