const PLACES={};PL.forEach(([v,l])=>l.forEach(([n,a,b,f])=>PLACES[n]={vil:v,lat:a,lng:b,fb:f}));
const REG=[...PL.map(x=>x[0]),...Object.keys(PLACES)];
const ALL=[...PL.map(x=>({n:x[0],v:"Viloyat"})),...PL.flatMap(([v,l])=>l.map(x=>({n:x[0],v})))];
const pl=n=>PLACES[n]||PLACES[n+" tumani"]||PLACES[n+" shahri"]||PLACES[String(n).replace(/ sh\.$/," shahri")];
const nz=s=>String(s||"").toLowerCase().replace(/[ʻʼ'’`‘]/g,"");
const vilOf=a=>a.vil||(pl(a.reg)||{}).vil||"";
const hit=a=>{const q=nz(st.q).trim();return nz(a.reg).includes(q)||nz(vilOf(a)).includes(q)};
const PUR={oila:["Oila qurish uchun","Jiddiy niyat bilan, nikoh maqsadida","1 Roʻzgʻor uchun<br>(Jiddiy oila qurish)"],nikoh:["Nikoh uchun (maxfiy)","Shaxsiy hayot hurmat qilinadi, maxfiy tarzda","2 Roʻzgʻor uchun<br>(Yashirin nikoh)"],tanish:["Tanishuv uchun","Oʻzingizga mos juftni erkin izlash","Oddiy munosabat<br>(Mos juft izlash)"]};
const TPL={kelin:["👰","🧕","🌹","💐","🌸","🦋"],kuyov:["🤵","🧔","🦁","🦅","⚜️","🌙"]};
const S=(k,d)=>{try{return JSON.parse(localStorage[k])}catch(e){return d}};
const save=()=>{try{localStorage.yq=JSON.stringify({fav:st.fav,seen:st.seen})}catch(e){}};
const base=S("yq",{});
let st={user:null,am:"in",tab:"home",g:"kelin",mode:"self",pur:"oila",q:"",sort:"new",fav:base.fav||[],
 ads:[],raw:[],
 chats:[],groups:[],seen:base.seen||{},dis:{},cm:[],cph:[],priv:[],
 chat:null,menu:false,form:null,f:{}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const $=id=>document.getElementById(id);
const P={gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',heart:'<path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 21.6l8.8-8.6a5.2 5.2 0 0 0 0-7.4z"/>',users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2.2.7 3.5 2.6 3.5 5.7"/>',chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L3 20.5l1.5-4.9A8 8 0 1 1 21 12z"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',filter:'<path d="M3 4h18l-7 8.5V19l-4 2v-8.5z"/>',sort:'<path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/>',pin:'<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',back:'<path d="M19 12H5M12 19l-7-7 7-7"/>',dots:'<circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/>',send:'<path d="m22 2-11 11M22 2l-7 20-4-9-9-4z"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',img:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',ban:'<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',flag:'<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',cam:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',up:'<path d="M12 19V5M5 12l7-7 7 7"/>',plus:'<path d="M12 5v14M5 12h14"/>',map:'<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'};
const I=(n,z=18,f)=>`<svg viewBox="0 0 24 24" width="${z}" height="${z}" fill="${f?"currentColor":"none"}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;flex:none${f?";color:var(--r)":""}">${P[n]}</svg>`;

const av=a=>a.img?`<img src="${a.img}">`:a.ava;
function list(){let l=st.ads.filter(a=>a.g==st.g&&a.pur==st.pur&&(!st.q||hit(a)));
 if(st.f.min)l=l.filter(a=>a.age>=st.f.min);if(st.f.max)l=l.filter(a=>a.age<=st.f.max);
 l.sort((a,b)=>st.sort=="age"?a.age-b.age:(b.vip-a.vip)||b.t-a.t);return l}
function card(a){const f=st.fav.includes(a.id);return `<div class="card ${a.vip?"vip":""}"><div class="av">${av(a)}</div><div class="inf"><b>${esc(a.name)}, ${a.age}</b> ${a.vip?'<span class="tag vt">VIP</span>':""}<p>${I("pin",13)} ${esc(a.reg)} · <span class="tag">${PUR[a.pur][0]}</span></p><p>${esc(a.about)}</p><div class="acts"><button class="go" onclick="openAd('${a.id}')">Suhbat boshlash</button><button class="ghost" onclick="fav('${a.id}')">${f?I("heart",18,1):I("heart",18)}</button></div></div></div>`}
function home(){return `<div class="top"><span class="pill">Oʻz 🇺🇿</span><button class="ghost" style="width:46px;height:46px;flex:none" onclick="st.user?(st.form='logout'):(st.am='in',st.form='auth');draw()">${I(st.user?"logout":"user",20)}</button></div>
<div class="ban"><small>CHEKLANGAN TAKLIF</small><p style="margin-top:8px">Birinchi eʼlon <b>BEPUL</b> joylashtiriladi!</p></div>
<div class="logo">Yaq<span>in</span></div><p class="sub">Mos juftingizni ishonch bilan toping</p>
<div class="box"><div class="seg" style="margin-bottom:8px"><button class="${st.g=="kelin"?"on":""}" onclick="set('g','kelin')">Kelin nomzodlar</button><button class="${st.g=="kuyov"?"on":""}" onclick="set('g','kuyov')">Kuyov nomzodlar</button></div>
<div class="seg pur" style="margin-bottom:8px">${Object.keys(PUR).map(k=>`<button class="${st.pur==k?"on":""}" onclick="set('pur','${k}')">${PUR[k][2]}</button>`).join("")}</div>
<div class="row"><div class="sr" style="flex:1;position:relative">${I("search",18)}<input class="in" style="padding-left:42px" id="q" autocomplete="off" placeholder="Hudud yoki tuman.." value="${esc(st.q)}" oninput="sug(this.value)" onkeydown="if(event.key=='Enter')srch()"><div id="sg" class="sg"></div></div><button class="go" style="flex:none;padding:0 18px" onclick="srch()">Qidirish</button></div>
<div class="row"><button class="ghost" onclick="st.form='filter';draw()">${I("filter",16)} Filtrlar</button><button class="ghost" onclick="st.sort=st.sort=='new'?'age':'new';draw()">${I("sort",16)} Saralash: ${st.sort=="new"?"yangi":"yosh"}</button></div></div>
<h3>Yangi eʼlonlar</h3><div id="res">${list().map(card).join("")||'<div class="empty">Hozircha eʼlon yoʻq. Birinchi boʻling!</div>'}</div>`}
function res(){$("res").innerHTML=list().map(card).join("")||'<div class="empty">Hech narsa topilmadi</div>'}
function favs(){const l=st.ads.filter(a=>st.fav.includes(a.id));return `<h3>Sevimlilar</h3>`+(l.map(card).join("")||'<div class="empty">Sevimlilar roʻyxati boʻsh</div>')}
function prof(){const u=st.user,m=st.ads.filter(a=>a.mine);
 if(!u)return `<h3>Profil</h3><div class="box" style="text-align:center"><p class="sub">Eʼlon berish va suhbatlashish uchun kiring yoki roʻyxatdan oʻting</p><button class="go" style="width:100%" onclick="st.am='in';st.form='auth';draw()">Kirish / Roʻyxatdan oʻtish</button></div>`+price();
 const stat=(n,l)=>`<div class="price" style="text-align:center;margin:0"><b style="font-size:22px;color:var(--a)">${n}</b><p style="color:var(--m);font-size:12px">${l}</p></div>`;
 return `<h3>Profil</h3><div class="ban" style="text-align:left;display:flex;align-items:center;gap:10px"><div><small>CHEKLANGAN TAKLIF</small><p style="margin-top:8px">Birinchi eʼlon <b>BEPUL</b> joylashtiriladi!</p></div><span style="color:var(--a)">${I("gift",54)}</span></div>
<div class="box"><div style="display:flex;gap:14px;align-items:center"><div style="position:relative"><div class="av" style="width:84px;height:84px">${u.img?`<img src="${u.img}">`:I("user",40)}</div><button onclick="$('pf').click()" style="position:absolute;right:-4px;bottom:-4px;background:var(--a);color:#222;width:30px;height:30px;border-radius:50%;display:grid;place-items:center">${I("cam",16)}</button></div><div style="min-width:0"><b style="font-size:18px">${esc(u.name)}</b><p style="color:var(--m);font-size:13px;word-break:break-all">${esc(u.email)}</p></div></div><input type="file" id="pf" accept="image/*" hidden onchange="pfPhoto(this)">
<div class="row" style="margin-top:14px">${stat(m.length,"Faol eʼlonlarim")}${stat(m.length,"Jami eʼlonlarim")}${stat(st.fav.length,"Sevimlilar")}</div>
<div class="price" style="display:flex;gap:12px;align-items:center"><div style="background:var(--g);border-radius:14px;width:46px;height:46px;display:grid;place-items:center">${I("phone",22)}</div><div style="flex:1"><p style="color:var(--m);font-size:12px">Telefon raqami</p><b>${esc(u.phone||"Kiritilmagan")}</b></div><button class="ghost" onclick="editPh()">Tahrirlash</button></div></div>`+privV()+price()+`<h3>Mening eʼlonlarim</h3>`+(m.map(a=>card(a).replace('</div></div></div>',`</div><button class="ghost" style="margin-top:6px" onclick="raise('${a.id}')">${I("up",14)} Yuqoriga koʻtarish — 10 000 soʻm</button><button class="ghost" style="margin-top:6px;color:#e5554a" onclick="delAd('${a.id}')">${I("x",14)} Oʻchirish</button></div></div>`)).join("")||'<div class="empty">Sizda hali eʼlon yoʻq</div>')+`<button class="ghost" style="width:100%;margin-top:16px;color:#e5554a" onclick="st.form='logout';draw()">${I("logout",16)} Tizimdan chiqish</button>`}
function price(){return `<div class="price"><b>Narxlar</b><p style="color:var(--m);margin-top:6px">1-eʼlon: <b style="color:var(--a)">BEPUL</b><br>Keyingi eʼlonlar: 10 000 soʻm<br>VIP TOP eʼlon: 20 000 soʻm<br>Eski eʼlonni yuqoriga koʻtarish: 10 000 soʻm</p></div>`}
function need(){if(st.user)return true;st.am="in";st.form="auth";draw();return false}
function postBtn(){if(need()){st.form="post";draw()}}

async function editPh(){const v=await uiPrompt("Telefon raqami","+998 90 123 45 67",st.user.phone||"");if(v===null)return;const f=fb();if(!f)return;try{await f.saveUser({phone:v.trim()});st.user.phone=v.trim();draw()}catch(x){uiAlert(x.message)}}
function pfPhoto(i){const f=i.files[0];if(!f||!fb())return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=async()=>{const c=document.createElement("canvas");c.width=c.height=256;c.getContext("2d").drawImage(im,0,0,256,256);try{st.user.img=await FB.photo(c.toDataURL("image/jpeg",.8));draw()}catch(x){uiAlert("Rasm yuklanmadi: "+x.message)}};im.src=r.result};r.readAsDataURL(f)}
const fb=()=>window.FB||(uiAlert("Firebase sozlanmagan: js/firebase-config.js faylini toʻldiring"),null);
const ERR={"auth/email-already-in-use":"Bu email allaqachon roʻyxatdan oʻtgan","auth/invalid-credential":"Email yoki parol notoʻgʻri","auth/wrong-password":"Parol notoʻgʻri","auth/user-not-found":"Bunday foydalanuvchi topilmadi","auth/weak-password":"Parol kamida 6 belgidan iborat boʻlsin","auth/network-request-failed":"Internet aloqasi yoʻq","auth/too-many-requests":"Juda koʻp urinish. Birozdan soʻng qayta urining","auth/popup-closed-by-user":""};
const em=e=>ERR[e.code]??("Xatolik: "+(e.code||e.message));
function done(u){st.user=u;syncAds();st.form=null;draw()}
async function authGo(){const f=fb();if(!f)return;const e=$("ae").value.trim(),p=$("ap").value;
 if(!/^\S+@\S+\.\S+$/.test(e)||p.length<6){uiAlert("Email va kamida 6 belgili parol kiriting");return}
 try{if(st.am=="up"){const n=$("an").value.trim();if(!n){uiAlert("Ismingizni kiriting");return}done(await f.signUp(e,p,n,$("aph").value.trim()))}else done(await f.signIn(e,p))}catch(x){const m=em(x);if(m)uiAlert(m)}}
async function gAuth(){const f=fb();if(!f)return;try{done(await f.google())}catch(x){const m=em(x);if(m)uiAlert(m)}}
async function forgot(){const e=$("ae").value.trim();if(!e){uiAlert("Avval emailni kiriting");return}const f=fb();if(!f)return;try{await f.reset(e);uiAlert("Parolni tiklash havolasi emailingizga yuborildi")}catch(x){uiAlert(em(x))}}
async function delAd(id){if(!await uiConfirm("Eʼlon oʻchirilsinmi? Bu amalni qaytarib boʻlmaydi.","Oʻchirish",true))return;const f=fb();if(f)try{await f.delAd(id)}catch(x){uiAlert(x.message)}}
function authV(){const up=st.am=="up";return `<div class="ov" style="overflow:auto"><div class="w" style="width:100%"><div style="text-align:right"><button class="ghost" style="display:inline-flex;width:44px;height:44px;border-radius:50%" onclick="st.form=null;draw()">${I("x",20)}</button></div><div class="logo">Yaq<span>in</span></div><p class="sub">Mos juftingizni ishonch bilan toping</p>
<div class="box"><button class="ghost" style="width:100%" onclick="gAuth()"><b style="color:#4285f4;font-size:19px">G</b> Google orqali davom etish</button><p class="sub" style="margin:12px 0 6px;font-size:12px">YOKI</p>
<div class="seg"><button class="${up?"":"on"}" onclick="st.am='in';draw()">Kirish</button><button class="${up?"on":""}" onclick="st.am='up';draw()">Roʻyxatdan oʻtish</button></div>
${up?`<label>ISM</label><input class="in" id="an" autocomplete="name"><label>TELEFON</label><input class="in" id="aph" type="tel" placeholder="+998">`:""}
<label>EMAIL</label><input class="in" id="ae" type="email" autocomplete="email"><label>PAROL</label><div class="sr"><input class="in" id="ap" type="password" autocomplete="${up?"new-password":"current-password"}"><span style="position:absolute;right:14px;top:50%;margin-top:-10px;color:var(--m)" onclick="const i=$('ap');i.type=i.type=='password'?'text':'password'">${I("eye",20)}</span></div>
${up?"":`<div style="text-align:right;margin-top:10px"><button class="ghost" style="display:inline-flex" onclick="forgot()">Parolni unutdingizmi?</button></div>`}
<button class="go" style="width:100%;margin-top:16px" onclick="authGo()">${up?"Roʻyxatdan oʻtish":"Kirish"}</button></div></div></div>`}
function outV(){return `<div class="ov" style="background:#000b;justify-content:flex-end"><div style="background:var(--c);border-radius:26px 26px 0 0;padding:22px 20px calc(22px + env(safe-area-inset-bottom))"><h3 style="margin:0 0 6px">Tizimdan chiqish</h3><p style="color:var(--m)">Rostdan ham profildan chiqishni istaysizmi?</p><div class="row" style="margin-top:16px"><button class="ghost" onclick="st.form=null;draw()">Yoʻq</button><button class="go" style="background:#e5554a;color:#fff" onclick="FB.out();st.form=null;st.tab='home';draw()">Ha, chiqish</button></div></div></div>`}
function fav(id){const i=st.fav.indexOf(id);i<0?st.fav.push(id):st.fav.splice(i,1);save();draw()}
async function raise(id){if(!CFG.TEST_MODE){uiAlert("Toʻlov tizimi hali ulanmagan");return}if(!await uiConfirm("Sinov rejimi: toʻlov olinmaydi. Eʼlon yuqoriga koʻtarilsinmi?","Koʻtarish"))return;const f=fb();if(f)try{await f.upAd(id,{t:Date.now()})}catch(x){uiAlert(x.message)}}
function set(k,v){st[k]=v;draw()}
function formV(){if(st.form=="auth")return authV();if(st.form=="logout")return outV();if(st.form=="filter")return `<div class="ov"><div class="hd"><button onclick="st.form=null;draw()">${I("back",22)}</button><b>Filtrlar</b></div><div class="sheet"><label>Yosh (dan)</label><input class="in" id="fa" type="number" value="${st.f.min||""}"><label>Yosh (gacha)</label><input class="in" id="fb" type="number" value="${st.f.max||""}"><button class="go" style="width:100%;margin-top:16px" onclick="st.f={min:+$('fa').value||0,max:+$('fb').value||0};st.form=null;draw()">Qoʻllash</button></div></div>`;
 const p=st.p=st.p||{g:"kelin",pur:"oila",mode:"self",ava:"👰",vip:false};const n=S("yq",{}).x;const free=!st.ads.some(a=>a.mine);const cost=(free?0:10000)+(p.vip?20000:0);
 return `<div class="ov"><div class="hd"><button onclick="st.form=null;draw()">${I("back",22)}</button><b>Eʼlon berish</b></div><div class="sheet">
<label>Kim uchun eʼlon?</label><div class="seg"><button class="${p.g=="kelin"?"on":""}" onclick="pf('g','kelin');p.ava=TPL.kelin[0]">Kelin nomzod</button><button class="${p.g=="kuyov"?"on":""}" onclick="pf('g','kuyov');p.ava=TPL.kuyov[0]">Kuyov nomzod</button></div>
<label>Maqsad</label><div class="chips">${Object.keys(PUR).map(k=>`<button class="chip ${p.pur==k?"on":""}" onclick="pf('pur','${k}')"><b>${PUR[k][0]}</b></button>`).join("")}</div>
<label>Avatar (hamma koʻradi) — shablon tanlang yoki galereyadan yuklang</label><div class="tpl">${TPL[p.g].map(e=>`<button class="${p.ava==e&&!p.img?"on":""}" onclick="pf('ava','${e}');p.img=null">${e}</button>`).join("")}<button onclick="$('file').click()">${I('img',22)}</button></div><input type="file" id="file" accept="image/*" hidden onchange="pick(this)">
<label>Ism</label><input class="in" id="fn" value="${esc(p.name||"")}"><label>Yosh</label><input class="in" id="fy" type="number" value="${p.age||""}">
<label>Hudud</label><select class="in" id="fr">${PL.map(([v,l])=>`<optgroup label="${v}">${l.map(x=>`<option ${p.reg==x[0]?"selected":""}>${x[0]}</option>`).join("")}</optgroup>`).join("")}</select>
<label>Oʻzingiz haqingizda</label><textarea class="in" id="fo" rows="3">${esc(p.about||"")}</textarea>
<label>Shaxsiy rasmlar yopiq turadi — suhbatda faqat siz ruxsat bersangiz koʻrinadi.</label>
<div class="price"><label style="margin:0"><input type="checkbox" ${p.vip?"checked":""} onchange="pf('vip',this.checked)"> VIP TOP eʼlon (+20 000 soʻm)</label><p style="margin-top:8px">Jami: <b style="color:var(--a)">${cost?cost.toLocaleString("ru")+" soʻm":"BEPUL"}</b></p></div>
<button class="go" style="width:100%;margin-top:14px" onclick="pub(${cost})">Joylashtirish</button></div></div>`}
function pf(k,v){keep();st.p[k]=v;draw()}
function keep(){const p=st.p;if(!$("fn"))return;p.name=$("fn").value;p.age=+$("fy").value;p.reg=$("fr").value;p.about=$("fo").value}
function pick(i){const f=i.files[0];if(!f)return;keep();const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement("canvas");c.width=c.height=320;c.getContext("2d").drawImage(im,0,0,160,160);st.p.img=c.toDataURL("image/jpeg",.7);draw()};im.src=r.result};r.readAsDataURL(f)}
async function pub(cost){keep();const p=st.p;if(!p.name||!p.age||p.age<18){uiAlert("Ism va yosh (18+) kiriting");return}
 if(cost&&!CFG.TEST_MODE){uiAlert("Toʻlov tizimi hali ulanmagan");return}
 if(cost&&!await uiConfirm("Sinov rejimi: "+cost.toLocaleString("ru")+" soʻm toʻlov olinmaydi. Davom etamizmi?","Davom etish"))return;
 const f=fb();if(!f)return;
 try{await f.addAd({name:p.name,age:p.age,reg:p.reg||"Andijon shahri",vil:(pl(p.reg||"Andijon shahri")||{}).vil||"",g:p.g,pur:p.pur,about:p.about||"",ava:p.ava,img:p.img||"",vip:!!p.vip});st.p=null;st.form=null;st.tab="home";draw()}catch(x){uiAlert("Eʼlon joylashmadi: "+x.message)}}
function draw(){const a=document.activeElement&&document.activeElement.id,mv=$("mi")?$("mi").value:null;
 const v={home,fav:favs,circ:groupsV,msg:msgs,prof,map:mapV}[st.tab]();
 $("app").innerHTML=v;
 const ov=st.form?formV():st.chat?chatV():"";if(ov)$("app").insertAdjacentHTML("beforeend",ov);
 const N=[["home",I("home",24),"Bosh"],["fav",I("heart",24),"Sevimli"],["circ",I("users",24),"Guruhlar"],["+","+",""],["map",I("map",24),"Xarita"],["msg",I("chat",24),"Xabarlar"],["prof",I("user",24),"Profil"]];
 $("nav").innerHTML=N.map(n=>n[0]=="+"?`<button class="plus" onclick="postBtn()">${I('plus',30)}</button>`:`<button class="${st.tab==n[0]?"on":""}" onclick="st.tab='${n[0]}';st.chat=null;st.form=null;draw()"><i>${n[1]}</i>${n[2]}</button>`).join("");
 const m=$("ms");if(m)m.scrollTop=m.scrollHeight;if(a==="q"&&$("q")){$("q").focus()}
 if(mv!=null&&$("mi"))$("mi").value=mv;if(st.tab=="map")initMap()}
function syncAds(){st.ads=st.raw.map(a=>({...a,mine:!!st.user&&a.uid==st.user.uid}))}
let UC,UG,UM,UP;
function stopAll(){[UC,UG].forEach(f=>f&&f());UC=UG=null;closeCh();st.chats=[];st.groups=[];st.priv=[]}
addEventListener("fb-ready",()=>{FB.onUser(u=>{const was=st.user&&st.user.uid;st.user=u;if(!u&&st.form=="logout")st.form=null;if(u&&st.form=="auth")st.form=null;syncAds();
 if(!u){stopAll();st.chat=null}else if(was!=u.uid){stopAll();UC=FB.chats(u.uid,l=>{st.chats=l.sort((a,b)=>b.lastT-a.lastT);syncShared();if(st.chat&&st.chat.t=="c")draw();else if(st.tab=="msg"&&!st.form)draw()});UG=FB.groups(l=>{st.groups=l;if(st.tab=="circ"&&!st.form&&!st.chat)draw()});FB.priv().then(x=>{st.priv=x;if(st.tab=="prof"&&!st.form)draw()}).catch(()=>{})}
 draw()});FB.ads(l=>{st.raw=l;syncAds();if(!st.form&&!st.chat)draw()})});

st.dr={on:false,pts:[]};let MAP,DL;
function purSeg(){return `<div class="seg pur" style="margin-bottom:8px">${Object.keys(PUR).map(k=>`<button class="${st.pur==k?"on":""}" onclick="set('pur','${k}')">${PUR[k][2]}</button>`).join("")}</div>`}
function mapV(){return `<h3 style="margin:8px 0">Xarita</h3><div class="seg" style="margin-bottom:8px"><button class="${st.g=="kelin"?"on":""}" onclick="set('g','kelin')">Kelin nomzodlar</button><button class="${st.g=="kuyov"?"on":""}" onclick="set('g','kuyov')">Kuyov nomzodlar</button></div>${purSeg()}
<div class="row"><button class="ghost" onclick="st.dr.on=!st.dr.on;draw()">${I("pin",16)} ${st.dr.on?"Chizish yoqilgan: xaritaga bosing":"Hududni chizish"}</button><button class="ghost" onclick="st.dr={on:false,pts:[]};draw()">${I("x",16)} Tozalash</button></div>
<div id="map"></div><p class="sub" style="font-size:12px;margin:0 0 8px">Nomzodlar aniq manzilsiz, faqat hudud boʻyicha koʻrsatiladi</p><div id="mres"></div>`}
function inPoly(pt,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const[a,b]=P[i],[x,y]=P[j];if((a>pt[0])!=(x>pt[0])&&pt[1]<(y-b)*(pt[0]-a)/(x-a)+b)c=!c}return c}
function showPlace(n){const l=list().filter(a=>{const p=pl(a.reg);return p&&p.lat+","+p.lng==n});$("mres").innerHTML=`<h3>${esc([...new Set(l.map(a=>a.reg))].join(", "))}</h3>`+(l.map(card).join("")||'<div class="empty">Nomzod yoʻq</div>')}
function polyRes(){const P=st.dr.pts;if(P.length<3){$("mres").innerHTML="";return}const l=list().filter(a=>pl(a.reg)&&inPoly([pl(a.reg).lat,pl(a.reg).lng],P));$("mres").innerHTML=`<h3>Belgilangan hududda: ${l.length} ta nomzod</h3>`+(l.map(card).join("")||'<div class="empty">Bu hududda nomzod yoʻq</div>')}
function initMap(){const el=$("map");if(!el||!window.L){if(el)el.innerHTML='<div class="empty">Xarita yuklanmadi (internetni tekshiring)</div>';return}
 if(MAP){MAP.remove();MAP=null}
 const m=MAP=L.map(el).setView(st.mv||[41.3,64.6],st.mz||5);
 L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{maxZoom:18,attribution:"© OpenStreetMap © CARTO"}).addTo(m);
 const g={};list().forEach(a=>{const p=pl(a.reg);if(p)(g[p.lat+","+p.lng]=g[p.lat+","+p.lng]||[]).push(a)});
 Object.entries(g).forEach(([n,l])=>{const p=n.split(",").map(Number);L.marker(p,{icon:L.divIcon({className:"",html:`<div class="mk">${l.length}</div>`,iconSize:[36,36]})}).addTo(m).on("click",()=>{if(!st.dr.on)showPlace(n)})});
 const P=st.dr.pts;if(P.length)DL=(P.length>2?L.polygon(P,{color:"#f0b34a",fillOpacity:.2}):L.polyline(P,{color:"#f0b34a"})).addTo(m);
 polyRes();
 m.on("click",e=>{if(!st.dr.on)return;st.dr.pts.push([e.latlng.lat,e.latlng.lng]);if(DL)m.removeLayer(DL);DL=(st.dr.pts.length>2?L.polygon(st.dr.pts,{color:"#f0b34a",fillOpacity:.2}):L.polyline(st.dr.pts,{color:"#f0b34a"})).addTo(m);polyRes()});
 m.on("moveend",()=>{st.mv=[m.getCenter().lat,m.getCenter().lng];st.mz=m.getZoom()})}

function modal(o){return new Promise(res=>{const d=document.createElement("div");d.className="md";
 d.innerHTML=`<div class="mb"><h3>${esc(o.title||"")}</h3><p>${esc(o.msg||"")}</p>${o.input?`<input class="in" value="${esc(o.val||"")}" placeholder="${esc(o.ph||"")}">`:""}<div class="row">${o.cancel?`<button class="ghost">${o.cancel}</button>`:""}<button class="go${o.danger?" dg":""}">${o.ok||"OK"}</button></div></div>`;
 document.body.appendChild(d);const bs=d.querySelectorAll("button"),inp=d.querySelector("input"),done=v=>{d.remove();res(v)},no=()=>done(o.input?null:false);
 bs[bs.length-1].onclick=()=>done(o.input?inp.value:true);if(o.cancel)bs[0].onclick=no;
 d.onclick=e=>{if(e.target==d&&o.cancel)no()};if(inp){inp.focus();inp.onkeydown=e=>{if(e.key=="Enter")bs[bs.length-1].click()}}})}
const uiAlert=(msg,title)=>modal({msg:String(msg),title:title||(/yuborildi|koʻtarildi/i.test(msg)?"Tayyor":"Diqqat")});
const uiConfirm=(msg,ok,danger)=>modal({msg,title:"Tasdiqlang",ok:ok||"Ha",cancel:"Bekor qilish",danger});
const uiPrompt=(title,ph,val)=>modal({title,ph,val,input:1,ok:"Saqlash",cancel:"Bekor qilish"});

function sug(v){st.q=v;res();const q=nz(v).trim(),b=$("sg");if(!q){b.innerHTML="";return}
 const s=ALL.filter(p=>nz(p.n).includes(q)).sort((x,y)=>(nz(y.n).startsWith(q)-nz(x.n).startsWith(q))||(nz(y.n).split(" ").some(w=>w.startsWith(q))-nz(x.n).split(" ").some(w=>w.startsWith(q)))).slice(0,8);
 window.SG=s;b.innerHTML=s.map((p,i)=>`<button onclick="pickSug(${i})">${I("pin",14)}<b>${esc(p.n)}</b><small>${esc(p.v)}</small></button>`).join("")}
function pickSug(i){const p=window.SG[i];st.q=p.n;$("q").value=p.n;$("sg").innerHTML="";res()}
function srch(){$("sg").innerHTML="";$("q").blur();res();$("res").scrollIntoView({behavior:"smooth"})}

const tm=t=>{try{return new Date(t).toLocaleTimeString("uz",{hour:"2-digit",minute:"2-digit"})}catch(e){return""}};
const ava=(img,emo)=>img?`<img src="${img}">`:(emo||I("user",24));
function needLogin(t){return `<h3>${t}</h3><div class="box" style="text-align:center"><p class="sub">Davom etish uchun kiring yoki roʻyxatdan oʻting</p><button class="go" style="width:100%" onclick="st.am='in';st.form='auth';draw()">Kirish / Roʻyxatdan oʻtish</button></div>`}
function ctitle(c){const own=c.owner==st.user.uid;return own?c.askerName:c.ownerName}
function msgs(){if(!st.user)return needLogin("Xabarlar");return `<h3>Xabarlar</h3>`+(st.chats.map(c=>{const own=c.owner==st.user.uid,un=c.lastBy&&c.lastBy!=st.user.uid&&c.lastT>(st.seen[c.id]||0);return `<div class="card" onclick="openC('${c.id}')"><div class="av">${own?ava(c.askerImg):ava(c.ownerImg,c.ownerAva)}</div><div class="inf"><b>${esc(ctitle(c))}</b>${own?'<span class="tag">Eʼloningizga</span>':""}<p>${esc(c.last||"Suhbat boshlandi")}</p></div>${un?'<span class="dot"></span>':""}</div>`}).join("")||'<div class="empty">Hozircha suhbat yoʻq. Nomzod eʼlonidan "Suhbat boshlash" ni bosing.</div>')}
function groupsV(){if(!st.user)return needLogin("Guruhlar");const mine=st.user.groups||[];return `<h3>Guruhlar</h3><p class="sub" style="text-align:left">Oʻz guruhingizni oching, muxlislaringizni bir joyga yigʻing va guruh chatida suhbatlashing.</p><button class="go" style="width:100%;margin-bottom:10px" onclick="newGroup()">${I("plus",16)} Yangi guruh ochish</button>`+(st.groups.map(g=>`<div class="card"><div class="av">${esc(g.ava||"👥")}</div><div class="inf"><b>${esc(g.name)}</b><p>${I("users",14)} ${g.n||1} aʼzo</p><div class="acts"><button class="go" onclick="${mine.includes(g.id)?`openG('${g.id}')`:`joinG('${g.id}')`}">${mine.includes(g.id)?"Chatga kirish":"Qoʻshilish"}</button></div></div></div>`).join("")||'<div class="empty">Hozircha guruh yoʻq. Birinchi boʻlib oching!</div>')}
function closeCh(){[UM,UP].forEach(f=>f&&f());UM=UP=null}
function syncShared(){const ch=st.chat;if(!ch||ch.t!="c")return;const c=st.chats.find(x=>x.id==ch.id);if(!c||c.asker!=st.user.uid)return;if(c.photoOk&&!UP)UP=FB.shared(ch.id,p=>{st.cph=p;draw()});if(!c.photoOk&&UP){UP();UP=null;st.cph=[]}}
function chatMsgs(){const m=$("ms");if(!m)return;const g=st.chat.t=="g";m.innerHTML=st.cm.map(x=>`<div class="m ${x.from==st.user.uid?"me":""}">${g&&x.from!=st.user.uid?`<b>${esc(x.name||"")}</b>`:""}${esc(x.text)}<small>${tm(x.t)}</small></div>`).join("");m.scrollTop=m.scrollHeight}
function seen(id){st.seen[id]=Date.now();save()}
async function openAd(id){if(!need())return;const a=st.ads.find(x=>x.id==id);if(!a)return;if(a.uid==st.user.uid){uiAlert("Bu sizning oʻz eʼloningiz");return}const f=fb();if(!f)return;try{openC(await f.openChat(a,st.user))}catch(x){uiAlert("Suhbat ochilmadi: "+x.message)}}
function openC(id){closeCh();st.chat={t:"c",id};st.menu=false;st.cm=[];st.cph=[];seen(id);UM=FB.msgs("chats",id,m=>{st.cm=m;chatMsgs();seen(id)});syncShared();draw()}
function openG(id){closeCh();st.chat={t:"g",id};st.menu=false;st.cm=[];UM=FB.msgs("groups",id,m=>{st.cm=m;chatMsgs()});draw()}
function closeChat(){closeCh();st.chat=null;draw()}
async function joinG(id){if(!need())return;const f=fb();if(!f)return;try{await f.joinGroup(id,st.user.name);st.user.groups=[...(st.user.groups||[]),id];openG(id)}catch(x){uiAlert("Qoʻshilib boʻlmadi: "+x.message)}}
async function newGroup(){if(!need())return;const n=await uiPrompt("Yangi guruh nomi","Masalan: Andijon nomzodlari");if(!n||!n.trim())return;const f=fb();if(!f)return;try{const id=await f.newGroup(n.trim().slice(0,40),["⭐","🌙","💍","🌹","🕊️","💫"][Math.floor(Math.random()*6)],st.user.name);st.user.groups=[...(st.user.groups||[]),id];openG(id)}catch(x){uiAlert("Guruh ochilmadi: "+x.message)}}
async function leaveG(){const id=st.chat.id;if(!await uiConfirm("Guruhdan chiqasizmi?","Chiqish",true))return;try{await FB.leaveGroup(id);st.user.groups=(st.user.groups||[]).filter(x=>x!=id);closeChat()}catch(x){uiAlert(x.message)}}
async function grant(on){const id=st.chat.id;st.menu=false;try{const ok=await FB.grant(id,on);if(!ok)uiAlert("Avval Profil bolimida shaxsiy rasmlaringizni yuklang (3 tagacha).","Rasm yoʻq");draw()}catch(x){uiAlert("Amal bajarilmadi: "+x.message)}}
async function report(){st.menu=false;draw();if(!await uiConfirm("Bu suhbat haqida shikoyat yuborilsinmi?","Yuborish"))return;try{await FB.report(st.chat.id);uiAlert("Shikoyatingiz yuborildi")}catch(x){uiAlert(x.message)}}
function zoom(s){const d=document.createElement("div");d.className="md";d.innerHTML=`<img src="${s}" style="max-width:100%;max-height:80vh;border-radius:16px">`;d.onclick=()=>d.remove();document.body.appendChild(d)}
function chatV(){const ch=st.chat,g=ch.t=="g",c=g?st.groups.find(x=>x.id==ch.id):st.chats.find(x=>x.id==ch.id);
 if(!c)return `<div class="ov"><div class="hd"><button onclick="closeChat()">${I("back",22)}</button><b>Yuklanmoqda...</b></div></div>`;
 const me=st.user.uid,own=!g&&c.owner==me,asker=!g&&!own;
 const title=g?c.name:(own?c.askerName:c.ownerName),av=g?esc(c.ava||"👥"):(own?ava(c.askerImg):ava(c.ownerImg,c.ownerAva));
 let menu="";if(st.menu)menu=`<div class="menu">${own?(c.photoOk?`<button onclick="grant(false)">${I("lock",16)} Ruxsatni bekor qilish</button>`:`<button onclick="grant(true)">${I("img",16)} Shaxsiy rasmlarga ruxsat berish</button>`):""}${g?(c.owner!=me?`<button onclick="leaveG()">${I("logout",16)} Guruhdan chiqish</button>`:""):`<button onclick="report()">${I("flag",16)} Shikoyat</button>`}</div>`;
 const ban=own&&!c.photoOk&&!st.dis[c.id]&&st.cm.some(x=>x.from!=me)?`<div class="cons"><button class="x" onclick="st.dis['${c.id}']=1;draw()">${I("x",18)}</button><b>Shaxsiy rasmlaringizni koʻrsatishga ruxsat berasizmi?</b><p style="color:var(--m);margin:4px 0 8px">Rasmlar faqat shu suhbatdosh uchun ochiladi. Istalgan payt bekor qilishingiz mumkin.</p><button class="go" onclick="grant(true)">Ruxsat berish</button></div>`:"";
 const ph=asker?(c.photoOk?`<div class="ph">${st.cph.map((x,i)=>`<img src="${x}" onclick="zoom('${x}')">`).join("")||'<small style="color:var(--m)">Yuklanmoqda...</small>'}</div>`:`<div class="ph"><div class="lock">${I("lock",22)}</div><div class="lock">${I("lock",22)}</div><small style="color:var(--m);align-self:center">Shaxsiy rasmlar yopiq. Egasi ruxsat bersa ochiladi.</small></div>`):(own&&c.photoOk?`<div class="ph"><small style="color:var(--a)">${I("img",14)} Shaxsiy rasmlaringiz bu suhbatdoshga ochiq</small></div>`:"");
 return `<div class="ov"><div class="hd"><button onclick="closeChat()">${I("back",22)}</button><div class="av">${av}</div><b>${esc(title)}</b><button onclick="st.menu=!st.menu;draw()">${I("dots",20)}</button>${menu}</div>${ban}${ph}<div class="msgs" id="ms"></div><div class="send"><input class="in" id="mi" maxlength="1000" placeholder="Xabar yozing.." autocomplete="off" onkeydown="if(event.key=='Enter')send()"><button class="go" onclick="send()">${I("send",18)}</button></div></div>`}
async function send(){const i=$("mi"),v=i.value.trim();if(!v)return;i.value="";const ch=st.chat;try{await FB.send(ch.t=="g"?"groups":"chats",ch.id,v,st.user.name)}catch(x){i.value=v;uiAlert("Xabar yuborilmadi: "+x.message)}}
function privV(){if(!st.user)return"";return `<h3>Shaxsiy rasmlarim</h3><p class="sub" style="text-align:left;font-size:12px;margin:0 0 8px">Faqat siz ruxsat bergan suhbatdoshga koʻrinadi (3 tagacha).</p><div class="ph" style="padding:0">${st.priv.map((x,i)=>`<div style="position:relative"><img src="${x}"><button onclick="delPriv(${i})" style="position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;background:#e5554a;color:#fff;display:grid;place-items:center">${I("x",12)}</button></div>`).join("")}${st.priv.length<3?`<div onclick="$('pp').click()">${I("plus",24)}</div>`:""}</div><input type="file" id="pp" accept="image/*" hidden onchange="addPriv(this)">`}
function addPriv(i){const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=async()=>{const c=document.createElement("canvas"),k=Math.min(1,480/Math.max(im.width,im.height));c.width=im.width*k;c.height=im.height*k;c.getContext("2d").drawImage(im,0,0,c.width,c.height);const n=[...st.priv,c.toDataURL("image/jpeg",.7)];try{await FB.setPriv(n);st.priv=n;draw()}catch(x){uiAlert("Rasm saqlanmadi: "+x.message)}};im.src=r.result};r.readAsDataURL(f)}
async function delPriv(i){const n=st.priv.filter((_,j)=>j!=i);try{await FB.setPriv(n);st.priv=n;draw()}catch(x){uiAlert(x.message)}}
draw();
