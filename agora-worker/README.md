# Yaqin Worker (bepul, kutubxonasiz, ~130 qator)

Ikkita ish qiladi:
- `POST /` — guruh ovozli chat / video translatsiya uchun Agora token (1 soatlik)
- `POST /api/openinary/sign` — guruhga rasm/video yuklash uchun imzo

## Telefondan / brauzerdan deploy (buyruqsiz)
1. Cloudflare → Workers & Pages → `yaqin-agora` → Edit code.
2. Ichidagi hamma narsani o'chirib, `index.js` mazmunini (131 qator) to'liq joylang → Deploy.
3. Settings → Variables and Secrets (Type: Secret):
   - `AGORA_APP_CERT` = Agora Primary Certificate
   - `OPENINARY_API_KEY` = Openinary API kaliti
4. Kutubxona ham, `nodejs_compat` ham kerak emas.

## Buyruq bilan
```
cd agora-worker
npm install
npx wrangler login
npx wrangler deploy
```
