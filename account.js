(function(){
// CareerLab launch-preview access layer. Authentication, subscriptions and payments are intentionally disabled for now.
const visitorId=localStorage.getItem("careerlab_visitor_id")||crypto.randomUUID();
localStorage.setItem("careerlab_visitor_id",visitorId);
function toast(text){const el=document.getElementById("unlockToast");if(!el)return;const t=document.getElementById("unlockText");if(t)t.textContent=text;el.classList.remove("hidden");clearTimeout(window.__clToast);window.__clToast=setTimeout(()=>el.classList.add("hidden"),4200);}
window.careerLabGetAccessToken=async()=>null;
window.careerLabCanUse=async()=>true;
window.careerLabRequireLogin=()=>true;
window.careerLabSetPlan=()=>{};
window.careerLabStartPayment=()=>toast("Payments will be added later. Full Pro Preview access is already enabled.");
window.careerLabUnlock=label=>toast(label+" is ready for you.");
})();
