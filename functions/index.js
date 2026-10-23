// Yaqin Cloud Functions: push bildirishnoma va VIP muddati eslatmasi (Blaze tarifi kerak)
const {onDocumentCreated}=require("firebase-functions/v2/firestore");
const {onSchedule}=require("firebase-functions/v2/scheduler");
const {initializeApp}=require("firebase-admin/app");
const {getFirestore,FieldValue}=require("firebase-admin/firestore");
const {getMessaging}=require("firebase-admin/messaging");

const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {defineSecret}=require("firebase-functions/params");
const {RtcTokenBuilder,RtcRole}=require("agora-access-token");

const AGORA_APP_ID="868b06d16f0f43dc82dec0f4fefb23e9";
const AGORA_APP_CERT=defineSecret("AGORA_APP_CERT");

// Secure, short-lived Agora RTC token. The certificate never reaches the browser.
exports.agoraToken=onCall({secrets:[AGORA_APP_CERT]},async request=>{
  if(!request.auth) throw new HttpsError("unauthenticated","Avval Yaqin hisobingizga kiring.");
  const data=request.data||{};
  const channel=String(data.channel||"");
  const uid=Number(data.uid);
  if(!/^yq_[A-Za-z0-9_-]{1,60}$/.test(channel)||!Number.isSafeInteger(uid)||uid<1||uid>4294967295){
    throw new HttpsError("invalid-argument","Kanal yoki foydalanuvchi ID notoʻgʻri.");
  }
  const gid=channel.slice(3);
  const [group,member]=await Promise.all([
    db.doc("groups/"+gid).get(),
    db.doc("groups/"+gid+"/members/"+request.auth.uid).get()
  ]);
  if(!group.exists) throw new HttpsError("not-found","Guruh topilmadi.");
  if(!member.exists) throw new HttpsError("permission-denied","Faqat guruh aʼzolari qoʻngʻiroqqa kira oladi.");
  if(Number(group.data().premiumUntil)<=Date.now()) throw new HttpsError("failed-precondition","Guruh Premium muddati tugagan.");
  const cert=AGORA_APP_CERT.value();
  if(!cert) throw new HttpsError("failed-precondition","AGORA_APP_CERT server siri sozlanmagan.");
  const expires=Math.floor(Date.now()/1000)+3600;
  const token=RtcTokenBuilder.buildTokenWithUid(AGORA_APP_ID,cert,channel,uid,RtcRole.PUBLISHER,expires);
  return {appId:AGORA_APP_ID,channel,uid,token,expiresAt:expires};
});

initializeApp();const db=getFirestore();

async function push(uid,title,body){
  const s=await db.doc(`fcm/${uid}`).get(),tokens=(s.data()||{}).tokens||[];
  if(!tokens.length)return;
  const r=await getMessaging().sendEachForMulticast({tokens,notification:{title,body}});
  const bad=[];
  r.responses.forEach((x,i)=>{if(!x.success&&/not-registered|invalid-registration/.test((x.error&&x.error.code)||""))bad.push(tokens[i])});
  if(bad.length)await s.ref.update({tokens:FieldValue.arrayRemove(...bad)});
}
exports.pushNotif=onDocumentCreated("notifs/{id}",e=>{const n=e.data.data();return push(n.to,n.title,n.text||"")});
exports.pushChat=onDocumentCreated("chats/{cid}/msgs/{mid}",async e=>{
  const m=e.data.data();if(m.kind==="like")return;
  const c=(await db.doc(`chats/${e.params.cid}`).get()).data();if(!c)return;
  const to=c.members.find(u=>u!==m.from);
  if(to)await push(to,m.name||"Yangi xabar",String(m.text).slice(0,100));
});
exports.vipExpiry=onSchedule("every 24 hours",async()=>{
  const now=Date.now(),s=await db.collection("ads").where("vipUntil","<",now).get();
  const docs=s.docs.filter(d=>d.data().vip===true);
  for(let i=0;i<docs.length;i+=200){
    const b=db.batch();
    docs.slice(i,i+200).forEach(d=>{
      b.update(d.ref,{vip:false});
      b.set(db.collection("notifs").doc(),{to:d.data().uid,type:"ad",title:"VIP muddati tugadi",text:"Eʼloningiz oddiy eʼlonlar qatoriga qoʻshildi. Uni yana VIP qilishni xohlaysizmi?",t:now,read:false});
    });
    await b.commit();
  }
});
