const AI_ENDPOINT="https://careerlab-ai.leoaravind007.workers.dev";

const DOMAINS=["ServiceNow","Software Engineering","Frontend Development","Backend Development","Full Stack Development","Mobile Development","Java","Python","JavaScript / TypeScript","Data Structures & Algorithms","Data Engineering","Data Science","Artificial Intelligence / Machine Learning","Generative AI","Cloud / AWS","Microsoft Azure","Google Cloud","DevOps","SRE","Cybersecurity","Networking","Database / SQL","API / Integration","System Design","Solution Architecture","IT Support","IT Operations","ITSM","CRM","SAP","Salesforce","Testing / QA","Business Analysis","Product Management","Project Management","Operations","Supply Chain","Finance","Accounting","Banking","Marketing","Human Resources","Healthcare","Legal","Education","Manufacturing","Other IT","Other Non-IT","Custom"];

const LOCATIONS=["Chennai","Bengaluru","Hyderabad","Pune","Mumbai","Delhi NCR","Noida","Gurugram","Kolkata","Coimbatore","Madurai","Trichy","Ahmedabad","Jaipur","Kochi","Thiruvananthapuram","Visakhapatnam","Chandigarh","Indore","Remote","India"];

let state={fileName:"",resumeText:"",skills:[],analysis:null,domain:"ServiceNow",isPro:localStorage.getItem("careerlab_plan")==="pro",interview:{running:false,type:"",difficulty:"Medium",question:"",turns:[]}};
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const redact=x=>String(x||"").replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,"[EMAIL]").replace(/\b(?:\+?\d[\d\s().-]{8,}\d)\b/g,"[PHONE]");

async function api(body){
  const r=await fetch(AI_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.detail?`${d.error||"AI request failed"}: ${d.detail}`:(d.error||"AI request failed"));
  return d;
}

async function pdfText(file){
  const pdfjs=await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
  const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;
  const pages=[];
  for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);const content=await page.getTextContent();pages.push(content.items.map(x=>x.str).join(" "));}
  return pages.join("\n");
}

async function docxText(file){
  if(!window.mammoth)throw new Error("DOCX parser is still loading. Try again in a moment.");
  const result=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
  return result.value;
}

async function loadResume(file){
  if(!file)return;
  if(file.size>8*1024*1024){alert("Please upload a resume smaller than 8 MB.");return;}
  $("fileStatus").innerHTML="<span class='dot'></span>Reading resume locally…";
  try{
    let text;
    if(file.name.toLowerCase().endsWith(".pdf"))text=await pdfText(file);
    else if(file.name.toLowerCase().endsWith(".docx"))text=await docxText(file);
    else throw new Error("Please upload a PDF or DOCX file.");
    text=text.replace(/\u0000/g,"").replace(/[ \t]+\n/g,"\n").slice(0,36000).trim();
    if(text.length<80)throw new Error("Not enough readable text. Try a text-based PDF or DOCX.");
    state.fileName=file.name;state.resumeText=text;state.skills=[];state.analysis=null;
    $("fileStatus").innerHTML="<span class='dot'></span>"+esc(file.name)+" · browser memory only";
    resetResumeUI(false);
    $("fileStatus").innerHTML="<span class='dot'></span>"+esc(file.name)+" · browser memory only";
    renderLearningLab();
  }catch(e){$("fileStatus").textContent="⚠️ "+e.message;}
}

function resetResumeUI(full=true){
  if(full){state={fileName:"",resumeText:"",skills:[],analysis:null,domain:$("careerDomain")?.value||"ServiceNow",isPro:localStorage.getItem("careerlab_plan")==="pro",interview:{running:false,type:"",difficulty:"Medium",question:"",turns:[]}};if($("resumeFile"))$("resumeFile").value="";}
  $("score").textContent="—";$("scorebar").style.width="0";$("scoreReason").textContent="Upload a resume to generate analysis.";$("analysisSummary").textContent="Your resume-specific analysis will appear here.";$("skillMap").innerHTML="Your supported skills, evidence warnings and interview areas will appear here.";$("skillMap").className="skillmap empty";
  $("exploreOutput").innerHTML=`<div class="careerlab-answer"><div class="careerlab-answer-header"><div><div class="careerlab-brand">CareerLab Guidance</div><div class="careerlab-subtitle">Ask CareerLab a question about your resume or interview preparation.</div></div><span class="careerlab-badge">CAREERLAB</span></div><div class="careerlab-content"><p>Upload a resume and ask CareerLab a question.</p></div></div>`;
  $("exploreSources").innerHTML="";$("chat").innerHTML="<div class='msg ai'>Start a mock interview and I will ask one question at a time.</div>";$("sampleAnswer").textContent="Sample answer guidance will appear after you submit an interview answer.";$("interviewState").textContent="No interview running.";renderLearningLab();
  if(full)$("fileStatus").innerHTML="<span class='dot'></span>No resume loaded";
}

function parseJson(text){try{return JSON.parse(text)}catch{}const m=String(text||"").match(/\{[\s\S]*\}/);if(!m)return null;try{return JSON.parse(m[0])}catch{return null}}

function formatCareerLabAnswer(text){
  let value=String(text||"").replace(/\r/g,"").trim();
  if(!value){
    return `<div class="careerlab-answer"><div class="careerlab-answer-header"><div><div class="careerlab-brand">CareerLab Guidance</div><div class="careerlab-subtitle">CareerLab could not generate an answer.</div></div><span class="careerlab-badge">CAREERLAB</span></div><div class="careerlab-content"><p>Please try the question again.</p></div></div>`;
  }

  value=value.replace(/```(?:markdown|md|text|json)?/gi,"").replace(/```/g,"").replace(/\*\*/g,"").replace(/__/g,"").replace(/~~/g,"").replace(/\|/g," ").replace(/^\s*[-*•]\s*/gm,"").replace(/^\s*#{1,6}\s*/gm,"").replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim();

  const lines=value.split("\n");let html="";let paragraph=[];
  function flushParagraph(){if(!paragraph.length)return;const p=paragraph.join(" ").trim();if(p)html+=`<p>${esc(p)}</p>`;paragraph=[];}

  for(const rawLine of lines){
    const line=rawLine.trim();
    if(!line){flushParagraph();continue;}
    const headingMatch=line.match(/^(What your resume proves|What this topic normally means|Simple memory explanation|How to discuss this safely in an interview|What the candidate should verify before claiming it|Example interview wording|Resume evidence|General knowledge|Safe interview explanation|Follow-up questions|Current skills|Gaps|Priority order|Learning plan|What is good|What is missing|What is unclear|Unsupported claims|How to improve|Sample answer template|CareerLab Guidance|What to learn next)\s*:?\s*$/i);
    if(headingMatch){flushParagraph();html+=`<h3>${esc(headingMatch[1])}</h3>`;continue;}
    const numberedHeading=line.match(/^\d+\.\s*(.+)$/i);
    if(numberedHeading&&numberedHeading[1].length<100){flushParagraph();html+=`<h3>${esc(numberedHeading[1])}</h3>`;continue;}
    const bullet=line.match(/^[-*•]\s*(.+)$/);
    if(bullet){flushParagraph();html+=`<div class="careerlab-point">${esc(bullet[1])}</div>`;continue;}
    paragraph.push(line);
  }
  flushParagraph();

  return `<div class="careerlab-answer"><div class="careerlab-answer-header"><div><div class="careerlab-brand">CareerLab Guidance</div><div class="careerlab-subtitle">Personalized guidance based on your resume</div></div><span class="careerlab-badge">CAREERLAB</span></div><div class="careerlab-content">${html}</div><div class="careerlab-footer"><strong>CareerLab note:</strong> This guidance is generated from your resume and CareerLab's interview coaching logic. Only claim experience that you can confidently explain in an interview.</div></div>`;
}

async function analyze(){
  if(!state.resumeText){alert("Upload a resume first.");return;}
  $("analysisSummary").textContent="Analyzing your resume…";$("analyzeBtn").disabled=true;$("analyzeBtn").textContent="Analyzing…";
  try{
    const d=await api({mode:"resume_analysis",domain:state.domain,resumeText:redact(state.resumeText)});
    const j=d.analysis||parseJson(d.answer)||{};state.analysis=j;state.skills=Array.isArray(j.skills)?j.skills:[];
    const score=Math.max(0,Math.min(100,Number(j.score)||0));$("score").textContent=score+"/100";$("scorebar").style.width=score+"%";$("scoreReason").textContent=j.summary||"Analysis completed.";
    $("analysisSummary").innerHTML=formatCareerLabAnswer([
      "Resume evidence",
      j.summary||"Analysis completed.",
      j.strengths?.length?"Strengths:":"",j.strengths?.join(". ")||"",
      j.gaps?.length?"Gaps:":"",j.gaps?.join(". ")||"",
      j.evidenceWarnings?.length?"Evidence warnings:":"",j.evidenceWarnings?.join(". ")||""
    ].filter(Boolean).join("\n\n"));
    const tags=[...new Set([...state.skills,...(j.interviewAreas||[])])];$("skillMap").className="skillmap";$("skillMap").innerHTML=tags.length?tags.map(x=>`<span class="skill">${esc(x)}</span>`).join(""):"No supported skills detected yet.";
    updateJobDefaults();renderLearningLab();
  }catch(e){$("analysisSummary").textContent="⚠️ "+e.message;}
  finally{$("analyzeBtn").disabled=false;$("analyzeBtn").textContent="Analyze My Resume";}
}

function renderSources(sources){$("exploreSources").innerHTML=(sources||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title||s.url)}</a>`).join("");}

async function explore(){
  if(!state.resumeText){alert("Upload a resume first.");return;}
  const mode=$("exploreMode").value;
  if(["project","skill_gap"].includes(mode)&&!state.isPro){openUpgrade();return;}

  $("exploreOutput").innerHTML=`<div class="careerlab-answer"><div class="careerlab-answer-header"><div><div class="careerlab-brand">CareerLab Guidance</div><div class="careerlab-subtitle">CareerLab is preparing your personalized answer…</div></div><span class="careerlab-badge">CAREERLAB</span></div><div class="careerlab-content"><p>Analyzing your resume and preparing interview guidance…</p></div></div>`;
  $("exploreSources").innerHTML="";

  try{
    const d=await api({mode,resumeText:redact(state.resumeText),domain:state.domain,topic:$("exploreTopic").value,question:$("exploreQuestion").value});
    $("exploreOutput").innerHTML=formatCareerLabAnswer(d.answer||"No answer returned.");
    renderSources(d.sources);
  }catch(e){
    $("exploreOutput").innerHTML=`<div class="careerlab-answer"><div class="careerlab-answer-header"><div><div class="careerlab-brand">CareerLab Guidance</div><div class="careerlab-subtitle">CareerLab could not complete this answer.</div></div><span class="careerlab-badge">CAREERLAB</span></div><div class="careerlab-content"><p>${esc(e.message)}</p></div></div>`;
  }
}

async function startInterview(){
  if(!state.resumeText){alert("Upload a resume first.");return;}
  state.interview={running:true,type:$("interviewType").value,difficulty:$("difficulty").value,question:"",turns:[]};$("chat").innerHTML="";$("interviewState").textContent="Interview running · one question at a time · resume evidence first";await nextInterview("Start the interview. Ask one realistic question based on the resume.");
}

async function nextInterview(instruction){
  try{
    const d=await api({mode:"mock_interview",resumeText:redact(state.resumeText),domain:state.domain,interviewType:state.interview.type,difficulty:state.interview.difficulty,history:state.interview.turns,instruction});
    state.interview.question=d.answer||"Tell me about one project on your resume.";
    $("chat").insertAdjacentHTML("beforeend",`<div class="msg ai">${esc(state.interview.question)}</div>`);
    $("chat").scrollTop=$("chat").scrollHeight;
  }catch(e){$("chat").insertAdjacentHTML("beforeend",`<div class="msg ai">⚠️ ${esc(e.message)}</div>`);}
}

async function evaluateInterviewAnswer(answer){
  if(!state.isPro){$("sampleAnswer").textContent="Upgrade to CareerLab Pro for detailed answer improvement and sample answer guidance.";return;}
  try{
    const d=await api({mode:"interview_feedback",resumeText:redact(state.resumeText),domain:state.domain,question:state.interview.question,answer});
    $("sampleAnswer").innerHTML=formatCareerLabAnswer(d.answer||"No sample guidance returned.");
  }catch(e){$("sampleAnswer").textContent="⚠️ "+e.message;}
}

async function answerInterview(){
  const answer=$("answerInput").value.trim();if(!answer||!state.interview.running)return;
  $("chat").insertAdjacentHTML("beforeend",`<div class="msg user">${esc(answer)}</div>`);
  state.interview.turns.push({question:state.interview.question,answer});
  $("answerInput").value="";
  await evaluateInterviewAnswer(answer);
  await nextInterview("Briefly evaluate the previous answer, then ask one focused follow-up question. If the answer claims unsupported experience, ask the candidate to verify it.");
}

function stopInterview(){state.interview.running=false;$("interviewState").textContent="Interview ended. Your interview data remains only in this page memory until you reload or delete the resume.";}

function renderLearningLab(){
  const grid=$("learningGrid");if(!grid)return;
  if(!state.resumeText){grid.innerHTML='<div class="learning-empty">Upload and analyze your resume to build a personalized Learning Lab.</div>';return;}
  if(!state.analysis){grid.innerHTML='<div class="learning-empty">Analyze your resume first. CareerLab will build learning topics from your skills, gaps and interview areas.</div>';return;}
  const a=state.analysis;const topics=[...(Array.isArray(a.learningPath)?a.learningPath:[]),...(Array.isArray(a.gaps)?a.gaps:[]),...(Array.isArray(a.interviewAreas)?a.interviewAreas:[])];const unique=[...new Set(topics.map(x=>String(x||"").trim()).filter(Boolean))].slice(0,12);
  if(!unique.length){grid.innerHTML='<div class="learning-empty">No personalized learning topics were returned. Re-run resume analysis to generate them.</div>';return;}
  grid.innerHTML=unique.map((topic,i)=>`<div class="learning-card"><span class="learning-priority">${i<3?"High priority":i<7?"Recommended":"Interview practice"}</span><h3>${esc(topic)}</h3><p class="muted">Based on your resume, skills, gaps and interview areas.</p><button class="secondary" data-topic="${esc(topic)}">Learn & Practice →</button></div>`).join("");
  grid.querySelectorAll("button[data-topic]").forEach(b=>b.addEventListener("click",()=>{$("exploreMode").value="experience";$("exploreTopic").value=b.dataset.topic;$("exploreQuestion").value="Teach me this topic for an interview. First explain what my resume proves, then teach the general concept, common mistakes, and give me a safe interview answer structure.";document.querySelector("#experience").scrollIntoView({behavior:"smooth"});explore();}));
}

function updateJobDefaults(){$("jobKeyword").value=state.skills.slice(0,2).join(" ")||state.domain;}

function buildJobLinks(keyword,location){
  const title=encodeURIComponent(keyword||state.domain),loc=encodeURIComponent(location||""),q=encodeURIComponent(`${keyword} ${location}`.trim()),slug=(keyword||state.domain).toLowerCase().replace(/[^a-z0-9]+/g,"-"),locationSlug=(location||"").toLowerCase().replace(/[^a-z0-9]+/g,"-");
  return[
    {name:"LinkedIn Jobs",url:`https://www.linkedin.com/jobs/search/?keywords=${title}&location=${loc}`},
    {name:"Indeed",url:`https://www.indeed.com/jobs?q=${q}&l=${loc}`},
    {name:"Google Jobs",url:`https://www.google.com/search?q=${q}+jobs`},
    {name:"Glassdoor",url:`https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword=${title}&locKeyword=${loc}`},
    {name:"Naukri",url:locationSlug?`https://www.naukri.com/${slug}-jobs-in-${locationSlug}`:`https://www.naukri.com/${slug}-jobs`}
  ];
}

function searchJobs(){
  if(!state.isPro){openUpgrade();return;}
  if(!state.resumeText){alert("Upload and analyze your resume first.");return;}
  const keyword=$("jobKeyword").value.trim()||state.skills.slice(0,2).join(" ")||state.domain,location=$("jobLocation").value.trim();
  if(!location){alert("Please select a location first.");$("jobLocation").focus();return;}
  const jobs=buildJobLinks(keyword,location);
  $("jobResults").innerHTML=jobs.map(j=>`<div class="job-card"><div><h3>${esc(j.name)}</h3><p><strong>Location:</strong> ${esc(location)}</p><p>Search ${esc(keyword)} jobs in ${esc(location)} using your resume profile.</p></div><a class="primary" href="${esc(j.url)}" target="_blank" rel="noopener noreferrer">Search Jobs ↗</a></div>`).join("");
}

function populateLocations(){
  const input=$("jobLocation");
  const listId="careerLabLocations";
  let datalist=document.getElementById(listId);
  if(!datalist){datalist=document.createElement("datalist");datalist.id=listId;document.body.appendChild(datalist);}
  datalist.innerHTML=LOCATIONS.map(x=>`<option value="${esc(x)}">`).join("");
  input.setAttribute("list",listId);
}

function openUpgrade(){$("upgradeModal").classList.remove("hidden");}
function closeUpgrade(){$("upgradeModal").classList.add("hidden");}
function activateTestPro(){state.isPro=true;localStorage.setItem("careerlab_plan","pro");updatePlanUI();closeUpgrade();alert("CareerLab Pro test mode activated.");}
function updatePlanUI(){const b=$("planBadge");b.textContent=state.isPro?"PRO":"FREE";b.className=state.isPro?"plan pro":"plan free";$("upgradeBtn").textContent=state.isPro?"Pro Active":"Upgrade to Pro";}

function applyDisplayMode(mode,showNotice=true){
  document.body.classList.remove("night-mode","reading-mode");
  if(mode==="night")document.body.classList.add("night-mode");
  if(mode==="reading")document.body.classList.add("reading-mode");
  localStorage.setItem("careerlab_display_mode",mode);
  const night=$("nightModeBtn"),reading=$("readingModeBtn");
  night.textContent=mode==="night"?"☀️ Day Mode":"🌙 Night Mode";
  reading.textContent=mode==="reading"?"✓ Reading Mode":"Reading Mode";
  document.documentElement.style.colorScheme=mode==="night"?"dark":"light";
  if(showNotice){
    const labels={night:"Night Mode enabled for low-light use.",reading:"Reading Mode enabled with softer contrast and easier reading.",day:"Standard display mode restored."};
    $("modeNotice").textContent=labels[mode]||labels.day;
    $("modeNotice").classList.remove("hidden");
    clearTimeout(window.careerLabNoticeTimer);
    window.careerLabNoticeTimer=setTimeout(()=>$("modeNotice").classList.add("hidden"),2600);
  }
}

function toggleNightMode(){applyDisplayMode(document.body.classList.contains("night-mode")?"day":"night");}
function toggleReadingMode(){applyDisplayMode(document.body.classList.contains("reading-mode")?"day":"reading");}

function populate(){
  $("careerDomain").innerHTML=DOMAINS.map(d=>`<option>${esc(d)}</option>`).join("");
  $("careerDomain").value=state.domain;
  populateLocations();
  renderLearningLab();
  updatePlanUI();
  applyDisplayMode(localStorage.getItem("careerlab_display_mode")||"day",false);
}

$("resumeFile").addEventListener("change",e=>loadResume(e.target.files[0]));
$("deleteBtn").addEventListener("click",()=>{if(!state.resumeText)return alert("No resume is currently loaded.");if(confirm("Delete this resume session now? This clears resume text, analysis, skills and interview state."))resetResumeUI(true);});
$("analyzeBtn").addEventListener("click",analyze);
$("exploreBtn").addEventListener("click",explore);
$("architectureBtn").addEventListener("click",()=>{$("exploreMode").value="project";$("exploreQuestion").value="Explain my project architecture for an interview. Separate resume evidence from generic reference architecture.";explore();});
$("clearOutputBtn").addEventListener("click",()=>{$("exploreOutput").innerHTML=`<div class="careerlab-answer"><div class="careerlab-answer-header"><div><div class="careerlab-brand">CareerLab Guidance</div><div class="careerlab-subtitle">Ask CareerLab a question about your resume or interview preparation.</div></div><span class="careerlab-badge">CAREERLAB</span></div><div class="careerlab-content"><p>Your CareerLab answer will appear here.</p></div></div>`;$("exploreSources").innerHTML="";});
$("startInterview").addEventListener("click",startInterview);
$("stopInterview").addEventListener("click",stopInterview);
$("answerBtn").addEventListener("click",answerInterview);
$("jobSearchBtn").addEventListener("click",searchJobs);
$("upgradeBtn").addEventListener("click",openUpgrade);
$("pricingUpgradeBtn").addEventListener("click",openUpgrade);
$("closeModal").addEventListener("click",closeUpgrade);
$("activateTestPro").addEventListener("click",activateTestPro);
$("careerDomain").addEventListener("change",e=>{state.domain=e.target.value;renderLearningLab();});
$("nightModeBtn").addEventListener("click",toggleNightMode);
$("readingModeBtn").addEventListener("click",toggleReadingMode);
populate();
