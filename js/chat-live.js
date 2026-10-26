/* Yaqin: xabarga javob berish, "oʻqildi" belgisi, "yozmoqda…", xabarni tahrirlash va oʻchirish. match-push.js dan keyin yuklanadi. */
(function () {
  "use strict";
  const q = id => document.getElementById(id);
  const PREV = x => x.deleted ? "Xabar oʻchirildi" : x.kind === "media" ? "Rasm" : x.kind === "voice" ? "Ovozli xabar" : x.kind === "sticker" ? "Stiker " + (x.text || "") : String(x.text || "").slice(0, 100);
  const col = () => (st.chat && st.chat.t === "g" ? "groups" : "chats");
  const find = id => (st.cm || []).find(x => x.id === id);
  const mine = x => st.user && x.from === st.user.uid;

  // ---------- javob (reply) ----------
  window.replyQuote = x => {
    const r = x && x.reply; if (!r) return "";
    return `<div class="rq" data-rid="${esc(r.id || "")}"><b>${esc(r.name || "")}</b><span>${esc(r.text || "")}</span></div>`;
  };
  function barHtml() {
    const r = st.replyTo; if (!r) return "";
    return `<div class="rbar" id="rbar"><div class="rb-t"><b>${esc(r.name || "Xabar")}</b><span>${esc(r.text || "")}</span></div><button type="button" aria-label="Bekor qilish" onclick="replyCancel()">${YI("x", 16)}</button></div>`;
  }
  window.replyBarSync = function () {
    const old = q("rbar"); if (old) old.remove();
    const s = document.querySelector(".ov .send");
    if (st.replyTo && s) s.insertAdjacentHTML("beforebegin", barHtml());
  };
  window.replyCancel = function () { st.replyTo = null; window.replyBarSync(); };
  function startReply(id) {
    const m = find(id); if (!m || m.deleted) return;
    st.replyTo = { id: m.id, name: (mine(m) ? "Siz" : (m.name || "")).slice(0, 40), text: PREV(m).slice(0, 100), kind: m.kind || "" };
    st.replyCid = st.chat && st.chat.id;
    window.replyBarSync();
    const mi = q("mi"); if (mi) mi.focus();
  }
  window.replyJump = function (id) {
    const el = id && document.querySelector('#ms [data-mid="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
    if (!el) { toast("Xabar yuklanmagan (eski)"); return; }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1400);
  };

  // ---------- oʻchirilgan xabar ----------
  window.deletedBubble = (x, g) => `<div class="m mdel ${mine(x) ? "me" : ""}">${g && !mine(x) ? `<b>${esc(x.name || "")}</b>` : ""}<i>${YI("ban", 14)} Xabar oʻchirildi</i><small>${tm(x.t)}</small></div>`;

  // ---------- belgilar: tahrirlangan, ✓ / ✓✓ ----------
  window.msgTick = x => {
    let s = x.edited ? " · tahrirlangan" : "";
    if (st.chat && st.chat.t === "c" && mine(x) && !(st.prefs && st.prefs.rr === false)) {
      const list = st.cm || [], idx = list.findIndex(y => y.id === x.id), rm = st.peerState && st.peerState.readMsg, ri = rm ? list.findIndex(y => y.id === rm) : -1;
      s += ri >= 0 && idx >= 0 && idx <= ri ? ' <span class="tk r" title="Oʻqildi">' + YI("checks", 16) + '</span>' : ' <span class="tk" title="Yuborildi">' + YI("check", 16) + '</span>';
    }
    return s;
  };

  // ---------- amallar menyusi ----------
  function closeMenu() { const b = document.querySelector(".mm-bg"); if (b) b.remove(); }
  function modal(html, wire) {
    closeMenu();
    document.body.insertAdjacentHTML("beforeend", `<div class="mm-bg"><div class="mm">${html}</div></div>`);
    const bg = document.querySelector(".mm-bg");
    bg.addEventListener("click", e => { if (e.target === bg) closeMenu(); });
    if (wire) wire(bg);
    return bg;
  }
  function openMenu(id) {
    const m = find(id); if (!m || !st.user || !st.chat) return;
    const own = mine(m), plain = !m.kind && !m.deleted;
    const gOwner = st.chat.t === "g" && (st.groups || []).some(g => g.id === st.chat.id && g.owner === st.user.uid);
    const items = [];
    if (!m.deleted) items.push([YI("reply", 20), "Javob berish", () => startReply(id)]);
    if (plain) items.push([YI("copy", 20), "Nusxalash", () => { try { navigator.clipboard.writeText(m.text); toast("Nusxalandi"); } catch (_) { uiAlert("Nusxalab boʻlmadi."); } }]);
    if (own && plain) items.push([YI("edit", 20), "Tahrirlash", () => editDialog(id)]);
    if (!m.deleted && (own || gOwner)) items.push([YI("trash", 20), "Oʻchirish", () => deleteDialog(id, !own), true]);
    if (!items.length) return;
    modal(items.map((it, i) => `<button type="button" class="mm-i${it[3] ? " danger" : ""}" data-i="${i}"><span>${it[0]}</span>${it[1]}</button>`).join("") + '<button type="button" class="mm-i cancel">Bekor qilish</button>', bg => {
      bg.querySelectorAll(".mm-i[data-i]").forEach(b => b.addEventListener("click", () => { closeMenu(); items[+b.dataset.i][2](); }));
      bg.querySelector(".cancel").addEventListener("click", closeMenu);
    });
  }
  function editDialog(id) {
    const m = find(id); if (!m) return;
    modal('<h4>Xabarni tahrirlash</h4><textarea id="mmText" maxlength="1000" rows="4"></textarea><div class="mm-row"><button type="button" class="mm-i cancel">Bekor qilish</button><button type="button" class="mm-i ok">Saqlash</button></div>', bg => {
      const ta = bg.querySelector("#mmText"); ta.value = m.text; ta.focus();
      bg.querySelector(".cancel").addEventListener("click", closeMenu);
      bg.querySelector(".ok").addEventListener("click", async () => {
        const v = ta.value.trim();
        if (!v || v === m.text) { closeMenu(); return; }
        const last = st.cm[st.cm.length - 1];
        closeMenu();
        try { await FB.editMsg(col(), st.chat.id, id, v, !!last && last.id === id); }
        catch (e) { uiAlert("Tahrirlab boʻlmadi: " + (e.message || e)); }
      });
    });
  }
  function deleteDialog(id, hard) {
    modal(`<h4>Xabarni oʻchirasizmi?</h4><p class="mm-p">${hard ? "Xabar guruhdan butunlay olib tashlanadi." : "Xabar ikkala tomonda ham «Xabar oʻchirildi» deb koʻrinadi."}</p><div class="mm-row"><button type="button" class="mm-i cancel">Bekor qilish</button><button type="button" class="mm-i danger ok">Oʻchirish</button></div>`, bg => {
      bg.querySelector(".cancel").addEventListener("click", closeMenu);
      bg.querySelector(".ok").addEventListener("click", async () => {
        const last = st.cm[st.cm.length - 1]; closeMenu();
        try { await FB.deleteMsg(col(), st.chat.id, id, hard, !!last && last.id === id); }
        catch (e) { uiAlert("Oʻchirib boʻlmadi: " + (e.message || e)); }
      });
    });
  }
  window.msgMenu = openMenu;
  window.ysModal = modal; window.ysCloseModal = closeMenu;

  // ---------- imo-ishoralar: uzoq bosish, oʻngga surish, sichqoncha oʻng tugmasi ----------
  let G = null;
  const bubble = t => t && t.closest ? t.closest("#ms .m[data-mid]") : null;
  document.addEventListener("touchstart", e => {
    const b = bubble(e.target); if (!b || e.touches.length !== 1) { G = null; return; }
    const t = e.touches[0]; G = { b, x: t.clientX, y: t.clientY, dx: 0, swipe: false, fired: false };
    G.timer = setTimeout(() => { if (G && !G.swipe) { G.fired = true; if (navigator.vibrate) try { navigator.vibrate(12); } catch (_) {} openMenu(b.dataset.mid); } }, 480);
  }, { passive: true });
  document.addEventListener("touchmove", e => {
    if (!G) return; const t = e.touches[0], dx = t.clientX - G.x, dy = t.clientY - G.y;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) clearTimeout(G.timer);
    if (!G.swipe && dx > 14 && Math.abs(dx) > Math.abs(dy) * 1.6) G.swipe = true;
    if (G.swipe) { G.dx = Math.max(0, Math.min(dx, 84)); G.b.style.transition = "none"; G.b.style.transform = "translateX(" + G.dx + "px)"; }
  }, { passive: true });
  function endTouch() {
    if (!G) return; clearTimeout(G.timer);
    const g = G; G = null;
    g.b.style.transition = "transform .18s"; g.b.style.transform = "";
    if (g.swipe && g.dx >= 64) startReply(g.b.dataset.mid);
    if (g.fired) { const kill = ev => { ev.stopPropagation(); ev.preventDefault(); }; document.addEventListener("click", kill, { capture: true, once: true }); setTimeout(() => document.removeEventListener("click", kill, true), 400); }
  }
  document.addEventListener("touchend", endTouch, { passive: true });
  document.addEventListener("touchcancel", endTouch, { passive: true });
  document.addEventListener("contextmenu", e => { const b = bubble(e.target); if (b) { e.preventDefault(); openMenu(b.dataset.mid); } });
  document.addEventListener("click", e => {
    const r = e.target.closest && e.target.closest("#ms .rq[data-rid]"); if (r) { e.preventDefault(); window.replyJump(r.dataset.rid); }
  });

  // ---------- qoʻngʻiroqqa ruxsat: soʻrov kartasi, ruxsat berish/bekor qilish ----------
  st.cdis = st.cdis || (function () { try { return JSON.parse(localStorage.getItem("yq_cdis") || "{}"); } catch (_) { return {}; } })();
  window.callReqBubble = function (x) {
    const me = mine(x), t = tm(x.t), nm = esc(x.name || "");
    if (x.kind === "callok") return `<div class="m cb ${me ? "me" : ""}" data-mid="${x.id}"><span class="cb-i ok">${YI("phone", 18)}</span><span class="cb-t">Qoʻngʻiroqqa ruxsat berildi</span><small>${t}</small></div>`;
    if (me) return `<div class="m cb me" data-mid="${x.id}"><span class="cb-i">${YI("phone", 18)}</span><span class="cb-t">Qoʻngʻiroq uchun ruxsat soʻraldi</span><small>${t}</small></div>`;
    const ok = !!(st.myState && st.myState.allowCalls === true);
    const act = ok ? '<span class="cb-st">Ruxsat berilgan</span><button type="button" class="cb-b" onclick="callAllow(false)">Bekor qilish</button>'
      : st.cdis[x.id] ? '<span class="cb-st">Rad etildi</span>' : `<button type="button" class="cb-b y" onclick="callAllow(true)">Ruxsat berish</button><button type="button" class="cb-b" onclick="callDismiss('${x.id}')">Rad etish</button>`;
    return `<div class="m cb req" data-mid="${x.id}"><span class="cb-i">${YI("phone", 18)}</span><span class="cb-t">${nm || "Suhbatdosh"} qoʻngʻiroq qilishga ruxsat soʻramoqda</span><div class="cb-a">${act}</div><small>${t}</small></div>`;
  };
  window.callAllow = async function (v) {
    const ch = st.chat; if (!ch || ch.t !== "c") return;
    try {
      await FB.setCallAllow(ch.id, v);
      if (v) { FB.send("chats", ch.id, "Qoʻngʻiroqqa ruxsat berildi", st.user.name, "callok").catch(() => {}); toast("Qoʻngʻiroqqa ruxsat berildi"); }
      else toast("Ruxsat bekor qilindi");
    } catch (e) { uiAlert("Saqlab boʻlmadi: " + (e.message || e)); }
  };
  window.callDismiss = function (id) { st.cdis[id] = 1; try { localStorage.setItem("yq_cdis", JSON.stringify(st.cdis)); } catch (_) {} if (typeof chatMsgs === "function") chatMsgs(); };
  window.toggleCallAllow = function () { st.menu = false; window.callAllow(!(st.myState && st.myState.allowCalls === true)); if (typeof draw === "function") draw(); };

  // ---------- oldingi xabarlarni yuklash va yuklash xatosini koʻrsatish ----------
  window.olderBtn = () => st.chat && st.cm && st.cm.length >= (st.msgLimit || 120) ? '<button type="button" class="older" onclick="loadOlder()">⬆ Oldingi xabarlar</button>' : "";
  window.loadOlder = function () {
    const ch = st.chat; if (!ch) return;
    const m = q("ms"); if (m) st.keepScroll = { h: m.scrollHeight, t: m.scrollTop };
    st.msgLimit = (st.msgLimit || 120) + 120;
    try { if (typeof UM === "function") UM(); } catch (_) {}
    const colName = ch.t === "g" ? "groups" : "chats";
    UM = FB.msgs(colName, ch.id, list => { st.cm = list; chatMsgs(); if (ch.t === "c" && typeof seen === "function") seen(ch.id); });
  };
  let lastErr = "";
  window.msgsError = function (e) {
    const key = (st.chat ? st.chat.id : "") + ":" + (e && e.code);
    if (key === lastErr) return; lastErr = key;
    uiAlert("Xabarlarni yuklab boʻlmadi (" + ((e && e.code) || "xato") + "). " + (e && e.code === "permission-denied" ? "Firestore qoidalari yangilanmagan boʻlishi mumkin." : "Internetni tekshirib, sahifani yangilang."));
  };

  // ---------- oʻqildi va yozmoqda (1:1) ----------
  let sub = { id: null, unsub: null }, retryAt = 0, curChat = null, lastReadId = null, typingOn = false, lastTypingSent = 0, prevTyping = 0, typingUntil = 0, typingTimer = null;
  window.liveRender = function () {
    const m = q("ms"); if (!m) return;
    const old = q("typing"); if (old) old.remove();
    if (st.chat && st.chat.t === "c" && typingUntil > Date.now() && !(st.prefs && st.prefs.typ === false)) {
      const near = m.scrollHeight - m.scrollTop - m.clientHeight < 140;
      m.insertAdjacentHTML("beforeend", '<div class="m typing" id="typing" aria-label="Yozmoqda"><span></span><span></span><span></span></div>');
      if (near) m.scrollTop = m.scrollHeight;
    }
  };
  function watch(cid) {
    const c = (st.chats || []).find(x => x.id === cid), peer = c && (c.members || []).find(x => x !== st.user.uid);
    if (!peer) return false;
    const u2 = FB.stateWatch(cid, st.user.uid, s => {
      const was = st.myState && st.myState.allowCalls;
      st.myState = s || {};
      if (was !== st.myState.allowCalls && typeof chatMsgs === "function") chatMsgs();
    });
    const u1 = FB.stateWatch(cid, peer, s => {
      const old = st.peerState && st.peerState.readMsg;
      st.peerState = s || {};
      if (s && s.typing && s.typing !== prevTyping) typingUntil = Date.now() + 4500;
      if (!s || !s.typing) typingUntil = 0;
      prevTyping = (s && s.typing) || 0;
      clearTimeout(typingTimer); if (typingUntil > Date.now()) typingTimer = setTimeout(window.liveRender, 4600);
      if (st.peerState.readMsg !== old && typeof chatMsgs === "function") chatMsgs(); else window.liveRender();
    });
    sub.unsub = () => { try { u1(); } catch (_) {} try { u2(); } catch (_) {} };
    return true;
  }
  function loop() {
    if (!st || !st.user) return;
    const ch = st.chat, cid = ch ? ch.id : null;
    if (cid !== curChat) { curChat = cid; st.msgLimit = 120; if (st.replyTo && st.replyCid !== cid) { st.replyTo = null; } }
    const want = ch && ch.t === "c" ? ch.id : null;
    if (want !== sub.id) {
      if (sub.unsub) { try { sub.unsub(); } catch (_) {} }
      sub = { id: want, unsub: null }; st.peerState = null; st.myState = null; lastReadId = null; typingOn = false; lastTypingSent = 0; prevTyping = 0; typingUntil = 0;
      if (want && !watch(want)) sub.id = null;
    }
    if (!want) return;
    const list = st.cm || [], last = list[list.length - 1], mi = q("mi");
    if (last && last.from !== st.user.uid && last.id !== lastReadId && Date.now() >= retryAt && document.visibilityState === "visible" && !(st.prefs && st.prefs.rr === false)) {
      lastReadId = last.id; FB.markRead(want, last.id).catch(() => { lastReadId = null; retryAt = Date.now() + 30000; });
    }
    if (typingOn && (!mi || !mi.value.trim())) { typingOn = false; FB.setTyping(want, 0).catch(() => {}); }
  }
  document.addEventListener("input", e => {
    if (!e.target || e.target.id !== "mi" || !sub.id || (st.prefs && st.prefs.typ === false)) return;
    const v = e.target.value.trim(), now = Date.now();
    if (v) { if (now - lastTypingSent > 2500) { lastTypingSent = now; typingOn = true; FB.setTyping(sub.id, now).catch(() => {}); } }
    else if (typingOn) { typingOn = false; FB.setTyping(sub.id, 0).catch(() => {}); }
  });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") loop(); });
  window.addEventListener("pagehide", () => { if (typingOn && sub.id) { try { FB.setTyping(sub.id, 0); } catch (_) {} } });
  setInterval(loop, 700);

  // ---------- chat oynasiga "javob" paneli ----------
  const base = window.chatV;
  window.chatV = function () {
    let h = base();
    if (st.replyTo && st.chat && h.indexOf('<div class="send') >= 0) h = h.replace('<div class="send', barHtml() + '<div class="send');
    return h;
  };
  window.__chatLive = { loop, get sub() { return sub; } };
})();
