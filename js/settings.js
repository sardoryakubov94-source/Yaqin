/* Yaqin: Telegram uslubidagi Profil va sozlamalar (bitta joyda). Qoʻngʻiroq cheklovlari, oʻqildi/yozmoqda, matn oʻlchami,
   bloklanganlar, bildirishnomalar, eʼlon va toʻlovlar. chat-live.js dan keyin yuklanadi. */
(function () {
  "use strict";
  const q = id => document.getElementById(id);
  const DEF = { calls: "approved", video: true, rr: true, typ: true };
  const CALLS = { none: ["Hech kim", "Hech kim sizga qoʻngʻiroq qila olmaydi"], approved: ["Faqat men ruxsat berganlar", "Suhbatdosh ruxsat soʻraydi, siz chatda ruxsat berasiz"], all: ["Barcha suhbatdoshlar", "Siz bilan chati borlarning hammasi qoʻngʻiroq qila oladi"] };
  const FONTS = [[13, "Kichik"], [14, "Oʻrtacha"], [16, "Katta"], [18, "Juda katta"]];
  const pr = () => Object.assign({}, DEF, st.prefs || {});

  // ---------- sozlamalarni yuklash va qoʻllash ----------
  let loadedFor = null;
  function applyFont() { let v = 14; try { v = +localStorage.getItem("yq_mfs") || 14; } catch (_) {} document.documentElement.style.setProperty("--mfs", v + "px"); return v; }
  applyFont();
  setInterval(() => {
    const uid = st && st.user && st.user.uid;
    if (uid === loadedFor) return;
    loadedFor = uid || null; st.prefs = null;
    if (uid && window.FB && FB.getPrefs) FB.getPrefs().then(p => { if (loadedFor === uid) { st.prefs = p || {}; if (st.tab === "prof" && !st.form && !st.chat) draw(); } }).catch(() => {});
  }, 1500);
  async function save(patch) {
    st.prefs = Object.assign({}, st.prefs || {}, patch);
    try { await FB.setPrefs(patch); } catch (e) { uiAlert("Saqlab boʻlmadi: " + (e.message || e)); }
    draw();
  }
  window.psTog = k => { const p = pr(); save({ [k]: !(p[k] !== false) }); };
  window.psCalls = function () {
    const cur = pr().calls;
    ysModal('<h4>Kim sizga qoʻngʻiroq qila oladi</h4>' + Object.keys(CALLS).map(k => `<button type="button" class="mm-i ps-opt${cur === k ? " sel" : ""}" data-k="${k}"><span class="ps-radio"></span><div><b>${CALLS[k][0]}</b><small>${CALLS[k][1]}</small></div></button>`).join("") + '<button type="button" class="mm-i cancel">Yopish</button>', bg => {
      bg.querySelectorAll(".ps-opt").forEach(b => b.addEventListener("click", () => { ysCloseModal(); save({ calls: b.dataset.k }); }));
      bg.querySelector(".cancel").addEventListener("click", () => ysCloseModal());
    });
  };
  window.psFont = function () {
    const cur = applyFont();
    ysModal('<h4>Xabar matni oʻlchami</h4>' + FONTS.map(f => `<button type="button" class="mm-i ps-opt${cur === f[0] ? " sel" : ""}" data-v="${f[0]}"><span class="ps-radio"></span><div><b style="font-size:${f[0]}px">${f[1]}</b></div></button>`).join("") + '<button type="button" class="mm-i cancel">Yopish</button>', bg => {
      bg.querySelectorAll(".ps-opt").forEach(b => b.addEventListener("click", () => { try { localStorage.setItem("yq_mfs", b.dataset.v); } catch (_) {} applyFont(); ysCloseModal(); draw(); }));
      bg.querySelector(".cancel").addEventListener("click", () => ysCloseModal());
    });
  };
  window.psBlocked = function () {
    const list = st.bl || [];
    ysModal('<h4>Bloklangan foydalanuvchilar</h4>' + (list.length ? list.map(b => `<div class="ps-blk" data-to="${esc(b.to)}"><span class="ps-ic c5">${YI("ban", 16)}</span><b>${esc(b.name || "Foydalanuvchi")}</b><button type="button" class="ghost">Blokdan chiqarish</button></div>`).join("") : '<p class="mm-p">Bloklangan foydalanuvchilar yoʻq.</p>') + '<button type="button" class="mm-i cancel">Yopish</button>', bg => {
      bg.querySelectorAll(".ps-blk button").forEach(b => b.addEventListener("click", async () => { const row = b.closest(".ps-blk"); await unblock(row.dataset.to); row.remove(); draw(); }));
      bg.querySelector(".cancel").addEventListener("click", () => ysCloseModal());
    });
  };
  // bildirishnomalar
  let mp = null;
  function loadMp() { if (mp !== null || !window.FB || !FB.getMatchPush) return; mp = true; FB.getMatchPush().then(v => { mp = v; if (st.tab === "prof" && !st.form && !st.chat) draw(); }).catch(() => {}); }
  window.psMatch = async function () { const next = !(mp !== false); try { await FB.setMatchPush(next); mp = next; draw(); } catch (e) { uiAlert("Saqlab boʻlmadi: " + (e.message || e)); } };
  window.psPush = async function () {
    if (!("Notification" in window)) { uiAlert("Brauzeringiz bildirishnomalarni qoʻllamaydi."); return; }
    if (Notification.permission === "denied") { uiAlert("Bildirishnomalar brauzer sozlamalarida bloklangan. Sayt sozlamalaridan ruxsat bering."); return; }
    if (Notification.permission === "granted") { toast("Bildirishnomalar yoqilgan"); return; }
    try { await enablePush(); } catch (_) {}
    draw();
  };

  // ---------- profil sahifasi ----------
  const ico = (n, c) => `<span class="ps-ic ${c || ""}">${YI(n, 18)}</span>`;
  const row = (n, c, title, sub, right, on) => `<div class="ps-row"${on ? ` onclick="${on}"` : ""}>${ico(n, c)}<div class="ps-tx"><b>${title}</b>${sub ? `<small>${sub}</small>` : ""}</div>${right === undefined ? YI("chevron", 18, "ps-ch") : right}</div>`;
  const sw = on => `<span class="ps-sw${on ? " on" : ""}"><i></i></span>`;
  const det = (n, c, title, count, body) => `<details class="ps-det"><summary>${ico(n, c)}<div class="ps-tx"><b>${title}</b>${count !== "" ? `<small>${count}</small>` : ""}</div>${YI("chevron", 18, "ps-ch")}</summary><div class="ps-body">${body}</div></details>`;

  // ---------- profilni kim koʻrdi / sevimlilarga qoʻshdi ----------
  const EVT = { profile_view: ["Profilni koʻrganlar", "Profilingizni koʻrishdi", /\s*profilingizni koʻrdi\.?$/], favorite: ["Sevimlilarga qoʻshganlar", "sevimlilarga qoʻshishdi", /\s*eʼloningizni sevimlilarga qoʻshdi\.?$/] };
  function who(kind) {
    const E = EVT[kind], seen = {}, out = [];
    (st.notifs || []).slice().sort((a, b) => (b.t || 0) - (a.t || 0)).forEach(n => {
      if (n.type !== "like" || !n.from) return;
      const hit = n.kind ? n.kind === kind : String(n.title || "").includes(E[1]);
      if (!hit || seen[n.from]) return;
      seen[n.from] = 1;
      out.push({ name: n.name || String(n.text || "").replace(E[2], "") || "Foydalanuvchi", t: n.t || 0 });
    });
    return out;
  }
  window.psWho = function (kind) {
    const l = who(kind), E = EVT[kind];
    ysModal("<h4>" + E[0] + "</h4>" + (l.length ? l.map(x => `<div class="ps-blk"><span class="ps-ic c1">${YI("user", 16)}</span><b>${esc(x.name)}</b><small style="color:var(--m)">${x.t ? new Date(x.t).toLocaleDateString("uz") : ""}</small></div>`).join("") : '<p class="mm-p">Hozircha hech kim yoʻq.</p>') + '<button type="button" class="mm-i cancel">Yopish</button>', bg => {
      bg.querySelector(".cancel").addEventListener("click", () => ysCloseModal());
    });
  };

  window.prof = function () {
    const u = st.user;
    if (!u) return `<h3>Profil</h3><div class="box" style="text-align:center"><p class="sub">Eʼlon berish va suhbatlashish uchun kiring yoki roʻyxatdan oʻting</p><button class="go" style="width:100%" onclick="st.am='in';st.form='auth';draw()">Kirish / Roʻyxatdan oʻtish</button></div>` + price();
    loadMp();
    const m = st.mine || [], p = pr(), n = typeof unN === "function" ? unN() : 0, pend = (st.pays || []).filter(x => x.status === "pending").length;
    const act = m.filter(a => a.status !== "pending").length, mpOn = mp !== false;
    const perm = ("Notification" in window) ? Notification.permission : "denied";
    const pushTxt = perm === "granted" ? "Yoqilgan" : perm === "denied" ? "Bloklangan (brauzer sozlamalari)" : "Yoqilmagan";
    const pays = (st.mypays || []).slice(0, 8).map(x => `<div class="card" style="align-items:center"><div class="inf"><b>${KIND[x.kind] || x.kind} · ${fmt(x.amount)} soʻm</b><p>Kod ${esc(x.id.slice(-6).toUpperCase())} · ${new Date(x.t).toLocaleDateString("uz")}</p></div><span class="tag">${PSTAT[x.status] || x.status}</span>${x.status === "pending" ? `<button class="ghost" onclick="paySheet(${x.amount},'${x.id}','admin tekshiradi')">Rekvizit</button>` : ""}</div>`).join("") || '<div class="empty">Toʻlovlar yoʻq</div>';
    return `<div class="ps">
<div class="ps-hero"><div class="ps-ava"><div class="av big">${u.img ? `<img src="${u.img}">` : YI("user", 44)}</div><button type="button" class="ps-cam" aria-label="Rasmni oʻzgartirish" onclick="$('pf').click()">${YI("camera", 16)}</button></div>
<div class="ps-nm" style="display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:12px"><b class="ps-name" style="margin-top:0">${esc(u.name)}</b><button type="button" class="ps-edit" aria-label="Ismni oʻzgartirish" onclick="editMyName()" style="display:inline-flex;align-items:center;gap:6px;background:var(--c,#1f1b2e);color:var(--a,#f2b544);border:1px solid var(--a,#f2b544);border-radius:999px;padding:6px 14px;font-size:12px;font-weight:700;width:auto">${YI("edit", 15)} Ismni oʻzgartirish</button></div><p class="ps-sub">${esc(u.phone || u.email || "")}</p>
<div class="ps-stats"><div><b>${act}</b><small>Faol eʼlon</small></div><div><b>${m.length}</b><small>Jami eʼlon</small></div><div><b>${(st.fav || []).length}</b><small>Sevimli</small></div></div>
<div class="ps-stats ps-stats2"><div role="button" onclick="psWho('profile_view')"><b>${who("profile_view").length}</b><small>Profilimni koʻrganlar</small></div><div role="button" onclick="psWho('favorite')"><b>${who("favorite").length}</b><small>Sevimlilarga qoʻshganlar</small></div></div>
<input type="file" id="pf" accept="image/*" hidden onchange="pfPhoto(this)"></div>
${u.freeUsed ? "" : `<div class="ps-promo">${YI("gift", 22)}<div><b>Birinchi eʼlon BEPUL</b><small>Hoziroq eʼlon joylashtiring</small></div></div>`}
<div class="ps-sec">Hisob</div><div class="ps-list">
${row("camera", "c1", "Profil rasmi", "Avatarni oʻzgartirish", undefined, "$('pf').click()")}
${row("phone", "c2", "Telefon raqami", esc(u.phone || "Kiritilmagan"), undefined, "editPh()")}
${row("mail", "c3", "Email", esc(u.email || ""), "")}
${row("heart", "c4", "Qiziqish va mos nomzod", "Anketa sozlamalari", undefined, "st.sv=null;st.form='survey';draw()")}</div>
<div class="ps-sec">Verifikatsiya</div><div class="ps-list ps-pad ps-verif">${typeof verificationV === "function" ? verificationV().replace('class="box" style="margin-top:12px"', 'class="ps-vbox"') : ""}</div>
<div class="ps-sec">Profil rasmlari</div><div class="ps-list ps-pad">${privV().replace("<h3>Shaxsiy rasmlarim</h3>", '<b class="ps-mini">Shaxsiy rasmlarim</b>')}</div>
<div class="ps-sec">Chat sozlamalari</div><div class="ps-list">
${row("phone", "c2", "Qoʻngʻiroqlar", CALLS[p.calls][0], undefined, "psCalls()")}
${row("video", "c6", "Video qoʻngʻiroqlar", p.calls === "none" ? "Qoʻngʻiroqlar oʻchiq" : "Videoga ruxsat", sw(p.video !== false && p.calls !== "none"), p.calls === "none" ? "" : "psTog('video')")}
${row("checks", "c7", "Oʻqildi belgisi", "Oʻqilganini koʻrsatish va koʻrish", sw(p.rr !== false), "psTog('rr')")}
${row("keyboard", "c8", "Yozmoqda… koʻrsatkichi", "Yozayotganingizni koʻrsatish va koʻrish", sw(p.typ !== false), "psTog('typ')")}
${row("type", "c3", "Xabar matni oʻlchami", FONTS.find(f => f[0] === applyFont())[1], undefined, "psFont()")}
${row("ban", "c5", "Bloklanganlar", (st.bl || []).length ? (st.bl.length + " ta") : "Yoʻq", undefined, "psBlocked()")}</div>
<div class="ps-sec">Bildirishnomalar</div><div class="ps-list">
${row("bell", "c1", "Bildirishnomalar", n ? n + " ta yangi" : "Yangi yoʻq", n ? `<span class="tag" style="background:#e5554a;color:#fff;font-weight:800">${n}</span>` : undefined, "openNotif()")}
${row("bell", "c6", "Telefon bildirishnomalari", pushTxt, undefined, "psPush()")}
${row("heart", "c4", "Mos eʼlonlar xabari", "Sizga mos yangi nomzod (kuniga 2 tagacha)", sw(mpOn), "psMatch()")}</div>
<div class="ps-sec">Eʼlonlar va toʻlovlar</div><div class="ps-list">
${det("list", "c2", "Mening eʼlonlarim", m.length + " ta", m.map(myAd).join("") || '<div class="empty">Sizda hali eʼlon yoʻq</div>')}
${det("card", "c7", "Toʻlovlarim", (st.mypays || []).length + " ta", pays)}
${det("tag", "c3", "Narxlar", "", price())}</div>
<div class="ps-sec">Yordam</div><div class="ps-list">
${row("headset", "c6", "Yordam xizmati", "Admin bilan yozishma", typeof supDot === "function" && supDot() ? '<span class="dot"></span>' : undefined, "openSup(st.user.uid)")}
${st.admin ? row("sliders", "c5", "Admin panel", "Toʻlovlar, eʼlonlar, shikoyatlar", pend ? `<span class="tag" style="background:#e5554a;color:#fff;font-weight:800">${pend}</span>` : undefined, "openAdmin()") : ""}
${row("shield", "c8", "Maxfiylik siyosati", "", undefined, "window.open('privacy.html','_blank')")}
${row("file", "c8", "Foydalanish shartlari", "", undefined, "window.open('terms.html','_blank')")}</div>
<div class="ps-list" style="margin-top:6px">
${row("logout", "c5", "Tizimdan chiqish", "", "", "st.form='logout';draw()")}
${row("x", "c5 dng", "Hisobni oʻchirish", "", "", "delAcc()")}</div></div>`;
  };

  // ---------- verifikatsiya natijasini avtomatik yangilash ----------
  const VWAIT = ["pending", "pending_review", "in_review", "in review", "in_progress", "in progress", "awaiting_user", "processing", "created", "resubmitted", "manual_review", "manual review"];
  let vBusy = false, vTries = 0;
  setInterval(async () => {
    try {
      if (vBusy || document.hidden || !window.st || !st.user || st.tab !== "prof" || st.form || st.chat) { return; }
      const raw = String((st.user.verification || {}).status || "").toLowerCase();
      if (!VWAIT.includes(raw)) { vTries = 0; return; }
      if (++vTries > 90) return;                       // ~12 daqiqadan keyin toʻxtaydi
      if (!window.FB || !FB.getVerification) return;
      vBusy = true;
      const v = await FB.getVerification();
      if (v && String(v.status || "").toLowerCase() !== raw) { st.user.verification = v; draw(); }
    } catch (e) { /* tarmoq xatosi — keyingi urinishda */ } finally { vBusy = false; }
  }, 8000);

  // ---------- chat menyusiga: qoʻngʻiroqqa ruxsat ----------
  const base = window.chatV;
  window.chatV = function () {
    let h = base();
    if (!st.chat || st.chat.t !== "c" || !st.user || h.indexOf('<div class="menu">') < 0) return h;
    const ok = st.myState && st.myState.allowCalls === true;
    return h.replace('<div class="menu">', `<div class="menu"><button onclick="toggleCallAllow()">${YI("phone", 16)} Qoʻngʻiroqqa ruxsat: ${ok ? "berilgan (bekor qilish)" : "berish"}</button>`);
  };
})();
