# Yaqin Worker (bepul, kutubxonasiz, ~130 qator)

Uchta ish qiladi:
- `POST /` — guruh ovozli chat / video translatsiya uchun Agora token (1 soatlik)
- `POST /api/game/token` — oʻyin xonasi (ovozli) uchun Agora tokeni
- `POST /api/openinary/sign` — guruhga rasm/video yuklash uchun imzo
- `POST /api/call/token` — shaxsiy qoʻngʻiroq tokeni
- `POST /api/push` — push bildirishnoma (FCM): yangi xabar, kiruvchi qoʻngʻiroq va "Sizga eng mos inson yangi eʼlon joyladi" (anketa asosida, kuniga 2 tagacha)
  - yangi: `type:"game"` — oʻyin xonasi: "Sizga savol yoʻllashdi", "Navbat sizda!", "Sizga oʻpich yuborishdi", "Xonangizga yangi oʻyinchi qoʻshildi"

## Telefondan / brauzerdan deploy (buyruqsiz)
1. Cloudflare → Workers & Pages → `yaqin-agora` → Edit code.
2. Ichidagi hamma narsani o'chirib, `index.js` mazmunini (131 qator) to'liq joylang → Deploy.
3. Settings → Variables and Secrets (Type: Secret):
   - `AGORA_APP_CERT` = Agora Primary Certificate
   - `OPENINARY_API_KEY` = Openinary API kaliti
   - `FIREBASE_SA` = Firebase service account JSON (Project settings → Service accounts → Generate new private key; fayl mazmunini toʻliq joylang)
4. Kutubxona ham, `nodejs_compat` ham kerak emas.

## Buyruq bilan
```
cd agora-worker
npm install
npx wrangler login
npx wrangler deploy
```

## Telefonga push (bildirishnoma) ishlashi uchun 3 ta shart
1. **VAPID kalit:** Firebase Console → Project settings → Cloud Messaging → *Web Push certificates* → *Generate key pair* → ochiq kalitni `js/config.js` dagi `VAPID:""` ichiga qoʻying.
2. **Worker siri:** `FIREBASE_SA` (service account JSON) Worker'da Secret sifatida bor boʻlsin (yuqoridagi 3-qadam).
3. **Worker'ni qayta deploy qiling:** shu papkadagi yangi `index.js` mazmunini Cloudflare → `yaqin-agora` → Edit code ga joylab Deploy qiling (oʻyin xonasi pushlari shu yangilanishda).

Ilovada foydalanuvchi bir marta "Yoqish" ni bosadi (yoki Profil → Bildirishnomalar). Ilova ochiq va koʻrinib turganda tizim bildirishnomasi chiqmaydi (qoʻngʻiroqdan tashqari).
