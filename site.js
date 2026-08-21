(() => {
"use strict";
const cfg=window.ARAVINTH_CONFIG||{backendUrl:"",siteUrl:location.origin,maxResumeBytes:5*1024*1024};
const KEY="aravinthVisitorId";
let id=localStorage.getItem(KEY);
if(!id){id=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():"v-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);localStorage.setItem(KEY,id)}
const api={visitorId:id,connected:!!cfg.backendUrl,send(payload){
 if(!cfg.backendUrl)return Promise.resolve(false);
 const body=JSON.stringify({...payload,visitorId:payload.visitorId||id,userAgent:navigator.userAgent,screen:`${screen.width}x${screen.height}`});
 try{return fetch(cfg.backendUrl,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=UTF-8"},body}).then(()=>true).catch(()=>false)}catch{return Promise.resolve(false)}
}};
window.AravinthSite=api;
function setTheme(t){document.documentElement.dataset.theme=t;localStorage.setItem("aravinthTheme",t)}
setTheme(localStorage.getItem("aravinthTheme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"));
function initUI(){
 if(!document.body)return;
 if(!document.querySelector(".aravinth-theme-toggle")){
  const b=document.createElement("button");b.type="button";b.className="aravinth-theme-toggle";b.title="Toggle dark/light mode";b.textContent=document.documentElement.dataset.theme==="dark"?"☀️":"🌙";
  b.onclick=()=>{const n=document.documentElement.dataset.theme==="dark"?"light":"dark";setTheme(n);b.textContent=n==="dark"?"☀️":"🌙"};document.body.appendChild(b);
 }
 if(matchMedia("(pointer:fine)").matches&&!document.querySelector(".aravinth-cursor-dot")){
  const d=document.createElement("div"),r=document.createElement("div");d.className="aravinth-cursor-dot";r.className="aravinth-cursor-ring";document.body.append(d,r);
  let x=-100,y=-100,rx=x,ry=y;addEventListener("pointermove",e=>{x=e.clientX;y=e.clientY;d.style.left=x+"px";d.style.top=y+"px"});
  (function loop(){rx+=(x-rx)*.2;ry+=(y-ry)*.2;r.style.left=rx+"px";r.style.top=ry+"px";requestAnimationFrame(loop)})();
  document.querySelectorAll("a,button,input,textarea,select,.card").forEach(el=>{el.addEventListener("mouseenter",()=>r.classList.add("hover"));el.addEventListener("mouseleave",()=>r.classList.remove("hover"))});
 }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initUI);else initUI();
const owner=new URLSearchParams(location.search).get("owner")==="1";
if(owner)localStorage.setItem("aravinthOwnerMode","1");
const isOwner=localStorage.getItem("aravinthOwnerMode")==="1";
api.send({action:isOwner?"owner_heartbeat":"visit",path:location.pathname,referrer:document.referrer||"",title:document.title,owner:isOwner});
setInterval(()=>api.send({action:isOwner?"owner_heartbeat":"heartbeat",path:location.pathname,owner:isOwner}),30000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)api.send({action:isOwner?"owner_heartbeat":"heartbeat",path:location.pathname,owner:isOwner})});
if("serviceWorker"in navigator&&location.protocol==="https:")navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(()=>{});
})();