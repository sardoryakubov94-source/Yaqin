# Yaqin

Mos juftni topish ilovasi (PWA + Firebase). Build kerak emas: oddiy HTML/CSS/JS.

## Ishga tushirish
1. Firebase Console: Authentication → Email/Password va Google yoqing. Firestore va Storage yarating. Authentication → Settings → Authorized domains ga hosting domenini qoʻshing.
2. `js/firebase-config.js` ga `firebaseConfig` ni qoʻying.
3. Deploy: `npm i -g firebase-tools && firebase login && firebase use <project-id> && firebase deploy` (hosting, firestore.rules va storage.rules birga yuklanadi).
4. Mahalliy sinov: `npx serve .` (`file://` orqali ochmang, modullar ishlamaydi).

## Holat
- Haqiqiy: kirish/roʻyxatdan oʻtish, Google, parolni tiklash, profil, eʼlonlar (umumiy baza), rasm yuklash.
- Real vaqtli chat (shaxsiy rasmga ruxsat bilan) va guruhlar ulangan. Hali yoʻq: push bildirishnoma, bloklash, admin panel.
- Toʻlov: `TEST_MODE=true` boʻlsa VIP/qoʻshimcha eʼlon pulsiz. Haqiqiy Click/Payme uchun server (Cloud Function) kerak; shundan keyin `TEST_MODE=false` va VIP/narxni faqat server belgilaydigan qiling.
- Play Market: PWA → Bubblewrap/PWABuilder (TWA). Maxfiylik siyosati, shikoyat/bloklash va 18+ cheklovi shart.

## Admin va toʻlov
1. Firebase Console → Authentication → Users: oʻzingizning UID ni nusxalang.
2. Firestore → collection `admins` → Document ID = UID, maydon: `ok` = true. Shundan keyin Profilda "Admin panel" chiqadi.
3. Admin panel → Sozlama: karta raqamlari va narxlarni kiriting (kod ichida karta raqami saqlanmaydi).
4. Toʻlov oqimi: foydalanuvchi toʻlov soʻraydi → rekvizit oynasi → toʻlaydi → admin "Tasdiqlash" bosadi → eʼlon faollashadi / VIP / yuqoriga koʻtariladi.

## Yordam xizmati va bildirishnomalar
- Foydalanuvchi yozishmalari `support/{uid}` da saqlanadi; admin panel → Yordam bo‘limida ko‘rinadi va javob beriladi.
- Admin panel → Sozlama: "Ishonch telefoni" kiritiladi (Yordam sahifasida ko‘rinadi).
- Bildirishnomalar `notifs` kolleksiyasida: to‘lov natijasi, yordam javobi, yoqtirishlar. Yangilari ajralib turadi.
- Telefon bildirishnomasi ilova ochiq yoki orqa fonda turganda ishlaydi. Ilova butunlay yopiq bo‘lganda push uchun FCM va Cloud Functions (Blaze tarifi) kerak.

## Cloud Functions (push va VIP eslatmasi)
Blaze tarifi kerak. Qadamlar:
1. Firebase Console → Project settings → Cloud Messaging → Web Push certificates → **Generate key pair**. Chiqqan kalitni `js/config.js` dagi `VAPID` ga qo'ying.
2. `cd functions && npm install && cd .. && firebase deploy --only functions,firestore:rules`
3. Funksiyalar: `pushNotif` (har bildirishnomaga push), `pushChat` (yangi chat xabari), `vipExpiry` (har kuni VIP muddati tugaganlarni oddiy qiladi va eslatma yuboradi).
Foydalanuvchi bildirishnomalar oynasida "Yoqish" ni bosgach, qurilma tokeni `fcm/{uid}` ga yoziladi.

## Bloklash
Chat menyusidan "Bloklash": bloklangan foydalanuvchi yoza olmaydi (Rules darajasida), eʼlonlari ham ko'rinmaydi. Profilda "Bloklanganlar" bo'limidan blokdan chiqariladi.

## Openinary media uploads
- Profile images, ad images, private photos, and group-chat media are uploaded to Openinary Cloud; Firestore stores the returned file path rather than a delivery URL.
- In Cloudflare Dashboard → Workers & Pages → `yaqin-agora` → Settings → Variables and Secrets, add `OPENINARY_API_KEY` as a **Secret** (not a plain Variable). Never commit the key or put it in browser code.
- Replace the placeholder in `js/config.js` (`AGORA_TOKEN_URL`) with the actual deployed `yaqin-agora` Worker URL, for example `https://yaqin-agora.<your-subdomain>.workers.dev`. The same Worker URL is used for Agora token requests and `/api/openinary/sign`.
- Deploy the Worker from `agora-worker/` with `npm install` then `npm run deploy`; make sure the Cloudflare secret is set for the Production environment.
- Openinary Cloud upload signatures expire after 5 minutes. The browser uploads directly to `https://cdn.openinary.dev/upload`; the API key remains on the Worker.
