const G="https://www.gstatic.com/firebasejs/10.14.1/";
const {initializeApp}=await import(G+"firebase-app.js");
const A=await import(G+"firebase-auth.js"),D=await import(G+"firebase-firestore.js"),S=await import(G+"firebase-storage.js");
const cfg=(await import("./firebase-config.js")).default;
try{
const app=initializeApp(cfg),auth=A.getAuth(app),db=D.getFirestore(app),sto=S.getStorage(app);auth.languageCode="uz";
const U=()=>auth.currentUser,uref=u=>D.doc(db,"users",u);
async function profile(u){const s=await D.getDoc(uref(u.uid)),d=s.exists()?s.data():{};return{uid:u.uid,email:u.email,name:d.name||u.displayName||u.email.split("@")[0],phone:d.phone||"",img:d.img||u.photoURL||"",groups:d.groups||[],prefs:d.prefs||null}}
async function up(path,data){const r=S.ref(sto,path);await S.uploadString(r,data,"data_url");return S.getDownloadURL(r)}
window.FB={
 onUser:cb=>A.onAuthStateChanged(auth,async u=>cb(u?await profile(u):null)),
 async signUp(e,p,name,phone){const c=await A.createUserWithEmailAndPassword(auth,e,p);await A.updateProfile(c.user,{displayName:name});await D.setDoc(uref(c.user.uid),{name,phone,email:e,t:Date.now()});return profile(c.user)},
 async signIn(e,p){return profile((await A.signInWithEmailAndPassword(auth,e,p)).user)},
 async google(){const u=(await A.signInWithPopup(auth,new A.GoogleAuthProvider())).user;if(!(await D.getDoc(uref(u.uid))).exists())await D.setDoc(uref(u.uid),{name:u.displayName||"",phone:"",email:u.email,img:u.photoURL||"",t:Date.now()});return profile(u)},
 reset:e=>A.sendPasswordResetEmail(auth,e),out:()=>A.signOut(auth),
 ads:cb=>D.onSnapshot(D.query(D.collection(db,"ads"),D.orderBy("t","desc"),D.limit(200)),s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))),e=>console.error(e)),
 async addAd(d){const u=U(),{_priv,...ad}=d;let img=ad.img;if(img&&img.startsWith("data:"))img=await up(`ads/${u.uid}/${Date.now()}.jpg`,img);const r=await D.addDoc(D.collection(db,"ads"),{...ad,img:img||"",uid:u.uid,t:Date.now()});if(_priv)await D.setDoc(D.doc(db,"ads",r.id,"priv","info"),_priv);return r},
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
 async newGroup(name,ava,uname){const u=U(),r=await D.addDoc(D.collection(db,"groups"),{name,ava,owner:u.uid,n:1,t:Date.now()});await D.setDoc(D.doc(db,"groups",r.id,"members",u.uid),{name:uname,t:Date.now()});await D.setDoc(uref(u.uid),{groups:D.arrayUnion(r.id)},{merge:true});return r.id},
 async joinGroup(id,uname){const u=U();await D.setDoc(D.doc(db,"groups",id,"members",u.uid),{name:uname,t:Date.now()});await D.updateDoc(D.doc(db,"groups",id),{n:D.increment(1)});await D.setDoc(uref(u.uid),{groups:D.arrayUnion(id)},{merge:true})},
 async leaveGroup(id){const u=U();await D.deleteDoc(D.doc(db,"groups",id,"members",u.uid));await D.updateDoc(D.doc(db,"groups",id),{n:D.increment(-1)});await D.setDoc(uref(u.uid),{groups:D.arrayRemove(id)},{merge:true})},
 savePrefs:p=>D.setDoc(uref(U().uid),{prefs:p},{merge:true}),
 async mySwipes(){const s=await D.getDocs(D.query(D.collection(db,"swipes"),D.where("uid","==",U().uid))),m={};s.docs.forEach(d=>{const x=d.data();m[x.adId]=x.v});return m},
 swipe:(ad,v)=>D.setDoc(D.doc(db,"swipes",`${U().uid}_${ad.id}`),{uid:U().uid,adId:ad.id,v,t:Date.now()}),
 async like(ad,me){const ex=(await D.getDoc(D.doc(db,"chats",`${ad.id}_${me.uid}`))).exists(),id=await this.openChat(ad,me);if(!ex)await this.send("chats",id,"❤️ Sizning eʼloningizni yoqtirdi",me.name,"like");return id},
 async photo(data){const url=await up(`avatars/${U().uid}.jpg`,data);await D.setDoc(uref(U().uid),{img:url},{merge:true});return url}
};
dispatchEvent(new Event("fb-ready"));
}catch(e){console.error("Firebase init xatosi:",e)}
