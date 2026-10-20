# Yaqin

Mos juftni topish ilovasi (PWA + Firebase). Build kerak emas: oddiy HTML/CSS/JS.

## Ishga tushirish
1. Firebase Console: Authentication → Email/Password va Google yoqing. Firestore va Storage yarating. Authentication → Settings → Authorized domains ga hosting domenini qoʻshing.
2. `js/firebase-config.js` ga `firebaseConfig` ni qoʻying.
3. Deploy: `npm i -g firebase-tools && firebase login && firebase use <project-id> && firebase deploy` (hosting, firestore.rules va storage.rules birga yuklanadi).
4. Mahalliy sinov: `npx serve .` (`file://` orqali ochmang, modullar ishlamaydi).

## Holat
- Haqiqiy: kirish/roʻyxatdan oʻtish, Google, parolni tiklash, profil, eʼlonlar (umumiy baza), rasm yuklash.
- Hali ulanmagan: real vaqtli chat, guruhlar (`js/config.js`: CHAT_LIVE), push bildirishnoma.
- Toʻlov: `TEST_MODE=true` boʻlsa VIP/qoʻshimcha eʼlon pulsiz. Haqiqiy Click/Payme uchun server (Cloud Function) kerak; shundan keyin `TEST_MODE=false` va VIP/narxni faqat server belgilaydigan qiling.
- Play Market: PWA → Bubblewrap/PWABuilder (TWA). Maxfiylik siyosati, shikoyat/bloklash va 18+ cheklovi shart.
