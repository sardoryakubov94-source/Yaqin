/* Yaqin — admin uchun namuna eʼlonlar generatori (56 ta: 28 kelin + 28 kuyov). Faqat admin panelidan ishlatiladi. */
window.YQ_DEMO_PUBLIC_BADGE=false; // true qilsangiz "Namuna" belgisi hamma foydalanuvchiga koʻrinadi
window.yqDemoAds=function(pl){
const rnd=(()=>{let a=Date.now()%2147483647||1;return()=>(a=a*48271%2147483647)/2147483647})();
const pick=a=>a[Math.floor(rnd()*a.length)],between=(x,y)=>x+Math.floor(rnd()*(y-x+1));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const NAMES={kelin:["Madina","Nilufar","Malika","Dilnoza","Sevara","Zilola","Gulnora","Shahnoza","Feruza","Munisa","Kamola","Laylo","Nodira","Odina","Ruxsora","Sabina","Umida","Zarina","Barno","Charos","Dildora","Hilola","Iroda","Mohira","Nargiza","Robiya","Sitora","Yulduz"],
kuyov:["Jasur","Bobur","Azizbek","Dilshod","Eldor","Farhod","Humoyun","Islom","Javohir","Kamol","Lazizbek","Mansur","Nodir","Otabek","Rustam","Sanjar","Temur","Ulugʻbek","Zafar","Abbos","Doniyor","Bekzod","Sherzod","Umid","Anvar","Behzod","Jahongir","Oybek"]};
const REG=["Andijon shahri","Andijon shahri","Andijon shahri","Andijon shahri","Asaka tumani","Asaka tumani","Xonobod shahri","Shahrixon tumani","Qoʻrgʻontepa tumani","Marxamat tumani","Baliqchi tumani","Paxtaobod tumani","Andijon tumani","Boʻz tumani","Fargʻona shahri","Namangan shahri","Qoʻqon shahri","Samarqand shahri","Chilonzor tumani","Yunusobod tumani"];
const ABOUT={kelin:["Oilaparvar, samimiy va mehnatsevar qizman. Hayotda halollik va hurmatni qadrlayman.","Tinch, kamtar oilada ulgʻaganman. Kelajakda mehribon oila qurishni xohlayman.","Ishlayman va oʻqishni davom ettiryapman. Oʻzaro tushunish va ishonchga asoslangan munosabat izlayapman.","Hazilni tushunadigan, ochiq fikrli qizman. Sayohat qilish va kitob oʻqishni yaxshi koʻraman.","Ota-onamga hurmatli, oilaviy qadriyatlarga sodiqman. Jiddiy niyatli inson bilan tanishmoqchiman.","Oshpazlikni yaxshi koʻraman, uyda qulaylik yaratishni bilaman. Mehribon va gapga quloq soladigan inson kerak.","Sport va tabiatni yaxshi koʻraman. Hayotga ijobiy qarayman, yaxshi suhbatdosh topishni istayman.","Oʻz ishimni sevaman, rivojlanishga intilaman. Bir-birini qoʻllab-quvvatlaydigan oila orzu qilaman."],
kuyov:["Mehnatsevar, masʼuliyatli yigitman. Oila qurishga jiddiy tayyorman.","Ota-onamga yaqinman, oilaviy qadriyatlarni qadrlayman. Samimiy va halol qiz bilan tanishmoqchiman.","Ish bilan band, lekin oila uchun doim vaqt topaman. Oʻzaro hurmat asosidagi munosabat izlayman.","Sport bilan shugʻullanaman, sogʻlom turmush tarzini yoqtiraman. Hazilni tushunadigan hamroh kerak.","Oʻz ishim va rejalarim bor. Kelajakda toʻkis, baxtli oila qurmoqchiman.","Kitob oʻqish va sayohatni yaxshi koʻraman. Ochiq fikrli, mehribon inson bilan tanishishni istayman.","Tinch va jiddiy yigitman. Gapga quloq soladigan, oilaparvar qiz bilan tanishmoqchiman.","Texnologiya va biznesga qiziqaman. Bir-birini tushunadigan, ishonchli juft topmoqchiman."]};
const INTS=["Sayohat","Sport","Kitob","Musiqa","Oshpazlik","Texnologiya","Biznes","Sanʼat","Tabiat","Dinu maʼnaviyat","Oila","Kino","Moda","Avtomobil"];
const D={housing:["own","parents","rent"],living:["parents","family","alone"],work:["state","private","business","self"],car:["yes","no"],education:["higher","college","student","secondary"]};
const PH={kelin:[1,2,3,4,5],kuyov:[1,2,3,4,5]},VIS={kelin:[1,2,3,4,5,8,9],kuyov:[1,2,3,6,7,8,9]};
const PUR=()=>{const r=rnd();return r<.6?"oila":r<.85?"tanish":"nikoh"};
const out=[],now=Date.now();
["kelin","kuyov"].forEach(g=>{
 const names=shuffle(NAMES[g]),avs=shuffle([...PH[g].map(n=>"ph:"+g+":"+n),...VIS[g].map(n=>"yq:"+g+":"+n)]);
 names.forEach((nm,i)=>{
  const anon=i%7===3,reg=pick(REG),age=g==="kelin"?between(19,34):between(22,42),open=!anon;
  const details={};Object.keys(D).forEach(k=>{if(rnd()<.8)details[k]=pick(D[k])});
  if(g==="kelin")delete details.car;
  const img=open&&i%4!==1?"icons/avatars/"+g+PH[g][i%5]+".webp":"";
  const off=Math.floor((2+rnd()*470)*3600000);
  out.push({name:anon?"Anonim":nm,age,reg,vil:(pl(reg)||{}).vil||"",g,pur:PUR(),about:anon?"":pick(ABOUT[g]),ava:avs[i%avs.length],img,vip:false,status:"active",anon,ints:shuffle(INTS).slice(0,between(2,4)),profileDetails:anon?{}:details,isDemo:true,t:now-off});
 });
});
shuffle(out.map((_,i)=>i)).slice(0,4).forEach(i=>{out[i].vip=true});
return shuffle(out)};
