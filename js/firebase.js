const G="https://www.gstatic.com/firebasejs/10.14.1/";
const {initializeApp}=await import(G+"firebase-app.js");
const A=await import(G+"firebase-auth.js"),D=await import(G+"firebase-firestore.js"),S=await import(G+"firebase-storage.js");
const cfg=(await import("./firebase-config.js")).default;
try{
const app=initializeApp(cfg),auth=A.getAuth(app),db=D.getFirestore(app),sto=S.getStorage(app);auth.languageCode="uz";
const U=()=>auth.currentUser,uref=u=>D.doc(db,"users",u);
async function profile(u){const s=await D.getDoc(uref(u.uid)),d=s.exists()?s.data():{};return{uid:u.uid,email:u.email,name:d.name||u.displayName||u.email.split("@")[0],phone:d.phone||"",img:d.img||u.photoURL||""}}
async function up(path,data){const r=S.ref(sto,path);await S.uploadString(r,data,"data_url");return S.getDownloadURL(r)}
window.FB={
 onUser:cb=>A.onAuthStateChanged(auth,async u=>cb(u?await profile(u):null)),
 async signUp(e,p,name,phone){const c=await A.createUserWithEmailAndPassword(auth,e,p);await A.updateProfile(c.user,{displayName:name});await D.setDoc(uref(c.user.uid),{name,phone,email:e,t:Date.now()});return profile(c.user)},
 async signIn(e,p){return profile((await A.signInWithEmailAndPassword(auth,e,p)).user)},
 async google(){const u=(await A.signInWithPopup(auth,new A.GoogleAuthProvider())).user;if(!(await D.getDoc(uref(u.uid))).exists())await D.setDoc(uref(u.uid),{name:u.displayName||"",phone:"",email:u.email,img:u.photoURL||"",t:Date.now()});return profile(u)},
 reset:e=>A.sendPasswordResetEmail(auth,e),out:()=>A.signOut(auth),
 ads:cb=>D.onSnapshot(D.query(D.collection(db,"ads"),D.orderBy("t","desc"),D.limit(200)),s=>cb(s.docs.map(d=>({...d.data(),id:d.id}))),e=>console.error(e)),
 async addAd(d){const u=U();let img=d.img;if(img&&img.startsWith("data:"))img=await up(`ads/${u.uid}/${Date.now()}.jpg`,img);return D.addDoc(D.collection(db,"ads"),{...d,img:img||"",uid:u.uid,t:Date.now()})},
 upAd:(id,x)=>D.updateDoc(D.doc(db,"ads",id),x),delAd:id=>D.deleteDoc(D.doc(db,"ads",id)),
 saveUser:x=>D.setDoc(uref(U().uid),x,{merge:true}),
 async photo(data){const url=await up(`avatars/${U().uid}.jpg`,data);await D.setDoc(uref(U().uid),{img:url},{merge:true});return url}
};
dispatchEvent(new Event("fb-ready"));
}catch(e){console.error("Firebase init xatosi:",e)}
