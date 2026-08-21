(() => {
  "use strict";
  const cfg = window.ARAVINTH_CONFIG || {backendUrl:"", siteUrl:location.origin, maxResumeBytes:5*1024*1024};
  const KEY = "aravinthVisitorId";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : "v-" + Date.now() + "-" + Math.random().toString(36).slice(2));
    localStorage.setItem(KEY, id);
  }

  const api = {
    visitorId: id,
    connected: !!cfg.backendUrl,
    send(payload) {
      if (!cfg.backendUrl) return Promise.resolve(false);
      const body = JSON.stringify({...payload, visitorId: payload.visitorId || id, userAgent:navigator.userAgent, screen:`${screen.width}x${screen.height}`});
      try {
        return fetch(cfg.backendUrl, {
          method:"POST",
          mode:"no-cors",
          headers:{"Content-Type":"text/plain;charset=UTF-8"},
          body
        }).then(() => true).catch(() => false);
      } catch { return Promise.resolve(false); }
    }
  };
  window.AravinthSite = api;

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("aravinthTheme", theme);
  }
  const saved = localStorage.getItem("aravinthTheme");
  setTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  // Theme button injected on every page by the deployment workflow.
  const themeBtn = document.createElement("button");
  themeBtn.type = "button";
  themeBtn.className = "aravinth-theme-toggle";
  themeBtn.title = "Toggle dark/light mode";
  themeBtn.textContent = document.documentElement.dataset.theme === "dark" ? "☀️" : "🌙";
  themeBtn.onclick = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(next); themeBtn.textContent = next === "dark" ? "☀️" : "🌙";
  };
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(themeBtn));

  // Visitor tracking / presence. No IP or password is collected here.
  const ownerMode = new URLSearchParams(location.search).get("owner") === "1";
  if (ownerMode) localStorage.setItem("aravinthOwnerMode","1");
  const isOwner = localStorage.getItem("aravinthOwnerMode") === "1";
  const event = {
    action: isOwner ? "owner_heartbeat" : "visit",
    visitorId:id,
    path:location.pathname,
    referrer:document.referrer || "",
    title:document.title,
    owner:isOwner
  };
  api.send(event);
  const beat = () => api.send({action:isOwner ? "owner_heartbeat":"heartbeat", visitorId:id, path:location.pathname, owner:isOwner});
  setInterval(beat, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) beat(); });

  // Cursor enhancement on desktop.
  if (matchMedia("(pointer:fine)").matches) {
    const dot = document.createElement("div"), ring = document.createElement("div");
    dot.className="aravinth-cursor-dot"; ring.className="aravinth-cursor-ring";
    document.body.append(dot, ring);
    let x=0,y=0,rx=0,ry=0;
    addEventListener("pointermove", e => {x=e.clientX;y=e.clientY;dot.style.left=x+"px";dot.style.top=y+"px";});
    (function loop(){rx+=(x-rx)*.2;ry+=(y-ry)*.2;ring.style.left=rx+"px";ring.style.top=ry+"px";requestAnimationFrame(loop)})();
    document.querySelectorAll("a,button,input,textarea,select,.card").forEach(el=>{
      el.addEventListener("mouseenter",()=>ring.classList.add("hover"));
      el.addEventListener("mouseleave",()=>ring.classList.remove("hover"));
    });
  }

  // Service worker for offline shell/recovery.
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(()=>{});
  }
})();