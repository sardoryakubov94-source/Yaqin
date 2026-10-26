/* Yaqin: shaxsiy (1:1) ovozli va video qoʻngʻiroq + video filtrlar. Agora RTC + Firestore signal. voice-msg.js dan keyin yuklanadi. */
(function () {
  "use strict";
  const APP_ID = "868b06d16f0f43dc82dec0f4fefb23e9";
  const SDK = "https://download.agora.io/sdk/release/AgoraRTC_N-4.23.4.js";
  const RING_MS = () => Number(window.YQ_CALL_TIMEOUT) || 45000;
  const q = id => document.getElementById(id);
  const fmt = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s % 60).padStart(2, "0"); };
  function uidFor(v) { let h = 2166136261; for (let i = 0; i < v.length; i++) { h ^= v.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) || 1; }
  const SUP_FILTER = typeof CanvasRenderingContext2D !== "undefined" && "filter" in CanvasRenderingContext2D.prototype;

  const I_PHONE = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>';
  const I_CAM = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4zM2 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" transform="translate(1 0)"/></svg>';

  // ---------- video filtrlar (canvas) ----------
  const FILTERS = [
    { id: "none", name: "Oddiy", css: "" },
    { id: "warm", name: "Iliq", css: "sepia(.3) saturate(1.35) contrast(1.05) brightness(1.04)", cf: 1 },
    { id: "cool", name: "Sovuq", css: "saturate(1.1) hue-rotate(14deg) brightness(1.04)", cf: 1 },
    { id: "bw", name: "Qora-oq", css: "grayscale(1) contrast(1.1)", cf: 1 },
    { id: "retro", name: "Retro", css: "sepia(.65) contrast(1.15) saturate(.9)", cf: 1 },
    { id: "pink", name: "Pushti", css: "saturate(1.5) hue-rotate(-25deg) brightness(1.05)", cf: 1 },
    { id: "film", name: "Kino", css: "contrast(1.2) saturate(.9)", vignette: 1, cf: 1 },
    { id: "hearts", name: "💖", css: "saturate(1.15) brightness(1.04)", fx: "💖", dir: -1 },
    { id: "stars", name: "✨", css: "contrast(1.05)", fx: "✨", dir: -1 },
    { id: "snow", name: "❄️", css: "brightness(1.05) saturate(.95)", fx: "❄️", dir: 1 },
    { id: "m_glasses", name: "🕶️", css: "", mask: "glasses" },
    { id: "m_crown", name: "👑", css: "", mask: "crown" },
    { id: "m_dog", name: "🐶", css: "", mask: "dog" },
    { id: "m_cat", name: "🐱", css: "", mask: "cat" },
    { id: "m_clown", name: "🤡", css: "", mask: "clown" },
    { id: "m_love", name: "😍", css: "", mask: "love" }
  ];
  const usable = () => FILTERS.filter(f => SUP_FILTER || !f.cf);

  // ---------- yuz niqoblari (MediaPipe Face Landmarker, faqat tanlanganda yuklanadi) ----------
  let faceP = null;
  function loadFace() {
    if (window.YQ_FACE_LOADER) return window.YQ_FACE_LOADER();
    if (faceP) return faceP;
    faceP = (async () => {
      const V = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
      const mod = await import(V + "/vision_bundle.mjs");
      const files = await mod.FilesetResolver.forVisionTasks(V + "/wasm");
      const make = d => mod.FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", delegate: d }, runningMode: "VIDEO", numFaces: 1 });
      try { return await make("GPU"); } catch (_) { return await make("CPU"); }
    })().catch(e => { faceP = null; throw e; });
    return faceP;
  }
  const mid = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
  function anchors(cam, lm) {
    const P = i => ({ x: lm[i].x * cam.w, y: lm[i].y * cam.h });
    const cur = { a: P(234), b: P(454), top: P(10), chin: P(152), nose: P(1), eL: mid(P(33), P(133)), eR: mid(P(263), P(362)) };
    const pv = cam.pv;
    if (pv) for (const k in cur) { cur[k] = { x: pv[k].x + (cur[k].x - pv[k].x) * .55, y: pv[k].y + (cur[k].y - pv[k].y) * .55 }; }
    cam.pv = cur;
    return cur;
  }
  function emoji(ctx, ch, x, y, size, rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.font = size + "px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ch, 0, 0); ctx.restore(); }
  function ear(ctx, x, y, fw, rot, tri, c1, c2) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    if (tri) { ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(-fw * .13, 0); ctx.lineTo(0, -fw * .3); ctx.lineTo(fw * .13, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(-fw * .07, 0); ctx.lineTo(0, -fw * .19); ctx.lineTo(fw * .07, 0); ctx.closePath(); ctx.fill(); }
    else { ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(0, -fw * .1, fw * .1, fw * .19, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(0, -fw * .09, fw * .055, fw * .12, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  function drawMask(cam, kind, lm) {
    const ctx = cam.ctx, A = anchors(cam, lm);
    const fw = Math.hypot(A.b.x - A.a.x, A.b.y - A.a.y), ang = Math.atan2(A.b.y - A.a.y, A.b.x - A.a.x);
    ctx.save(); ctx.filter = "none";
    if (kind === "glasses") { const c = mid(A.eL, A.eR); emoji(ctx, "🕶️", c.x, c.y, fw * 1.05, ang); }
    else if (kind === "crown") emoji(ctx, "👑", A.top.x, A.top.y - fw * .2, fw * .8, ang);
    else if (kind === "love") { const k = 1 + .09 * Math.sin(Date.now() / 120); emoji(ctx, "❤️", A.eL.x, A.eL.y, fw * .3 * k, ang); emoji(ctx, "❤️", A.eR.x, A.eR.y, fw * .3 * k, ang); }
    else if (kind === "dog" || kind === "cat") {
      const dog = kind === "dog", c1 = dog ? "#8a5a2b" : "#3b3b46", c2 = dog ? "#e9a1a8" : "#f2a6b8";
      ear(ctx, A.top.x - fw * .34 * Math.cos(ang), A.top.y - fw * .34 * Math.sin(ang), fw, ang - (dog ? .35 : .15), !dog, c1, c2);
      ear(ctx, A.top.x + fw * .34 * Math.cos(ang), A.top.y + fw * .34 * Math.sin(ang), fw, ang + (dog ? .35 : .15), !dog, c1, c2);
      ctx.fillStyle = dog ? "#1d1d22" : "#f2a6b8"; ctx.beginPath(); ctx.ellipse(A.nose.x, A.nose.y, fw * .065, fw * .045, ang, 0, Math.PI * 2); ctx.fill();
      if (!dog) { ctx.strokeStyle = "#ffffffcc"; ctx.lineWidth = Math.max(2, fw * .01); ctx.beginPath(); for (const sd of [-1, 1]) for (const dy of [-.03, .02, .07]) { ctx.moveTo(A.nose.x + sd * fw * .1, A.nose.y + fw * dy); ctx.lineTo(A.nose.x + sd * fw * .5, A.nose.y + fw * (dy * 1.8 - .01)); } ctx.stroke(); }
    } else if (kind === "clown") {
      ctx.fillStyle = "#e5232d"; ctx.beginPath(); ctx.arc(A.nose.x, A.nose.y, fw * .1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff66"; ctx.beginPath(); ctx.arc(A.nose.x - fw * .03, A.nose.y - fw * .035, fw * .025, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ff5a8a55"; for (const e of [A.eL, A.eR]) { ctx.beginPath(); ctx.arc(e.x, e.y + fw * .2, fw * .09, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  }

  // ---------- yuzni tiniqlashtirish (Snapchat uslubidagi "go'zallik" qatlami) ----------
  // Teri faqat yuz konturi ichida yumshatiladi; koʻz, qosh va lablar aniq qoladi. Yuz topilmasa yengil umumiy yumshatish.
  const OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
  const EYE_L = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466];
  const EYE_R = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
  const LIPS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
  const BROW_L = [276, 283, 282, 295, 285, 300, 293, 334, 296, 336];
  const BROW_R = [46, 53, 52, 65, 55, 70, 63, 105, 66, 107];
  const BEAUTY_IDX = [...new Set([...OVAL, ...EYE_L, ...EYE_R, ...LIPS, ...BROW_L, ...BROW_R])];
  function ensureFace(cam, failMsg, onFail) {
    if (cam.fl || cam.flBusy) return;
    cam.flBusy = true; toast("Yuz filtri yuklanmoqda…");
    loadFace().then(fl => { cam.fl = fl; cam.flBusy = false; if (!cam.dead) toast("Yuz filtri tayyor. Yuzingizni kameraga qarating"); })
      .catch(() => { cam.flBusy = false; if (!cam.dead) { if (onFail) onFail(); uiAlert(failMsg); } });
  }
  function smoothLm(cam) {
    const lm = cam.lm;
    if (!lm) { cam.sm = null; return; }
    if (!cam.sm) cam.sm = new Array(lm.length);
    for (const i of BEAUTY_IDX) { const p = cam.sm[i], n = lm[i]; cam.sm[i] = p ? { x: p.x + (n.x - p.x) * .6, y: p.y + (n.y - p.y) * .6 } : { x: n.x, y: n.y }; }
    cam.maskDirty = true;
  }
  function ensureBeauty(cam) {
    if (cam.sc) return;
    const mk = (cw, ch) => { const c = document.createElement("canvas"); c.width = Math.max(2, Math.round(cw)); c.height = Math.max(2, Math.round(ch)); return c; };
    cam.sc = mk(cam.w / 3, cam.h / 3); cam.scx = cam.sc.getContext("2d");   // yumshatilgan nusxa (kichraytirib-kattalashtirish = tabiiy xiralik)
    cam.tm = mk(cam.w, cam.h); cam.tmx = cam.tm.getContext("2d");           // yuz ichidagi qism
    cam.mk = mk(cam.w / 4, cam.h / 4); cam.mkx = cam.mk.getContext("2d");   // yuz niqobi (past oʻlchamda, qirralari silliq)
  }
  function poly(c, idx, sm, cw, ch, grow) {
    let cx = 0, cy = 0; for (const i of idx) { cx += sm[i].x; cy += sm[i].y; } cx /= idx.length; cy /= idx.length;
    c.beginPath();
    idx.forEach((i, k) => { const x = (cx + (sm[i].x - cx) * grow) * cw, y = (cy + (sm[i].y - cy) * grow) * ch; if (k) c.lineTo(x, y); else c.moveTo(x, y); });
    c.closePath();
  }
  function buildMask(cam) {
    const m = cam.mkx, cw = cam.mk.width, ch = cam.mk.height, sm = cam.sm;
    m.globalCompositeOperation = "source-over"; m.clearRect(0, 0, cw, ch); m.fillStyle = "#fff";
    poly(m, OVAL, sm, cw, ch, 1); m.fill();
    m.globalCompositeOperation = "destination-out";
    for (const g of [EYE_L, EYE_R]) { poly(m, g, sm, cw, ch, 1.4); m.fill(); }
    for (const g of [BROW_L, BROW_R]) { poly(m, g, sm, cw, ch, 1.15); m.fill(); }
    poly(m, LIPS, sm, cw, ch, 1.12); m.fill();
    m.globalCompositeOperation = "source-over";
  }
  function beautify(cam) {
    const L = cam.beauty; if (!L) return;
    ensureBeauty(cam);
    const { ctx, w, h } = cam, f = cam.filter, face = !!cam.sm;
    cam.scx.imageSmoothingQuality = "high";
    cam.scx.filter = SUP_FILTER ? (f.css ? f.css + " " : "") + "brightness(" + (1 + .12 * L) + ") contrast(" + (1 - .05 * L) + ") saturate(" + (1 + .06 * L) + ")" : "none";
    cam.scx.drawImage(cam.v, 0, 0, cam.sc.width, cam.sc.height); cam.scx.filter = "none";
    const t = cam.tmx; t.globalCompositeOperation = "source-over"; t.clearRect(0, 0, w, h); t.imageSmoothingQuality = "high";
    t.drawImage(cam.sc, 0, 0, w, h);
    if (face) {
      if (cam.maskDirty) { buildMask(cam); cam.maskDirty = false; }
      t.globalCompositeOperation = "destination-in"; t.drawImage(cam.mk, 0, 0, w, h); t.globalCompositeOperation = "source-over";
    }
    ctx.save(); ctx.filter = "none";
    ctx.globalAlpha = face ? .35 + .55 * L : .18 + .22 * L; ctx.drawImage(cam.tm, 0, 0, w, h);   // teri silliqlanadi
    if (face) { ctx.globalCompositeOperation = "soft-light"; ctx.globalAlpha = .35 * L; ctx.drawImage(cam.tm, 0, 0, w, h); }   // yuz yorishadi
    ctx.restore();
  }
  async function startCam(facing) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing || "user", width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } }, audio: false });
    const v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.setAttribute("playsinline", ""); v.srcObject = stream;
    try { await v.play(); } catch (_) {}
    const w = v.videoWidth || 640, h = v.videoHeight || 480;
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    const out = cv.captureStream(24).getVideoTracks()[0];
    const cam = { stream, v, cv, ctx, out, w, h, facing: facing || "user", filter: FILTERS[0], parts: [], dead: false, beauty: 0 };
    cam.timer = setInterval(() => draw(cam), 1000 / 24);
    draw(cam);
    return cam;
  }
  function draw(cam) {
    if (cam.dead || !cam.ctx) return;
    const { ctx, v, w, h } = cam, f = cam.filter;
    if (v.readyState !== undefined && v.readyState < 2 && !window.YQ_TEST) return;
    ctx.save();
    ctx.filter = SUP_FILTER && f.css ? f.css : "none";
    ctx.drawImage(v, 0, 0, w, h);
    ctx.filter = "none";
    if ((f.mask || cam.beauty > 0) && cam.fl) {
      cam.n = (cam.n || 0) + 1;
      if (cam.n % 2 === 0 || !cam.lm) { try { const r = cam.fl.detectForVideo(v, performance.now()); cam.lm = r && r.faceLandmarks && r.faceLandmarks[0] || null; if (!cam.lm) cam.pv = null; smoothLm(cam); } catch (_) {} }
    }
    if (cam.beauty > 0) beautify(cam);
    if (f.vignette) {
      const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .78);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.55)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    if (f.fx) {
      if (cam.parts.length < 16 && Math.random() < .35) { const s = 16 + Math.random() * 22; cam.parts.push({ x: Math.random() * w, y: f.dir < 0 ? h + s : -s, s, v: (1.2 + Math.random() * 2.2) * f.dir, d: (Math.random() - .5) * .8 }); }
      ctx.textBaseline = "middle"; ctx.textAlign = "center";
      cam.parts = cam.parts.filter(p => { p.y += p.v; p.x += p.d; ctx.font = p.s + "px serif"; ctx.fillText(f.fx, p.x, p.y); return p.y > -50 && p.y < h + 50; });
    }
    if (f.mask && cam.fl && cam.lm) drawMask(cam, f.mask, cam.lm);
    ctx.restore();
  }
  function stopCam(cam) {
    if (!cam) return; cam.dead = true; clearInterval(cam.timer);
    try { cam.stream.getTracks().forEach(t => t.stop()); } catch (_) {}
    try { cam.out.stop(); } catch (_) {}
  }

  // ---------- qoʻngʻiroq tovushi ----------
  const RG = { t: null, v: null, ac: null };
  function ring(kind) {
    stopRing();
    try {
      const AC = window.AudioContext || window.webkitAudioContext; const ac = RG.ac = new AC();
      const beep = () => { const o = ac.createOscillator(), g = ac.createGain(); o.type = "sine"; o.frequency.value = kind === "in" ? 880 : 425; g.gain.value = .08; o.connect(g); g.connect(ac.destination); o.start(); setTimeout(() => { try { o.stop(); } catch (_) {} }, kind === "in" ? 350 : 900); };
      beep(); RG.t = setInterval(beep, kind === "in" ? 1500 : 3200);
    } catch (_) {}
    if (kind === "in" && navigator.vibrate) { const vb = () => { try { navigator.vibrate([400, 200, 400]); } catch (_) {} }; vb(); RG.v = setInterval(vb, 2200); }
  }
  function stopRing() { clearInterval(RG.t); clearInterval(RG.v); RG.t = RG.v = null; try { RG.ac && RG.ac.close(); } catch (_) {} RG.ac = null; try { navigator.vibrate && navigator.vibrate(0); } catch (_) {} }

  // ---------- holat va oyna ----------
  let C = null, sdkP = null, incUnsub = null, incUid = null;
  const handled = new Set();
  function loadSdk() {
    if (window.AgoraRTC) return Promise.resolve();
    if (!sdkP) sdkP = new Promise((res, rej) => { const s = document.createElement("script"); s.src = SDK; s.onload = res; s.onerror = () => { sdkP = null; rej(new Error("Agora SDK yuklanmadi. Internetni tekshiring.")); }; document.head.appendChild(s); });
    return sdkP;
  }
  const e2 = s => esc(String(s == null ? "" : s));
  function ui(state) {
    let el = q("yc");
    if (!el) {
      document.body.insertAdjacentHTML("beforeend", `<div class="yc" id="yc"><div class="yc-remote" id="ycRemote"></div><div class="yc-peer" id="ycPeer"><div class="yc-ava" id="ycAva"></div><div class="yc-name" id="ycName"></div><div class="yc-st" id="ycSt"></div></div><div class="yc-pip" id="ycPip" hidden></div><div class="yc-filters" id="ycFil" hidden></div><div class="yc-ctl" id="ycCtl"></div></div>`);
      el = q("yc");
    }
    q("ycName").textContent = C.peerName || "Suhbatdosh";
    q("ycAva").innerHTML = C.peerAva || "👤";
    el.dataset.state = state;
    renderCtl();
  }
  const btn = (cls, on, ico, lab) => `<button type="button" class="yc-b ${cls}" onclick="${on}"><span>${ico}</span><small>${lab}</small></button>`;
  function renderCtl() {
    const ctl = q("ycCtl"); if (!ctl || !C) return;
    const s = q("yc").dataset.state;
    if (s === "incoming") ctl.innerHTML = btn("red", "callDecline()", YI("phone", 26, "rot"), "Rad etish") + btn("green", "callAccept()", C.mode === "video" ? YI("video", 26) : YI("phone", 26), "Javob berish");
    else if (s === "calling") ctl.innerHTML = btn("red", "callEnd()", YI("phone", 26, "rot"), "Bekor qilish");
    else {
      const video = !!C.cam;
      ctl.innerHTML = btn(C.muted ? "off" : "", "callMute()", C.muted ? YI("micoff", 24) : YI("mic", 24), "Mikrofon") +
        btn(video ? "" : "off", "callCamera()", video ? YI("video", 24) : YI("videooff", 24), video ? "Kamera" : "Kamerani yoq") +
        (video ? btn("", "callFlip()", YI("flip", 24), "Almashtirish") + btn(C.cam.beauty > 0 ? "on" : "", "callBeauty()", YI("sparkle", 24), "Tiniq") + btn(C.filterOpen ? "on" : "", "callFilters()", YI("sliders", 24), "Filtr") : "") +
        btn("red", "callEnd()", YI("phone", 26, "rot"), "Tugatish");
    }
  }
  function status(t) { const e = q("ycSt"); if (e) e.textContent = t; }
  function renderPip() {
    const p = q("ycPip"); if (!p) return;
    p.innerHTML = "";
    if (C && C.cam) { C.cam.cv.className = C.cam.facing === "user" ? "mir" : ""; p.appendChild(C.cam.cv); p.hidden = false; } else p.hidden = true;
  }
  function renderFilters() {
    const f = q("ycFil"); if (!f) return;
    f.hidden = !(C && C.cam && C.filterOpen);
    if (f.hidden) return;
    const cam = C.cam, val = Math.round((cam.beauty || cam.bLast || .7) * 100);
    f.innerHTML = `<div class="yc-beauty"><span>✨ Tiniq yuz</span><input type="range" id="ycInt" min="0" max="100" value="${val}" oninput="callBeautyLevel(this.value)" aria-label="Tiniqlik darajasi"><b id="ycIntV">${cam.beauty > 0 ? Math.round(cam.beauty * 100) + "%" : "Oʻchiq"}</b></div><div class="yc-chips">` +
      usable().map(x => `<button type="button" class="${cam.filter.id === x.id ? "on" : ""}" onclick="callSetFilter('${x.id}')">${x.name}</button>`).join("") + "</div>";
  }

  // ---------- chiquvchi ----------
  async function preflight(mode) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("Qoʻngʻiroq uchun sayt HTTPS orqali ochilishi va brauzer mikrofonni qoʻllashi kerak.");
    try { const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === "video" }); s.getTracks().forEach(t => t.stop()); }
    catch (_) { throw new Error(mode === "video" ? "Kamera va mikrofondan foydalanishga ruxsat bering." : "Mikrofondan foydalanishga ruxsat bering."); }
  }
  // ---------- qabul qiluvchi sozlamalari: kim qoʻngʻiroq qila oladi ----------
  function askPermission(chatId, name) {
    const nm = esc(name || "Suhbatdosh");
    if (typeof ysModal !== "function") { uiAlert(nm + " qoʻngʻiroqlarni faqat oʻzi ruxsat bergan suhbatdoshlardan qabul qiladi."); return; }
    ysModal(`<h4>Qoʻngʻiroq uchun ruxsat kerak</h4><p class="mm-p">${nm} qoʻngʻiroqlarni faqat oʻzi ruxsat bergan suhbatdoshlardan qabul qiladi. Ruxsat soʻrab xabar yuborasizmi?</p><div class="mm-row"><button type="button" class="mm-i cancel">Bekor qilish</button><button type="button" class="mm-i ok">Soʻrov yuborish</button></div>`, bg => {
      bg.querySelector(".cancel").addEventListener("click", () => ysCloseModal());
      bg.querySelector(".ok").addEventListener("click", () => {
        ysCloseModal();
        st.creq = st.creq || {};
        if (st.creq[chatId] && Date.now() - st.creq[chatId] < 10 * 60000) { toast("Soʻrov allaqachon yuborilgan. Javobni kuting."); return; }
        st.creq[chatId] = Date.now();
        FB.send("chats", chatId, "Qoʻngʻiroq qilishga ruxsat soʻralmoqda", st.user.name, "callreq").then(() => toast("Soʻrov yuborildi")).catch(e => uiAlert("Soʻrov yuborilmadi: " + (e.message || e)));
      });
    });
  }
  async function gate(mode, peer, chatId, name) {
    let p = {};
    try { p = await FB.getPrefs(peer); } catch (_) {}
    const cm = p.calls || "approved";
    if (cm === "none") { uiAlert("Bu foydalanuvchi qoʻngʻiroqlarni qabul qilmaydi."); return false; }
    if (mode === "video" && p.video === false) { uiAlert("Bu foydalanuvchi video qoʻngʻiroqlarni qabul qilmaydi. Ovozli qoʻngʻiroq qilib koʻring."); return false; }
    const allowed = st.peerState ? st.peerState.allowCalls === true : null;
    if (cm !== "all" && allowed === false) { askPermission(chatId, name); return false; }
    return true;
  }

  window.callStart = async function (mode) {
    const ch = st.chat;
    if (C && !C.ended) { uiAlert("Siz allaqachon qoʻngʻiroqdasiz."); return; }
    if (C) closeUi(C);
    if (!ch || ch.t !== "c" || !st.user) return;
    const chat = (st.chats || []).find(x => x.id === ch.id); if (!chat) return;
    if (st.vrec) { uiAlert("Avval ovoz yozishni tugating."); return; }
    const me = st.user.uid, peer = (chat.members || []).find(x => x !== me);
    if (!peer) return;
    const own = chat.owner === me;
    const name = own ? chat.askerName : ((st.csh && st.csh.name) || chat.ownerName);
    const ava = own ? ava2(chat.askerImg) : ava2(chat.ownerImg, chat.ownerAva);
    if (!(await gate(mode, peer, ch.id, name))) return;
    try { await preflight(mode); } catch (e) { uiAlert(e.message); return; }
    if (C && !C.ended) return;
    if (C) closeUi(C);
    C = { role: "caller", mode, chatId: ch.id, peer, peerName: name, peerAva: ava, ended: false };
    ui("calling"); status("Qoʻngʻiroq qilinmoqda…"); ring("out");
    try { C.id = await FB.callCreate(ch.id, peer, mode, st.user.name); }
    catch (e) {
      const m = e && e.message ? e.message : e; closeUi(C);
      if (e && e.code === "permission-denied") askPermission(ch.id, name); else uiAlert("Qoʻngʻiroq boshlanmadi: " + m);
      return;
    }
    const my = C;
    my.unsub = FB.callWatch(my.id, d => {
      if (!d || C !== my || my.ended) return;
      my.status = d.status;
      if (d.status === "accepted" && !my.joined) { my.joined = true; stopRing(); clearTimeout(my.tm); connect(); }
      else if (d.status === "declined") finish("Qoʻngʻiroq rad etildi", "declined");
      else if (d.status === "ended" || d.status === "missed") finish("Qoʻngʻiroq tugadi", d.status);
    });
    my.tm = setTimeout(() => { if (C === my && !my.joined) { FB.callSet(my.id, "missed").catch(() => {}); finish("Javob bermadi", "missed"); } }, RING_MS());
  };
  function ava2(img, emoji) { return img ? `<img alt="" src="${e2(img)}">` : e2(emoji || "👤"); }

  // ---------- kiruvchi ----------
  function showIncoming(d) {
    if (C && !C.ended) { FB.callSet(d.id, "declined").catch(() => {}); return; }
    if (C) closeUi(C);
    const chat = (st.chats || []).find(x => x.id === d.chatId);
    const me = st.user && st.user.uid, own = chat && chat.owner === me;
    C = { role: "callee", id: d.id, mode: d.mode === "video" ? "video" : "audio", chatId: d.chatId, peer: d.from, peerName: d.fromName || (chat ? (own ? chat.askerName : chat.ownerName) : "Suhbatdosh"), peerAva: chat ? (own ? ava2(chat.askerImg) : ava2(chat.ownerImg, chat.ownerAva)) : "👤", ended: false };
    ui("incoming"); status(C.mode === "video" ? "Video qoʻngʻiroq…" : "Ovozli qoʻngʻiroq…"); ring("in");
    const my = C;
    my.unsub = FB.callWatch(my.id, x => { if (C !== my || my.ended) return; if (!x || (x.status !== "ringing" && x.status !== "accepted")) finish("Qoʻngʻiroq bekor qilindi", "ended", true); });
    my.tm = setTimeout(() => { if (C === my && !my.joined) finish("Javob berilmadi", "missed", true); }, RING_MS() + 5000);
  }
  window.callAccept = async function () {
    const my = C; if (!my || my.role !== "callee" || my.joined) return;
    try { await preflight(my.mode); } catch (e) { uiAlert(e.message); return; }
    if (C !== my) return;
    my.joined = true; stopRing(); clearTimeout(my.tm);
    try { await FB.callSet(my.id, "accepted"); } catch (e) { finish("Qoʻngʻiroqqa ulanib boʻlmadi", "ended", true); return; }
    connect();
  };
  window.callDecline = function () { const my = C; if (!my || my.role !== "callee") return; FB.callSet(my.id, "declined").catch(() => {}); finish("Rad etildi", "declined", true); };

  function watchIncoming() {
    const uid = st && st.user && st.user.uid;
    if (uid === incUid) return;
    if (incUnsub) { try { incUnsub(); } catch (_) {} incUnsub = null; }
    incUid = uid || null;
    if (!uid) return;
    incUnsub = FB.callIncoming(uid, list => {
      list.forEach(d => {
        if (handled.has(d.id) || Math.abs(Date.now() - (d.t || 0)) > 75000) return;
        handled.add(d.id); showIncoming(d);
      });
    });
  }

  // ---------- ulanish ----------
  async function connect() {
    const my = C; if (!my) return;
    ui("live"); status("Ulanmoqda…");
    try {
      await loadSdk();
      const myUid = uidFor(st.user.uid);
      const d = await FB.callToken(my.id, myUid);
      if (C !== my) return;
      const client = my.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      client.on("user-joined", () => { if (!my.t0) { my.t0 = Date.now(); my.clock = setInterval(() => status(fmt((Date.now() - my.t0) / 1000)), 500); status("0:00"); } });
      client.on("user-published", async (u, type) => {
        try { await client.subscribe(u, type); } catch (_) { return; }
        if (type === "video") { const r = q("ycRemote"); if (r) { u.videoTrack.play(r); r.classList.add("on"); } q("yc").classList.add("hasv"); }
        if (type === "audio") u.audioTrack.play();
      });
      client.on("user-unpublished", (u, type) => { if (type === "video") { const r = q("ycRemote"); if (r) r.classList.remove("on"); q("yc") && q("yc").classList.remove("hasv"); } });
      client.on("user-left", () => { if (C === my) { status("Suhbatdosh uzildi"); setTimeout(() => { if (C === my) endLocal(true); }, 1200); } });
      client.on("token-privilege-will-expire", async () => { try { const n = await FB.callToken(my.id, myUid); await client.renewToken(n.token); } catch (_) {} });
      await client.join(d.appId || APP_ID, d.channel, d.token, d.uid);
      if (C !== my) { try { await client.leave(); } catch (_) {} return; }
      my.mic = await AgoraRTC.createMicrophoneAudioTrack({ AEC: true, ANS: true, AGC: true });
      await client.publish([my.mic]);
      if (my.mode === "video") await startVideo();
      status(my.t0 ? fmt((Date.now() - my.t0) / 1000) : (my.role === "caller" ? "Suhbatdosh ulanmoqda…" : "Ulanmoqda…"));
      try { if (navigator.wakeLock) my.wl = await navigator.wakeLock.request("screen"); } catch (_) {}
    } catch (e) {
      if (C === my) { const m = e && e.message ? e.message : e; finish("Ulanib boʻlmadi", "ended"); uiAlert("Qoʻngʻiroqqa ulanib boʻlmadi: " + m); }
    }
  }
  async function startVideo() {
    const my = C; if (!my || my.cam) return;
    const cam = await startCam("user");
    if (C !== my) { stopCam(cam); return; }
    my.cam = cam;
    my.vtrack = AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: cam.out, width: cam.w, height: cam.h, frameRate: 24, bitrateMin: 200, bitrateMax: 900, optimizationMode: "motion" });
    await my.client.publish([my.vtrack]);
    renderPip(); renderFilters(); renderCtl();
  }
  async function stopVideo() {
    const my = C; if (!my || !my.cam) return;
    try { await my.client.unpublish([my.vtrack]); } catch (_) {}
    try { my.vtrack.close(); } catch (_) {}
    stopCam(my.cam); my.cam = null; my.vtrack = null; my.filterOpen = false;
    renderPip(); renderFilters(); renderCtl();
  }

  // ---------- boshqaruv ----------
  window.callMute = function () { const my = C; if (!my || !my.mic) return; my.muted = !my.muted; try { my.mic.setEnabled(!my.muted); } catch (_) {} renderCtl(); };
  window.callCamera = async function () {
    const my = C; if (!my || !my.client) return;
    try { if (my.cam) await stopVideo(); else { await preflight("video"); await startVideo(); } }
    catch (e) { uiAlert("Kamerani yoqib boʻlmadi: " + (e.message || e)); }
  };
  window.callFlip = async function () {
    const my = C; if (!my || !my.cam) return;
    const next = my.cam.facing === "user" ? "environment" : "user";
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: next, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      const old = my.cam.stream; my.cam.stream = s; my.cam.v.srcObject = s; my.cam.facing = next;
      try { old.getTracks().forEach(t => t.stop()); } catch (_) {}
      try { await my.cam.v.play(); } catch (_) {}
      renderPip();
    } catch (_) { uiAlert("Kamerani almashtirib boʻlmadi."); }
  };
  window.callFilters = function () { const my = C; if (!my || !my.cam) return; my.filterOpen = !my.filterOpen; renderFilters(); renderCtl(); };
  window.callSetFilter = function (id) {
    const my = C; if (!my || !my.cam) return;
    const cam = my.cam, f = FILTERS.find(x => x.id === id) || FILTERS[0];
    cam.filter = f; cam.parts = []; cam.pv = null; if (f.mask) cam.lm = null; renderFilters();
    if (f.mask) ensureFace(cam, "Niqobni yuklab boʻlmadi. Internet aloqasini tekshiring.", () => { cam.filter = FILTERS[0]; renderFilters(); });
  };
  window.callBeauty = function () {
    const my = C; if (!my || !my.cam) return; const cam = my.cam;
    if (cam.beauty > 0) { cam.bLast = cam.beauty; cam.beauty = 0; }
    else { cam.beauty = cam.bLast || .7; ensureFace(cam, "Aniq yuz filtri yuklanmadi, oddiy yumshatish ishlayapti."); }
    renderCtl(); renderFilters();
  };
  window.callBeautyLevel = function (v) {
    const my = C; if (!my || !my.cam) return; const cam = my.cam;
    cam.beauty = Math.max(0, Math.min(1, Number(v) / 100));
    if (cam.beauty > 0) { cam.bLast = cam.beauty; ensureFace(cam, "Aniq yuz filtri yuklanmadi, oddiy yumshatish ishlayapti."); }
    const t = q("ycIntV"); if (t) t.textContent = cam.beauty > 0 ? Math.round(cam.beauty * 100) + "%" : "Oʻchiq";
    renderCtl();
  };
  window.callEnd = function () {
    const my = C; if (!my) return;
    if (my.role === "caller" && !my.joined) { FB.callSet(my.id, "ended").catch(() => {}); finish("Bekor qilindi", "ended"); }
    else endLocal(false);
  };
  function endLocal(remote) { const my = C; if (!my) return; if (!remote && my.id && my.status !== "ended") FB.callSet(my.id, "ended").catch(() => {}); finish("Qoʻngʻiroq tugadi", "ended", remote); }

  function closeUi(my) { if (my && C !== my) return; const el = q("yc"); if (el) el.remove(); C = null; stopRing(); }
  function finish(msg, final, quiet) {
    const my = C; if (!my || my.ended) return;
    my.ended = true; stopRing(); clearTimeout(my.tm); clearInterval(my.clock);
    try { my.unsub && my.unsub(); } catch (_) {}
    const secs = my.t0 ? (Date.now() - my.t0) / 1000 : 0;
    try { my.client && my.client.leave(); } catch (_) {}
    try { if (my.mic) { my.mic.stop(); my.mic.close(); } } catch (_) {}
    try { my.vtrack && my.vtrack.close(); } catch (_) {}
    stopCam(my.cam); my.cam = null;
    try { my.wl && my.wl.release(); } catch (_) {}
    if (my.role === "caller" && my.chatId) {
      const kind = my.mode === "video" ? "📹 Video qoʻngʻiroq" : "📞 Ovozli qoʻngʻiroq";
      const text = secs >= 1 ? kind + " · " + fmt(secs) : (final === "declined" ? "📞 Qoʻngʻiroq rad etildi" : "📞 Javobsiz qoʻngʻiroq");
      FB.send("chats", my.chatId, text, st.user ? st.user.name : "", "call", {}).catch(() => {});
    }
    if (quiet) { closeUi(my); return; }
    status(msg); const f = q("ycFil"); if (f) f.hidden = true; const c = q("ycCtl"); if (c) c.innerHTML = "";
    setTimeout(() => closeUi(my), 900);
  }

  // chatdagi qoʻngʻiroq yozuvi (emoji oʻrniga ilova ikoni)
  window.callBubble = function (x) {
    const me = st.user && x.from === st.user.uid, t = String(x.text || ""), video = /Video/.test(t), miss = /Javobsiz|rad etildi/.test(t);
    const label = t.replace(/^[^A-Za-z0-9]+/, "");
    return `<div class="m cb ${me ? "me" : ""}" data-mid="${x.id}"><span class="cb-i${miss ? " miss" : ""}">${YI(video ? "video" : "phone", 18)}</span><span class="cb-t">${esc(label)}</span><small>${tm(x.t)}${typeof msgTick === "function" ? msgTick(x) : ""}</small></div>`;
  };

  // ---------- chat sarlavhasiga tugmalar ----------
  const base = window.chatV;
  window.chatV = function () {
    let h = base();
    if (!st.chat || st.chat.t === "g" || !st.user) return h;
    const k = '<button onclick="st.menu=!st.menu;draw()">';
    if (h.indexOf(k) < 0) return h;
    return h.replace(k, `<button class="hd-call" type="button" aria-label="Ovozli qoʻngʻiroq" onclick="callStart('audio')">${I_PHONE}</button><button class="hd-call" type="button" aria-label="Video qoʻngʻiroq" onclick="callStart('video')">${I_CAM}</button>` + k);
  };
  // bildirishnomani bosganda tegishli chatni ochish
  function openWhenReady(id, n) {
    n = n || 0;
    if (typeof openC === "function" && st.user && (st.chats || []).some(c => c.id === id)) { openC(id); return; }
    if (n < 40) setTimeout(() => openWhenReady(id, n + 1), 500);
  }
  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener("message", e => { const id = e.data && e.data.openChat; if (id) openWhenReady(id); });
  try { const qid = new URLSearchParams(location.search).get("chat"); if (qid) { history.replaceState(null, "", location.pathname); openWhenReady(qid); } } catch (_) {}
  setInterval(watchIncoming, 2000);
  window.addEventListener("pagehide", () => { if (C && C.id && (C.joined || C.role === "caller")) { try { FB.callSet(C.id, "ended"); } catch (_) {} } });
  window.__yqCall = { get C() { return C; }, FILTERS, watchIncoming };
})();
