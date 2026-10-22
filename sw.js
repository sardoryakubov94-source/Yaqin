const C="yaqin-v4",A=["./","index.html","css/style.css","js/app.js","js/config.js","js/places.js","js/firebase.js","js/firebase-config.js","manifest.json"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting()});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=C).map(x=>caches.delete(x))))));
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!="GET"||u.origin!=location.origin)return;e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(clients.matchAll({type:"window"}).then(l=>l.length?l[0].focus():clients.openWindow("./")))});
self.addEventListener("push",e=>{let d={};try{d=e.data.json()}catch(x){}const n=d.notification||d.data||{};e.waitUntil(self.registration.showNotification(n.title||"Yaqin",{body:n.body||"",icon:"icons/icon-192.png",badge:"icons/icon-192.png"}))});
