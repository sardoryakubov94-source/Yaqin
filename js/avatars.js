/* Yaqin — mahalliy (offline) multfilm uslubidagi professional avatarlar. Tashqi servis kerak emas. */
(function(){
const M=[
{skin:"#efc3a0",hair:"#1d1613",style:"short",out:"suit",c:"#1e2a4a",c2:"#e8c15a",bg:["#6ea8ff","#27407a"]},
{skin:"#e6b48e",hair:"#17120f",style:"quiff",out:"tux",c:"#15151a",c2:"#b3203a",bg:["#9aa7c4","#3a4262"]},
{skin:"#e9b992",hair:"#1d1613",style:"short",out:"suit",c:"#2c3f33",c2:"#d9b45a",acc:["doppi"],bg:["#6fd0b0","#1f5f55"]},
{skin:"#dba67f",hair:"#241a14",style:"quiff",out:"hoodie",c:"#22252d",acc:[],bg:["#8f86e8","#41357f"]},
{skin:"#efc3a0",hair:"#1b1411",style:"quiff",out:"tee",c:"#15161b",acc:["sun"],bg:["#f2b36b","#a24f2c"]},
{skin:"#e2ae88",hair:"#1d1613",style:"short",out:"blazer",c:"#1c2233",acc:["cap"],capc:"#16171c",bg:["#7b8aa8","#2a3248"]},
{skin:"#d49d76",hair:"#14100d",style:"short",out:"shirt",c:"#f4f4f6",acc:["beard"],bg:["#e08aa5","#7a3350"]},
{skin:"#f1c9a8",hair:"#3a2a1f",style:"side",out:"blazer",c:"#c9a982",c2:"#fff",bg:["#6dc9d8","#1f5870"]},
{skin:"#e8b890",hair:"#1d1613",style:"side",out:"sweater",c:"#6a4a7a",acc:["glasses"],bg:["#b08cf0","#4a2f8a"]}];
const F=[
{skin:"#f3cfb2",hair:"#2a1a15",style:"long",out:"gown",c:"#fbf7ee",acc:["veil","tiara","pearl"],blush:1,bg:["#ff9ab8","#8a3d78"]},
{skin:"#f0c8a8",hair:"#2a1a15",style:"hijab",hc:"#fbf7ee",out:"gown",c:"#fbf7ee",acc:["pearl"],blush:1,bg:["#f5c8d8","#a85a86"]},
{skin:"#ebbd9a",hair:"#1f130f",style:"long",out:"dress",c:"#d84a74",acc:["earring","flowers"],blush:1,bg:["#9a86e8","#46308a"]},
{skin:"#f0c5a4",hair:"#1f130f",style:"bun",out:"turtle",c:"#171519",acc:["earring"],blush:1,bg:["#e08aa0","#7a3348"]},
{skin:"#efc8a8",hair:"#1b1210",style:"hijab",hc:"#19191e",out:"blazer",c:"#19191e",acc:[],blush:1,bg:["#5cc8b4","#1d5a54"]},
{skin:"#e8b896",hair:"#241713",style:"long",out:"blazer",c:"#17181d",acc:["sun","earring"],bg:["#c9a98a","#6a4a36"]},
{skin:"#f2cdb0",hair:"#2d1c15",style:"long",out:"hoodie",c:"#22232b",acc:[],blush:1,bg:["#9a8bea","#3f3586"]},
{skin:"#e6b690",hair:"#17100d",style:"braid",out:"dress",c:"#2e8f7c",acc:["tiara","earring"],blush:1,bg:["#7fd8c0","#27665c"]},
{skin:"#f0c8a8",hair:"#4a2d1f",style:"long",out:"dress",c:"#f08aa8",acc:["flowers","earring"],blush:1,bg:["#ffc0d0","#c0507a"]}];
const sh=(h,a)=>{const n=parseInt(h.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=x=>Math.max(0,Math.min(255,Math.round(x+a)));return"#"+((1<<24)+(f(r)<<16)+(f(g)<<8)+f(b)).toString(16).slice(1)};
function svg(g,i){
const c=(g==="kelin"?F:M)[((Number(i)||1)-1)%9],s=c.skin,sd=sh(s,-28),hr=c.hair,a=c.acc||[],has=k=>a.indexOf(k)>-1,fem=g==="kelin";
let o=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.bg[0]}"/><stop offset="1" stop-color="${c.bg[1]}"/></linearGradient><radialGradient id="f" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="${sh(s,12)}"/><stop offset="1" stop-color="${s}"/></radialGradient><clipPath id="k"><circle cx="100" cy="100" r="94"/></clipPath></defs><circle cx="100" cy="100" r="98" fill="url(#b)"/><g clip-path="url(#k)">`;
const hijab=c.style==="hijab";
// orqa soch / hijob
if(c.style==="long")o+=`<path d="M54 84C46 28 154 28 146 84C152 124 152 156 142 182L58 182C48 156 48 124 54 84Z" fill="${hr}"/>`;
if(c.style==="braid")o+=`<path d="M54 84C46 30 154 30 146 84C150 110 148 120 146 130Z" fill="${hr}"/><path d="M138 120C150 140 146 170 140 192C134 176 130 150 138 120Z" fill="${hr}"/><path d="M141 130l8 6M139 146l9 5M137 162l8 5" stroke="${sh(hr,40)}" stroke-width="2"/>`;
if(has("veil"))o+=`<path d="M52 70C50 26 150 26 148 70C156 120 160 170 172 200L28 200C40 170 46 120 52 70Z" fill="#fff" opacity=".55"/>`;
// tana
const out=c.out;let body=`<path d="M22 200C22 162 58 148 100 148C142 148 178 162 178 200Z" fill="${c.c}"/>`;
if(out==="gown")body=`<path d="M22 200C22 164 56 150 100 150C144 150 178 164 178 200Z" fill="${c.c}"/><path d="M70 152C80 172 120 172 130 152C120 148 80 148 70 152Z" fill="${s}"/><path d="M70 152C80 172 120 172 130 152" fill="none" stroke="#d9c9a8" stroke-width="2"/>`;
if(out==="dress")body=`<path d="M22 200C22 164 56 150 100 150C144 150 178 164 178 200Z" fill="${c.c}"/><path d="M72 152C82 170 118 170 128 152C118 147 82 147 72 152Z" fill="${s}"/>`;
o+=body;
if(hijab)o+=`<path d="M56 110C60 144 140 144 144 110C150 150 156 178 164 200L36 200C44 178 50 150 56 110Z" fill="${c.hc}"/>`;
else o+=`<rect x="86" y="116" width="28" height="40" rx="12" fill="${sd}"/>`;
if(out==="suit"||out==="tux"){o+=`<path d="M82 148L100 186L118 148Z" fill="#fff"/><path d="M82 148L100 186L74 176Z M118 148L100 186L126 176Z" fill="${sh(c.c,-18)}"/>`;
 if(out==="suit")o+=`<path d="M96 154h8l3 28-7 7-7-7z" fill="${c.c2}"/>`;
 else o+=`<path d="M100 156L84 148v16zM100 156l16-8v16z" fill="${c.c2}"/><circle cx="100" cy="156" r="3.5" fill="${sh(c.c2,-30)}"/>`;}
if(out==="blazer"){o+=`<path d="M84 148L100 180L116 148Z" fill="${c.c2||"#f1f1f4"}"/><path d="M84 148L100 184L70 178Z M116 148L100 184L130 178Z" fill="${sh(c.c,-14)}"/>`;}
if(out==="hoodie")o+=`<path d="M70 150C70 128 130 128 130 150C124 160 76 160 70 150Z" fill="${sh(c.c,-20)}"/><path d="M90 158v22M110 158v22" stroke="#e8e8ee" stroke-width="2.5" stroke-linecap="round"/>`;
if(out==="tee")o+=`<path d="M82 149C90 164 110 164 118 149" fill="${s}" stroke="${sh(c.c,30)}" stroke-width="3"/>`;
if(out==="shirt")o+=`<path d="M84 148L100 170L116 148Z" fill="${s}"/><path d="M84 148L100 172L92 150Z M116 148L100 172L108 150Z" fill="#e3e3ea"/><path d="M100 172V200" stroke="#d6d6de" stroke-width="2"/>`;
if(out==="sweater")o+=`<rect x="84" y="130" width="32" height="28" rx="12" fill="${sh(c.c,-18)}"/>`;
if(out==="turtle")o+=`<rect x="82" y="122" width="36" height="34" rx="14" fill="${sh(c.c,18)}"/>`;
// bosh
if(c.style==="bun")o+=`<circle cx="100" cy="24" r="17" fill="${hr}"/>`;
o+=`<ellipse cx="59" cy="92" rx="7" ry="9" fill="${s}"/><ellipse cx="141" cy="92" rx="7" ry="9" fill="${s}"/>`;
o+=`<path d="M60 80C60 48 80 38 100 38C120 38 140 48 140 80C140 110 124 136 100 136C76 136 60 110 60 80Z" fill="url(#f)"/>`;
if(has("beard"))o+=`<path d="M60 92C60 130 80 142 100 142C120 142 140 130 140 92C134 114 122 122 100 122C78 122 66 114 60 92Z" fill="${hr}"/><path d="M92 112Q100 108 108 112" stroke="${hr}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
if(c.blush)o+=`<ellipse cx="74" cy="106" rx="9" ry="5" fill="#ff7a9a" opacity=".28"/><ellipse cx="126" cy="106" rx="9" ry="5" fill="#ff7a9a" opacity=".28"/>`;
// ko'zlar
const eye=x=>`<ellipse cx="${x}" cy="90" rx="9.5" ry="${fem?11:10}" fill="#fff"/><circle cx="${x}" cy="91" r="6.2" fill="#4a2e1c"/><circle cx="${x}" cy="91" r="3.2" fill="#120a06"/><circle cx="${x+2.2}" cy="88" r="2" fill="#fff"/><path d="M${x-10} 86Q${x} ${fem?76:78} ${x+10} 86" fill="none" stroke="#1a100c" stroke-width="${fem?3.2:2.6}" stroke-linecap="round"/>`;
if(!has("sun")){o+=eye(82)+eye(118);if(fem)o+=`<path d="M72 86l-4-3M128 86l4-3" stroke="#1a100c" stroke-width="2" stroke-linecap="round"/>`;}
o+=fem?`<path d="M70 74Q82 66 94 72M106 72Q118 66 130 74" fill="none" stroke="${hr}" stroke-width="3.4" stroke-linecap="round"/>`:`<path d="M69 76Q82 66 95 74M105 74Q118 66 131 76" fill="none" stroke="${hr}" stroke-width="5.5" stroke-linecap="round"/>`;
o+=`<path d="M100 94Q94 108 99 112Q104 113 106 110" fill="none" stroke="${sd}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
o+=`<path d="M86 116Q100 130 114 116Q100 120 86 116Z" fill="#fff" stroke="${fem?"#d8456a":"#9c4a3a"}" stroke-width="2.6" stroke-linejoin="round"/>`;
if(fem)o+=`<path d="M92 118Q100 123 108 118" fill="none" stroke="#d8456a" stroke-width="1.5"/>`;
// soch oldi
const st=c.style;
if(st==="short")o+=`<path d="M57 86C52 42 78 26 102 26C130 26 150 44 143 86C141 70 134 60 120 56C102 66 80 62 68 62C62 68 59 76 57 86Z" fill="${hr}"/>`;
if(st==="quiff")o+=`<path d="M57 86C50 40 80 22 108 26C136 26 150 46 143 86C141 70 134 60 118 54C100 60 84 52 74 48C64 58 60 70 57 86Z" fill="${hr}"/><path d="M76 46C88 30 112 28 124 36" stroke="${sh(hr,35)}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
if(st==="side")o+=`<path d="M57 88C48 42 80 24 106 26C134 28 152 50 143 88C142 72 134 60 116 56C98 66 76 62 66 66C60 72 58 80 57 88Z" fill="${hr}"/>`;
if(st==="long"||st==="bun"||st==="braid")o+=`<path d="M57 90C54 46 78 32 100 32C124 32 146 46 143 90C138 64 124 52 104 52C84 58 66 66 57 90Z" fill="${hr}"/><path d="M104 52C96 44 90 40 86 34" stroke="${sh(hr,30)}" stroke-width="2.2" fill="none"/>`;
if(hijab)o+=`<path d="M58 84C58 46 80 36 100 36C120 36 142 46 142 84C136 60 120 50 100 50C80 50 64 60 58 84Z" fill="${c.hc}"/><path d="M58 84C58 46 80 36 100 36" stroke="${sh(c.hc,-30)}" stroke-width="2" fill="none"/>`;
// aksessuarlar
if(has("doppi"))o+=`<path d="M62 60C64 26 136 26 138 60L134 68C118 60 82 60 66 68Z" fill="#14161a"/><path d="M72 58l6-8 6 8-6 8zM94 54l6-8 6 8-6 8zM116 58l6-8 6 8-6 8z" fill="none" stroke="#fff" stroke-width="1.8"/>`;
if(has("cap"))o+=`<path d="M58 66C58 24 142 24 142 66C120 60 80 60 58 66Z" fill="${c.capc}"/><path d="M56 66C82 56 128 58 156 74C130 70 90 70 56 66Z" fill="${sh(c.capc,24)}"/><path d="M96 44l8 0" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
if(has("sun"))o+=`<rect x="64" y="78" width="30" height="20" rx="8" fill="#0d0d11"/><rect x="106" y="78" width="30" height="20" rx="8" fill="#0d0d11"/><path d="M94 86h12" stroke="#0d0d11" stroke-width="3"/><path d="M70 82l8 0" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" stroke-linecap="round"/>`;
if(has("glasses"))o+=`<circle cx="82" cy="90" r="13" fill="#fff" fill-opacity=".12" stroke="#2a2a30" stroke-width="3"/><circle cx="118" cy="90" r="13" fill="#fff" fill-opacity=".12" stroke="#2a2a30" stroke-width="3"/><path d="M95 90h10" stroke="#2a2a30" stroke-width="3"/>`;
if(has("tiara"))o+=`<path d="M76 46L84 36L92 44L100 32L108 44L116 36L124 46Z" fill="#f4cf5a" stroke="#d9a73a" stroke-width="1.5"/><circle cx="100" cy="36" r="2.5" fill="#fff"/>`;
if(has("flowers"))o+=`<g fill="#fff"><circle cx="70" cy="50" r="6"/><circle cx="130" cy="50" r="6"/><circle cx="82" cy="40" r="5"/><circle cx="118" cy="40" r="5"/></g><g fill="#f4cf5a"><circle cx="70" cy="50" r="2.4"/><circle cx="130" cy="50" r="2.4"/><circle cx="82" cy="40" r="2"/><circle cx="118" cy="40" r="2"/></g>`;
if(has("earring"))o+=`<circle cx="58" cy="106" r="4" fill="#f4cf5a"/><circle cx="142" cy="106" r="4" fill="#f4cf5a"/>`;
if(has("pearl"))o+=`<circle cx="58" cy="106" r="4" fill="#fff" stroke="#cfcfd8"/><circle cx="142" cy="106" r="4" fill="#fff" stroke="#cfcfd8"/>`;
o+=`</g><circle cx="100" cy="100" r="96" fill="none" stroke="${sh(c.bg[0],30)}" stroke-width="5"/></svg>`;
return o}
window.yqAvatar=function(code){const q=/^ph:(kelin|kuyov):([1-5])$/.exec(String(code||""));if(q)return"icons/avatars/"+q[1]+q[2]+".webp";const m=/^yq:(kelin|kuyov):(\d+)$/.exec(String(code||""));if(!m)return code;return"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg(m[1],m[2]))};
window.yqPhNames={kelin:["Klassik","Samimiy","Turmak","Hijobli","Quyoshli"],kuyov:["Rasmiy","Hoodie","Quyoshli","Oq koʻylak","Kepkali"]};
window.yqVis={kelin:[1,2,3,4,5,8,9],kuyov:[1,2,3,6,7,8,9]};
window.yqNames={kelin:["Kelin","Hijobli","Zarif","Turmak","Qora hijob","Quyoshli","Sporty","Gulli","Malika"],kuyov:["Kuyov","Smoking","Doppi","Sporty","Quyoshli","Kepkali","Soqolli","Blazer","Ziyoli"]};
})();
