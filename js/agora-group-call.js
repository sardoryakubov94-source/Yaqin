/* Agora RTC group calling for Yaqin. App ID is public; certificate stays server-side. */
(function () {
  "use strict";
  const APP_ID = "868b06d16f0f43dc82dec0f4fefb23e9";
  const active = () => GC || null;
  const channelFor = gid => ("yq_" + String(gid)).slice(0, 63);
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
      wrap.style.cssText = "position:relative;min-height:100px;background:#171421;border-radius:12px;overflow:hidden;color:white";
      const name = document.createElement("small");
      name.className = "agora-name";
      name.style.cssText = "display:block;padding:5px 7px;color:#fff;background:#211d2b";
      wrap.appendChild(name);
      const media = document.createElement("div");
      media.className = "agora-media";
      media.style.cssText = "width:100%;min-height:100px";
      wrap.appendChild(media);
      box.appendChild(wrap);
    }
    wrap.querySelector(".agora-name").textContent = label;
    return wrap.querySelector(".agora-media");
  }
  function showLocal(call) {
    if (!call.videoTrack) return;
    const el = node("local", "Siz");
    if (el) call.videoTrack.play(el);
  }
  async function startGroupCall(mode) {
    const ch = st && st.chat;
    if (!ch || ch.t !== "g") return;
    const g = (st.groups || []).find(x => x.id === ch.id);
    if (!g || Number(g.premiumUntil) <= Date.now()) {
      uiAlert("Ovozli suhbat va jonli video uchun faol Premium guruh kerak."); return;
    }
    if (!window.AgoraRTC) { uiAlert("Agora Web SDK yuklanmadi. Internet aloqasini tekshiring."); return; }
    if (!navigator.mediaDevices?.getUserMedia) { uiAlert("Mikrofon/kamera uchun sayt HTTPS orqali ochilishi kerak."); return; }
    if (GC) {
      if (GC.gid === ch.id && GC.mode === mode) { uiAlert("Siz allaqachon qoʻngʻiroqdasiz."); return; }
      await leaveGroupCall(true);
    }
    let call = null;
    try {
      const channel = channelFor(ch.id);
      const uid = uidFor(st.user.uid);
      const credentials = await FB.agoraToken(channel, uid);
      if (!credentials || !credentials.token || !credentials.appId) throw new Error("Agora token xizmati sozlanmagan.");
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      call = { gid: ch.id, mode, channel, uid, client, audioTrack: null, videoTrack: null, muted: false, cameraOff: false, leaving: false };
      GC = call;
      client.on("user-published", async (user, mediaType) => {
        if (GC !== call) return;
        await client.subscribe(user, mediaType);
        if (mediaType === "audio" && user.audioTrack) user.audioTrack.play();
        if (mediaType === "video" && user.videoTrack) {
          const el = node(user.uid, "Guruh aʼzosi " + String(user.uid).slice(-5));
          if (el) user.videoTrack.play(el);
        }
      });
      client.on("user-unpublished", user => document.getElementById("agora_" + user.uid)?.querySelector(".agora-media")?.replaceChildren());
      client.on("user-left", user => document.getElementById("agora_" + user.uid)?.remove());
      await client.join(credentials.appId || APP_ID, channel, credentials.token, uid);
      call.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const tracks = [call.audioTrack];
      if (mode === "video") {
        call.videoTrack = await AgoraRTC.createCameraVideoTrack({ encoderConfig: "360p_7" });
        tracks.push(call.videoTrack);
      }
      await client.publish(tracks);
      await FB.groupCallEnter(ch.id, mode);
      draw();
      const panel = document.getElementById("groupCallPanel");
      if (panel) panel.style.display = "block";
      if (mode === "video") showLocal(call);
      const videos = document.getElementById("callVideos");
      if (mode === "audio" && videos) videos.innerHTML = '<div style="padding:12px;background:var(--card);border-radius:10px">🎙️ Mikrofon faol. Guruh aʼzolari ulanmoqda…</div>';
      const controls = document.getElementById("groupCallPanel");
      if (controls && !document.getElementById("agoraCallTools")) {
        const tools = document.createElement("div");
        tools.id = "agoraCallTools";
        tools.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-top:8px";
        tools.innerHTML = '<button class="ghost" id="agoraMuteBtn" type="button">🎙️ Mikrofonni oʻchirish</button>' +
          (mode === "video" ? '<button class="ghost" id="agoraCameraBtn" type="button">📷 Kamerani oʻchirish</button>' : "");
        controls.appendChild(tools);
        document.getElementById("agoraMuteBtn").onclick = async () => {
          if (GC !== call) return;
          call.muted = !call.muted; await call.audioTrack.setEnabled(!call.muted);
          document.getElementById("agoraMuteBtn").textContent = call.muted ? "🔇 Mikrofonni yoqish" : "🎙️ Mikrofonni oʻchirish";
        };
        const cam = document.getElementById("agoraCameraBtn");
        if (cam) cam.onclick = async () => {
          if (GC !== call || !call.videoTrack) return;
          call.cameraOff = !call.cameraOff; await call.videoTrack.setEnabled(!call.cameraOff);
          cam.textContent = call.cameraOff ? "📷 Kamerani yoqish" : "📷 Kamerani oʻchirish";
        };
      }
      const status = document.getElementById("callStatus");
      if (status) status.textContent = mode === "video" ? "Agora jonli video faol" : "Agora ovozli suhbat faol";
      toast(mode === "video" ? "Jonli video boshlandi" : "Ovozli suhbat boshlandi");
    } catch (e) {
      console.error("Agora group call:", e);
      if (call) {
        try { call.audioTrack?.close(); call.videoTrack?.close(); await call.client?.leave(); } catch (_) {}
        if (GC === call) GC = null;
      }
      try { await FB.groupCallLeave(ch.id); } catch (_) {}
      uiAlert("Qoʻngʻiroq boshlanmadi: " + (e?.message || e) + ". Agora tokeni va mikrofon/kamera ruxsatini tekshirish kerak.");
    }
  }
  async function leaveGroupCall(silent = false) {
    const call = GC;
    if (!call) return;
    GC = null;
    try { call.audioTrack?.stop(); call.audioTrack?.close(); } catch (_) {}
    try { call.videoTrack?.stop(); call.videoTrack?.close(); } catch (_) {}
    try { await call.client?.leave(); } catch (e) { console.warn("Agora leave:", e); }
    document.getElementById("callVideos")?.replaceChildren();
    document.getElementById("agoraCallTools")?.remove();
    try { await FB.groupCallLeave(call.gid); } catch (e) { console.warn("Guruh qoʻngʻirogʻidan chiqish:", e); }
    if (!silent && st?.chat?.id === call.gid) draw();
  }
  // Override the previous WebRTC group-call implementation with Agora RTC.
  window.startGroupCall = startGroupCall;
  window.leaveGroupCall = leaveGroupCall;
})();
