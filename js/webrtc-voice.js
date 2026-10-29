/* Yaqin: Agora'siz ovozli chat — oddiy WebRTC (mesh), signal Firestore orqali beriladi.
   Foydalanish: const r = YQRtc.create({ myUid, getIce, send, listen, del, onSpeak, onStatus, onAutoplayBlocked });
   await r.join(); r.syncPeers([boshqa ishtirokchilar uid]); await r.setMic(true/false); r.leave(); */
(function (root) {
  "use strict";
  const STUN = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];
  // Zaxira (ommaviy bepul) TURN — Cloudflare TURN sozlanmagan boʻlsa urinib koʻriladi, kafolat yoʻq.
  const PUBLIC_TURN = [{ urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443", "turn:openrelay.metered.ca:443?transport=tcp"], username: "openrelayproject", credential: "openrelayproject" }];
  const SIG_MAX_AGE = 120000, WATCH_EVERY = 6000, STUCK_AFTER = 14000;

  function create(o) {
    const me = String(o.myUid), peers = new Map(), early = new Map(), logs = [];
    let iceServers = null, micTrack = null, localAn = null, muted = true, joined = false, unsub = null;
    let ac = null, host = null, speakT = null, watchT = null, queue = Promise.resolve(), lastSet = [], gestureFn = null;
    const speaking = new Map();
    const log = (...a) => { logs.push(((typeof performance !== "undefined" ? performance.now() / 1000 : 0).toFixed(1) + "s " + a.join(" ")).slice(0, 240)); if (logs.length > 160) logs.shift(); };
    const short = u => String(u).slice(0, 6);
    const rid = () => Math.random().toString(36).slice(2, 10);
    const isInit = other => me < String(other);
    const notify = () => { try { o.onStatus && o.onStatus(status()); } catch (_) {} };
    const send = (to, sid, type, data) => Promise.resolve(o.send({ to, sid, type, data: data || "" })).catch(e => log("send xato", type, e && e.message));

    function status() { return [...peers.values()].map(p => ({ uid: p.uid, state: p.pc.connectionState || "new" })); }

    async function loadIce() {
      let list = null;
      try { list = await Promise.race([o.getIce(), new Promise((_, rej) => setTimeout(() => rej(new Error("ice timeout")), 8000))]); } catch (e) { log("ICE serverlar olinmadi:", e && e.message); }
      if (!Array.isArray(list) || !list.length) list = STUN.slice();
      if (!list.some(s => s && s.username)) list = list.concat(PUBLIC_TURN);
      iceServers = list; log("ICE:", list.map(s => [].concat(s.urls).join("|")).join(" ; ").slice(0, 150));
    }

    function makePeer(other, id, asInit) {
      const pc = new RTCPeerConnection({ iceServers, bundlePolicy: "max-bundle" });
      // Taklif beruvchi transceiver yaratadi; javob beruvchi esa taklifdan kelgan transceiver'dan foydalanadi (aks holda mikrofon ishlatilmaydigan transceiver'ga ulanib qoladi).
      const tr = asInit ? pc.addTransceiver("audio", { direction: "sendrecv" }) : null;
      const p = { uid: other, pc, id, tr, pend: [], remoteSet: false, t0: Date.now(), audio: null, an: null, closed: false };
      if (tr && micTrack && !muted) tr.sender.replaceTrack(micTrack).catch(() => {});
      pc.onicecandidate = e => { if (e.candidate) send(other, id, "cand", JSON.stringify(e.candidate)); };
      pc.ontrack = e => attach(p, (e.streams && e.streams[0]) || new MediaStream([e.track]));
      pc.oniceconnectionstatechange = () => log(short(other), "ice", pc.iceConnectionState);
      pc.onconnectionstatechange = () => {
        log(short(other), "conn", pc.connectionState); notify();
        if (pc.connectionState === "failed") setTimeout(() => { if (!p.closed && peers.get(other) === p && pc.connectionState === "failed") restart(other); }, 1200);
      };
      peers.set(other, p); notify(); return p;
    }

    function closePeer(uid) {
      const p = peers.get(uid); if (!p) return; p.closed = true; peers.delete(uid);
      try { p.pc.onicecandidate = p.pc.ontrack = p.pc.onconnectionstatechange = null; p.pc.close(); } catch (_) {}
      try { if (p.audio) { p.audio.srcObject = null; p.audio.remove && p.audio.remove(); } } catch (_) {}
      try { p.an && p.an.src && p.an.src.disconnect(); } catch (_) {}
      setSpeak(uid, false); notify();
    }

    async function connectTo(other) {
      closePeer(other);
      const id = rid(), p = makePeer(other, id, true);
      try {
        const offer = await p.pc.createOffer(); await p.pc.setLocalDescription(offer);
        await send(other, id, "offer", JSON.stringify({ type: offer.type, sdp: offer.sdp })); log("offer →", short(other));
      } catch (e) { log("offer xato", e && e.message); }
    }
    function restart(other) {
      log("qayta ulanish:", short(other));
      if (isInit(other)) connectTo(other); else { closePeer(other); send(other, "", "hello", ""); }
    }

    async function flush(p) { for (const c of p.pend.splice(0)) { try { await p.pc.addIceCandidate(c); } catch (e) { log("cand xato", e && e.message); } } }

    async function onSignal(m) {
      if (!joined || !m || !m.from) return;
      if (m.t && Date.now() - m.t > SIG_MAX_AGE) return;
      const from = String(m.from);
      if (m.type === "hello") { if (isInit(from)) { const p = peers.get(from); if (!p || (p.pc.connectionState !== "connected" && Date.now() - p.t0 > 5000)) await connectTo(from); } return; }
      if (m.type === "offer") {
        if (isInit(from)) return; // faqat kichik uid taklif yuboradi
        let p = peers.get(from); if (p && p.id === m.sid) return;
        if (p) closePeer(from);
        p = makePeer(from, m.sid, false);
        const ek = from + "|" + m.sid; if (early.has(ek)) { p.pend.push(...early.get(ek)); early.delete(ek); }
        await p.pc.setRemoteDescription(JSON.parse(m.data)); p.remoteSet = true;
        const tr = p.pc.getTransceivers().find(t => t.mid !== null && t.receiver && t.receiver.track && t.receiver.track.kind === "audio");
        if (tr) { p.tr = tr; try { tr.direction = "sendrecv"; } catch (_) {} if (micTrack && !muted) tr.sender.replaceTrack(micTrack).catch(() => {}); }
        await flush(p);
        const ans = await p.pc.createAnswer(); await p.pc.setLocalDescription(ans);
        await send(from, m.sid, "answer", JSON.stringify({ type: ans.type, sdp: ans.sdp })); log("answer →", short(from));
        return;
      }
      if (m.type === "answer") {
        const p = peers.get(from); if (!p || p.id !== m.sid || p.remoteSet) return;
        await p.pc.setRemoteDescription(JSON.parse(m.data)); p.remoteSet = true; await flush(p); return;
      }
      if (m.type === "cand") {
        let c; try { c = JSON.parse(m.data); } catch (_) { return; }
        const p = peers.get(from);
        if (p && p.id === m.sid) { if (p.remoteSet) { try { await p.pc.addIceCandidate(c); } catch (e) { log("cand xato", e && e.message); } } else p.pend.push(c); }
        else { const ek = from + "|" + m.sid; if (!early.has(ek)) early.set(ek, []); early.get(ek).push(c); }
      }
    }
    const handle = m => { queue = queue.then(() => onSignal(m)).catch(e => log("signal xato", m && m.type, e && e.message)).then(() => { try { o.del && m && m.id && o.del(m.id); } catch (_) {} }); };

    // ----- audio chiqishi va "gapiryapti" aniqlash -----
    function mkAnalyser(stream) {
      if (!ac) return null;
      try { const src = ac.createMediaStreamSource(stream), an = ac.createAnalyser(); an.fftSize = 512; src.connect(an); return { an, src, buf: new Uint8Array(an.fftSize) }; } catch (_) { return null; }
    }
    const level = a => { a.an.getByteTimeDomainData(a.buf); let s = 0; for (let i = 0; i < a.buf.length; i++) { const v = a.buf[i] - 128; s += v * v; } return Math.sqrt(s / a.buf.length); };
    function setSpeak(uid, on) { if ((speaking.get(uid) || false) === on) return; speaking.set(uid, on); try { o.onSpeak && o.onSpeak(uid, on); } catch (_) {} }
    function attach(p, stream) {
      try {
        if (!host) return;
        const a = document.createElement("audio"); a.autoplay = true; a.setAttribute("playsinline", ""); a.srcObject = stream; host.appendChild(a); p.audio = a;
        const pr = a.play(); if (pr && pr.catch) pr.catch(() => { log("autoplay bloklandi"); try { o.onAutoplayBlocked && o.onAutoplayBlocked(); } catch (_) {} });
        p.an = mkAnalyser(stream);
      } catch (e) { log("attach xato", e && e.message); }
    }
    function speakLoop() {
      for (const p of peers.values()) if (p.an) { try { setSpeak(p.uid, level(p.an) > 5); } catch (_) {} }
      if (localAn) { try { setSpeak(me, !muted && level(localAn) > 5); } catch (_) {} }
    }
    function watchdog() {
      for (const u of lastSet) {
        const p = peers.get(u), stuck = p && p.pc.connectionState !== "connected" && Date.now() - p.t0 > STUCK_AFTER;
        if (!p || stuck) { if (isInit(u)) connectTo(u); else { if (stuck) closePeer(u); send(u, "", "hello", ""); } }
      }
    }

    return {
      logs, status, me, _peers: peers,
      async join() {
        if (joined) return;
        await loadIce();
        host = document.createElement("div"); host.style.cssText = "position:fixed;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none"; document.body.appendChild(host);
        try { const AC = root.AudioContext || root.webkitAudioContext; if (AC) { ac = new AC(); if (ac.state === "suspended") ac.resume().catch(() => {}); } } catch (_) {}
        gestureFn = () => { try { ac && ac.state === "suspended" && ac.resume(); } catch (_) {} for (const p of peers.values()) { try { p.audio && p.audio.paused && p.audio.play(); } catch (_) {} } };
        document.addEventListener("pointerdown", gestureFn, true);
        joined = true; unsub = o.listen(handle);
        speakT = setInterval(speakLoop, 200); watchT = setInterval(watchdog, WATCH_EVERY);
        log("qoʻshildi, men:", short(me));
      },
      syncPeers(list) {
        if (!joined) return;
        lastSet = [...new Set((list || []).map(String).filter(u => u !== me))];
        const set = new Set(lastSet);
        for (const u of [...peers.keys()]) if (!set.has(u)) { log("ketdi:", short(u)); closePeer(u); }
        for (const u of lastSet) { if (peers.has(u)) continue; if (isInit(u)) connectTo(u); else send(u, "", "hello", ""); }
      },
      async setMic(on) {
        if (on) {
          if (!micTrack) {
            if (!root.navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("Mikrofon uchun sayt HTTPS orqali ochilishi kerak");
            const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
            micTrack = s.getAudioTracks()[0]; localAn = mkAnalyser(new MediaStream([micTrack]));
          }
          muted = false; micTrack.enabled = true;
          for (const p of peers.values()) { try { if (p.tr) await p.tr.sender.replaceTrack(micTrack); } catch (e) { log("replaceTrack xato", e && e.message); } }
        } else {
          muted = true;
          for (const p of peers.values()) { try { if (p.tr) await p.tr.sender.replaceTrack(null); } catch (_) {} }
          if (micTrack) { try { micTrack.stop(); } catch (_) {} micTrack = null; }
          try { localAn && localAn.src && localAn.src.disconnect(); } catch (_) {} localAn = null; setSpeak(me, false);
        }
      },
      isMuted: () => muted,
      leave() {
        if (!joined && !host) return; joined = false;
        clearInterval(speakT); clearInterval(watchT);
        try { unsub && unsub(); } catch (_) {} unsub = null;
        for (const u of [...peers.keys()]) closePeer(u);
        if (micTrack) { try { micTrack.stop(); } catch (_) {} micTrack = null; }
        try { document.removeEventListener("pointerdown", gestureFn, true); } catch (_) {}
        try { host && host.remove(); } catch (_) {} host = null;
        try { ac && ac.close(); } catch (_) {} ac = null; setSpeak(me, false); log("chiqdi");
      },
    };
  }
  root.YQRtc = { create };
  if (typeof module !== "undefined" && module.exports) module.exports = { create };
})(typeof window !== "undefined" ? window : globalThis);
