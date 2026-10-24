/* Agora RTC group calling for Yaqin. App ID is public; certificate stays server-side. */
(function () {
  "use strict";
  const APP_ID = "868b06d16f0f43dc82dec0f4fefb23e9";
  function channelFor(gid) { return ("yq_" + String(gid)).slice(0, 63); }
  function uidFor(value) {
    let h = 2166136261;
    for (let i = 0; i < value.length; i++) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) || 1;
  }
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
      name.textContent = label;
      const media = document.createElement("div");
      media.className = "agora-media";
      wrap.append(name, media);
      box.appendChild(wrap);
    }
    wrap.querySelector(".agora-name").textContent = label;
    return wrap.querySelector(".agora-media");
  }
  function setStatus(text) {
    const el = document.getElementById("callStatus");
    if (el) el.textContent = text;
  }
  function updateButtons(call) {
    const mic = document.getElementById("callMuteBtn");
    const cam = document.getElementById("callVideoBtn");
    if (mic) mic.textContent = call.muted ? "🔇 Mikrofonni yoqish" : "🎙️ Mikrofonni oʻchirish";
    if (cam) cam.textContent = call.videoTrack ? "📷 Videoni oʻchirish" : "📹 Videoni yoqish";
  }
  function wireButtons(call) {
    const mic = document.getElementById("callMuteBtn");
    const cam = document.getElementById("callVideoBtn");
    if (mic) mic.onclick = async () => {
      if (GC !== call || !call.audioTrack) return;
      try {
        call.muted = !call.muted;
        await call.audioTrack.setEnabled(!call.muted);
        updateButtons(call);
      } catch (e) { call.muted = !call.muted; uiAlert("Mikrofonni almashtirib boʻlmadi: " + (e?.message || e)); }
    };
    if (cam) cam.onclick = () => toggleCamera(call);
    updateButtons(call);
  }
  async function startGroupCall(mode) {
    const ch = st && st.chat;
    if (!ch || ch.t !== "g") return;
    const g = (st.groups || []).find(x => x.id === ch.id);
    if (!g || Number(g.premiumUntil) <= Date.now()) {
      uiAlert("Ovozli chat va jonli video uchun faol Premium guruh kerak."); return;
    }
    if (!window.AgoraRTC) {
      try {
        await new Promise((res, rej) => {
          const sc = document.createElement("script");
          sc.src = "https://download.agora.io/sdk/release/AgoraRTC_N-4.23.4.js";
          sc.onload = res; sc.onerror = () => rej(new Error("x"));
          document.head.appendChild(sc);
        });
      } catch (_) { uiAlert("Agora Web SDK yuklanmadi. Internet aloqasini tekshiring."); return; }
    }
    if (!navigator.mediaDevices?.getUserMedia) { uiAlert("Mikrofon/kamera uchun sayt HTTPS orqali ochilishi kerak."); return; }
    if (GC) {
      if (GC.gid === ch.id) {
        if (mode === "video" && !GC.videoTrack) return toggleCamera(GC);
        uiAlert("Siz allaqachon ovozli chatdasiz."); return;
      }
      await leaveGroupCall(true);
    }
    let call = null;
    try {
      const channel = channelFor(ch.id);
      const uid = uidFor(st.user.uid);
      const credentials = await FB.agoraToken(channel, uid);
      if (!credentials || !credentials.token || !credentials.appId) throw new Error("Agora token xizmati sozlanmagan.");
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      call = { gid: ch.id, mode: "audio", channel, uid, client, audioTrack: null, videoTrack: null, muted: false, videoEnabled: false, leaving: false };
      GC = call;
      const renewToken = async () => {
        try {
          const c = await FB.agoraToken(channel, uid);
          await client.renewToken(c.token);
        } catch (e) { console.warn("Agora token yangilanmadi:", e); }
      };
      client.on("token-privilege-will-expire", renewToken);
      client.on("token-privilege-did-expire", renewToken);
      client.on("user-published", async (user, mediaType) => {
        if (GC !== call) return;
        await client.subscribe(user, mediaType);
        if (mediaType === "audio" && user.audioTrack) user.audioTrack.play();
        if (mediaType === "video" && user.videoTrack) {
          const el = node(user.uid, (call.names && call.names[user.uid]) || ("Guruh aʼzosi " + String(user.uid).slice(-5)));
          if (el) user.videoTrack.play(el);
        }
      });
      client.on("user-unpublished", user => document.getElementById("agora_" + user.uid)?.querySelector(".agora-media")?.replaceChildren());
      client.on("user-left", user => document.getElementById("agora_" + user.uid)?.remove());
      await client.join(credentials.appId || APP_ID, channel, credentials.token, uid);
      call.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await client.publish([call.audioTrack]);
      await FB.groupCallEnter(ch.id, "audio");
      call.names = {};
      call.unsubNames = FB.groupCallParticipants(ch.id, ps => {
        for (const p of ps) {
          const k = uidFor(p.uid);
          call.names[k] = p.name || "Aʼzo";
          const el = document.querySelector("#agora_" + k + " .agora-name");
          if (el) el.textContent = call.names[k];
        }
      });
      draw();
      const panel = document.getElementById("groupCallPanel");
      if (panel) panel.style.display = "block";
      wireButtons(call);
      setStatus("🎙️ Ovozli chat yoniq · guruh aʼzolari ulanishi kutilmoqda");
      toast("Ovozli chat boshlandi");
      if (mode === "video") await toggleCamera(call);
    } catch (e) {
      console.error("Agora group call:", e);
      if (call) {
        try { call.audioTrack?.close(); call.videoTrack?.close(); await call.client?.leave(); } catch (_) {}
        if (GC === call) GC = null;
      }
      try { if (ch?.id) await FB.groupCallLeave(ch.id); } catch (_) {}
      uiAlert("Qoʻngʻiroq boshlanmadi: " + (e?.message || e) + ". Agora tokeni va mikrofon/kamera ruxsatini tekshirish kerak.");
    }
  }
  async function toggleCamera(call) {
    if (GC !== call) return;
    try {
      if (call.videoTrack) {
        await call.client.unpublish(call.videoTrack);
        call.videoTrack.stop();
        call.videoTrack.close();
        call.videoTrack = null;
        document.getElementById("agora_local")?.querySelector(".agora-media")?.replaceChildren();
        setStatus("🎙️ Ovozli chat yoniq · video oʻchirilgan");
      } else {
        call.videoTrack = await AgoraRTC.createCameraVideoTrack({ encoderConfig: "360p_7" });
        await call.client.publish(call.videoTrack);
        const el = node("local", "Siz");
        if (el) call.videoTrack.play(el);
        setStatus("🎙️ Ovozli chat yoniq · 📹 video ham yoqilgan");
      }
      call.videoEnabled = !!call.videoTrack;
      updateButtons(call);
    } catch (e) {
      if (call.videoTrack && !call.videoEnabled) {
        try { call.videoTrack.close(); } catch (_) {}
        call.videoTrack = null;
      }
      uiAlert("Videoni yoqib/oʻchirib boʻlmadi: " + (e?.message || e) + ". Kamera ruxsatini tekshiring.");
    }
  }
  async function leaveGroupCall(silent = false) {
    const call = GC;
    if (!call) return;
    GC = null;
    try { call.unsubNames && call.unsubNames(); } catch (_) {}
    try { call.audioTrack?.stop(); call.audioTrack?.close(); } catch (_) {}
    try { call.videoTrack?.stop(); call.videoTrack?.close(); } catch (_) {}
    try { await call.client?.leave(); } catch (e) { console.warn("Agora leave:", e); }
    document.getElementById("callVideos")?.replaceChildren();
    try { await FB.groupCallLeave(call.gid); } catch (e) { console.warn("Guruh qoʻngʻirogʻidan chiqish:", e); }
    if (!silent && st?.chat?.id === call.gid) draw();
  }
  window.addEventListener("pagehide", () => { try { GC && GC.client && GC.client.leave(); } catch (_) {} });
  window.startGroupCall = startGroupCall;
  window.leaveGroupCall = leaveGroupCall;
})();
