/* Yaqin: suhbatda ovozli xabarlar (1:1). Yozish, yuborish va ijro etish. chat-extras.js dan keyin yuklanadi. */
(function () {
  "use strict";
  const MAX_SEC = 60, MAX_CHARS = 760000;
  const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const BARS = 26;
  const bars = id => { let h = 7; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; let o = ""; for (let i = 0; i < BARS; i++) { h = (h * 1103515245 + 12345) >>> 0; o += `<i style="height:${6 + (h >> 8) % 17}px"></i>`; } return o; };
  const MIC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>';
  const SEND = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4zM22 2 11 13"/></svg>';

  // ---------- ijro ----------
  const VP = { id: null, audio: null, chat: null }, cache = {};
  function ui(id) {
    const el = document.querySelector('[data-vid="' + id + '"]');
    if (!el) return;
    const playing = VP.id === id && VP.audio && !VP.audio.paused;
    const b = el.querySelector(".vm-play"); if (b) b.textContent = playing ? "⏸" : "▶";
    const m = (st.cm || []).find(x => x.id === id), dur = Math.max(1, (m && m.dur) || 1);
    const cur = VP.id === id && VP.audio ? VP.audio.currentTime : 0;
    const n = Math.round(Math.min(1, cur / dur) * BARS);
    el.querySelectorAll(".vm-wave i").forEach((e, i) => e.classList.toggle("on", i < n));
    const t = el.querySelector(".vm-t"); if (t) t.textContent = VP.id === id && cur > 0 ? fmt(cur) : fmt(dur);
  }
  function stopPlay() { if (VP.audio) { try { VP.audio.pause(); } catch (_) {} } const old = VP.id; VP.id = null; VP.audio = null; if (old) ui(old); }
  window.voiceRestore = function () { if (VP.id) { if (!st.chat || st.chat.id !== VP.chat) return stopPlay(); ui(VP.id); } };
  window.voicePlay = async function (id) {
    const ch = st.chat, m = (st.cm || []).find(x => x.id === id);
    if (!ch || !m || !m.voiceId) return;
    if (VP.id === id && VP.audio) { if (VP.audio.paused) VP.audio.play().catch(() => {}); else VP.audio.pause(); return ui(id); }
    stopPlay();
    const b = document.querySelector('[data-vid="' + id + '"] .vm-play'); if (b) b.textContent = "…";
    try {
      const key = ch.id + "/" + m.voiceId;
      if (!cache[key]) cache[key] = await FB.voiceGet(ch.id, m.voiceId);
      const a = new Audio(cache[key]);
      VP.id = id; VP.audio = a; VP.chat = ch.id;
      a.ontimeupdate = () => { if (VP.audio === a) ui(id); };
      a.onpause = () => { if (VP.audio === a) ui(id); };
      a.onended = () => { if (VP.audio === a) { VP.id = null; VP.audio = null; } ui(id); };
      await a.play();
      ui(id);
    } catch (e) {
      stopPlay(); if (b) b.textContent = "▶";
      uiAlert("Ovozli xabarni ijro etib boʻlmadi. Internetni tekshiring yoki brauzer bu formatni qoʻllamasligi mumkin.");
    }
  };
  window.voiceBubble = function (x, g) {
    const me = x.from == st.user.uid, d = Math.max(1, Math.round(x.dur || 1));
    return `<div class="m vm-msg ${me ? "me" : ""}" data-vid="${x.id}">${g && !me ? `<b>${esc(x.name || "")}</b>` : ""}<div class="vm-row"><button type="button" class="vm-play" aria-label="Ijro" onclick="voicePlay('${x.id}')">▶</button><div class="vm-wave">${bars(x.id)}</div><span class="vm-t">${fmt(d)}</span></div><small>${tm(x.t)}</small></div>`;
  };

  // ---------- yozish ----------
  function bar() { return `<div class="vrec" id="vrec"><button type="button" class="ghost vcancel" aria-label="Bekor qilish" onclick="voiceStop(false)">🗑</button><span class="vdot"></span><b id="vrecT">0:00</b><span class="vhint">Yozilmoqda…</span><button type="button" class="go" aria-label="Yuborish" onclick="voiceStop(true)">${SEND}</button></div>`; }
  function showBar() {
    const s = document.querySelector(".ov .send");
    if (!s || document.getElementById("vrec")) return;
    s.classList.add("recording"); s.insertAdjacentHTML("afterbegin", bar());
  }
  function hideBar() {
    const s = document.querySelector(".ov .send"); if (s) s.classList.remove("recording");
    const v = document.getElementById("vrec"); if (v) v.remove();
  }
  function cleanup(R) { clearInterval(R.timer); try { R.stream.getTracks().forEach(t => t.stop()); } catch (_) {} if (st.vrec === R) st.vrec = null; hideBar(); }

  window.voiceStart = async function () {
    const ch = st.chat;
    if (st.vrec || !ch || ch.t === "g" || ch.obs) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { uiAlert("Bu brauzerda ovoz yozish qoʻllab-quvvatlanmaydi. Chrome yoki Safari yangi versiyasidan foydalaning."); return; }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (_) { uiAlert("Mikrofondan foydalanishga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering."); return; }
    const mime = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find(m => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || "";
    let rec;
    try { rec = new MediaRecorder(stream, Object.assign(mime ? { mimeType: mime } : {}, { audioBitsPerSecond: 24000 })); }
    catch (_) { stream.getTracks().forEach(t => t.stop()); uiAlert("Ovoz yozishni boshlab boʻlmadi."); return; }
    const R = { rec, stream, chunks: [], t0: Date.now(), ch, mime: rec.mimeType || mime || "audio/webm", send: false };
    rec.ondataavailable = e => { if (e.data && e.data.size) R.chunks.push(e.data); };
    rec.onstop = async () => {
      const dur = (Date.now() - R.t0) / 1000;
      cleanup(R);
      if (!R.send) return;
      if (dur < 1) { toast("Ovozli xabar juda qisqa"); return; }
      try {
        const blob = new Blob(R.chunks, { type: R.mime });
        const data = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(new Error("read")); fr.readAsDataURL(blob); });
        if (data.length > MAX_CHARS) { uiAlert("Ovozli xabar juda katta. Qisqaroq yozing."); return; }
        FB.sendVoice(R.ch.id, data, Math.min(dur, MAX_SEC + 1), st.user.name).catch(x => uiAlert("Ovozli xabar yuborilmadi: " + (x.message || x)));
      } catch (x) { uiAlert("Ovozli xabar tayyorlanmadi: " + (x.message || x)); }
    };
    st.vrec = R; stopPlay();
    rec.start(250); showBar();
    R.timer = setInterval(() => {
      const sec = (Date.now() - R.t0) / 1000, t = document.getElementById("vrecT");
      if (!st.chat || st.chat.id !== R.ch.id) { R.send = false; try { rec.stop(); } catch (_) {} return; }
      if (t) t.textContent = fmt(sec);
      if (!document.getElementById("vrec")) showBar();
      if (sec >= MAX_SEC) window.voiceStop(true);
    }, 250);
    if (navigator.vibrate) try { navigator.vibrate(15); } catch (_) {}
  };
  window.voiceStop = function (send) {
    const R = st.vrec; if (!R) return;
    R.send = !!send;
    try { if (R.rec.state !== "inactive") R.rec.stop(); else cleanup(R); } catch (_) { cleanup(R); }
  };

  // ---------- chat oynasiga mikrofon tugmasi ----------
  document.addEventListener("input", e => {
    if (e.target && e.target.id === "mi") { const s = e.target.closest(".send"); if (s) s.classList.toggle("hastext", !!e.target.value.trim()); }
  });
  const base = window.chatV;
  window.chatV = function () {
    let h = base();
    if (!st.chat || !st.user || st.chat.t === "g" || h.indexOf('class="go" onclick="send()"') < 0) return h;
    h = h.replace('<div class="send', '<div class="send vm' + (st.vrec ? " recording" : ""));
    h = h.replace('<button class="go" onclick="send()">', `<button class="ghost vm-btn" type="button" title="Ovozli xabar" aria-label="Ovozli xabar" onclick="voiceStart()">${MIC}</button><button class="go" onclick="send()">`);
    if (st.vrec) h = h.replace(/(<div class="send[^>]*>)/, "$1" + bar());
    return h;
  };
  window.addEventListener("pagehide", () => { if (st.vrec) window.voiceStop(false); });
})();
