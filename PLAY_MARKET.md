# Yaqin: Play Market'ga chiqarish yo'riqnomasi

## 1. Asosiy manzil (muhim)
GitHub Pages manzili (`.../Yaqin/`) kichik papkada, TWA uchun ildiz domen yaxshiroq. Firebase Hosting'dan foydalaning:
`firebase deploy --only hosting` → `https://yaqin-3f9f9.web.app` (yoki o'z domeningiz).
Auth → Settings → Authorized domains ga shu domenni qo'shing.

## 2. TWA (AAB) yaratish
1. `npm i -g @bubblewrap/cli`
2. `bubblewrap init --manifest https://yaqin-3f9f9.web.app/manifest.json`
   (package: masalan `uz.yaqin.app`, ikonka: `icons/icon-512.png`)
3. `bubblewrap build` → `app-release-bundle.aab` (Play Console'ga yuklanadi). Keystore'ni zaxiralang!
4. Digital Asset Links: `bubblewrap fingerprint` yoki Play Console → App signing → **SHA-256**. `.well-known/assetlinks.json` ni to'ldiring:
```json
[{"relation":["delegate_permission/common.handle_all_urls"],"target":{"namespace":"android_app","package_name":"uz.yaqin.app","sha256_cert_fingerprints":["SHA256_BU_YERGA"]}}]
```
   keyin `firebase deploy --only hosting`.
(Alternativa: pwabuilder.com orqali ham AAB yaratish mumkin.)

## 3. Play Console talablari
- **Maxfiylik siyosati URL:** `https://yaqin-3f9f9.web.app/privacy.html`
- **Hisobni o'chirish URL (Data safety):** `https://yaqin-3f9f9.web.app/delete-account.html` (ilova ichida ham bor: Profil → Hisobni o'chirish)
- **Foydalanish shartlari:** `/terms.html`
- **Maqsadli auditoriya:** faqat 18+. Kontent reytingi so'rovnomasida: tanishuv ilovasi, foydalanuvchi kontenti (UGC) bor.
- **UGC siyosati:** shikoyat, bloklash, moderatsiya (admin panel) mavjud. Tanishuv ilovalari uchun 18+ cheklovi va xavfsizlik vositalari shart: ro'yxatdan o'tishda 18+ roziligi bor.
- **Data safety (taxminiy javoblar):**
  - To'planadi: Ism, Email, Telefon (ixtiyoriy), Rasmlar, Xabarlar, Taxminiy joylashuv (hudud nomi, GPS emas), Foydalanuvchi ID, qurilma tokeni
  - Maqsad: App functionality, Account management, Communications. Reklama yo'q.
  - Uchinchi tomonga sotilmaydi. Shifrlangan uzatiladi (HTTPS). Foydalanuvchi o'chirishni so'ray oladi: Ha.
- **To'lovlar:** hozir qo'lda (karta o'tkazmasi) tasdiqlanadi. Google Play siyosati ilova ichidagi *raqamli* xizmatlar (VIP, yuqoriga ko'tarish) uchun odatda Play Billing talab qiladi. Bu xavf: Click/Payme yoki qo'lda to'lov bilan nashr etilsa ilova rad etilishi mumkin. Play'ga yuborishdan oldin siyosatni tekshiring yoki bu xizmatlarni veb-versiyada qoldirib, ilovada faqat bepul funksiyalarni oching.

## 4. Do'kon matni (taklif)
**Qisqa (80):** Oila qurish uchun mos juftingizni hududingiz va qiziqishlaringiz bo'yicha toping.

**To'liq:** Yaqin: mos juftni ishonch bilan topishning zamonaviy usuli. Kelin va kuyov nomzodlar eʼlonlari, hudud bo'yicha qidiruv va xarita, Juft topish (rasmlarni surish), anonim eʼlon (maʼlumotlar faqat ruxsat bilan ochiladi), shaxsiy rasmlarga ruxsat tizimi, xavfsiz chat va guruhlar, shikoyat va bloklash. Faqat 18+.

## 5. Chiqarishdan oldin tekshiruv ro'yxati
- [ ] Firestore/Storage Rules deploy qilingan
- [ ] `admins/<UID>` yaratilgan, Sozlama bo'limida kartalar va ishonch telefoni kiritilgan
- [ ] Maxfiylik siyosatiga aloqa emailini qo'shdingiz (privacy.html oxiriga)
- [ ] Ikkita test akkaunt bilan: ro'yxatdan o'tish, e'lon, chat, ruxsat, surish, shikoyat, bloklash, hisobni o'chirish sinab ko'rilgan
- [ ] Ilova skrinshotlari (telefon 1080×1920, 4–8 ta) va 512×512 ikonka, 1024×500 banner
- [ ] Yopiq sinov (closed testing): yangi shaxsiy akkauntlar uchun Google odatda 12+ test qiluvchi bilan 14 kun sinov talab qiladi
