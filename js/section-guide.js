/* Yaqin: birinchi kirganda har bir bo‘limni tanishtirish (spotlight).
   - Tegishli bo‘lim tiniq, qolgan ekran 4 ta alohida xira soha bilan yopiladi.
   - Sariq ramka va izoh oynasi bo‘lim joyini har kadrda qayta o‘lchab, kuzatib boradi
     (ekran surilganda, sahifa qayta chizilganda ham).
   - Har bir bo‘lim bir marta ko‘rsatiladi («Tushundim» bosilganda eslab qolinadi). */
(function () {
"use strict";
var KEY = "yq_section_guide_v1", LATER = "yq_section_guide_later", PAD = 6, WAIT = 4000, GRACE = 500;
var copy = {
  home: { label: "BOSH SAHIFA", title: "Filtr bo‘limi", text: "Bu yerda nomzodlarni o‘zingiz istagandek sozlang: kelin yoki kuyov, tanishuv maqsadi va hududni tanlang. Kerak bo‘lsa «Filtrlar»ni ochib, qo‘shimcha mezonlarni belgilang. So‘ng «Qidirish» tugmasini bosing.", sel: [".box"] },
  open: { label: "OCHIQ E’LONLAR", title: "Ochiq e’lonlar", text: "Bu bo‘limda Yaqin sizning qiziqishlaringiz va hududingizga mos nomzodlarni tavsiya qiladi. Profilni ko‘ring, yoqqan nomzodni tanlang va suhbatni boshlang. O‘zingiz haqingizdagi ma’lumotlar va qiziqishlarni to‘ldirsangiz, mos tavsiyalar olish osonlashadi.", sel: [".swipe-hero"] },
  msg: { label: "XABARLAR", title: "Xabarlar bo‘limi", text: "Nomzodlar bilan yozishmalaringiz shu yerda saqlanadi. Suhbatni tanlab, xabar yuborishingiz mumkin. Shaxsiy ma’lumotlaringizni faqat ishonch hosil qilganingizdan keyin ulashing.", sel: ["#app>h3", "#app>h3+*"] },
  fav: { label: "SEVIMLILAR", title: "Sevimlilar bo‘limi", text: "Siz yoqtirgan va keyin yana ko‘rmoqchi bo‘lgan nomzodlar shu yerda jamlanadi. Yurak belgisini bosib, nomzodni sevimlilarga qo‘shing yoki ro‘yxatdan olib tashlang.", sel: ["#app>h3", "#app>h3+*"] },
  map: { label: "XARITA", title: "Xarita bo‘limi", text: "Xaritada hududlarni tanlab, shu joylardagi e’lonlarni ko‘rishingiz mumkin. Viloyat yoki tumanni tanlang va «Hududni chizish»ni bosing. Joylashuvni ko‘rsatish uchun telefon yoki brauzer ruxsati kerak bo‘lishi mumkin.", sel: [".map-title", "#map"] },
  circ: { label: "GURUHLAR", title: "Guruhlar bo‘limi", text: "Bu yerda qiziqishlaringizga mos guruhlarni topasiz yoki yangi guruh ochasiz. Guruhga kirish shartlarini tekshiring, suhbatlashing va qoidalarga rioya qiling.", sel: ["#app>h3", "#app>h3+.sub", "#app>.go"] },
  prof: { label: "PROFIL", title: "Profil bo‘limi", text: "Profilingizda ism, yosh, hudud, qiziqishlar va e’lonlaringizni boshqarasiz. Ma’lumotlarni to‘liq kiriting — bu sizga mos nomzodlarni tavsiya qilishga yordam beradi.", sel: ["#app>h3", "#app>.ban", "#app>.box"] }
};
var styles = "#yqGuide{position:fixed;inset:0;z-index:9996;display:none;pointer-events:none;font-family:system-ui,sans-serif;color:#f4f0ff}" +
"#yqGuide.show{display:block}#yqGuide *{box-sizing:border-box}" +
"#yqGuide .yqg-shade{position:fixed;background:rgba(7,5,14,.66);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);pointer-events:none}" +
"#yqGuide .yqg-frame{position:fixed;display:none;border:3px solid #f0b34a;border-radius:14px;box-shadow:0 0 0 3px rgba(240,179,74,.22),0 0 22px rgba(240,179,74,.35);pointer-events:none;z-index:9998}" +
"#yqGuide.has-target .yqg-frame{display:block}" +
"#yqGuide .yqg-card{position:fixed;left:50%;transform:translateX(-50%);z-index:9999;width:min(calc(100vw - 28px),390px);max-height:calc(100dvh - 20px);overflow:auto;padding:21px 20px 17px;border-radius:21px;background:linear-gradient(145deg,#30223e,#1e1a2e 72%);border:1px solid #ffffff25;box-shadow:0 22px 80px #0009;pointer-events:auto}" +
"#yqGuide .yqg-step{font-size:11px;font-weight:800;letter-spacing:1.1px;color:#f0b34a;margin-bottom:9px}" +
"#yqGuide h2{font-size:23px;line-height:1.2;margin:0 0 12px}#yqGuide p{font-size:14px;line-height:1.65;color:#c5bdd8;margin:0 0 20px}" +
"#yqGuide .yqg-actions{display:flex;gap:9px}#yqGuide button{border-radius:13px;padding:12px 15px;font:700 14px system-ui;cursor:pointer}" +
"#yqGuide .yqg-skip{background:#ffffff10;color:#d2cbe1;border:1px solid #ffffff20}#yqGuide .yqg-ok{flex:1;background:linear-gradient(135deg,#ffd27a,#f0b34a);color:#21182a;border:0}" +
"@media(max-height:520px){#yqGuide .yqg-card{padding:17px}#yqGuide h2{font-size:20px}#yqGuide p{font-size:13px;line-height:1.45;margin-bottom:14px}}";

var root, card, frame, shades, active = null, raf = 0, lastGood = null, lastGoodAt = 0, sig = "", waitSince = 0, cardH = 0;

function getTab() { try { return window.st && window.st.tab || "home"; } catch (e) { return "home"; } }
function readJSON(store, k) { try { return JSON.parse(store.getItem(k) || "{}") || {}; } catch (e) { return {}; } }
function mark(k) { var s = readJSON(localStorage, KEY); s[k] = 1; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
function later(k) { var s = readJSON(sessionStorage, LATER); s[k] = 1; try { sessionStorage.setItem(LATER, JSON.stringify(s)); } catch (e) {} }
function unseen(k) { return !readJSON(localStorage, KEY)[k] && !readJSON(sessionStorage, LATER)[k]; }
function stepsFor(tab) { return tab === "home" ? ["home", "open"] : copy[tab] ? [tab] : []; }

// Boshqa oyna/forma/qo‘ng‘iroq ochiq bo‘lsa — tanishtiruv ko‘rsatilmaydi
function blocked() {
  if (document.querySelector("#yqIntro.show")) return true;
  return !!document.querySelector("#app .ov,#app .md,#gm,#yc");
}
// Bo‘lim joyini HAR SAFAR yangidan topadi (sahifa qayta chizilganda eski element yaroqsiz bo‘lib qoladi)
function measure(key) {
  var sel = copy[key].sel, x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9, found = 0, first = null;
  for (var i = 0; i < sel.length; i++) {
    var n = document.querySelector(sel[i]); if (!n) continue;
    var r = n.getBoundingClientRect(); if (!r.width || !r.height) continue;
    found++; if (!first) first = n;
    if (r.left < x1) x1 = r.left; if (r.top < y1) y1 = r.top; if (r.right > x2) x2 = r.right; if (r.bottom > y2) y2 = r.bottom;
  }
  return found ? { left: x1, top: y1, right: x2, bottom: y2, el: first } : null;
}
function build() {
  if (root) return;
  var st = document.createElement("style"); st.id = "yqGuideStyles"; st.textContent = styles; document.head.appendChild(st);
  root = document.createElement("div"); root.id = "yqGuide";
  root.innerHTML = '<div class="yqg-shade"></div><div class="yqg-shade"></div><div class="yqg-shade"></div><div class="yqg-shade"></div><div class="yqg-frame"></div>' +
    '<div class="yqg-card" role="dialog" aria-label="Bo‘lim tanishuvi"><div class="yqg-step"></div><h2></h2><p></p><div class="yqg-actions"><button class="yqg-skip" type="button">Keyinroq</button><button class="yqg-ok" type="button">Tushundim</button></div></div>';
  document.body.appendChild(root);
  card = root.querySelector(".yqg-card"); frame = root.querySelector(".yqg-frame"); shades = [].slice.call(root.querySelectorAll(".yqg-shade"));
  root.querySelector(".yqg-ok").addEventListener("click", next);
  root.querySelector(".yqg-skip").addEventListener("click", dismiss);
}
function setBox(el, l, t, w, h) { el.style.left = l + "px"; el.style.top = t + "px"; el.style.width = Math.max(0, w) + "px"; el.style.height = Math.max(0, h) + "px"; }

// Bitta kadr: ramka, 4 ta xira soha va izoh oynasini joriy joyga qo‘yadi
function paint(rect) {
  var W = window.innerWidth, H = window.innerHeight, x1, y1, x2, y2, cardTop;
  cardH = card.offsetHeight || cardH || 240;
  if (rect) {
    x1 = Math.max(0, rect.left - PAD); y1 = Math.max(0, rect.top - PAD); x2 = Math.min(W, rect.right + PAD); y2 = Math.min(H, rect.bottom + PAD);
    if (x2 <= x1 || y2 <= y1) rect = null;    // butunlay ekrandan tashqarida
  }
  var key = rect ? [x1, y1, x2, y2, W, H, cardH].map(Math.round).join() : "none|" + W + "|" + H + "|" + cardH;
  if (key === sig) return; sig = key;
  if (rect) {
    root.classList.add("has-target");
    setBox(shades[0], 0, 0, W, y1);                       // tepa
    setBox(shades[1], 0, y2, W, H - y2);                  // past
    setBox(shades[2], 0, y1, x1, y2 - y1);                // chap
    setBox(shades[3], x2, y1, W - x2, y2 - y1);           // o‘ng
    setBox(frame, x1, y1, x2 - x1, y2 - y1);
    var below = H - y2, above = y1, gap = 14, m = 10;
    cardTop = below >= cardH + gap + m ? y2 + gap : above >= cardH + gap + m ? y1 - cardH - gap : (below >= above ? H - cardH - m : m);
  } else {
    root.classList.remove("has-target");
    setBox(shades[0], 0, 0, W, H); shades.slice(1).forEach(function (s) { setBox(s, 0, 0, 0, 0); });
    cardTop = (H - cardH) / 2;
  }
  card.style.top = Math.min(Math.max(10, cardTop), Math.max(10, H - cardH - 10)) + "px";
}
function frameLoop() {
  if (!active) return;
  if (getTab() !== active.tab || blocked()) { finish(); return; }   // boshqa bo‘limga o‘tildi yoki oyna ochildi
  var key = active.queue[0], r = measure(key), now = Date.now();
  if (r) { lastGood = r; lastGoodAt = now; }
  else if (lastGood && now - lastGoodAt < GRACE) r = lastGood;      // qayta chizish payti qisqa vaqtga yo‘qolsa — oxirgi joyda ushlab turadi
  paint(r);
  raf = requestAnimationFrame(frameLoop);
}
function render() {
  var key = active.queue[0], d = copy[key], total = active.total, idx = total - active.queue.length + 1;
  root.querySelector(".yqg-step").textContent = d.label + (total > 1 ? "  ·  " + idx + "/" + total : "");
  root.querySelector("h2").textContent = d.title; root.querySelector("p").textContent = d.text;
  root.classList.add("show"); sig = ""; lastGood = null;
  var r = measure(key);
  if (r && r.el && (r.top < 56 || r.bottom > window.innerHeight - 70) && (r.bottom - r.top) < window.innerHeight * 0.8) {
    try { r.el.scrollIntoView({ block: "center", behavior: "auto" }); } catch (e) {}
  }
  cancelAnimationFrame(raf); frameLoop();
}
function start(tab, keys) {
  build(); active = { tab: tab, queue: keys.slice(), total: keys.length }; waitSince = 0; render();
}
function next() { if (!active) return; mark(active.queue[0]); active.queue.shift(); if (active.queue.length) render(); else finish(); }
function dismiss() { if (!active) return; active.queue.forEach(later); finish(); }
function finish() {
  cancelAnimationFrame(raf); raf = 0; active = null; lastGood = null; sig = "";
  if (root) root.classList.remove("show");
}
// Vaqti-vaqti bilan tekshiradi: yangi (ko‘rilmagan) bo‘lim ochiqmi va hech narsa halaqit bermayaptimi
function due() {
  if (active || document.hidden) return;
  if (blocked()) { waitSince = 0; return; }
  var app = document.getElementById("app"); if (!app || !app.children.length) return;
  var tab = getTab(), keys = stepsFor(tab).filter(unseen); if (!keys.length) { waitSince = 0; return; }
  if (!measure(keys[0])) {                                   // bo‘lim hali chizilmagan bo‘lishi mumkin — biroz kutamiz
    if (!waitSince) waitSince = Date.now(); if (Date.now() - waitSince < WAIT) return;
  }
  start(tab, keys);
}
function boot() { setInterval(due, 700); setTimeout(due, 300); }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();

window.YaqinSectionGuide = {
  show: function () { due(); },
  preview: function (tab) { tab = tab || getTab(); var k = stepsFor(tab); if (!k.length || active) return false; start(tab, k); return true; },   // ko‘rilganlikdan qat’i nazar sinab ko‘rish
  reset: function () { try { localStorage.removeItem(KEY); sessionStorage.removeItem(LATER); } catch (e) {} }
};
})();
