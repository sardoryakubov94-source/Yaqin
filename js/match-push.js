/* Yaqin: "Sizga mos yangi eʼlon" xabarlarini yoqish/oʻchirish (bildirishnomalar oynasida). */
(function () {
  "use strict";
  const base = window.notifV;
  if (typeof base !== "function") return;
  let loaded = false, on = true;
  function load() {
    if (loaded || !window.FB || !FB.getMatchPush) return;
    loaded = true;
    FB.getMatchPush().then(v => { on = v; if (st.form === "notif") draw(); }).catch(() => {});
  }
  window.matchToggle = async function () {
    const next = !on;
    try { await FB.setMatchPush(next); on = next; toast(next ? "Mos eʼlon xabarlari yoqildi" : "Mos eʼlon xabarlari oʻchirildi"); draw(); }
    catch (e) { uiAlert("Saqlab boʻlmadi: " + (e.message || e)); }
  };
  window.notifV = function () {
    const h = base();
    if (!st.user) return h;
    load();
    const noPrefs = !st.user.prefs;
    const row = `<div class="cons" style="margin:0 0 12px;display:flex;align-items:center;gap:12px"><div style="flex:1"><b>Sizga mos eʼlonlar</b><p style="color:var(--m);margin:4px 0 0;font-size:13px">${noPrefs ? "Mos nomzodlar haqida xabar olish uchun avval qisqa anketani toʻldiring." : "Sizga mos nomzod yangi eʼlon joylaganda xabar beramiz (kuniga 2 tagacha)."}</p></div>${noPrefs ? '<button class="go" onclick="st.afterSv=0;st.sv=null;st.form=\'survey\';draw()">Anketa</button>' : `<button class="go" onclick="matchToggle()">${on ? "Oʻchirish" : "Yoqish"}</button>`}</div>`;
    return h.replace('<div class="sheet">', '<div class="sheet">' + row);
  };
})();
