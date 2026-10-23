const G="https://www.gstatic.com/firebasejs/10.14.1/";
const {initializeApp}=await import(G+"firebase-app.js");
const A=await import(G+"firebase-auth.js"),D=await import(G+"firebase-firestore.js"),S=await import(G+"firebase-storage.js");
const cfg=(await import("./firebase-config.js")).default;
try{
const app=initializeApp(cfg),auth=A.getAuth(app),db=D.getFirestore(app),sto=S.getStorage(app);auth.languageCode="uz";
const U=()=>auth.currentUser,uref=u=>D.doc(db,"users",u);
async function profile(u){const s=await D.getDoc(uref(u.uid)),d=s.exists()?s.data():{};return{uid:u.uid,email:u.email,name:d.name||u.displayName||u.email.split("@")[0],phone:d.phone||"",img:d.img||u.photoURL||"",groups:d.groups||[],prefs:d.prefs||null,favs:d.favs||null,freeUsed:!!d.freeUsed}}
async function up(path,data){const r=S.ref(sto,path);await S.uploadString(r,data,"data_url");return S.getDownloadURL(r)}
window.FB={
 onUser:cb=>A.onAuthStateChanged(auth,async u=>cb(u?await profile(u):null)),
 async signUp(e,p,name,phone){const c=await A.createUserWithEmailAndPassword(auth,e,p);await A.updateProfile(c.user,{displayName:name});await D.setDoc(uref(c.user.uid),{name,phone,email:e,t:Date.now()});return profile(c.user)},
 async signIn(e,p){return profile((await A.signInWithEmailAndPassword(auth,e,p)).user)},
 async google(){const u=(await A.signInWithPopup(auth,new A.GoogleAuthProvider())).user;if(!(await D.getDoc(uref(u.uid))).exists())await D.setDoc(uref(u.uid),{name:u.displayName||"",phone:"",email:u.email,img:u.photoURL||"",t:Date.now()});return profile(u)},
 reset:e=>A.sendPasswordResetEmail(auth,e),out:()=>A.signOut(auth),
 ads:cb=>D.onSnapshot(D.query(D.collection(db,"ads"),D.limit(200)),s=>cb(s.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>(Number(b.t)||0)-(Number(a.t)||0))),e=>console.error("Eʼlonlarni yuklashda xato:",e)),
 async addAd(d,free){const u=U(),{_priv,...ad}=d;let img=ad.img;if(img&&img.startsWith("data:"))img=await up(`ads/${u.uid}/${Date.now()}.jpg`,img);const r=D.doc(D.collection(db,"ads")),data={...ad,img:img||"",uid:u.uid,t:Date.now()};if(free){const b=D.writeBatch(db);b.set(r,data);b.set(uref(u.uid),{freeUsed:true},{merge:true});await b.commit()}else await D.setDoc(r,data);if(_priv)await D.setDoc(D.doc(db,"ads",r.id,"priv","info"),_priv);return r.id},
 upAd:(id,x)=>D.updateDoc(D.doc(db,"ads",id),x),async delAd(id){try{await D.deleteDoc(D.doc(db,"ads",id,"priv","info"))}catch(e){}await D.deleteDoc(D.doc(db,"ads",id))},
 saveUser:x=>D.setDoc(uref(U().uid),x,{merge:true}),
 chats:(uid,cb)=>D.onSnapshot(D.query(D.collection(db,"chats"),D.where("members","array-contains",uid)),s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))),e=>console.error(e)),
 async openChat(ad,me){const id=`${ad.id}_${me.uid}`,r=D.doc(db,"chats",id);if(!(await D.getDoc(r)).exists())await D.setDoc(r,{adId:ad.id,owner:ad.uid,asker:me.uid,members:[ad.uid,me.uid],ownerName:ad.name,ownerAva:ad.ava||"",ownerImg:ad.img||"",askerName:me.name,askerImg:me.img||"",photoOk:false,last:"",lastT:Date.now(),lastBy:"",t:Date.now()});return id},
 msgs:(col,id,cb)=>D.onSnapshot(D.query(D.collection(db,col,id,"msgs"),D.orderBy("t","asc"),D.limit(300)),s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))),e=>console.error(e)),
 async send(col,id,text,name,kind){const u=U(),t=Date.now();await D.addDoc(D.collection(db,col,id,"msgs"),{from:u.uid,name:name||"",text,t,...(kind?{kind}:{})});if(col=="chats")await D.updateDoc(D.doc(db,"chats",id),{last:text.slice(0,80),lastT:t,lastBy:u.uid})},
 async priv(){const s=await D.getDoc(D.doc(db,"priv",U().uid));return s.exists()?s.data().imgs||[]:[]},
 setPriv:imgs=>D.setDoc(D.doc(db,"priv",U().uid),{imgs}),
 async grant(id,on,adId){const sr=D.doc(db,"chats",id,"shared","photos");if(on){const imgs=await this.priv();let info={};try{const s=await D.getDoc(D.doc(db,"ads",adId,"priv","info"));if(s.exists())info=s.data()}catch(e){}if(!imgs.length&&!info.name)return false;await D.setDoc(sr,{imgs,name:info.name||"",about:info.about||"",t:Date.now()});await D.updateDoc(D.doc(db,"chats",id),{photoOk:true})}else{await D.updateDoc(D.doc(db,"chats",id),{photoOk:false});await D.deleteDoc(sr)}return true},
 shared:(id,cb)=>D.onSnapshot(D.doc(db,"chats",id,"shared","photos"),s=>cb(s.exists()?s.data():{}),()=>cb({})),
 report:(id)=>D.addDoc(D.collection(db,"reports"),{chat:id,by:U().uid,t:Date.now()}),
 groups:cb=>D.onSnapshot(D.query(D.collection(db,"groups"),D.orderBy("t","desc"),D.limit(100)),s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))),e=>console.error(e)),
 async newGroup(name,ava,uname){const u=U(),r=await D.addDoc(D.collection(db,"groups"),{name,ava,owner:u.uid,n:1,mediaUploadMode:"owner",t:Date.now()});await D.setDoc(D.doc(db,"groups",r.id,"members",u.uid),{name:uname,t:Date.now()});await D.setDoc(uref(u.uid),{groups:D.arrayUnion(r.id)},{merge:true});return r.id},
 async joinGroup(id,uname){const u=U(),gr=D.doc(db,"groups",id),snap=await D.getDoc(gr);if(!snap.exists())throw new Error("Guruh topilmadi");const req=D.doc(db,"groups",id,"joinRequests",u.uid),rs=await D.getDoc(req);if(!rs.exists()){await D.setDoc(req,{uid:u.uid,name:uname,status:"pending",t:Date.now()});return "requested"}if(rs.data().status!=="approved"){if(rs.data().status==="rejected"){await D.updateDoc(req,{name:uname,status:"pending",t:Date.now()});return "requested"}return "pending"}await D.setDoc(D.doc(db,"groups",id,"members",u.uid),{name:uname,t:Date.now()});await D.updateDoc(gr,{n:D.increment(1)});await D.setDoc(uref(u.uid),{groups:D.arrayUnion(id)},{merge:true});await D.deleteDoc(req);return "joined"},
 groupRequests:async id=>(await D.getDocs(D.query(D.collection(db,"groups",id,"joinRequests"),D.where("status","==","pending")))).docs.map(d=>({...d.data(),uid:d.id})),
 decideGroupRequest:(id,uid,status)=>D.updateDoc(D.doc(db,"groups",id,"joinRequests",uid),{status,decidedAt:Date.now()}),
 async setGroupMediaPolicy(id,mode){const u=U(),r=D.doc(db,"groups",id),s=await D.getDoc(r);if(!s.exists()||s.data().owner!==u.uid)throw new Error("Faqat guruh egasi media ruxsatini oʻzgartira oladi");if(!["owner","members"].includes(mode))throw new Error("Notoʻgʻri ruxsat");await D.updateDoc(r,{mediaUploadMode:mode,mediaPolicyAt:Date.now()})},
 async uploadGroupMedia(id,file){const u=U(),r=D.doc(db,"groups",id),s=await D.getDoc(r);if(!s.exists())throw new Error("Guruh topilmadi");const g=s.data(),member=await D.getDoc(D.doc(db,"groups",id,"members",u.uid));if(!member.exists())throw new Error("Faqat guruh aʼzolari media yubora oladi");if(g.owner!==u.uid&&g.mediaUploadMode!=="members")throw new Error("Guruh egasi media yuborishga ruxsat bermagan");const isVideo=file.type.startsWith("video/");if(!file.type.startsWith("image/")&&!["video/mp4","video/webm","video/quicktime"].includes(file.type))throw new Error("Faqat rasm yoki MP4/WebM/MOV video yuborish mumkin");if(file.size>(isVideo?20*1024*1024:5*1024*1024))throw new Error(isVideo?"Video 20 MB dan kichik boʻlishi kerak":"Rasm 5 MB dan kichik boʻlishi kerak");const path=`group-media/${id}/${u.uid}/${Date.now()}_${Math.random().toString(36).slice(2,8)}`;const ref=S.ref(sto,path);await S.uploadBytes(ref,file,{contentType:file.type});const us=await D.getDoc(uref(u.uid)),uname=us.exists()?us.data().name||u.displayName||"":u.displayName||"",t=Date.now();await D.addDoc(D.collection(db,"groups",id,"msgs"),{from:u.uid,name:uname,text:isVideo?"Video":"Rasm",kind:"media",mediaType:isVideo?"video":"image",mediaPath:path,t});return path},
 async groupMediaBlob(path){const blob=await S.getBlob(S.ref(sto,path));return URL.createObjectURL(blob)},
 async adminSetGroupPremium(id,until){if(!(await D.getDoc(D.doc(db,"admins",U().uid))).exists())throw new Error("Faqat admin premium muddatini boshqarishi mumkin");await D.updateDoc(D.doc(db,"groups",id),{premiumUntil:until,premiumBy:U().uid,premiumAt:Date.now()})},
 async leaveGroup(id){const u=U();await D.deleteDoc(D.doc(db,"groups",id,"members",u.uid));await D.updateDoc(D.doc(db,"groups",id),{n:D.increment(-1)});await D.setDoc(uref(u.uid),{groups:D.arrayRemove(id)},{merge:true})},
 async deleteGroup(id){const u=U(),gr=D.doc(db,"groups",id),snap=await D.getDoc(gr);if(!snap.exists())throw new Error("Guruh topilmadi");if(snap.data().owner!==u.uid)throw new Error("Faqat guruh egasi uni oʻchira oladi");const [members,msgs]=await Promise.all([D.getDocs(D.collection(db,"groups",id,"members")),D.getDocs(D.collection(db,"groups",id,"msgs"))]);const refs=[...members.docs,...msgs.docs].map(d=>d.ref);for(let i=0;i<refs.length;i+=400){const b=D.writeBatch(db);refs.slice(i,i+400).forEach(ref=>b.delete(ref));await b.commit()}await D.setDoc(uref(u.uid),{groups:D.arrayRemove(id)},{merge:true});await D.deleteDoc(gr)},
 savePrefs:p=>D.setDoc(uref(U().uid),{prefs:p},{merge:true}),
 async mySwipes(){const s=await D.getDocs(D.query(D.collection(db,"swipes"),D.where("uid","==",U().uid))),m={};s.docs.forEach(d=>{const x=d.data();m[x.adId]=x.v});return m},
 swipe:(ad,v)=>D.setDoc(D.doc(db,"swipes",`${U().uid}_${ad.id}`),{uid:U().uid,adId:ad.id,v,t:Date.now()}),
 async like(ad,me){const ex=(await D.getDoc(D.doc(db,"chats",`${ad.id}_${me.uid}`))).exists(),id=await this.openChat(ad,me);if(!ex){await this.send("chats",id,"❤️ Sizning eʼloningizni yoqtirdi",me.name,"like");await D.addDoc(D.collection(db,"notifs"),{to:ad.uid,from:me.uid,type:"like",title:"Sizni yoqtirishdi",text:`${me.name} eʼloningizni yoqtirdi. Suhbat Xabarlar boʻlimida.`,t:Date.now(),read:false})}return id},
 async pay(x,me){const r=await D.addDoc(D.collection(db,"payments"),{...x,uid:me.uid,name:me.name,email:me.email,status:"pending",t:Date.now()});return r.id},
 myPays:(uid,cb)=>D.onSnapshot(D.query(D.collection(db,"payments"),D.where("uid","==",uid)),s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))),e=>console.error(e)),
 allPays:cb=>D.onSnapshot(D.query(D.collection(db,"payments"),D.orderBy("t","desc"),D.limit(100)),s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))),e=>console.error(e)),
 async decide(p,ok){const b=D.writeBatch(db),n=Date.now(),v={vip:true,vipUntil:n+30*864e5};b.update(D.doc(db,"payments",p.id),{status:ok?"approved":"rejected",by:U().uid,dt:n});if(ok&&p.adId){const m={ad:{status:"active",t:n},ad_vip:{status:"active",t:n,...v},vip:{...v,t:n},raise:{t:n}}[p.kind];if(m)b.update(D.doc(db,"ads",p.adId),m)}if(ok&&p.kind==="group_premium"&&p.groupId){const gr=await D.getDoc(D.doc(db,"groups",p.groupId));if(!gr.exists())throw new Error("Guruh topilmadi");const expiry=Math.max(n,Number(gr.data().premiumUntil)||0)+30*864e5;b.update(D.doc(db,"groups",p.groupId),{premiumUntil:expiry,premiumBy:p.uid,premiumAt:n})}const tx={ad:"Eʼloningiz faollashdi",ad_vip:"Eʼloningiz faollashdi va VIP boʻldi",vip:"Eʼloningiz VIP TOP boʻldi",raise:"Eʼloningiz yuqoriga koʻtarildi",group_premium:"Guruhingizga 30 kunlik PREMIUM yoqildi"};b.set(D.doc(D.collection(db,"notifs")),{to:p.uid,type:"pay",title:ok?"Toʻlov tasdiqlandi":"Toʻlov rad etildi",text:ok?(tx[p.kind]||"Toʻlov tasdiqlandi"):"Toʻlovingiz rad etildi. Savolingiz boʻlsa Yordam xizmatiga yozing.",t:n,read:false});await b.commit()},
 reports:cb=>D.onSnapshot(D.query(D.collection(db,"reports"),D.orderBy("t","desc"),D.limit(100)),s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))),e=>console.error(e)),
 delReport:id=>D.deleteDoc(D.doc(db,"reports",id)),
 settings:cb=>D.onSnapshot(D.doc(db,"settings","payment"),s=>cb(s.exists()?s.data():{}),()=>cb({})),
 saveSettings:x=>D.setDoc(D.doc(db,"settings","payment"),x),
 async demoCount(){return (await D.getCountFromServer(D.query(D.collection(db,"ads"),D.where("isDemo","==",true)))).data().count},
 async seedDemo(list){const u=U();let n=0;for(let i=0;i<list.length;i+=400){const part=list.slice(i,i+400),b=D.writeBatch(db);part.forEach(a=>b.set(D.doc(D.collection(db,"ads")),{...a,uid:u.uid}));await b.commit();n+=part.length}return n},
 async delDemo(){const s=await D.getDocs(D.query(D.collection(db,"ads"),D.where("isDemo","==",true)));let n=0;for(let i=0;i<s.docs.length;i+=400){const part=s.docs.slice(i,i+400),b=D.writeBatch(db);part.forEach(d=>b.delete(d.ref));await b.commit();n+=part.length}return n},
 async isAdmin(){try{return (await D.getDoc(D.doc(db,"admins",U().uid))).exists()}catch(e){return false}},
 async counts(){const c=async n=>(await D.getCountFromServer(D.collection(db,n))).data().count;return{users:await c("users"),ads:await c("ads"),groups:await c("groups")}},
 notifs:(uid,cb)=>{let first=true;return D.onSnapshot(D.query(D.collection(db,"notifs"),D.where("to","==",uid)),s=>{const added=first?[]:s.docChanges().filter(c=>c.type=="added").map(c=>({...c.data(),id:c.doc.id}));first=false;cb(s.docs.map(d=>({...d.data(),id:d.id})),added)},e=>console.error(e))},
 async markRead(ids){const b=D.writeBatch(db);ids.slice(0,400).forEach(i=>b.update(D.doc(db,"notifs",i),{read:true}));await b.commit()},
 supMsgs:(uid,cb)=>D.onSnapshot(D.query(D.collection(db,"support",uid,"msgs"),D.orderBy("t","asc"),D.limit(300)),s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))),e=>console.error(e)),
 supThread:(uid,cb)=>D.onSnapshot(D.doc(db,"support",uid),s=>cb(s.exists()?s.data():null),()=>cb(null)),
 threads:cb=>D.onSnapshot(D.query(D.collection(db,"support"),D.orderBy("lastT","desc"),D.limit(100)),s=>cb(s.docs.map(d=>({...d.data(),uid:d.id}))),e=>console.error(e)),
 async supSend(uid,text,as,me){const t=Date.now(),last=text.slice(0,80);await D.addDoc(D.collection(db,"support",uid,"msgs"),{from:as,text,t});await D.setDoc(D.doc(db,"support",uid),as=="user"?{uid,name:me.name,email:me.email,contact:me.phone||"",last,lastT:t,lastBy:"user"}:{last,lastT:t,lastBy:"admin"},{merge:true});if(as=="admin")await D.addDoc(D.collection(db,"notifs"),{to:uid,type:"support",title:"Yordam xizmati javob berdi",text:text.slice(0,120),t,read:false})},
 block:(to,name)=>D.setDoc(D.doc(db,"blocks",`${U().uid}_${to}`),{by:U().uid,to,name:name||"",t:Date.now()}),
 unblock:to=>D.deleteDoc(D.doc(db,"blocks",`${U().uid}_${to}`)),
 blocksBy:(uid,cb)=>D.onSnapshot(D.query(D.collection(db,"blocks"),D.where("by","==",uid)),s=>cb(s.docs.map(d=>d.data())),e=>console.error(e)),
 blocksTo:(uid,cb)=>D.onSnapshot(D.query(D.collection(db,"blocks"),D.where("to","==",uid)),s=>cb(s.docs.map(d=>d.data().by)),e=>console.error(e)),
 async regPush(vapid){const M=await import(G+"firebase-messaging.js"),reg=await navigator.serviceWorker.ready,tok=await M.getToken(M.getMessaging(app),{vapidKey:vapid,serviceWorkerRegistration:reg});if(tok)await D.setDoc(D.doc(db,"fcm",U().uid),{tokens:D.arrayUnion(tok)},{merge:true});return tok},
 async adPriv(id){const s=await D.getDoc(D.doc(db,"ads",id,"priv","info"));return s.exists()?s.data():{}},
 async updAd(id,x,priv){let img=x.img;if(img&&img.startsWith("data:"))img=await up(`ads/${U().uid}/${Date.now()}.jpg`,img);await D.updateDoc(D.doc(db,"ads",id),{...x,img:img||""});if(priv)await D.setDoc(D.doc(db,"ads",id,"priv","info"),priv)},
 hasPw:()=>U().providerData.some(p=>p.providerId=="password"),
 async delAccount(pw){const u=U(),uid=u.uid;
  if(this.hasPw())await A.reauthenticateWithCredential(u,A.EmailAuthProvider.credential(u.email,pw));else await A.reauthenticateWithPopup(u,new A.GoogleAuthProvider());
  const ads=await D.getDocs(D.query(D.collection(db,"ads"),D.where("uid","==",uid)));
  for(const d of ads.docs){try{await D.deleteDoc(D.doc(db,"ads",d.id,"priv","info"))}catch(e){}const im=d.data().img;if(im&&im.startsWith("http"))try{await S.deleteObject(S.ref(sto,im))}catch(e){}await D.deleteDoc(d.ref)}
  for(const [c,k] of [["swipes","uid"],["notifs","to"]]){const s=await D.getDocs(D.query(D.collection(db,c),D.where(k,"==",uid)));for(const d of s.docs)try{await D.deleteDoc(d.ref)}catch(e){}}
  for(const p of [["priv",uid],["fcm",uid],["users",uid]])try{await D.deleteDoc(D.doc(db,...p))}catch(e){}
  try{await S.deleteObject(S.ref(sto,`avatars/${uid}.jpg`))}catch(e){}
  await A.deleteUser(u)},
 async photo(data){const url=await up(`avatars/${U().uid}.jpg`,data);await D.setDoc(uref(U().uid),{img:url},{merge:true});return url}
};
dispatchEvent(new Event("fb-ready"));
}catch(e){console.error("Firebase init xatosi:",e)}
