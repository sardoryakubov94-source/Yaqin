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
  const FL = [["kiss", "💋", "Oʻpich"], ["atirgul", "🌹", "Atirgul"], ["lola", "🌷", "Lola"], ["gul", "🌸", "Gul"], ["guldasta", "💐", "Guldasta"]];
  const FLE = Object.fromEntries(FL.map(f => [f[0], f[1]]));
  const $ = id => document.getElementById(id);
  const uidFor = v => { let h = 2166136261; for (let i = 0; i < v.length; i++) { h ^= v.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) || 1; };
  let view = "", R = null, RID = null, unW = null, unG = null, unChat = null, unL = null, tick = null, call = null;
  let rot = 0, lastSeq = null, animDone = true, animTimer = null, seenG = null, closing = false;

  function layer(html) { let l = $("gm"); if (!l) { l = document.createElement("div"); l.id = "gm"; l.className = "gm"; document.body.appendChild(l); } l.innerHTML = html; return l; }
  function drop() { $("gm")?.remove(); }
  const gKey = () => "yqGmG:" + st.user.uid;
  const myMeta = () => ({ name: st.user.name, ava: st.user.ava || "", img: st.user.img || "", g: localStorage.getItem(gKey()) || "" });
  function askGender() {
    return new Promise(res => {
      const old = localStorage.getItem(gKey()); if (old === "m" || old === "f") return res(old);
      const sh = document.createElement("div"); sh.className = "gm-sheet"; sh.style.position = "fixed"; sh.style.zIndex = "950";
      sh.innerHTML = `<div class="gm-sheet-in"><b>Siz kimsiz?</b><p class="gm-hint">Xonalarda qizlar va yigitlar teng boʻladi. Tanlovingiz saqlanadi.</p><div class="gm-fl" style="grid-template-columns:1fr 1fr"><button data-g="f"><span>👩</span><small>Qiz</small></button><button data-g="m"><span>👨</span><small>Yigit</small></button></div><button class="ghost" data-g="">Bekor qilish</button></div>`;
      sh.addEventListener("click", e => { const b = e.target.closest("[data-g]"); if (!b && e.target !== sh) return; const g = b ? b.dataset.g : ""; if (g) localStorage.setItem(gKey(), g); sh.remove(); res(g); });
      document.body.appendChild(sh);
    });
  }
  const isBot = (d, u) => !!(d.pm && d.pm[u] && d.pm[u].bot);
  const hCnt = (d, g) => d.players.filter(u => !isBot(d, u) && (g === "f" ? gOf(d, u) === "f" : gOf(d, u) !== "f")).length;
  const BOT_SAY = ["Qiziq savol! Menimcha, eng muhimi — oʻzaro hurmat va samimiyat.", "Men uchun oila tinchligi hammasidan ustun.", "Hmm, oʻylab koʻrish kerak… Menimcha, sabr va mehr hal qiladi.", "Odamlarning samimiyligini qadrlayman, shuning uchun ochiq gaplashishni yaxshi koʻraman.", "Hayotda eng muhimi — sogʻlik va yaqinlar bilan birga boʻlish.", "Tinch, oddiy kunlarni yaxshi koʻraman, yaqinlar bilan choy ustida suhbat.", "Yangi joylarni koʻrish va yangi odamlar bilan tanishish menga yoqadi.", "Men halollik va mehnatsevarlikni hammadan koʻproq qadrlayman."];
  let botT = {}, busyEnter = false, pingT = null, listT = null, lastRs = [], newOpen = false;
  const leavingRooms = new Set(), ROOM_STALE = 150000, ROOM_GRACE = 25000;
  const gOf = (d, u) => (d.pm && d.pm[u] && d.pm[u].g) || "";
  function ordOf(d) { const m = d.players.filter(u => gOf(d, u) !== "f"), f = d.players.filter(u => gOf(d, u) === "f"), a = gOf(d, d.owner) === "f" ? f : m, b = a === f ? m : f, o = []; for (let i = 0; i < Math.max(m.length, f.length); i++) { if (a[i]) o.push(a[i]); if (b[i]) o.push(b[i]); } return o; }
  const pn = (d, u) => (d.pm && d.pm[u] && d.pm[u].n) || "Oʻyinchi";
  const pav = (d, u) => av({ img: d.pm && d.pm[u] && d.pm[u].i, ava: d.pm && d.pm[u] && d.pm[u].a });

  // ---------- Xonalar roʻyxati ----------
  window.gmOpenList = function () {
    if (!st.user) { uiAlert("Guruhli oʻyinlarga kirish uchun avval tizimga kiring."); return; }
    view = "list"; unL && unL(); newOpen = false;
    drawList([]);
    unL = FB.gmRooms(rs => { if (view === "list") drawList(rs); });
  };
  function drawList(rs) {
    lastRs = rs;
    const me = st.user.uid, now = Date.now();
    const live = r => (r.players || []).some(u => !isBot(r, u));
    rs = rs.filter(r => r.status === "open");
    // Roʻyxat ekranida turgan boʻlsam, men yozilgan xona — "arvoh": ilova yopilgan/uzilgan. Oʻzimni chiqaraman.
    if (!busyEnter) rs.filter(r => (r.players || []).includes(me) && r.id !== RID && !leavingRooms.has(r.id)).forEach(r => { leavingRooms.add(r.id); FB.gmLeave(r.id).catch(() => {}).finally(() => setTimeout(() => leavingRooms.delete(r.id), 8000)); });
    // Boʻsh qolgan xona 25 soniya saqlanadi (adashib chiqib ketgan qaytib kirishi mumkin), keyin yashiriladi/oʻchiriladi.
    const graceOver = r => now - (r.humanLeftAt || r.updatedAt || 0) > ROOM_GRACE;
    const stale = r => now - (r.updatedAt || 0) > ROOM_STALE;
    const dead = r => live(r) ? stale(r) : graceOver(r);
    rs.filter(r => dead(r) && r.owner === me).forEach(r => FB.gmDelete(r.id).catch(() => {}));
    rs = rs.filter(r => !dead(r) && !(r.players || []).includes(me)).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    clearTimeout(listT); if (rs.some(r => !live(r))) listT = setTimeout(() => { if (view === "list") drawList(lastRs); }, ROOM_GRACE + 1500);
    const keep = { t: ($("gmT") || {}).value || "", m: ($("gmM") || {}).value || "", b: $("gmB") ? $("gmB").checked : true };
    const row = r => `<div class="gm-room" onclick="gmEnter('${r.id}')"><div><b>${esc(r.title)}</b><small>${live(r) ? r.players.filter(u => !isBot(r, u)).map(u => esc(pn(r, u))).slice(0, 3).join(", ") : "Hozircha boʻsh · kirishingiz mumkin"}</small></div><span>👩 ${hCnt(r, "f")}/${r.max / 2}<br>👨 ${hCnt(r, "m")}/${r.max / 2}${r.owner === st.user.uid ? `<br><b onclick="event.stopPropagation();gmDel('${r.id}')" style="font-size:16px">🗑</b>` : ""}</span></div>`;
    layer(`<div class="gm-top"><button class="gm-ic" onclick="gmCloseAll()">←</button><b>🎲 Guruhli oʻyinlar</b></div>
<div class="gm-body"><p class="gm-sub">Ovozli oʻyin: shisha aylanadi, savolga javob berasiz, yoqsangiz — gul yuborasiz. Hammasi ovoz orqali.</p>
<button class="go" id="gmNewBtn" type="button" style="width:100%;margin-bottom:12px" onclick="gmToggleNew()">➕ Yangi xona ochish</button>
<div class="gm-new" id="gmNew" hidden><input id="gmT" maxlength="40" placeholder="Xona nomi (masalan: Andijon davrasi)"><select id="gmM"><option value="4">4 kishi (2 qiz + 2 yigit)</option><option value="6" selected>6 kishi (3 qiz + 3 yigit)</option><option value="8">8 kishi (4 qiz + 4 yigit)</option></select><label class="gm-chk"><input type="checkbox" id="gmB" checked> Odam yetmasa 1 daqiqadan keyin yordamchi oʻyinchilar toʻldirsin</label><button class="go" onclick="gmCreate()">Xona ochish</button></div>
${rs.length ? rs.map(row).join("") : '<p class="gm-empty">Hozircha odam bor xona yoʻq. Birinchi boʻlib xona oching!</p>'}</div>`);
    if ($("gmT")) { $("gmT").value = keep.t; if (keep.m && $("gmM")) $("gmM").value = keep.m; if ($("gmB")) $("gmB").checked = keep.b; }
    applyNew();
  }
  function applyNew() { const f = $("gmNew"), b = $("gmNewBtn"); if (f) f.hidden = !newOpen; if (b) b.textContent = newOpen ? "✕ Bekor qilish" : "➕ Yangi xona ochish"; }
  window.gmToggleNew = function () { newOpen = !newOpen; applyNew(); if (newOpen) setTimeout(() => $("gmT") && $("gmT").focus(), 50); };
  window.gmDel = function (id) { if (confirm("Bu xonani butunlay oʻchirasizmi?")) FB.gmDelete(id).catch(e => uiAlert("Oʻchirilmadi: " + (e.message || e))); };
  window.gmCreate = async function () {
    const t = ($("gmT") || {}).value || "", m = ($("gmM") || {}).value || 6;
    busyEnter = true;
    try { if (!(await askGender())) return; const id = await FB.gmCreate(t, m, myMeta(), !!($("gmB") || {}).checked); await gmEnter(id, true); } catch (e) { uiAlert(e.message || e); } finally { busyEnter = false; }
  };

  let chatMsgs = [], chatSig = "", chatKey = "";
  // ---------- Qoʻshiq: chatga yuklash, eshitish, hammaga birga qoʻyish ----------
  const IC = (n, z) => (window.YI ? window.YI(n, z || 18) : "");
  let songA = null, songMid = "", songPlaying = false, songSynced = false, seenCmd = null, upBusy = false, lastUp = 0;
  const SONG_MAX = 8 * 1024 * 1024, SONG_GAP = 20000, fmtT = x => { x = Math.max(0, Math.floor(x || 0)); return Math.floor(x / 60) + ":" + String(x % 60).padStart(2, "0"); };
  // ---------- YouTube (rasmiy pleyer): toʻliq qoʻshiq, mualliflik huquqi YouTube tomonida ----------
  let ytP = null, ytMid = "", ytTimer = null, ytApiP = null, ytS = null;
  const ytOn = () => !!(ytP && ytMid && ytMid === songMid);
  const songPos = () => ytOn() ? (ytP.getCurrentTime ? ytP.getCurrentTime() : 0) : (songA ? songA.currentTime : 0);
  const songDur = () => { const d = ytOn() ? (ytP.getDuration ? ytP.getDuration() : 0) : (songA ? songA.duration : 0); return d && isFinite(d) ? d : 0; };
  function ytApi() {
    if (window.YT && YT.Player) return Promise.resolve(true);
    if (ytApiP) return ytApiP;
    ytApiP = new Promise(res => {
      const prev = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { try { prev && prev(); } catch (_) {} res(true); };
      const sc = document.createElement("script"); sc.src = "https://www.youtube.com/iframe_api"; sc.onerror = () => { ytApiP = null; res(false); }; document.head.appendChild(sc);
      setTimeout(() => { if (!(window.YT && YT.Player)) { ytApiP = null; res(false); } }, 12000);
    });
    return ytApiP;
  }
  function ytDock(show) { const d = $("gmYtDock"); if (d) d.hidden = !show; }
  function ytStop() {
    clearInterval(ytTimer); ytTimer = null;
    if (ytP) { try { ytP.destroy(); } catch (_) {} ytP = null; }
    ytMid = ""; { const g = $("gm"); if (g) g.classList.remove("gm-yt-on"); } const d = $("gmYtDock"); if (d) { d.hidden = true; d.innerHTML = '<div id="gmYtHost"></div>'; }
  }
  async function ytPlay(m, pos, synced) {
    try { if (songA) songA.pause(); } catch (_) {}
    ytStop(); songMid = m.id; ytMid = m.id; songPlaying = false; songSynced = !!synced;
    const d = $("gmYtDock"); if (!d) return;
    d.innerHTML = '<button type="button" class="gm-yt-x" onclick="gmYtClose()" aria-label="Yopish">' + IC("x", 14) + '</button><div id="gmYtHost"></div>'; d.hidden = false; { const g = $("gm"); if (g) g.classList.add("gm-yt-on"); }
    if (!(await ytApi())) { toast("YouTube pleyeri yuklanmadi. Internetni tekshiring."); ytStop(); songMid = ""; renderChat(); return; }
    if (ytMid !== m.id) return;
    ytP = new YT.Player("gmYtHost", { width: "100%", height: "200", videoId: m.ytId, playerVars: { playsinline: 1, rel: 0, modestbranding: 1, start: Math.floor(pos || 0), autoplay: 1 }, events: {
      onReady: e => { try { e.target.setVolume(60); e.target.playVideo(); } catch (_) {} },
      onStateChange: e => {
        const st2 = e.data; if (ytMid !== m.id) return;
        if (st2 === 1) { if (!songPlaying) { songPlaying = true; renderChat(); } }
        else if (st2 === 2 || st2 === 0) { if (songPlaying) { songPlaying = false; if (st2 === 0) songSynced = false; renderChat(); } }
      },
      onError: () => { toast("Bu videoni xonada ijro etib boʻlmaydi (egasi taqiqlagan)."); songPlaying = false; songSynced = false; renderChat(); },
    } });
    clearInterval(ytTimer); ytTimer = setInterval(songBar, 500);
  }
  window.gmYtClose = () => { ytStop(); songMid = ""; songPlaying = false; songSynced = false; renderChat(); };
  function songBar() {
    if (!songMid) return;
    const m = document.querySelector('.gm-song[data-mid="' + songMid + '"]'); if (!m) return;
    const i = m.querySelector(".gm-song-bar i"), t = m.querySelector(".gm-song-time");
    const d = songDur(), c = songPos();
    if (i) i.style.width = d ? Math.min(100, c / d * 100) + "%" : "0%";
    if (t) t.textContent = fmtT(c) + (d ? " / " + fmtT(d) : "");
  }
  function songEl() {
    if (songA) return songA;
    songA = new Audio(); songA.preload = "none"; songA.volume = 0.6; songA.setAttribute("playsinline", "");
    songA.addEventListener("timeupdate", songBar);
    songA.addEventListener("ended", () => { songPlaying = false; songSynced = false; renderChat(); });
    songA.addEventListener("pause", () => { if (songPlaying) { songPlaying = false; renderChat(); } });
    songA.addEventListener("error", () => { if (songA && songA.src) { songPlaying = false; songSynced = false; toast("Qoʻshiqni ochib boʻlmadi"); renderChat(); } });
    return songA;
  }
  function songStop() {
    songPlaying = false; songSynced = false; ytStop();
    if (songA) { try { songA.pause(); songA.removeAttribute("src"); songA.load(); } catch (_) {} }
    songMid = "";
  }
  function songPlay(m, pos, synced) {
    if (m && m.ytId) { ytPlay(m, pos, synced); return; }
    if (!m || !m.audioUrl) return;
    if (ytMid) ytStop();
    const a = songEl();
    if (songMid !== m.id || !a.src) { a.src = m.audioUrl; songMid = m.id; }
    if (pos > 1) { const seek = () => { try { a.currentTime = pos; } catch (_) {} }; if (a.readyState >= 1) seek(); else a.addEventListener("loadedmetadata", seek, { once: true }); }
    const pr = a.play();
    const ok = () => {
      songPlaying = true; songSynced = !!synced; renderChat();
    };
    if (pr && pr.then) pr.then(ok, () => toast("Qoʻshiqni boshlash uchun ▶ tugmasini bosing")); else ok();
  }
  window.gmSongToggle = mid => {
    const m = chatMsgs.find(x => x.id === mid); if (!m) return;
    if (m.ytId) {
      if (ytOn() && ytP.pauseVideo) { try { songPlaying ? ytP.pauseVideo() : ytP.playVideo(); } catch (_) {} songSynced = false; return; }
      songPlay(m, 0, false); return;
    }
    if (songPlaying && songMid === mid) { songEl().pause(); songSynced = false; renderChat(); return; }
    songPlay(m, songMid === mid && songA ? songA.currentTime : 0, false);
  };
  window.gmSongAll = async mid => {
    const m = chatMsgs.find(x => x.id === mid); if (!m || !RID) return;
    try {
      if (songPlaying && songMid === mid && songSynced) { songStop(); renderChat(); await FB.gmRoomCmd(RID, mid, "stop", 0); toast("Qoʻshiq hammada toʻxtatildi"); return; }
      songPlay(m, 0, true);
      await FB.gmRoomCmd(RID, mid, "play", 0); toast("📢 Qoʻshiq hammaga qoʻyildi");
    } catch (e) { uiAlert("Yuborilmadi: " + (e.message || e)); }
  };
  window.gmSongPick = () => {
    if (upBusy) { toast("Qoʻshiq yuklanmoqda…"); return; }
    const wait = SONG_GAP - (Date.now() - lastUp);
    if (wait > 0) { toast("Yana " + Math.ceil(wait / 1000) + " soniyadan keyin yuklang"); return; }
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = "audio/*,.mp3,.m4a,.aac,.ogg,.wav";
    inp.onchange = async () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      if (!(/^audio\//.test(f.type) || /\.(mp3|m4a|aac|ogg|wav|opus)$/i.test(f.name))) { uiAlert("Faqat audio fayl (mp3, m4a, aac, ogg, wav) yuklash mumkin."); return; }
      if (f.size > SONG_MAX) { uiAlert("Fayl juda katta. Eng koʻpi 8 MB (" + (f.size / 1048576).toFixed(1) + " MB yuklamoqchisiz)."); return; }
      const b = $("gmSongPickBtn"); upBusy = true;
      try {
        await FB.gmRoomSong(RID, f, p => { if (b) b.textContent = Math.round(p * 100) + "%"; });
        lastUp = Date.now();
      } catch (e) { uiAlert("Qoʻshiq yuklanmadi: " + (e.message || e)); }
      finally { upBusy = false; const b2 = $("gmSongPickBtn"); if (b2) b2.innerHTML = IC("music", 18); }
    };
    inp.click();
  };
  // ---------- Qoʻshiq qidirish (iTunes Search: roʻyxatdan oʻtish va yuklash shart emas, 30 soniyalik namuna) ----------
  let srchA = null, srchId = "", srchBusy = false;
  function jsonp(url) {
    return new Promise((res, rej) => {
      const cb = "yqItn" + Date.now() + Math.floor(Math.random() * 1e4), sc = document.createElement("script");
      const done = () => { clearTimeout(tm); try { delete window[cb]; } catch (_) { window[cb] = undefined; } sc.remove(); };
      const tm = setTimeout(() => { done(); rej(new Error("Javob kelmadi. Internetni tekshiring.")); }, 10000);
      window[cb] = d => { done(); res(d); };
      sc.onerror = () => { done(); rej(new Error("Qidiruv xizmatiga ulanib boʻlmadi.")); };
      sc.src = url + "&callback=" + cb; document.head.appendChild(sc);
    });
  }
  function srchStop() { if (srchA) { try { srchA.pause(); } catch (_) {} } if (ytS) { try { ytS.destroy(); } catch (_) {} ytS = null; } { const pl = $("gmSrchPlayer"); if (pl) { pl.hidden = true; pl.innerHTML = ""; } } srchId = ""; document.querySelectorAll("#gmSongSheet .gm-srch-play").forEach(b => { b.innerHTML = IC("play", 16); }); }
  window.gmSongSearch = () => {
    if ($("gmSongSheet")) return;
    const sh = document.createElement("div"); sh.className = "gm-sheet"; sh.id = "gmSongSheet"; sh.style.zIndex = "100010";
    sh.innerHTML = `<div class="gm-sheet-in"><div class="gm-sheet-head"><b>${IC("search", 16)} Qoʻshiq qidirish</b><button class="gm-sheet-close" type="button" data-close>${IC("x", 16)}</button></div><div id="gmSrchPlayer" class="gm-srch-player" hidden></div><form class="gm-srch-form"><input id="gmSrchInput" type="search" placeholder="Qoʻshiq yoki ijrochi nomi…" autocomplete="off" maxlength="80"><button class="go" type="submit">Qidirish</button></form><div id="gmSrchList" class="gm-srch-list"><p class="gm-hint">Istalgan qoʻshiq nomini yozing. ${IC("play", 13)} bilan eshiting, ${IC("plus", 13)} bilan chatga qoʻying yoki ${IC("broadcast", 13)} bilan hammaga qoʻying.</p></div><small class="gm-srch-note" id="gmSrchNote">${(window.CFG && CFG.YT_KEY) ? "To‘liq qo‘shiqlar · YouTube pleyeri" : "YouTube kaliti ulanmagan: hozircha 30 soniyalik namunalar (iTunes)"}</small></div>`;
    const close = () => { srchStop(); sh.remove(); };
    sh.addEventListener("click", e => {
      if (e.target === sh || e.target.closest("[data-close]")) { close(); return; }
      const pb = e.target.closest(".gm-srch-play"), ab = e.target.closest(".gm-srch-add"), al = e.target.closest(".gm-srch-all");
      const row = e.target.closest(".gm-srch-row"); if (!row) return;
      const tr = row._tr; if (!tr) return;
      if (pb) {
        if (srchId === tr.id) { srchStop(); return; }
        if (tr.kind === "yt") {
          srchStop(); if (songPlaying) { try { songA && songA.pause(); ytP && ytP.pauseVideo(); } catch (_) {} }
          const pl = $("gmSrchPlayer"); pl.hidden = false; pl.innerHTML = '<div id="gmSrchYt"></div>'; srchId = tr.id; pb.innerHTML = IC("pause", 16);
          ytApi().then(ok => {
            if (!ok) { toast("YouTube pleyeri yuklanmadi"); srchStop(); return; }
            ytS = new YT.Player("gmSrchYt", { width: "100%", height: "200", videoId: tr.id, playerVars: { playsinline: 1, rel: 0, modestbranding: 1, autoplay: 1 }, events: { onReady: e => { try { e.target.playVideo(); } catch (_) {} }, onError: () => { toast("Bu videoni ijro etib boʻlmaydi"); srchStop(); } } });
          });
          return;
        }
        srchStop(); if (!srchA) { srchA = new Audio(); srchA.addEventListener("ended", srchStop); srchA.addEventListener("error", () => { toast("Namunani ochib boʻlmadi"); srchStop(); }); }
        if (songPlaying) { try { songEl().pause(); } catch (_) {} }
        srchA.src = tr.url; srchId = tr.id; pb.innerHTML = IC("pause", 16);
        const pr = srchA.play(); if (pr && pr.catch) pr.catch(() => { toast("Ijro etib boʻlmadi"); srchStop(); });
        return;
      }
      if (ab || al) {
        const btn = ab || al; if (btn.disabled) return; btn.disabled = true;
        (tr.kind === "yt" ? FB.gmRoomYt(RID, { id: tr.id, title: tr.title, channel: tr.artist }) : FB.gmRoomTrack(RID, tr)).then(async ref => {
          if (al) { songPlay(tr.kind === "yt" ? { id: ref.id, ytId: tr.id } : { id: ref.id, audioUrl: tr.url }, 0, true); await FB.gmRoomCmd(RID, ref.id, "play", 0); toast("📢 Qoʻshiq hammaga qoʻyildi"); }
          else toast("🎵 Chatga qoʻshildi");
          close();
        }).catch(e => { btn.disabled = false; uiAlert("Qoʻshilmadi: " + (e.message || e)); });
      }
    });
    sh.querySelector("form").addEventListener("submit", async e => {
      e.preventDefault(); if (srchBusy) return;
      const q = String($("gmSrchInput").value || "").trim(); if (q.length < 2) return;
      const list = $("gmSrchList"); srchStop(); srchBusy = true; list.innerHTML = '<p class="gm-hint">Qidirilmoqda…</p>';
      try {
        let items;
        if (window.CFG && CFG.YT_KEY) {
          const dec = t => { const x = document.createElement("textarea"); x.innerHTML = t; return x.value; };
          const r = await fetch("https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=15&q=" + encodeURIComponent(q) + "&key=" + encodeURIComponent(CFG.YT_KEY));
          const j = await r.json().catch(() => ({}));
          if (!r.ok) { const why = j.error && j.error.errors && j.error.errors[0] && j.error.errors[0].reason; throw new Error(why === "quotaExceeded" || why === "dailyLimitExceeded" ? "Bugungi qidiruv limiti tugadi. Ertaga urinib koʻring." : "YouTube qidiruvi ishlamadi (" + (why || r.status) + ")."); }
          items = (j.items || []).filter(v => v.id && /^[\w-]{11}$/.test(v.id.videoId || "")).map(v => ({ kind: "yt", id: v.id.videoId, title: dec(v.snippet.title || "Qoʻshiq"), artist: dec(v.snippet.channelTitle || ""), art: v.snippet.thumbnails && v.snippet.thumbnails.default && /^https:\/\//.test(v.snippet.thumbnails.default.url) ? v.snippet.thumbnails.default.url : "" }));
        } else {
        const d = await jsonp("https://itunes.apple.com/search?term=" + encodeURIComponent(q) + "&media=music&entity=song&limit=20");
        items = (d.results || []).filter(r => r.previewUrl && /^https:\/\/[\w.-]+\.(mzstatic\.com|itunes\.apple\.com)\//.test(r.previewUrl)).map(r => ({ id: String(r.trackId), url: r.previewUrl, title: r.trackName || "Qoʻshiq", artist: r.artistName || "", art: /^https:\/\//.test(r.artworkUrl60 || "") ? r.artworkUrl60 : "" }));
        }
        list.innerHTML = "";
        if (!items.length) { list.innerHTML = '<p class="gm-hint">Hech narsa topilmadi. Boshqacha yozib koʻring (masalan, ijrochi nomi bilan).</p>'; return; }
        items.forEach(tr => {
          const row = document.createElement("div"); row.className = "gm-srch-row"; row._tr = tr;
          row.innerHTML = (tr.art ? `<img src="${esc(tr.art)}" alt="" loading="lazy">` : '<span class="gm-srch-noart">${IC("music", 18)}</span>') + `<div class="gm-srch-meta"><b>${esc(tr.title)}</b><small>${esc(tr.artist)}</small></div><button type="button" class="gm-srch-play" aria-label="Eshitish">${IC("play", 16)}</button><button type="button" class="gm-srch-add" title="Chatga qoʻshish" aria-label="Chatga qoʻshish">${IC("plus", 16)}</button><button type="button" class="gm-srch-all" title="Hammaga qoʻyish" aria-label="Hammaga qoʻyish">${IC("broadcast", 16)}</button>`;
          list.appendChild(row);
        });
      } catch (err) { list.innerHTML = '<p class="gm-hint">⚠️ ' + esc(err.message || "Qidiruv xatosi") + "</p>"; }
      finally { srchBusy = false; }
    });
    document.body.appendChild(sh);
    setTimeout(() => { const i = $("gmSrchInput"); if (i) i.focus(); }, 50);
  };
  function songCmds(msgs) {
    if (seenCmd === null) { seenCmd = new Set(msgs.filter(m => m.cmd).map(m => m.id)); return; }
    for (const m of msgs) {
      if (!m.cmd || seenCmd.has(m.id)) continue; seenCmd.add(m.id);
      if (m.from === st.user.uid || Date.now() - (m.t || 0) > 15000) continue;
      if (m.cmd.act === "stop") { if (songMid === m.cmd.mid) { songStop(); } continue; }
      const song = msgs.find(x => x.id === m.cmd.mid); if (!song || !(song.audioUrl || song.ytId)) continue;
      const el = Math.max(0, Math.min(15, (Date.now() - m.t) / 1000));
      songPlay(song, (m.cmd.pos || 0) + el, true);
    }
  }
  function songCard(m, me, avatar) {
    const cur = songMid === m.id, on = cur && songPlaying, dd = cur ? songDur() : 0, pct = dd ? Math.min(100, songPos() / dd * 100) : 0;
    const tm = cur ? fmtT(songPos()) + (dd ? " / " + fmtT(dd) : "") : "";
    return `<div class="gm-room-msg gm-song${m.from === me ? " mine" : ""}" data-mid="${esc(m.id)}"><div class="gm-room-author">${avatar}<b>${esc(m.name || "Oʻyinchi")}</b></div><div class="gm-song-row"><button type="button" class="gm-song-btn" onclick="gmSongToggle('${esc(m.id)}')" aria-label="${on ? "Pauza" : "Qoʻyish"}">${on ? IC("pause", 16) : IC("play", 16)}</button><div class="gm-song-info"><span class="gm-song-name">${IC("music", 13)} ${esc(m.audio.name || "Qoʻshiq")}</span><div class="gm-song-bar"><i style="width:${pct}%"></i></div><small class="gm-song-time">${esc(tm)}</small></div><button type="button" class="gm-song-all${on && songSynced ? " on" : ""}" onclick="gmSongAll('${esc(m.id)}')" title="Hammaga qoʻyish" aria-label="Hammaga qoʻyish">${IC("broadcast", 16)}</button></div></div>`;
  }
  function renderChat() {
    const msgs = chatMsgs;
        const box = $("gmRoomMessages"); if (!box) return;
        const d = R, sp = d && d.spin, me = st.user.uid;
        const askPrompt = d && sp && sp.open && sp.by === me && sp.to !== me && animDone
          ? `<div class="gm-room-msg gm-room-question gm-room-ask-prompt"><div class="gm-room-author">${pav(d, sp.to)}<b>${esc(pn(d, sp.to))}</b></div><div class="gm-room-question-text">💬 ${esc(pn(d, sp.to))} ga savolingizni bering</div><small class="gm-room-question-hint">Savolni pastdagi chat maydoniga yozing</small></div>` : "";
        const answerPrompt = d && sp && sp.open && sp.to === me && sp.by !== me && animDone
          ? `<div class="gm-room-msg gm-room-question"><div class="gm-room-author">${pav(d, sp.by)}<b>${esc(pn(d, sp.by))}</b><small>sizga savol berdi</small></div><div class="gm-room-question-text">❓ ${esc(sp.customQ || QS[sp.q % QS.length])}</div><small class="gm-room-question-hint">Javobni pastdagi chat maydoniga yozing</small></div>` : "";
        songCmds(msgs);
        const rendered = msgs.map(m => {
          if (m.cmd) return "";
          if (m.audio && (m.audioUrl || m.ytId)) return songCard(m, me, d && d.pm && d.pm[m.from] ? pav(d, m.from) : "");
          const text = String(m.text || "");
          const isQA = text.startsWith("❓ Savol: ") && text.includes("\\n💬 Javob: ");
          const isQuestion = text.startsWith("❓ SAVOL → ");
          const body = isQA ? (() => { const p = text.split("\\n💬 Javob: "); return `<div class="gm-room-qa-question">❓ ${esc(p[0].replace(/^❓ Savol: /, ""))}</div><div class="gm-room-qa-answer">💬 Javob: ${esc(p.slice(1).join("\\n💬 Javob: "))}</div>`; })()
            : isQuestion ? `<div class="gm-room-qa-question">${esc(text)}</div>` : esc(text);
          const avatar = d && d.pm && d.pm[m.from] ? pav(d, m.from) : "";
          return `<div class="gm-room-msg${m.from === me ? " mine" : ""}${isQuestion ? " gm-room-question" : ""}"><div class="gm-room-author">${avatar}<b>${esc(m.name || "Oʻyinchi")}</b></div><span>${body}</span></div>`;
        }).join("");
        const near = box.scrollHeight - box.scrollTop - box.clientHeight < 80, sig = msgs.length + "|" + (askPrompt ? 1 : 0) + (answerPrompt ? 1 : 0);
        box.innerHTML = rendered + askPrompt + answerPrompt;
        if (near || sig !== chatSig) { const go = () => { box.scrollTop = box.scrollHeight; }; go(); requestAnimationFrame(go); }
        chatSig = sig;
        const inp = $("gmRoomInput"); if (inp) inp.placeholder = askPrompt ? "Savolingizni yozing…" : answerPrompt ? "Javobingizni yozing…" : "Xabaringizni yozing...";
        }

  // ---------- Xonaga kirish ----------
  window.gmEnter = async function (id, created) {
    busyEnter = true;
    try {
      if (!created) { if (!(await askGender())) return; await FB.gmJoin(id, myMeta()); }
      unL && unL(); unL = null; unChat && unChat(); unChat = null;
      songStop(); seenCmd = null; kissFxInit = false; kissFlown = new Set(); kissMy = null; RID = id; view = "room"; R = null; vInit = false; stopBeat(); chatMsgs = []; chatSig = ""; chatKey = ""; lastSeq = null; seenG = null; closing = false; animDone = true; rot = 0;
      buildRoom();
      unW = FB.gmWatch(id, d => { R = d; render(); });
      unG = FB.gmGifts(id, onGifts);
      unChat = FB.gmRoomChat(id, msgs => { chatMsgs = msgs; renderChat(); });
      tick = setInterval(() => R && render(true), 4000);
      clearInterval(pingT); pingT = setInterval(() => { if (RID === id && !closing) FB.gmPing(id).catch(() => {}); }, 30000);
      vstate = "off"; vmsg = ""; voiceUI();
    } catch (e) { uiAlert("Xonaga kirib boʻlmadi: " + (e.message || e)); if (view === "list") gmOpenList(); }
    finally { busyEnter = false; }
  };
  function buildRoom() {
    layer(`<div class="gm-top gm-room-top"><button class="gm-ic" onclick="gmLeave()">←</button><b id="gmTitle">Xona</b><div class="gm-top-right"><div class="yaqin-call-controls" id="gmCall"></div><div class="gm-vbar" id="gmVoiceBar" hidden></div></div></div>
<div class="gm-mid"><div class="gm-stage"><div class="gm-ring" id="gmRing"><div class="gm-bottle" id="gmBottle">🍾</div><div id="gmSeats"></div></div><div class="gm-kiss" id="gmKiss" hidden></div></div>
<div class="gm-below"><div class="gm-yt-dock" id="gmYtDock" hidden><div id="gmYtHost"></div></div><div class="gm-below-txt"><div class="gm-info" id="gmInfo"></div><div class="gm-card" id="gmCard" hidden></div></div></div></div><section class="gm-room-chat"><div class="gm-room-chat-title">💬 Xona chati <span class="gm-chat-tools"><button class="gm-song-pick" id="gmSongSearchBtn" type="button" onclick="gmSongSearch()" aria-label="Qoʻshiq qidirish" title="Qoʻshiq qidirish">${IC("search", 18)}</button><button class="gm-song-pick" id="gmSongPickBtn" type="button" onclick="gmSongPick()" aria-label="Qoʻshiq yuklash" title="Qoʻshiq yuklash">${IC("music", 18)}</button></span><small>Istalgan vaqtda yozing</small><button type="button" class="gm-chat-exp" id="gmChatExp" onclick="gmChatFull()" aria-label="Chatni kattalashtirish" title="Chatni kattalashtirish">${IC("expand", 16)}</button></div><div id="gmRoomMessages" class="gm-room-messages"></div><form class="gm-room-send" onsubmit="event.preventDefault();gmSendRoomText()"><input id="gmRoomInput" maxlength="500" placeholder="Xabaringizni yozing..." autocomplete="off"><button class="ghost gm-template-trigger" id="gmTemplateBtn" type="button" onclick="gmShowQuestionTemplates()" hidden>☷ Shablon</button><button class="go" type="submit">Yuborish</button></form></section>`);
  }

  // ---------- Oʻpich lahzasi: shisha ikki kishiga toʻgʻri kelganda 10 soniya (faqat shu ikkisiga koʻrinadi) ----------
  const KISS_SEC = 10, KISS_R = 22, KISS_C = 2 * Math.PI * KISS_R;
  let kissSeq = 0, kissT0 = 0, kissMy = null, kissKey = "", kissTmr = null, kissClosed = 0, kissFlown = new Set(), kissFxInit = false;
  function kissOff(el, closed) {
    clearInterval(kissTmr); kissTmr = null; if (el) { el.hidden = true; el.innerHTML = ""; }
    kissKey = ""; if (closed) kissClosed = kissSeq;
  }
  // Oʻpich (yuraklar) bir avatardan ikkinchisiga uchib boradi
  function kissFly(from, to) {
    try {
      const a = $("gs_" + from), b = $("gs_" + to); if (!a || !b) return;
      const ea = a.querySelector(".gm-av") || a, eb = b.querySelector(".gm-av") || b, ra = ea.getBoundingClientRect(), rb = eb.getBoundingClientRect();
      if (!ra.width || !rb.width) return;
      const x0 = ra.left + ra.width / 2, y0 = ra.top + ra.height / 2, dx = rb.left + rb.width / 2 - x0, dy = rb.top + rb.height / 2 - y0, lift = -Math.min(80, Math.hypot(dx, dy) * 0.28);
      for (let i = 0; i < 3; i++) {
        const el = document.createElement("div"); el.className = "gm-kiss-fx"; el.innerHTML = IC("heart", i ? 22 : 32);
        el.style.left = x0 + "px"; el.style.top = y0 + "px"; document.body.appendChild(el);
        const sway = (i - 1) * 22;
        const an = el.animate([
          { transform: "translate(0,0) scale(.35)", opacity: 0 },
          { transform: `translate(${dx * 0.5 + sway}px,${dy * 0.5 + lift}px) scale(1.15)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${dx}px,${dy}px) scale(.95)`, opacity: 1, offset: 0.88 },
          { transform: `translate(${dx}px,${dy}px) scale(1.7)`, opacity: 0 }
        ], { duration: 1150, delay: i * 150, easing: "cubic-bezier(.3,.6,.3,1)", fill: "both" });
        an.onfinish = () => el.remove(); setTimeout(() => el.remove(), 2600);
      }
      setTimeout(() => {
        const r2 = $("gs_" + to); const e2 = r2 && (r2.querySelector(".gm-av") || r2); if (!e2) return;
        const rr = e2.getBoundingClientRect(), pop = document.createElement("div"); pop.className = "gm-kiss-pop";
        pop.style.left = rr.left + rr.width / 2 + "px"; pop.style.top = rr.top + rr.height / 2 + "px"; pop.style.width = pop.style.height = rr.width + "px";
        document.body.appendChild(pop); setTimeout(() => pop.remove(), 900);
        try { navigator.vibrate && navigator.vibrate(25); } catch (_) {}
      }, 1050);
    } catch (_) {}
  }
  // Oʻpich tanlovi konteksti: aylanish ochiq boʻlsa yoki (navbat oʻtgan boʻlsa ham) tanlov vaqti tugamagan boʻlsa
  function kissCtx(d) {
    const sp = d && d.spin; if (!sp) return null;
    if (sp.open) return { seq: sp.seq || 0, by: sp.by, to: sp.to, kiss: sp.kiss || {}, kend: sp.kend || 0, open: true };
    if (sp.kby && sp.kto && (sp.kend || 0) > Date.now()) return { seq: sp.seq || 0, by: sp.kby, to: sp.kto, kiss: sp.kiss || {}, kend: sp.kend, open: false };
    return null;
  }
  // Boshqa tomon OK bosganda uning oʻpichi menga uchib keladi (va men bosganimda ham ikkalamizga koʻrinadi)
  function kissFx() {
    const c = kissCtx(R), me = st.user && st.user.uid;
    if (!kissFxInit) { kissFxInit = true; if (c) Object.keys(c.kiss).forEach(u => kissFlown.add(c.seq + "|" + u)); return; }
    if (!c || !animDone || !(c.by === me || c.to === me) || c.by === c.to) return;
    for (const u of [c.by, c.to]) {
      if (c.kiss[u] !== "y") continue; const key = c.seq + "|" + u; if (kissFlown.has(key)) continue; kissFlown.add(key);
      kissFly(u, u === c.by ? c.to : c.by);
    }
  }
  const kissMine = c => !!kissMy && kissMy.split("|")[0] === String(c.seq);
  window.gmKiss = async yes => {
    const c = kissCtx(R), me = st.user.uid; if (!c || kissMine(c) || c.kiss[me]) return;
    kissMy = c.seq + "|" + (yes ? "y" : "n"); kissClosed = c.seq; kissOff($("gmKiss"), true);
    if (yes) { const other = c.by === me ? c.to : c.by; kissFlown.add(c.seq + "|" + me); kissFly(me, other); }
    try { await FB.gmKiss(RID, !!yes); } catch (e) { uiAlert(e.message || e); }
  };
  function kissHtml(d, me, other) {
    const nm = u => esc(pn(d, u).split(" ")[0]);
    return `<div class="gm-kiss-card">
      <div class="gm-kiss-timer"><svg viewBox="0 0 52 52" width="46" height="46" aria-hidden="true"><circle class="bg" cx="26" cy="26" r="${KISS_R}"/><circle class="fg" id="gmKissArc" cx="26" cy="26" r="${KISS_R}" stroke-dasharray="${KISS_C.toFixed(1)}" stroke-dashoffset="0" transform="rotate(-90 26 26)"/></svg><b id="gmKissSec">${KISS_SEC}</b></div>
      <div class="gm-kiss-pair">
        <div class="gm-kiss-p"><div class="gm-av">${pav(d, me)}</div><small>Siz</small></div>
        <button type="button" class="gm-kiss-ok" onclick="gmKiss(true)" aria-label="OK, oʻpich yuborish"><span class="gm-kiss-ok-ic">${IC("heart", 22)}</span><b>OK</b></button>
        <div class="gm-kiss-p"><div class="gm-av">${pav(d, other)}</div><small>${nm(other)}</small></div>
      </div>
      <button type="button" class="gm-kiss-no" onclick="gmKiss(false)">${IC("x", 14)} Yoʻq</button></div>`;
  }
  function kissUI() {
    const el = $("gmKiss"); if (!el) return;
    const d = R, c = kissCtx(d), me = st.user && st.user.uid;
    const ok = c && animDone && c.by && c.to && c.by !== c.to && (c.by === me || c.to === me) && gOf(d, c.by) && gOf(d, c.to) && gOf(d, c.by) !== gOf(d, c.to) && kissClosed !== c.seq && !c.kiss[me] && !kissMine(c);
    if (!ok) { if (!el.hidden) kissOff(el, false); return; }
    if (kissSeq !== c.seq) { kissSeq = c.seq; kissT0 = Date.now(); kissKey = ""; }
    const other = c.by === me ? c.to : c.by, now = Date.now();
    const left = Math.max(0, Math.min(KISS_SEC - (now - kissT0) / 1000, c.kend ? (c.kend - now) / 1000 : KISS_SEC));
    if (left <= 0) { kissOff(el, true); return; }
    if (kissKey !== String(c.seq)) { kissKey = String(c.seq); el.innerHTML = kissHtml(d, me, other); }
    el.hidden = false;
    const sec = $("gmKissSec"), arc = $("gmKissArc");
    if (sec) sec.textContent = String(Math.ceil(left));
    if (arc) { arc.style.strokeDashoffset = String(KISS_C * (1 - left / KISS_SEC)); arc.classList.toggle("low", left <= 3); }
    if (!kissTmr) kissTmr = setInterval(kissUI, 250);
  }

  // ---------- Render ----------
  function render(soft) {
    if (!$("gmSeats")) return;
    const d = R;
    if (!d || d.status !== "open" || !(d.players || []).includes(st.user.uid)) { if (!closing) { closing = true; toast(!d || d.status !== "open" ? "Xona yopildi" : "Siz xonadan chiqdingiz"); gmCloseAll(); } return; }
    $("gmTitle").textContent = d.title;
    const ord = ordOf(d), n = d.players.length, sp = d.spin || { seq: 0 }, me = st.user.uid;
    $("gmSeats").innerHTML = ord.map((u, i) => {
      const a = (i / n) * 2 * Math.PI - Math.PI / 2, x = 50 + 41 * Math.cos(a), y = 50 + 41 * Math.sin(a) + (u === d.owner ? 5 : 0);
      const cls = (gOf(d, u) === "f" ? " gf" : " gmm") + (d.turn === u ? " turn" : "") + (sp.open && animDone && lastSeq === (sp.seq || 0) && sp.to === u ? " target" : "");
      return `<div class="gm-seat${cls}" id="gs_${u}" style="left:${x}%;top:${y}%" onclick="gmSeat('${u}')"><div class="gm-av">${pav(d, u)}</div><small>${esc(pn(d, u).split(" ")[0])}${u === me ? " (siz)" : ""}</small></div>`;
    }).join("");
    // shisha
    if (sp.seq > 0 && sp.to) {
      const i = ord.indexOf(sp.to);
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
    if (!d.players.some(u => gOf(d, u) && gOf(d, u) !== gOf(d, me))) h = `<p>Qarshi tomondan oʻyinchi kutilmoqda… (${n}/${d.max})</p>`;
    else if (sp.open) h = `<p>${esc(pn(d, sp.by))} → <b>${esc(pn(d, sp.to))}</b></p>`;
    else if (d.turn === me) h = `<p>Navbat sizda!</p><button class="go" onclick="gmSpin()"${spinWait ? " disabled" : ""}>${spinWait ? "⏳ Shisha tayyorlanmoqda…" : "🍾 Shishani aylantirish"}</button>`;
    else { h = `<p>Navbat: <b>${esc(turnName)}</b></p>`; if (Date.now() - (d.turnAt || 0) > 40000) h += `<button class="ghost" onclick="gmSkip()">Oʻtkazib yuborish</button>`; }
    info.innerHTML = h;
    const roomInput = $("gmRoomInput");
    if (roomInput) roomInput.placeholder = sp.open && animDone && sp.by === me && sp.to !== me
      ? "Savolingizni yozing..." : sp.open && animDone && sp.to === me && sp.by !== me
      ? "Javobingizni yozing..." : "Xabaringizni yozing...";
    const templateBtn = $("gmTemplateBtn");
    if (templateBtn) templateBtn.hidden = !(sp.open && animDone && sp.by === me && sp.to !== me && !isBot(d, sp.to));
    // savol kartochkasi
    const card = $("gmCard");
    if (sp.open && animDone) {
      const ans = sp.ans || {}, inv = sp.by === me || sp.to === me, other = sp.by === me ? sp.to : sp.by;
      const botInv = isBot(d, sp.by) || isBot(d, sp.to), match = !botInv && ans[sp.by] && ans[sp.to];
      card.hidden = false;
      const msgs = sp.msgs || {};
      const myMsg = msgs[me] || {};
      const otherMsg = msgs[other] || {};
      card.innerHTML = `<div class="gm-q">${esc(sp.customQ || QS[sp.q % QS.length])}</div>
        <div class="gm-text-chat"><div class="gm-text-messages">${myMsg.text ? `<div class="gm-text-msg mine"><b>${esc(myMsg.name || "Siz")}</b><span>${esc(myMsg.text)}</span></div>` : ""}${otherMsg.text ? `<div class="gm-text-msg"><b>${esc(otherMsg.name || pn(d, other))}</b><span>${esc(otherMsg.text)}</span></div>` : ""}${(!myMsg.text && !otherMsg.text) ? '<p class="gm-hint">Javobni ovoz bilan ayting yoki xabar yozing.</p>' : ""}</div>
        </div>
        ${isBot(d, sp.to) ? `<p class="gm-hint">${esc(pn(d, sp.to))}: ${sp.bt ? esc(sp.bt) : "javob yozmoqda…"}</p>` : `<p class="gm-hint">Ovozli javob ham berishingiz mumkin.</p>`}` +
        (inv && !botInv ? `<button class="${ans[me] ? "go" : "ghost"}" onclick="gmLike(${ans[me] ? "false" : "true"})">${ans[me] ? "❤️ Yoqdi (bekor qilish)" : "🤍 Yoqdi"}</button>` : "") +
        (match && inv ? `<div class="gm-match">🎉 Ikkalangizga ham yoqdi!<button class="go" onclick="gmChat('${other}')">Chat ochish</button></div>` : "") +
        ((sp.by === me && sp.same && !sp.rr) ? `<button class="go" onclick="gmRespin()">🔁 Shishani qayta aylantirish</button>` : "") +
        ((sp.by === me || d.turn === me) ? `<button class="ghost" onclick="gmNext()">Keyingi navbat →</button>` : "");
      const cs = (sp.seq || 0) + "|" + (sp.customQ || "");
      if (card.dataset.seen !== cs) { card.dataset.seen = cs; setTimeout(() => { try { card.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (_) {} }, 60); }
    } else if (!sp.open) { card.hidden = true; delete card.dataset.seen; }
    if (sp.open && Date.now() - (sp.at || 0) > 90000 && sp.by !== me) info.innerHTML += `<button class="ghost" onclick="gmSkip()">Oʻtkazib yuborish</button>`;
    if (sp.open && Date.now() - (sp.at || 0) >= 35000 && !botT.timeout) {
      const seq = sp.seq; botT.timeout = seq;
      FB.gmNext(RID, true).catch(() => {}).finally(() => { if (botT.timeout === seq) botT.timeout = 0; });
    }
    { const k = (sp.seq || 0) + "|" + (sp.open ? 1 : 0) + "|" + (animDone ? 1 : 0) + "|" + (sp.customQ || "") + "|" + (sp.by || "") + (sp.to || ""); if (k !== chatKey) { chatKey = k; renderChat(); } }
    kissUI(); kissFx();
    voiceBar(); syncRtc();
    botTick();
  }

  // ---------- Botlar (xonadagi birinchi odam mijozi boshqaradi) ----------
  function botTick() {
    const d = R; if (!d || d.status !== "open" || !RID) return;
    const hs = d.players.filter(u => !isBot(d, u)).sort();
    if (hs[0] !== st.user.uid) return;
    const now = Date.now(), sp = d.spin || {}, id = RID, rnd = (a, b) => a + Math.random() * (b - a);
    // Xona boshqaruvi faqat birinchi haqiqiy foydalanuvchida; dastlab 30 soniya, keyin har 60 soniyada bitta yordamchi.
    const hasBot = d.players.some(u => isBot(d, u));
    const fastRefill = !!d.humanLeftAt && now - d.humanLeftAt >= 30000;
    const waitMs = fastRefill ? 30000 : (hasBot ? 60000 : 30000);
    if (d.bots && d.players.length < d.max && now - (d.lj || d.createdAt || 0) >= waitMs && (!d.humanLeftAt || fastRefill) && !botT.add) { botT.add = 1; FB.gmAddBot(id).catch(() => {}).finally(() => setTimeout(() => { botT.add = 0; }, 4000)); }
    if (isBot(d, d.turn) && !sp.open) {
      const k = "s" + d.turn + ":" + (sp.seq || 0) + ":" + (d.turnAt || 0), t = d.turn;
      if (botT.k1 !== k) { botT.k1 = k; setTimeout(() => { if (R && RID === id && R.turn === t && !(R.spin && R.spin.open)) FB.gmSpin(id, QS.length, t).catch(() => {}); }, rnd(3000, 6500) + Math.max(0, Math.min(14000, (sp.kend || 0) - now))); }
    }
    if (sp.open) {
      const k = "o" + sp.seq, seq = sp.seq, by = sp.by, to = sp.to;
      if (botT.k2 !== k) {
        botT.k2 = k;
        const live = () => R && RID === id && R.spin && R.spin.seq === seq && R.spin.open;
        if (!(isBot(d, by) && isBot(d, to))) [by, to].forEach(b => { if (isBot(d, b)) setTimeout(() => { const c = R && RID === id && kissCtx(R); if (c && c.seq === seq && !c.kiss[b]) FB.gmKiss(id, Math.random() < 0.6, b).catch(() => {}); }, rnd(3500, 7500)); });
        if (isBot(d, to)) setTimeout(() => { if (live()) FB.gmBotSay(id, BOT_SAY[Math.floor(Math.random() * BOT_SAY.length)]).catch(() => {}); }, rnd(5500, 8500));
        if (isBot(d, by)) {
          setTimeout(() => { if (live()) FB.gmNext(id, false, by).catch(() => {}); }, rnd(14000, 22000));
        }
      }
    }
  }

  // ---------- Amallar ----------
  let spinWait = false;
  window.gmSpin = async () => {
    if (spinWait) return;
    const wait = ((R && R.spin && R.spin.kend) || 0) - Date.now();
    if (wait > 0) { // oldingi juftlik oʻpich yuborib boʻlmaguncha shisha biroz kutadi
      spinWait = true; render(true);
      await new Promise(r => setTimeout(r, Math.min(wait, 14000) + 120));
      spinWait = false;
    }
    try { await FB.gmSpin(RID, QS.length); } catch (e) { uiAlert(e.message || e); } finally { if (spinWait) spinWait = false; render(true); }
  };
  window.gmRespin = async () => { try { await FB.gmRespin(RID); } catch (e) { uiAlert(e.message || e); } };
  window.gmNext = async () => { try { await FB.gmNext(RID, false); } catch (e) { uiAlert(e.message || e); } };
  window.gmSkip = async () => { try { await FB.gmNext(RID, true); } catch (e) { uiAlert(e.message || e); } };
  window.gmLike = async y => { try { await FB.gmAnswer(RID, y); } catch (e) { uiAlert(e.message || e); } };
  window.gmShowQuestionTemplates = function () {
    const d = R, sp = d && d.spin, me = st.user && st.user.uid;
    if (!d || !sp || !sp.open || !animDone || sp.by !== me || sp.to === me || isBot(d, sp.to)) return;
    const old = document.getElementById("gmQuestionTemplates");
    if (old) old.remove();
    const sheet = document.createElement("div");
    sheet.id = "gmQuestionTemplates";
    sheet.className = "gm-sheet gm-question-template-sheet";
    sheet.innerHTML = `<div class="gm-sheet-in"><div class="gm-sheet-head"><b>❓ Savol shablonlari</b><button type="button" class="gm-sheet-close" onclick="document.getElementById('gmQuestionTemplates')?.remove()">×</button></div><p class="gm-hint">Savolni tanlang — u chatga yuboriladi va oʻyin ekranida chiqadi.</p><div class="gm-question-template-list">${QS.map((q, i) => `<button type="button" class="gm-question-template-item" data-q-index="${i}"><span>${i + 1}.</span><b>${esc(q)}</b><small>Tanlash →</small></button>`).join("")}</div></div>`;
    sheet.addEventListener("click", e => {
      const b = e.target.closest("[data-q-index]");
      if (!b) return;
      const q = QS[Number(b.dataset.qIndex)];
      sheet.remove();
      const input = $("gmRoomInput");
      if (input) input.value = q;
      window.gmSendRoomText();
    });
    document.body.appendChild(sheet);
  };

  window.gmChatFull = () => {
    const sec = document.querySelector(".gm-room-chat"); if (!sec) return;
    const on = sec.classList.toggle("gm-chat-full");
    document.body.classList.toggle("gm-chat-open", on);
    const b = $("gmChatExp"); if (b) { b.innerHTML = on ? IC("shrink", 16) : IC("expand", 16); b.title = on ? "Kichraytirish" : "Chatni kattalashtirish"; b.setAttribute("aria-label", b.title); }
    const box = $("gmRoomMessages"); if (box) requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; });
  };
  window.gmSendRoomText = async () => {
    const input = $("gmRoomInput"); let text = String(input?.value || "").trim();
    if (!text) return;
    const d = R, sp = d && d.spin, me = st.user.uid;
    try {
      if (d && sp && sp.open && animDone && sp.by === me && sp.to !== me) {
        const question = text.slice(0, 500);
        await FB.gmSetQuestion(RID, question);
        await FB.gmRoomSend(RID, "❓ SAVOL → " + pn(d, sp.to) + ": " + question);
      } else if (d && sp && sp.open && animDone && sp.to === me && sp.by !== me) {
        text = "❓ Savol: " + (sp.customQ || QS[sp.q % QS.length]) + "\\n💬 Javob: " + text;
        await FB.gmRoomSend(RID, text);
      } else {
        await FB.gmRoomSend(RID, text);
      }
      if (input) input.value = "";
    } catch (e) { uiAlert("Xabar yuborilmadi: " + (e.message || e)); }
  };
  window.gmSendText = async other => {
    const input = $("gmTextInput"), text = String(input?.value || "").trim();
    if (!text) return;
    try { await FB.gmText(RID, text); if (input) input.value = ""; }
    catch (e) { uiAlert("Xabar yuborilmadi: " + (e.message || e)); }
  };
  window.gmChat = async u => {
    try { const id = await FB.openDirectChat(u, pn(R, u), (R.pm[u] || {}).a || "", (R.pm[u] || {}).i || "", st.user); await gmLeave(true); st.tab = "msg"; openC(id); }
    catch (e) { uiAlert("Chat ochilmadi: " + (e.message || e)); }
  };
  window.gmSeat = function (u) {
    if (!R || u === st.user.uid) return;
    $("gmSheet")?.remove();
    const sh = document.createElement("div"); sh.className = "gm-sheet"; sh.id = "gmSheet";
    const name = pn(R, u), meta = (R.pm && R.pm[u]) || {};
    sh.innerHTML = `<div class="gm-sheet-in" role="dialog" aria-modal="true"><div class="gm-sheet-head"><b>${esc(name)}</b><button class="gm-sheet-close" aria-label="Yopish" onclick="document.getElementById('gmSheet')?.remove()">✕</button></div><div class="gm-sheet-actions"><button class="ghost" onclick="gmShowPlayerProfile('${u}')">👤 Profilini ko‘rish</button><button class="ghost" onclick="gmShowPlayerGifts('${u}')">🎁 Sovg‘a yuborish</button></div><div id="gmSheetContent"></div><button class="ghost" onclick="document.getElementById('gmSheet')?.remove()">Yopish</button></div>`;
    sh.addEventListener("click", e => { if (e.target === sh) sh.remove(); });
    document.body.appendChild(sh);
    window.gmShowPlayerGifts(u);
  };
  window.gmShowPlayerGifts = function (u) {
    if (!R || !document.getElementById("gmSheetContent")) return;
    const content = $("gmSheetContent");
    content.innerHTML = `<b>${esc(pn(R, u))} ga sovg‘a yuborish</b><div class="gm-fl">${FL.map(f => `<button onclick="gmSend('${u}','${f[0]}')"><span>${f[1]}</span><small>${f[2]}</small></button>`).join("")}</div>`;
  };
  window.gmShowPlayerProfile = function (u) {
    if (!R || !document.getElementById("gmSheetContent")) return;
    const meta = (R.pm && R.pm[u]) || {};
    const avatar = pav(R, u);
    $("gmSheetContent").innerHTML = `<div class="gm-player-profile"><div class="gm-player-avatar">${avatar}</div><b>${esc(pn(R, u))}</b><p>O‘yin ishtirokchisi</p><small>Ushbu o‘yin xonasidagi ishtirokchi profili</small></div>`;
  };
  window.gmSend = async (u, k) => { $("gmSheet")?.remove(); try { await FB.gmGift(RID, u, k, myMeta()); } catch (e) { uiAlert("Gul yuborilmadi: " + (e.message || e)); } };
  function onGifts(list) {
    if (seenG === null) { seenG = new Set(list.map(g => g.id)); return; }
    list.slice().reverse().forEach(g => {
      if (seenG.has(g.id)) return; seenG.add(g.id);
      const fromEl = $("gs_" + g.from), toEl = $("gs_" + g.to);
      if (fromEl && toEl) {
        const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
        const f = document.createElement("div"); f.className = "gm-gift-flight"; f.textContent = FLE[g.kind] || "🌸";
        f.style.left = (a.left + a.width / 2) + "px"; f.style.top = (a.top + a.height / 2) + "px";
        f.style.setProperty("--gift-dx", (b.left + b.width / 2 - a.left - a.width / 2) + "px");
        f.style.setProperty("--gift-dy", (b.top + b.height / 2 - a.top - a.height / 2) + "px");
        document.body.appendChild(f); setTimeout(() => f.remove(), 1500);
        const badge = document.createElement("div"); badge.className = "gm-fly"; badge.textContent = FLE[g.kind] || "🌸"; toEl.appendChild(badge); setTimeout(() => badge.remove(), 2600);
      }
      if (g.to === st.user.uid) toast(`${g.fromName || "Kimdir"} sizga ${FLE[g.kind] || "🌸"} yubordi`);
    });
  }

  // ---------- Ovozli xona (Agora): tinglash avtomatik, mikrofon ixtiyoriy ----------
  let vstate = "off", vmsg = "", vInit = false, beatT = null, vStep = "";
  const VOICE_TTL = 60000, VOICE_BEAT = 20000, TOKEN_TTL_CLIENT = 3600;
  const voiceLive = d => { const v = d && d.voice; if (!v || typeof v !== "object") return false; const now = Date.now(); return Object.keys(v).some(u => typeof v[u] === "number" && now - v[u] < VOICE_TTL); };
  function stopBeat() { clearInterval(beatT); beatT = null; }
  function startBeat(id) { stopBeat(); const go = () => FB.gmVoiceBeat(id, true).catch(e => console.warn("voice beat:", e)); go(); beatT = setInterval(() => { if (RID === id && call && !call.left) go(); else stopBeat(); }, VOICE_BEAT); }
  function voiceCount(d) { const v = d && d.voice; if (!v || typeof v !== "object") return 0; const now = Date.now(); return Object.keys(v).filter(u => typeof v[u] === "number" && now - v[u] < VOICE_TTL).length; }
  function voiceBar() {
    const el = $("gmVoiceBar"); if (!el) return;
    const on = vstate === "on", conn = vstate === "conn", n = Math.max(voiceCount(R), on ? 1 : 0);
    if (!on && !conn && !voiceLive(R)) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    el.innerHTML = on ? `<span class="dot"></span><span>🔊 Siz ovozdasiz · ${n} kishi ulangan</span>`
      : conn ? `<span class="dot"></span><span>⏳ ${esc(vStep || "Ulanmoqda…")}</span>`
      : `<span class="dot"></span><span>🎙️ Ovozli chat ochiq · ${n} kishi ulangan</span><button type="button" class="go" onclick="gmVoice(true)">Qoʻshilish</button>`;
  }
  function voiceUI() {
    voiceBar();
    const el = $("gmCall"); if (!el) return;
    const on = vstate === "on", c = call, ic = (n, s, x) => (typeof YI === "function" ? YI(n, s, x) : "");
    const ps = on && c && c.rtc ? c.rtc.status() : [], okc = ps.filter(x => x.state === "connected").length, cn = ps.length ? ` · aloqa: ${okc}/${ps.length}` : "";
    const msg = on ? (c && !c.muted ? "🎙️ Mikrofon yoqilgan · siz gapira olasiz" : "🔊 Ovozli chat yoniq · mikrofon oʻchiq") + cn : vmsg;
    el.innerHTML = `<div class="yaqin-call-head"><span class="yaqin-call-live-dot"></span><span class="yaqin-call-status">${esc(msg || "")}</span></div><div class="yaqin-call-actions">` +
      (on ? `<button class="yaqin-call-btn" type="button" onclick="gmMute()">${c && !c.muted ? "🎙️ Mikrofonni oʻchirish" : "🔇 Mikrofonni yoqish"}</button><button class="yaqin-call-btn yaqin-call-end" type="button" onclick="gmVoiceEnd()">${ic("phone", 18, "rot")} Tugatish</button>`
        : `<button class="yaqin-call-btn yaqin-call-primary" style="grid-column:1/-1" type="button" onclick="gmVoice()"${vstate === "conn" ? " disabled" : ""}>${ic("mic", 18)} ${vstate === "conn" ? esc(vStep || "Ulanmoqda…") : "Ovozli chat"}</button>`) + `</div>`;
  }
  window.gmVoice = async function (auto) {
    if (vstate !== "off" || !RID) return;
    vstate = "conn"; vmsg = ""; voiceUI();
    const rid = RID;
    await startVoice(RID);
    if (call && !call.left && vmsg === "") {
      vstate = "on"; voiceUI(); startBeat(rid); syncRtc();
      // Mikrofon so'ralmaydi: avval faqat eshitish; gapirish uchun "Mikrofonni yoqish" tugmasi bosiladi
      if (auto !== true) toast("🔊 Ovozli chatga ulandingiz (faqat eshitish). Gapirish uchun mikrofonni yoqing");
    } else vstate = "off";
    voiceUI();
  };
  window.gmVoiceEnd = async function () {
    const rid = RID; stopBeat();
    await stopVoice(); vstate = "off"; vmsg = ""; voiceUI();
    if (rid) FB.gmVoiceBeat(rid, false).catch(() => {});
  };
  const withTO = (p, ms, msg) => { let t; return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(msg)), ms); })]).finally(() => clearTimeout(t)); };
  const setStep = t => { vStep = t; voiceUI(); };
  // ---------- WebRTC ovoz (Agora'siz): js/webrtc-voice.js ----------
  let rtc = null;
  const liveUids = d => { const v = d && d.voice; if (!v || typeof v !== "object") return []; const now = Date.now(); return Object.keys(v).filter(u => u !== st.user.uid && typeof v[u] === "number" && now - v[u] < VOICE_TTL); };
  function syncRtc() { if (rtc && R && vstate === "on") rtc.syncPeers(liveUids(R)); }
  window.gmCopyDiag = function () {
    const t = rtc ? "Holat: " + JSON.stringify(rtc.status()) + "\n" + rtc.logs.join("\n") : (window._gmDiag || "Ovoz hali ulanmagan");
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast("Nusxalandi"), () => { const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); toast("Nusxalandi"); } catch (_) {} ta.remove(); });
  };
  async function startVoice(id) {
    try {
      setStep("Ovozli aloqa tayyorlanmoqda…");
      if (!window.YQRtc) throw new Error("webrtc-voice.js yuklanmadi. Sahifani yangilang.");
      const r = YQRtc.create({
        myUid: st.user.uid,
        getIce: () => FB.rtcIce(),
        send: m => FB.rtcSend(id, m),
        listen: cb => FB.rtcListen(id, cb),
        del: mid => FB.rtcDel(id, mid),
        onSpeak: (u, on) => { const el = $("gs_" + u); if (el) el.classList.toggle("speak", !!on); },
        onStatus: () => voiceUI(),
        onAutoplayBlocked: () => toast("🔊 Ovozni yoqish uchun ekranga bir marta bosing"),
      });
      await withTO(r.join(), 15000, "Ovozli aloqa tayyor boʻlmadi (internetni tekshiring).");
      rtc = r; call = { rtc: r, left: false, muted: true };
      const btn = $("gmMic"); if (btn) { btn.textContent = "🔇"; btn.title = "Mikrofonni yoqish"; btn.setAttribute("aria-label", "Mikrofonni yoqish"); }
      if ($("gmVs")) $("gmVs").textContent = "🔊 Ovozli xona ulandi · mikrofon oʻchiq";
    } catch (e) {
      console.error("gm voice:", e); window._gmDiag = String(e && e.message || e);
      if ($("gmVs")) $("gmVs").textContent = "⚠️ Ovozli xonaga ulanilmadi: " + (e.message || e);
      vmsg = "⚠️ Ulanilmadi: " + (e.message || e); toast(vmsg); try { rtc && rtc.leave(); } catch (_) {} rtc = null; call = null;
    } finally { vStep = ""; }
  }
  window.gmMute = async function () {
    const c = call;
    if (!c || c.left || !c.rtc) { toast("Ovozli xona hali ulanmagan"); return; }
    const b = $("gmMic"), vs = $("gmVs");
    try {
      if (c.muted) {
        await c.rtc.setMic(true); c.muted = false;
        if (b) { b.textContent = "🎙️"; b.title = "Mikrofonni oʻchirish"; b.setAttribute("aria-label", "Mikrofonni oʻchirish"); }
        if (vs) vs.textContent = "🎙️ Siz gapira olasiz · mikrofon yoqilgan";
      } else {
        await c.rtc.setMic(false); c.muted = true;
        if (b) { b.textContent = "🔇"; b.title = "Mikrofonni yoqish"; b.setAttribute("aria-label", "Mikrofonni yoqish"); }
        if (vs) vs.textContent = "🔊 Ovozli xona ulandi · mikrofon oʻchiq";
      }
    } catch (e) {
      console.error("gm mic toggle:", e);
      if (vs) vs.textContent = "⚠️ Mikrofon yoqilmadi: " + (e.message || e);
      toast("Mikrofonni yoqib boʻlmadi. Ruxsatni tekshiring.");
    }
  };
  { const _m = window.gmMute; window.gmMute = async function () { await _m.apply(this, arguments); voiceUI(); }; }
  async function stopVoice() {
    stopBeat(); const c = call; call = null; rtc = null; if (!c) return; c.left = true;
    try { c.rtc && c.rtc.leave(); } catch (_) {}
  }

  // ---------- Chiqish ----------
  window.gmLeave = function (silent) {
    const id = RID; closing = true;
    document.body.classList.remove("gm-chat-open"); kissOff($("gmKiss"), false); kissSeq = 0; songStop(); srchStop(); { const ss = $("gmSongSheet"); if (ss) ss.remove(); }
    if (id) { leavingRooms.add(id); setTimeout(() => leavingRooms.delete(id), 10000); stopVoice().catch(() => {}); FB.gmLeave(id).catch(e => console.warn("gmLeave:", e)); }
    cleanup(); if (silent === true) { drop(); return; } gmOpenList();
  };
  function cleanup() { clearInterval(pingT); pingT = null; vstate = "off"; vmsg = ""; unW && unW(); unG && unG(); clearInterval(tick); clearTimeout(animTimer); unW = unG = null; RID = null; R = null; }
  window.gmCloseAll = function () { stopVoice().catch(() => {}); unL && unL(); unL = null; clearTimeout(listT); if (RID) { const id = RID; leavingRooms.add(id); setTimeout(() => leavingRooms.delete(id), 10000); FB.gmLeave(id).catch(() => {}); } cleanup(); view = ""; drop(); };
  // Telefon "ortga" tugmasi (app.js popstate chaqiradi): avval ochiq oynacha, keyin xona -> roʻyxat -> yopish
  window.gmBackHandler = function () {
    if (!$("gm")) return false;
    const sh = $("gmSongSheet") || $("gmSheet") || $("gmQuestionTemplates"); if (sh) { if (sh.id === "gmSongSheet") srchStop(); sh.remove(); return true; }
    if (view === "room" && document.querySelector(".gm-room-chat.gm-chat-full")) { window.gmChatFull(); return true; }
    if (view === "room") { window.gmLeave(); return true; }
    window.gmCloseAll(); return true;
  };

  // ---------- Guruhlar sahifasiga kirish tugmasi ----------
  const base = window.groupsV;
  if (typeof base === "function") window.groupsV = function () {
    const h = base.apply(this, arguments);
    if (!st.user) return h;
    return `<button class="gm-entry" onclick="gmOpenList()"><span>🎲</span><div><b>Guruhli oʻyinlar</b></div></button>` + h;
  };
})();
