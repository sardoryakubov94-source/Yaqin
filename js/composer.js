/* Yaqin: Telegram uslubidagi yozish qatori (1:1 va guruhda bir xil).
   Chapda ichkarida: [soat (faqat guruh Premium)] [stiker]; oʻngda ichkarida: skripka (biriktirish);
   qator tashqarisida: mikrofon (bosib turib ovoz yozish) — matn yozilganda yuborish tugmasiga aylanadi. composer.js oxirgi yuklanadi. */
(function () {
  "use strict";
  const base = window.chatV;
  if (typeof base !== "function") return;
  const canRec = () => !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const SEND = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4zM22 2 11 13"/></svg>';
  const MIC = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>';
  const SCH = '<div class="sch-row" id="schRow"><label class="sch">Koʻrinish vaqti<input class="in" id="scheduleVisible" type="datetime-local"></label><label class="sch">Yashirish vaqti<input class="in" id="scheduleExpires" type="datetime-local"></label></div>';

  window.chatV = function () {
    const h = base();
    if (!st.chat || !st.user) return h;
    const i = h.indexOf('<div class="send');
    if (i < 0 || h.indexOf('id="mi"', i) < 0) return h;
    const tail = h.slice(i), isG = st.chat.t === "g";
    const obs = /^<div class="send[^"]*\bobs\b/.test(tail);
    const premium = tail.indexOf("sch-t") >= 0, gm = tail.indexOf('id="gmfile"') >= 0, cm = tail.indexOf('id="cmfile"') >= 0;
    const rec = canRec();
    const cls = "send tg" + (obs ? " obs" : "") + (st.vrec ? " recording" : "") + (st.vrec && st.vrec.locked ? " locked" : "") + (rec ? "" : " hastext");
    const left = (premium ? `<button class="tg-i sch-t" type="button" title="Xabar vaqtini belgilash" aria-label="Xabar vaqtini belgilash" onclick="$('schRow').classList.toggle('show')">${I("clock", 20)}</button>` : "") +
      '<button class="tg-i stk-btn" type="button" title="Stiker" aria-label="Stiker" onclick="toggleStk()">😊</button>';
    const clip = I("paperclip", 20);
    const right = isG
      ? (gm ? `<input id="gmfile" type="file" accept="image/*,video/mp4,video/webm,video/quicktime" hidden onchange="uploadGroupMedia(this)"><button class="tg-i media-attach" type="button" title="Rasm yoki video biriktirish" aria-label="Rasm yoki video biriktirish" onclick="$('gmfile').click()">${clip}</button>` : "")
      : (cm ? `<input id="cmfile" type="file" accept="image/*" hidden onchange="uploadChatMedia(this)"><button class="tg-i media-attach" type="button" title="Rasm yuborish" aria-label="Rasm yuborish" onclick="$('cmfile').click()">${clip}</button>` : "");
    const bar = st.vrec && window.voiceBarHtml ? window.voiceBarHtml() : "";
    return h.slice(0, i) + `<div class="${cls}">${premium ? SCH : ""}${bar}<div class="tg-in">${left}<input class="in" id="mi" maxlength="1000" placeholder="Xabar yozing.." autocomplete="off" onkeydown="if(event.key=='Enter')send()">${right}</div>` +
      `<button class="tg-act tg-mic" type="button" aria-label="Ovozli xabar: bosib turing">${MIC}</button><button class="tg-act tg-send go" type="button" aria-label="Yuborish" onclick="send()">${SEND}</button></div></div>`;
  };

  // xabar yuborilgach (maydon tozalanadi) tugma yana mikrofonga aylansin
  function sync() {
    const mi = document.getElementById("mi"), s = document.querySelector(".ov .send.tg");
    if (mi && s && canRec()) s.classList.toggle("hastext", !!mi.value.trim());
  }
  const _send = window.send;
  if (typeof _send === "function") window.send = function () { const r = _send.apply(this, arguments); sync(); return r; };

  // ---------- bosib turib yozish (Telegram kabi): qoʻyib yuborish = yuborish, chapga surish = bekor, yuqoriga surish = qulflash ----------
  let H = null;
  const buzz = () => { try { navigator.vibrate && navigator.vibrate(15); } catch (_) {} };
  const hint = () => toast("Ovozli xabar uchun mikrofon tugmasini bosib turing");
  async function press(h) {
    await window.voiceStart();
    if (!st.vrec) { if (H === h) H = null; return; }
    if (H !== h || !h.down) { window.voiceStop(false); if (H === h) H = null; hint(); }
  }
  document.addEventListener("pointerdown", e => {
    const b = e.target && e.target.closest && e.target.closest(".tg-mic");
    if (!b || (e.button && e.button > 0) || st.vrec) return;
    e.preventDefault();
    try { b.setPointerCapture(e.pointerId); } catch (_) {}
    H = { id: e.pointerId, x: e.clientX, y: e.clientY, down: true, lock: false };
    press(H);
  });
  document.addEventListener("pointermove", e => {
    if (!H || e.pointerId !== H.id || !st.vrec || H.lock) return;
    const dx = e.clientX - H.x, dy = e.clientY - H.y, bar = document.getElementById("vrec");
    if (bar) bar.style.setProperty("--vdx", Math.min(0, dx) + "px");
    if (dx < -90) { H = null; buzz(); window.voiceStop(false); return; }
    if (dy < -70) { H.lock = true; st.vrec.locked = true; const s = document.querySelector(".ov .send"); if (s) s.classList.add("locked"); buzz(); }
  });
  function release(e, cancelled) {
    if (!H || e.pointerId !== H.id) return;
    const h = H; h.down = false;
    if (!st.vrec) return;                       // ruxsat soʻrovi tugashini kutamiz (press ichida hal qilinadi)
    if (h.lock) { H = null; return; }           // qulflangan: pastdagi tugmalar bilan yuboriladi
    H = null;
    if (cancelled) { window.voiceStop(false); return; }
    if ((Date.now() - st.vrec.t0) / 1000 < 1) { window.voiceStop(false); hint(); return; }
    window.voiceStop(true);
  }
  document.addEventListener("pointerup", e => release(e, false));
  document.addEventListener("pointercancel", e => release(e, true));
  document.addEventListener("contextmenu", e => { if (e.target && e.target.closest && e.target.closest(".tg-mic")) e.preventDefault(); });
})();
