/* Yaqin: suhbatlarda stiker va rasm yuborish (1:1 va guruh). app.js dan keyin yuklanadi. */
(function () {
  "use strict";
  const PACKS = [
    ["🕘", "Soʻnggilar", null],
    ["😊", "Yuzlar", "😀 😁 😂 🤣 😊 😍 🥰 😘 😎 🤩 🥳 😇 🤗 🤭 😉 😌 😴 🥺 😢 😭 😡 🤯 😱 🙄 🤔 😏 😬 🫡 🤤 😋 🥹 🤝"],
    ["❤️", "Sevgi", "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💖 💗 💓 💞 💕 💘 💝 💍 💐 🌹 💌 💑 👩‍❤️‍👨 💏 😻 🫶 💋 🥂 🕊️ 🌸"],
    ["👍", "Qoʻllar", "👍 👎 👏 🙌 🤝 🙏 💪 👌 ✌️ 🤞 🤲 👋 🫶 🤌 ☝️ 👊 ✋ 🖐️ 🤙 🫵"],
    ["🎉", "Bayram", "🎉 🎊 🎁 🎂 🥂 🌙 ⭐ ✨ 🕌 📿 🍽️ ☕ 🍰 🍉 🎈 🪔 🏆 🔥 💯 🌟"],
    ["🏡", "Oila", "👨‍👩‍👧‍👦 👶 🏡 🧕 👳 👰 🤵 👪 🤰 🍼 🌿 🌷 🕋 🚗 ✈️ 🌍"]
  ];
  const RK = "yq_stk_recent";
  const esc2 = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const recents = () => { try { return JSON.parse(localStorage.getItem(RK) || "[]").slice(0, 16); } catch (_) { return []; } };
  const remember = e => { try { localStorage.setItem(RK, JSON.stringify([e, ...recents().filter(x => x !== e)].slice(0, 16))); } catch (_) {} };

  function panel() {
    const tab = Math.min(Number(st.stkTab) || 1, PACKS.length - 1);
    const list = tab === 0 ? recents() : PACKS[tab][2].split(" ");
    const tabs = PACKS.map((p, i) => `<button type="button" class="${i === tab ? "on" : ""}" title="${p[1]}" onclick="stkTab(${i})">${p[0]}</button>`).join("");
    const grid = list.length
      ? list.map(e => `<button type="button" data-s="${esc2(e)}" onclick="sendSticker(this.dataset.s)">${esc2(e)}</button>`).join("")
      : '<small class="stk-empty">Hali stikerlar ishlatilmagan</small>';
    return `<div class="stk-panel" id="stkPanel"><div class="stk-tabs">${tabs}</div><div class="stk-grid">${grid}</div></div>`;
  }

  window.stkTab = function (i) {
    st.stkTab = i;
    const p = $("stkPanel");
    if (p) p.outerHTML = panel();
  };
  window.toggleStk = function () {
    st.stk = !st.stk;
    const old = $("stkPanel");
    if (old) old.remove();
    if (!st.stk) return;
    const bar = document.querySelector(".ov .send");
    if (bar) bar.insertAdjacentHTML("beforebegin", panel());
    const m = $("ms");
    if (m) m.scrollTop = m.scrollHeight;
  };
  window.sendSticker = function (e) {
    const ch = st.chat;
    if (!ch || !e || ch.obs) return;
    remember(e);
    FB.send(ch.t === "g" ? "groups" : "chats", ch.id, e, st.user.name, "sticker", {}).catch(x => uiAlert("Stiker yuborilmadi: " + (x.message || x)));
  };
  window.uploadChatMedia = async function (input) {
    let file = input.files && input.files[0];
    input.value = "";
    const ch = st.chat;
    if (!file || !ch || ch.t === "g" || ch.obs) return;
    if (!/^image\//.test(file.type)) { uiAlert("Suhbatda hozircha faqat rasm yuborish mumkin."); return; }
    if (st.uploadingMedia) { uiAlert("Oldingi rasm hali yuklanmoqda. Biroz kuting."); return; }
    st.uploadingMedia = true;
    try {
      upStatus("Rasm tayyorlanmoqda…");
      file = await GM_COMPRESS(file);
      if (file.size > 8 * 1024 * 1024) throw new Error("Rasm 8 MB dan kichik boʻlishi kerak");
      upStatus("Rasm yuklanmoqda… 0%");
      await FB.uploadChatMedia(ch.id, file, p => upStatus("Rasm yuklanmoqda… " + Math.round(p * 100) + "%"));
    } catch (e) {
      uiAlert("Rasm yuborilmadi: " + (e.message || e));
    } finally {
      st.uploadingMedia = false;
      upStatus(null);
    }
  };

  const baseChatV = window.chatV;
  window.chatV = function () {
    let h = baseChatV();
    if (!st.chat || !st.user || h.indexOf('class="go" onclick="send()"') < 0) return h;
    if (st.stkChat !== st.chat.id) { st.stkChat = st.chat.id; st.stk = false; }
    const isG = st.chat.t === "g";
    const btns = `<button class="ghost stk-btn" type="button" title="Stiker" aria-label="Stiker" onclick="toggleStk()">😊</button>` +
      (isG ? "" : `<input id="cmfile" type="file" accept="image/*" hidden onchange="uploadChatMedia(this)"><button class="ghost media-attach" type="button" title="Rasm yuborish" aria-label="Rasm yuborish" onclick="$('cmfile').click()">${I("paperclip", 18)}</button>`);
    h = h.replace('<button class="go" onclick="send()">', btns + '<button class="go" onclick="send()">');
    if (st.stk) h = h.replace('<div class="send', panel() + '<div class="send');
    return h;
  };
})();
