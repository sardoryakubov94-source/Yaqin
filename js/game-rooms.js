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
  let botT = {};
  const gOf = (d, u) => (d.pm && d.pm[u] && d.pm[u].g) || "";
  function ordOf(d) { const m = d.players.filter(u => gOf(d, u) !== "f"), f = d.players.filter(u => gOf(d, u) === "f"), a = gOf(d, d.owner) === "f" ? f : m, b = a === f ? m : f, o = []; for (let i = 0; i < Math.max(m.length, f.length); i++) { if (a[i]) o.push(a[i]); if (b[i]) o.push(b[i]); } return o; }
  const pn = (d, u) => (d.pm && d.pm[u] && d.pm[u].n) || "Oʻyinchi";
  const pav = (d, u) => av({ img: d.pm && d.pm[u] && d.pm[u].i, ava: d.pm && d.pm[u] && d.pm[u].a });

  // ---------- Xonalar roʻyxati ----------
  window.gmOpenList = function () {
    if (!st.user) { uiAlert("Guruhli oʻyinlarga kirish uchun avval tizimga kiring."); return; }
    view = "list"; unL && unL();
    drawList([]);
    unL = FB.gmRooms(rs => { if (view === "list") drawList(rs); });
  };
  function drawList(rs) {
    const live = r => (r.players || []).some(u => !isBot(r, u));
    rs = rs.filter(r => r.status === "open");
    const mine = rs.filter(r => !live(r) && r.owner === st.user.uid).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    mine.forEach(r => { if (Date.now() - (r.updatedAt || 0) > 7 * 864e5) FB.gmDelete(r.id).catch(() => {}); });
    rs = rs.filter(live).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const row = r => `<div class="gm-room" onclick="gmEnter('${r.id}')"><div><b>${esc(r.title)}</b><small>${live(r) ? r.players.filter(u => !isBot(r, u)).map(u => esc(pn(r, u))).slice(0, 3).join(", ") : "Hozircha boʻsh · kirishingiz mumkin"}</small></div><span>👩 ${hCnt(r, "f")}/${r.max / 2}<br>👨 ${hCnt(r, "m")}/${r.max / 2}${r.owner === st.user.uid ? `<br><b onclick="event.stopPropagation();gmDel('${r.id}')" style="font-size:16px">🗑</b>` : ""}</span></div>`;
    layer(`<div class="gm-top"><button class="gm-ic" onclick="gmCloseAll()">←</button><b>🎲 Guruhli oʻyinlar</b></div>
<div class="gm-body"><p class="gm-sub">Ovozli oʻyin: shisha aylanadi, savolga javob berasiz, yoqsangiz — gul yuborasiz. Hammasi ovoz orqali.</p>
<div class="gm-new"><input id="gmT" maxlength="40" placeholder="Xona nomi (masalan: Andijon davrasi)"><select id="gmM"><option value="4">4 kishi (2 qiz + 2 yigit)</option><option value="6" selected>6 kishi (3 qiz + 3 yigit)</option><option value="8">8 kishi (4 qiz + 4 yigit)</option></select><label class="gm-chk"><input type="checkbox" id="gmB" checked> Odam yetmasa 1 daqiqadan keyin yordamchi oʻyinchilar toʻldirsin</label><button class="go" onclick="gmCreate()">Xona ochish</button></div>
${rs.length ? rs.map(row).join("") : '<p class="gm-empty">Hozircha odam bor xona yoʻq. Birinchi boʻlib xona oching!</p>'}${mine.length ? '<p class="gm-sub" style="margin-top:14px">Mening saqlangan xonalarim (hozir boʻsh)</p>' + mine.map(row).join("") : ""}</div>`);
  }
  window.gmDel = function (id) { if (confirm("Bu xonani butunlay oʻchirasizmi?")) FB.gmDelete(id).catch(e => uiAlert("Oʻchirilmadi: " + (e.message || e))); };
  window.gmCreate = async function () {
    const t = ($("gmT") || {}).value || "", m = ($("gmM") || {}).value || 6;
    try { if (!(await askGender())) return; const id = await FB.gmCreate(t, m, myMeta(), !!($("gmB") || {}).checked); await gmEnter(id, true); } catch (e) { uiAlert(e.message || e); }
  };

  // ---------- Xonaga kirish ----------
  window.gmEnter = async function (id, created) {
    try {
      if (!created) { if (!(await askGender())) return; await FB.gmJoin(id, myMeta()); }
      unL && unL(); unL = null; unChat && unChat(); unChat = null;
      RID = id; view = "room"; R = null; lastSeq = null; seenG = null; closing = false; animDone = true; rot = 0;
      buildRoom();
      unW = FB.gmWatch(id, d => { R = d; render(); });
      unG = FB.gmGifts(id, onGifts);
      unChat = FB.gmRoomChat(id, msgs => {
        const box = $("gmRoomMessages"); if (!box) return;
        const d = R, sp = d && d.spin, me = st.user.uid;
        const askPrompt = d && sp && sp.open && sp.by === me && sp.to !== me && animDone
          ? `<div class="gm-room-msg gm-room-question gm-room-ask-prompt"><div class="gm-room-author">${pav(d, sp.to)}<b>${esc(pn(d, sp.to))}</b></div><div class="gm-room-question-text">💬 ${esc(pn(d, sp.to))} ga savolingizni bering</div><small class="gm-room-question-hint">Savolni pastdagi chat maydoniga yozing</small></div>` : "";
        const answerPrompt = d && sp && sp.open && sp.to === me && sp.by !== me && animDone
          ? `<div class="gm-room-msg gm-room-question"><div class="gm-room-author">${pav(d, sp.by)}<b>${esc(pn(d, sp.by))}</b><small>sizga savol berdi</small></div><div class="gm-room-question-text">❓ ${esc(sp.customQ || QS[sp.q % QS.length])}</div><small class="gm-room-question-hint">Javobni pastdagi chat maydoniga yozing</small></div>` : "";
        const rendered = msgs.map(m => {
          const text = String(m.text || "");
          const isQA = text.startsWith("❓ Savol: ") && text.includes("\\n💬 Javob: ");
          const isQuestion = text.startsWith("❓ SAVOL → ");
          const body = isQA ? (() => { const p = text.split("\\n💬 Javob: "); return `<div class="gm-room-qa-question">❓ ${esc(p[0].replace(/^❓ Savol: /, ""))}</div><div class="gm-room-qa-answer">💬 Javob: ${esc(p.slice(1).join("\\n💬 Javob: "))}</div>`; })()
            : isQuestion ? `<div class="gm-room-qa-question">${esc(text)}</div>` : esc(text);
          const avatar = d && d.pm && d.pm[m.from] ? pav(d, m.from) : "";
          return `<div class="gm-room-msg${m.from === me ? " mine" : ""}${isQuestion ? " gm-room-question" : ""}"><div class="gm-room-author">${avatar}<b>${esc(m.name || "Oʻyinchi")}</b></div><span>${body}</span></div>`;
        }).join("");
        box.innerHTML = askPrompt + answerPrompt + rendered;
        box.scrollTop = box.scrollHeight;
      });
      tick = setInterval(() => R && render(true), 4000);
      startVoice(id);
    } catch (e) { uiAlert("Xonaga kirib boʻlmadi: " + (e.message || e)); if (view === "list") gmOpenList(); }
  };
  function buildRoom() {
    layer(`<div class="gm-top"><button class="gm-ic" onclick="gmLeave()">←</button><b id="gmTitle">Xona</b><button class="gm-ic" id="gmMic" onclick="gmMute()">🎙️</button></div>
<div class="gm-stage"><div class="gm-ring" id="gmRing"><div class="gm-bottle" id="gmBottle">🍾</div><div id="gmSeats"></div></div></div>
<div class="gm-info" id="gmInfo"></div><div class="gm-card" id="gmCard" hidden></div><section class="gm-room-chat"><div class="gm-room-chat-title">💬 Xona chati <small>Istalgan vaqtda yozing</small></div><div id="gmRoomMessages" class="gm-room-messages"></div><form class="gm-room-send" onsubmit="event.preventDefault();gmSendRoomText()"><input id="gmRoomInput" maxlength="500" placeholder="Xabaringizni yozing..." autocomplete="off"><button class="ghost gm-template-trigger" id="gmTemplateBtn" type="button" onclick="gmShowQuestionTemplates()" hidden>☷ Shablon</button><button class="go" type="submit">Yuborish</button></form></section><div class="gm-vs" id="gmVs">Ovozli aloqa ulanmoqda…</div>`);
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
    else if (d.turn === me) h = `<p>Navbat sizda!</p><button class="go" onclick="gmSpin()">🍾 Shishani aylantirish</button>`;
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
    } else if (!sp.open) card.hidden = true;
    if (sp.open && Date.now() - (sp.at || 0) > 90000 && sp.by !== me) info.innerHTML += `<button class="ghost" onclick="gmSkip()">Oʻtkazib yuborish</button>`;
    if (sp.open && Date.now() - (sp.at || 0) >= 18000 && !botT.timeout) {
      const seq = sp.seq; botT.timeout = seq;
      FB.gmNext(RID, true).catch(() => {}).finally(() => { if (botT.timeout === seq) botT.timeout = 0; });
    }
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
      if (botT.k1 !== k) { botT.k1 = k; setTimeout(() => { if (R && RID === id && R.turn === t && !(R.spin && R.spin.open)) FB.gmSpin(id, QS.length, t).catch(() => {}); }, rnd(3000, 6500)); }
    }
    if (sp.open) {
      const k = "o" + sp.seq, seq = sp.seq, by = sp.by, to = sp.to;
      if (botT.k2 !== k) {
        botT.k2 = k;
        const live = () => R && RID === id && R.spin && R.spin.seq === seq && R.spin.open;
        if (isBot(d, to)) setTimeout(() => { if (live()) FB.gmBotSay(id, BOT_SAY[Math.floor(Math.random() * BOT_SAY.length)]).catch(() => {}); }, rnd(5500, 8500));
        if (isBot(d, by)) {
          setTimeout(() => { if (live()) FB.gmNext(id, false, by).catch(() => {}); }, rnd(14000, 22000));
        }
      }
    }
  }

  // ---------- Amallar ----------
  window.gmSpin = async () => { try { await FB.gmSpin(RID, QS.length); } catch (e) { uiAlert(e.message || e); } };
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
    return `<button class="gm-entry" onclick="gmOpenList()"><span>🎲</span><div><b>Guruhli oʻyinlar</b></div></button>` + h;
  };
})();
