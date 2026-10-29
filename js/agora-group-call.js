/* Yaqin: guruh ovozli/video qoʻngʻirogʻi — oddiy WebRTC (mesh), signal Firestore (groupCalls/{gid}/rtc) orqali.
   Agora ishlatilmaydi. Fayl nomi eski; js/webrtc-voice.js (YQRtc) kerak. */
(function () {
  "use strict";
  const FRESH = 60000, BEAT = 20000, MAX_PEERS = 7;
  function node(uid, label) {
    const box = document.getElementById("callVideos");
    if (!box) return null;
    const id = "agora_" + String(uid);
    let wrap = document.getElementById(id);
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = id;
      wrap.className = "yaqin-call-tile";
      const name = document.createElement("small");
      name.className = "agora-name";
      const media = document.createElement("div");
      media.className = "agora-media";
      wrap.append(name, media);
      box.appendChild(wrap);
    }
    wrap.querySelector(".agora-name").textContent = label;
    return wrap.querySelector(".agora-media");
  }
  function showVideo(media, stream, mirror) {
    let v = media.querySelector("video");
    if (!v) {
      v = document.createElement("video");
      v.autoplay = true; v.muted = true; v.setAttribute("playsinline", "");
      v.style.cssText = "width:100%;height:100%;object-fit:cover" + (mirror ? ";transform:scaleX(-1)" : "");
      media.appendChild(v);
    }
    v.srcObject = stream;
    v.play().catch(() => {});
  }
  function setStatus(text) {
    const el = document.getElementById("callStatus");
    if (el) el.textContent = text;
  }
  function updateButtons(call) {
    const mic = document.getElementById("callMuteBtn");
    const cam = document.getElementById("callVideoBtn");
    if (mic) mic.textContent = call.muted ? "🔇 Mikrofonni yoqish" : "🎙️ Mikrofonni oʻchirish";
    if (cam) cam.textContent = call.cam ? "📷 Videoni oʻchirish" : "📹 Videoni yoqish";
  }
  function refreshStatus(call) {
    if (GC !== call || !call.rtc) return;
    const ps = call.rtc.status(), ok = ps.filter(x => x.state === "connected").length;
    const base = ps.length ? "Ovozli chat yoniq · ulangan: " + ok + "/" + ps.length : "Ovozli chat yoniq · guruh aʼzolari ulanishi kutilmoqda";
    setStatus(base + (call.cam ? " · video yoqilgan" : ""));
  }
  function wireButtons(call) {
    const mic = document.getElementById("callMuteBtn");
    const cam = document.getElementById("callVideoBtn");
    if (mic) mic.onclick = () => {
      if (GC !== call || !call.rtc) return;
      call.muted = !call.muted;
      call.rtc.setMuted(call.muted);
      updateButtons(call);
    };
    if (cam) cam.onclick = () => toggleCamera(call);
    updateButtons(call);
  }
  // Yangi (yaroqli) ishtirokchilar roʻyxatini hisoblab, ulanishlarni moslashtiradi
  function refreshPeers(call) {
    if (GC !== call || !call.rtc) return;
    const now = Date.now(), live = [];
    for (const p of call.parts || []) {
      const ts = p.seen || p.joinedAt || 0;
      if (p.uid !== st.user.uid && now - ts < FRESH) live.push(p.uid);
    }
    if (live.length > MAX_PEERS && !call.warned) { call.warned = true; toast("Qoʻngʻiroqda odam koʻp: sifat pasayishi mumkin"); }
    call.rtc.syncPeers(live.slice(0, MAX_PEERS));
  }
  async function startGroupCall(mode) {
    const ch = st && st.chat;
    if (!ch || ch.t !== "g") return;
    const g = (st.groups || []).find(x => x.id === ch.id);
    if (!g || Number(g.premiumUntil) <= Date.now()) {
      uiAlert("Ovozli chat va jonli video uchun faol Premium guruh kerak."); return;
    }
    if (!window.YQRtc) { uiAlert("Ovoz moduli yuklanmadi. Sahifani yangilang."); return; }
    if (!navigator.mediaDevices?.getUserMedia) { uiAlert("Mikrofon/kamera uchun sayt HTTPS orqali ochilishi kerak."); return; }
    if (GC) {
      if (GC.gid === ch.id) {
        if (mode === "video" && !GC.cam) return toggleCamera(GC);
        uiAlert("Siz allaqachon ovozli chatdasiz."); return;
      }
      await leaveGroupCall(true);
    }
    let call = null;
    try {
      const gid = ch.id;
      call = { gid, rtc: null, cam: null, muted: false, names: {}, parts: [], beat: null, unsubNames: null, warned: false };
      GC = call;
      call.rtc = YQRtc.create({
        myUid: st.user.uid, video: true, maxVideoBitrate: 500000,
        getIce: () => FB.rtcIce(),
        send: m => FB.rtcSendC("groupCalls", gid, m),
        listen: cb => FB.rtcListenC("groupCalls", gid, cb),
        del: id => FB.rtcDelC("groupCalls", gid, id),
        onStatus: () => refreshStatus(call),
        onRemoteVideo: (uid, stream) => {
          if (GC !== call) return;
          if (stream) { const el = node(uid, call.names[uid] || "Guruh aʼzosi"); if (el) showVideo(el, stream, false); }
          else document.getElementById("agora_" + uid)?.remove();
        },
      });
      await call.rtc.join();
      await call.rtc.setMic(true);
      await FB.groupCallEnter(gid, "audio");
      FB.groupCallBeat(gid);
      call.unsubNames = FB.groupCallParticipants(gid, ps => {
        if (GC !== call) return;
        call.parts = ps;
        for (const p of ps) {
          call.names[p.uid] = p.name || "Aʼzo";
          const el = document.querySelector("#agora_" + p.uid + " .agora-name");
          if (el) el.textContent = call.names[p.uid];
        }
        refreshPeers(call);
      });
      call.beat = setInterval(() => { if (GC !== call) return; FB.groupCallBeat(gid); refreshPeers(call); }, BEAT);
      draw();
      const panel = document.getElementById("groupCallPanel");
      if (panel) panel.style.display = "block";
      wireButtons(call);
      refreshStatus(call);
      toast("Ovozli chat boshlandi");
      if (mode === "video") await toggleCamera(call);
    } catch (e) {
      console.error("Guruh qoʻngʻirogʻi:", e);
      if (call) {
        try { call.rtc && call.rtc.leave(); } catch (_) {}
        try { clearInterval(call.beat); call.unsubNames && call.unsubNames(); } catch (_) {}
        if (GC === call) GC = null;
      }
      try { if (ch?.id) await FB.groupCallLeave(ch.id); } catch (_) {}
      uiAlert("Qoʻngʻiroq boshlanmadi: " + (e?.message || e) + ". Mikrofon/kamera ruxsatini va internetni tekshiring.");
    }
  }
  async function toggleCamera(call) {
    if (GC !== call || !call.rtc) return;
    try {
      if (call.cam) {
        const s = call.cam; call.cam = null;
        s.getTracks().forEach(t => t.stop());
        await call.rtc.setVideo(null);
        document.getElementById("agora_local")?.remove();
      } else {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 24 } }, audio: false });
        call.cam = s;
        await call.rtc.setVideo(s.getVideoTracks()[0]);
        const el = node("local", "Siz");
        if (el) showVideo(el, s, true);
      }
      refreshStatus(call);
      updateButtons(call);
    } catch (e) {
      uiAlert("Videoni yoqib/oʻchirib boʻlmadi: " + (e?.message || e) + ". Kamera ruxsatini tekshiring.");
    }
  }
  async function leaveGroupCall(silent = false) {
    const call = GC;
    if (!call) return;
    GC = null;
    try { clearInterval(call.beat); call.unsubNames && call.unsubNames(); } catch (_) {}
    try { call.cam && call.cam.getTracks().forEach(t => t.stop()); } catch (_) {}
    try { call.rtc && call.rtc.leave(); } catch (e) { console.warn("rtc leave:", e); }
    document.getElementById("callVideos")?.replaceChildren();
    try { await FB.groupCallLeave(call.gid); } catch (e) { console.warn("Guruh qoʻngʻirogʻidan chiqish:", e); }
    if (!silent && st?.chat?.id === call.gid) draw();
  }
  window.groupCallMic = function () {
    const c = GC; if (!c || !c.rtc) return;
    c.muted = !c.muted; c.rtc.setMuted(c.muted); updateButtons(c);
  };
  window.groupCallCam = function () { if (GC) toggleCamera(GC); };
  window.addEventListener("pagehide", () => { try { GC && GC.rtc && GC.rtc.leave(); } catch (_) {} });
  window.startGroupCall = startGroupCall;
  window.leaveGroupCall = leaveGroupCall;
})();
