// Yaqin: ovozli oʻyin xonalari — "Aylanuvchi shisha", savol kartochkalari, gul sovgʻa qilish.
(function () {
  "use strict";
  const QS = [
    "Oilada qanday inson boʻlishni xohlaysiz?", "Hayotdagi eng katta maqsadingiz nima?", "Sizni nima xursand qiladi?",
    "Ideal dam olish kuningiz qanday oʻtadi?", "Bolaligingizdan eng yaxshi xotirangiz?", "Turmush oʻrtogʻingizda eng muhim fazilat nima?",
    "Qaysi shaharda yashashni orzu qilasiz?", "Eng yaxshi koʻrgan taomingiz va uni kim pishiradi?", "Oxirgi marta nimadan chin dildan kuldingiz?",
    "5 yildan keyin oʻzingizni qayerda koʻrasiz?", "Oilaviy qadriyatlardan sizga eng muhimi?", "Sizni oʻzgartirgan eng katta voqea?",
    "Agar bir kunga sehrgar boʻlsangiz, nima qilardingiz?", "Sevimli kitob yoki filmingiz va nega?", "Do‘stlaringiz sizni qanday ta’riflaydi?",
    "Qanday sovgʻa sizni eng koʻp xursand qiladi?", "Hayotdagi eng katta saboqingiz?", "Safar qilishni yoqtirasizmi? Eng yaxshi joyingiz?",
    "Ertalab qanday boshlaysiz: choy, qahva yoki sport?", "Birinchi uchrashuvda eng muhim narsa nima deb oylaysiz?"
  ];
  const FL = [["atirgul", "🌹", "Atirgul"], ["lola", "🌷", "Lola"], ["gul", "🌸", "Gul"], ["guldasta", "💐", "Guldasta"]];
  const FLE = Object.fromEntries(FL.map(f => [f[0], f[1]]));
  const $ = id => document.getElementById(id);
  const uidFor = v => { let h = 2166136261; for (let i = 0; i < v.length; i++) { h ^= v.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) || 1; };
  let view = "", R = null, RID = null, unW = null, unG = null, unL = null, tick = null, call = null;
  let rot = 0, lastSeq = null, animDone = true, animTimer = null, seenG = null, closing = false;

  function layer(html) { let l = $("gm"); if (!l) { l = document.createElement("div"); l.id = "gm"; l.className = "gm"; document.body.appendChild(l); } l.innerHTML = html; return l; }
  function drop() { $("gm")?.remove(); }
  const myMeta = () => ({ name: st.user.name, ava: st.user.ava || "", img: st.user.img || "" });
  const pn = (d, u) => (d.pm && d.pm[u] && d.pm[u].n) || "Oʻyinchi";
  const pav = (d, u) => av({ img: d.pm && d.pm[u] && d.pm[u].i, ava: d.pm && d.pm[u] && d.pm[u].a });

  // ---------- Xonalar roʻyxati ----------
  window.gmOpenList = function () {
    if (!st.user) { uiAlert("Oʻyin xonalariga kirish uchun avval tizimga kiring."); return; }
    view = "list"; unL && unL();
    drawList([]);
    unL = FB.gmRooms(rs => { if (view === "list") drawList(rs); });
  };
  function drawList(rs) {
    rs = rs.filter(r => r.status === "open" && (r.players || []).length).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    layer(`<div class="gm-top"><button class="gm-ic" onclick="gmCloseAll()">←</button><b>🎲 Oʻyin xonalari</b></div>
<div class="gm-body"><p class="gm-sub">Ovozli oʻyin: shisha aylanadi, savolga javob berasiz, yoqsangiz — gul yuborasiz. Hammasi ovoz orqali.</p>
<div class="gm-new"><input id="gmT" maxlength="40" placeholder="Xona nomi (masalan: Andijon davrasi)"><select id="gmM"><option value="4">4 kishi</option><option value="6" selected>6 kishi</option><option value="8">8 kishi</option></select><button class="go" onclick="gmCreate()">Xona ochish</button></div>
${rs.length ? rs.map(r => `<div class="gm-room" onclick="gmEnter('${r.id}')"><div><b>${esc(r.title)}</b><small>${r.players.map(u => esc(pn(r, u))).slice(0, 3).join(", ")}</small></div><span>${r.players.length}/${r.max}</span></div>`).join("") : '<p class="gm-empty">Hozircha ochiq xona yoʻq. Birinchi boʻlib xona oching!</p>'}</div>`);
  }
  window.gmCreate = async function () {
    const t = ($("gmT") || {}).value || "", m = ($("gmM") || {}).value || 6;
    try { const id = await FB.gmCreate(t, m, myMeta()); await gmEnter(id, true); } catch (e) { uiAlert(e.message || e); }
  };

  // ---------- Xonaga kirish ----------
  window.gmEnter = async function (id, created) {
    try {
      unL && unL(); unL = null;
      if (!created) await FB.gmJoin(id, myMeta());
      RID = id; view = "room"; R = null; lastSeq = null; seenG = null; closing = false; animDone = true; rot = 0;
      buildRoom();
      unW = FB.gmWatch(id, d => { R = d; render(); });
      unG = FB.gmGifts(id, onGifts);
      tick = setInterval(() => R && render(true), 5000);
      startVoice(id);
    } catch (e) { uiAlert("Xonaga kirib boʻlmadi: " + (e.message || e)); if (view === "list") gmOpenList(); }
  };
  function buildRoom() {
    layer(`<div class="gm-top"><button class="gm-ic" onclick="gmLeave()">←</button><b id="gmTitle">Xona</b><button class="gm-ic" id="gmMic" onclick="gmMute()">🎙️</button></div>
<div class="gm-stage"><div class="gm-ring" id="gmRing"><div class="gm-bottle" id="gmBottle">🍾</div><div id="gmSeats"></div></div></div>
<div class="gm-info" id="gmInfo"></div><div class="gm-card" id="gmCard" hidden></div><div class="gm-vs" id="gmVs">Ovozli aloqa ulanmoqda…</div>`);
  }

  // ---------- Render ----------
  function render(soft) {
    if (!$("gmSeats")) return;
    const d = R;
    if (!d || d.status !== "open" || !(d.players || []).includes(st.user.uid)) { if (!closing) { closing = true; toast(!d || d.status !== "open" ? "Xona yopildi" : "Siz xonadan chiqdingiz"); gmCloseAll(); } return; }
    $("gmTitle").textContent = d.title;
    const n = d.players.length, sp = d.spin || { seq: 0 }, me = st.user.uid;
    $("gmSeats").innerHTML = d.players.map((u, i) => {
      const a = (i / n) * 2 * Math.PI - Math.PI / 2, x = 50 + 41 * Math.cos(a), y = 50 + 41 * Math.sin(a);
      const cls = (d.turn === u ? " turn" : "") + (sp.open && sp.to === u ? " target" : "");
      return `<div class="gm-seat${cls}" id="gs_${u}" style="left:${x}%;top:${y}%" onclick="gmSeat('${u}')"><div class="gm-av">${pav(d, u)}</div><small>${esc(pn(d, u).split(" ")[0])}${u === me ? " (siz)" : ""}</small></div>`;
    }).join("");
    // shisha
    if (sp.seq > 0 && sp.to) {
      const i = d.players.indexOf(sp.to);
      if (i >= 0) {
        const ang = (i / n) * 360;
        if (lastSeq === null) { rot = ang; $("gmBottle").style.transition = "none"; $("gmBottle").style.transform = `rotate(${rot}deg)`; animDone = true; }
        else if (sp.seq !== lastSeq) {
          rot = rot - (rot % 360) + 360 * 4 + ang; animDone = false;
          const b = $("gmBottle"); b.style.transition = "transform 3.4s cubic-bezier(.15,.7,.2,1)"; b.style.transform = `rotate(${rot}deg)`;
          clearTimeout(animTimer); animTimer = setTimeout(() => { animDone = true; render(true); }, 3500);
        }
      }
    }
    lastSeq = sp.seq || 0;
    // axborot / tugmalar
    const info = $("gmInfo"), turnName = pn(d, d.turn);
    let h = "";
    if (n < 2) h = `<p>Boshqa oʻyinchilar kutilmoqda… (${n}/${d.max})</p>`;
    else if (sp.open) h = `<p>${esc(pn(d, sp.by))} → <b>${esc(pn(d, sp.to))}</b></p>`;
    else if (d.turn === me) h = `<p>Navbat sizda!</p><button class="go" onclick="gmSpin()">🍾 Shishani aylantirish</button>`;
    else { h = `<p>Navbat: <b>${esc(turnName)}</b></p>`; if (Date.now() - (d.turnAt || 0) > 40000) h += `<button class="ghost" onclick="gmSkip()">Oʻtkazib yuborish</button>`; }
    info.innerHTML = h;
    // savol kartochkasi
    const card = $("gmCard");
    if (sp.open && animDone) {
      const ans = sp.ans || {}, inv = sp.by === me || sp.to === me, other = sp.by === me ? sp.to : sp.by;
      const match = ans[sp.by] && ans[sp.to];
      card.hidden = false;
      card.innerHTML = `<div class="gm-q">${esc(QS[sp.q % QS.length])}</div><p class="gm-hint">${esc(pn(d, sp.to))} ovoz orqali javob beradi.</p>` +
        (inv ? `<button class="${ans[me] ? "go" : "ghost"}" onclick="gmLike(${ans[me] ? "false" : "true"})">${ans[me] ? "❤️ Yoqdi (bekor qilish)" : "🤍 Yoqdi"}</button>` : "") +
        (match && inv ? `<div class="gm-match">🎉 Ikkalangizga ham yoqdi!<button class="go" onclick="gmChat('${other}')">Chat ochish</button></div>` : "") +
        ((sp.by === me || d.turn === me) ? `<button class="ghost" onclick="gmNext()">Keyingi navbat →</button>` : "");
    } else if (!sp.open) card.hidden = true;
  }

  // ---------- Amallar ----------
  window.gmSpin = async () => { try { await FB.gmSpin(RID, QS.length); } catch (e) { uiAlert(e.message || e); } };
  window.gmNext = async () => { try { await FB.gmNext(RID, false); } catch (e) { uiAlert(e.message || e); } };
  window.gmSkip = async () => { try { await FB.gmNext(RID, true); } catch (e) { uiAlert(e.message || e); } };
  window.gmLike = async y => { try { await FB.gmAnswer(RID, y); } catch (e) { uiAlert(e.message || e); } };
  window.gmChat = async u => {
    try { const id = await FB.openDirectChat(u, pn(R, u), (R.pm[u] || {}).a || "", (R.pm[u] || {}).i || "", st.user); await gmLeave(true); st.tab = "msg"; openC(id); }
    catch (e) { uiAlert("Chat ochilmadi: " + (e.message || e)); }
  };
  window.gmSeat = function (u) {
    if (!R || u === st.user.uid) return;
    const sh = document.createElement("div"); sh.className = "gm-sheet"; sh.id = "gmSheet";
    sh.innerHTML = `<div class="gm-sheet-in"><b>${esc(pn(R, u))} ga gul yuborish</b><div class="gm-fl">${FL.map(f => `<button onclick="gmSend('${u}','${f[0]}')"><span>${f[1]}</span><small>${f[2]}</small></button>`).join("")}</div><button class="ghost" onclick="document.getElementById('gmSheet').remove()">Yopish</button></div>`;
    sh.addEventListener("click", e => { if (e.target === sh) sh.remove(); });
    $("gm").appendChild(sh);
  };
  window.gmSend = async (u, k) => { $("gmSheet")?.remove(); try { await FB.gmGift(RID, u, k, myMeta()); } catch (e) { uiAlert("Gul yuborilmadi: " + (e.message || e)); } };
  function onGifts(list) {
    if (seenG === null) { seenG = new Set(list.map(g => g.id)); return; }
    list.slice().reverse().forEach(g => {
      if (seenG.has(g.id)) return; seenG.add(g.id);
      const el = $("gs_" + g.to); if (!el) return;
      const f = document.createElement("div"); f.className = "gm-fly"; f.textContent = FLE[g.kind] || "🌸"; el.appendChild(f); setTimeout(() => f.remove(), 2600);
      if (g.to === st.user.uid) toast(`${g.fromName || "Kimdir"} sizga ${FLE[g.kind] || "🌸"} yubordi`);
    });
  }

  // ---------- Ovoz (Agora) ----------
  async function startVoice(id) {
    const vs = () => $("gmVs"); const say = t => { if (vs()) vs().textContent = t; };
    try {
      if (!window.AgoraRTC) await new Promise((res, rej) => { const sc = document.createElement("script"); sc.src = "https://download.agora.io/sdk/release/AgoraRTC_N-4.23.4.js"; sc.onload = res; sc.onerror = () => rej(new Error("Agora SDK yuklanmadi")); document.head.appendChild(sc); });
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Mikrofon uchun sayt HTTPS orqali ochilishi kerak");
      const cr = await FB.gmToken(id);
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      const c = { id, client, mic: null, muted: false, left: false }; call = c;
      const renew = async () => { try { client.renewToken((await FB.gmToken(id)).token); } catch (e) { console.warn(e); } };
      client.on("token-privilege-will-expire", renew); client.on("token-privilege-did-expire", renew);
      client.on("user-published", async (u, t) => { await client.subscribe(u, t); if (t === "audio" && u.audioTrack) u.audioTrack.play(); });
      client.enableAudioVolumeIndicator();
      client.on("volume-indicator", vols => {
        if (!R) return;
        R.players.forEach(p => { const lv = vols.find(v => v.uid === uidFor(p) || (p === st.user.uid && v.uid === 0)); $("gs_" + p)?.classList.toggle("speak", !!lv && lv.level > 8); });
      });
      await client.join(cr.appId, cr.channel, cr.token, cr.uid);
      if (c.left) { await client.leave(); return; }
      c.mic = await AgoraRTC.createMicrophoneAudioTrack({ AEC: true, ANS: true, AGC: true });
      await client.publish([c.mic]);
      say("🎙️ Ovozli aloqa yoniq");
    } catch (e) {
      console.error("gm voice:", e);
      say("⚠️ Ovoz ulanmadi: " + (e.message || e) + " (mikrofon ruxsati va Worker sozlamasini tekshiring)");
    }
  }
  window.gmMute = function () {
    if (!call || !call.mic) { toast("Mikrofon hali ulanmagan"); return; }
    call.muted = !call.muted; call.mic.setEnabled(!call.muted);
    const b = $("gmMic"); if (b) b.textContent = call.muted ? "🔇" : "🎙️";
  };
  async function stopVoice() {
    const c = call; call = null; if (!c) return; c.left = true;
    try { c.mic?.close(); await c.client.leave(); } catch (_) {}
  }

  // ---------- Chiqish ----------
  window.gmLeave = async function (silent) {
    const id = RID; closing = true;
    await stopVoice();
    try { id && await FB.gmLeave(id); } catch (e) { console.warn(e); }
    cleanup(); if (silent === true) { drop(); return; } gmOpenList();
  };
  function cleanup() { unW && unW(); unG && unG(); clearInterval(tick); clearTimeout(animTimer); unW = unG = null; RID = null; R = null; }
  window.gmCloseAll = function () { stopVoice(); unL && unL(); unL = null; if (RID) { const id = RID; FB.gmLeave(id).catch(() => {}); } cleanup(); view = ""; drop(); };

  // ---------- Guruhlar sahifasiga kirish tugmasi ----------
  const base = window.groupsV;
  if (typeof base === "function") window.groupsV = function () {
    const h = base.apply(this, arguments);
    if (!st.user) return h;
    return `<button class="gm-entry" onclick="gmOpenList()"><span>🎲</span><div><b>Oʻyin xonalari</b><small>Ovozli shisha oʻyini · gul yuborish</small></div></button>` + h;
  };
})();
