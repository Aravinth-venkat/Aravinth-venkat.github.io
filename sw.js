const CACHE="aravinth-portfolio-v3";
const CORE=["/","/index.html","/404.html","/chess.html","/quiz.html"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE).catch(()=>{}))));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  e.respondWith(fetch(e.request).then(r=>{
    const copy=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
    return r;
  }).catch(()=>caches.match(e.request).then(r=>r || caches.match("/404.html"))));
});