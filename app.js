/* CareerLab — no API key in browser. Replace only AI_ENDPOINT after Worker deployment. */
const AI_ENDPOINT = "https://careerlab-ai.YOUR-SUBDOMAIN.workers.dev";

const DOMAINS = ["ServiceNow","Software Engineering","Cloud / AWS","DevOps","Java","Python","Data / AI","Cybersecurity","Frontend / Web","Backend / APIs","ITSM / IT Operations","Mechanical / Engineering","Business / Finance","Custom"];
const TOPICS = ["Incident Management","Problem Management","Change Management","Release Management","CMDB","CSDM","REST Integration","Flow Designer","Business Rules","Client Scripts","Virtual Agent","Now Assist / AI","ITOM","Service Catalog","API Design","System Design","Cloud Architecture","DevOps","Cybersecurity","Python","Java","Data Structures","SQL","Machine Learning","Project Management"];

let state = { fileName:"", resumeText:"", skills:[], analysis:null, domain:"ServiceNow", interview:{running:false,type:"",difficulty:"Medium",question:"",turns:[]} };
const $ = id => document.getElementById(id);
const esc = x => String(x ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const redact = x => String(x||"").replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,"[EMAIL]").replace(/\b(?:\+?\d[\d\s().-]{8,}\d)\b/g,"[PHONE]");

async function api(body){
  if(AI_ENDPOINT.includes("YOUR-SUBDOMAIN")) throw new Error("Deploy the Cloudflare Worker first, then replace AI_ENDPOINT in app.js with your Worker URL.");
  const r = await fetch(AI_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const d = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.error || "AI request failed");
  return d;
}

async function pdfText(file){
  const pdfjs = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
  const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;
  const pages=[];
  for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);const c=await page.getTextContent();pages.push(c.items.map(x=>x.str).join(" "));}
  return pages.join("\n");
}
async function docxText(file){
  if(!window.mammoth) throw new Error("DOCX parser is still loading. Try again in a moment.");
  const r=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
  return r.value;
}

async function loadResume(file){
  if(!file)return;
  if(file.size>8*1024*1024){alert("Please upload a resume smaller than 8 MB.");return;}
  $("fileStatus").innerHTML="<span class='dot'></span>Reading resume locally…";
  try{
    let text=file.name.toLowerCase().endsWith(".pdf")?await pdfText(file):await docxText(file);
    text=text.replace(/\u0000/g,"").replace(/[ \t]+\n/g,"\n").slice(0,36000).trim();
    if(text.length<80)throw new Error("Not enough readable text. Try a text-based PDF or DOCX.");
    state.fileName=file.name;state.resumeText=text;state.skills=[];state.analysis=null;
    $("fileStatus").innerHTML="<span class='dot'></span>"+esc(file.name)+" · browser memory only";
    resetResumeUI(false);
  }catch(e){$("fileStatus").textContent="⚠️ "+e.message;}
}

function resetResumeUI(full=true){
  if(full){state={fileName:"",resumeText:"",skills:[],analysis:null,domain:$('careerDomain')?.value||"ServiceNow",interview:{running:false,type:"",difficulty:"Medium",question:"",turns:[]}};$("resumeFile").value="";}
  $("score").textContent="—";$("scorebar").style.width="0";$("scoreReason").textContent="Upload a resume to generate analysis.";$("analysisSummary").textContent="Your resume-specific analysis will appear here.";$("skillMap").innerHTML="Your supported skills, evidence warnings and interview areas will appear here.";$("skillMap").className="skillmap empty";$("exploreOutput").textContent="Upload a resume and ask a question.";$("exploreSources").innerHTML="";$("diagramText").textContent="Your Mermaid flow or sequence diagram will appear here.";$("chat").innerHTML='<div class="msg ai">Start a mock interview and I will ask one question at a time.</div>';
  $("interviewState").textContent="No interview running.";
  $("fileStatus").innerHTML='<span class="dot"></span>No resume loaded';
}

function parseJson(text){try{return JSON.parse(text)}catch{}const m=String(text||"").match(/\{[\s\S]*\}/);if(!m)return null;try{return JSON.parse(m[0])}catch{return null}}

async function analyze(){
  if(!state.resumeText)return alert("Upload a resume first.");
  $("analysisSummary").textContent="Analyzing your resume…";
  try{
    const d=await api({mode:"resume_analysis",domain:state.domain,resumeText:redact(state.resumeText)}),j=parseJson(d.answer)||{};
    state.analysis=j;state.skills=Array.isArray(j.skills)?j.skills:[];
    const score=Math.max(0,Math.min(100,Number(j.score)||0));$("score").textContent=score+"/100";$("scorebar").style.width=score+"%";$("scoreReason").textContent=j.summary||"Analysis completed.";
    $("analysisSummary").textContent=[j.strengths?.length?"Strengths:\n• "+j.strengths.join("\n• "):"",j.gaps?.length?"Gaps:\n• "+j.gaps.join("\n• "):"",j.evidenceWarnings?.length?"Evidence warnings:\n• "+j.evidenceWarnings.join("\n• "):"",j.interviewAreas?.length?"Interview areas:\n• "+j.interviewAreas.join("\n• "):"",j.learningPath?.length?"Learning path:\n• "+j.learningPath.join("\n• "):""].filter(Boolean).join("\n\n")||d.answer;
    const tags=[...new Set([...state.skills,...(j.interviewAreas||[])])];$("skillMap").className="skillmap";$("skillMap").innerHTML=tags.map(x=>`<span class="skill">${esc(x)}</span>`).join("")||"No supported skills detected yet.";
  }catch(e){$("analysisSummary").textContent="⚠️ "+e.message;}
}

function renderSources(sources){
  $("exploreSources").innerHTML=(sources||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title||s.url)}</a>`).join("");
}
function renderDiagram(answer){const m=String(answer||"").match(/```mermaid\s*([\s\S]*?)```/i);if(m)$("diagramText").textContent=m[1].trim();}

async function explore(){
  if(!state.resumeText)return alert("Upload a resume first.");
  $("exploreOutput").textContent="Thinking…";$("exploreSources").innerHTML="";
  try{const d=await api({mode:$('exploreMode').value,resumeText:redact(state.resumeText),domain:state.domain,topic:$('exploreTopic').value,question:$('exploreQuestion').value});$("exploreOutput").textContent=d.answer||"No answer returned.";renderSources(d.sources);renderDiagram(d.answer);}
  catch(e){$("exploreOutput").textContent="⚠️ "+e.message;}
}

async function startInterview(){
  if(!state.resumeText)return alert("Upload a resume first.");
  state.interview={running:true,type:$('interviewType').value,difficulty:$('difficulty').value,question:"",turns:[]};
  $("chat").innerHTML="";$("interviewState").textContent="Interview running · one question at a time · resume evidence first";
  await nextInterview("Start the interview. Ask one realistic question based on the resume.");
}
async function nextInterview(instruction){
  try{const d=await api({mode:"mock_interview",resumeText:redact(state.resumeText),domain:state.domain,interviewType:state.interview.type,difficulty:state.interview.difficulty,history:state.interview.turns,instruction});state.interview.question=d.answer||"Tell me about one project on your resume.";$("chat").insertAdjacentHTML("beforeend",`<div class="msg ai">${esc(state.interview.question)}</div>`);$("chat").scrollTop=$("chat").scrollHeight;}
  catch(e){$("chat").insertAdjacentHTML("beforeend",`<div class="msg ai">⚠️ ${esc(e.message)}</div>`);}
}
async function answerInterview(){
  const answer=$("answerInput").value.trim();if(!answer||!state.interview.running)return;
  $("chat").insertAdjacentHTML("beforeend",`<div class="msg user">${esc(answer)}</div>`);state.interview.turns.push({question:state.interview.question,answer});$("answerInput").value="";await nextInterview("Briefly evaluate the answer in 2-3 lines, then ask one focused follow-up question. If the answer claims unsupported experience, ask the candidate to verify it.");
}
function stopInterview(){state.interview.running=false;$("interviewState").textContent="Interview ended. Your interview data remains only in this page memory until you reload or delete the resume.";}

function populate(){
  $("careerDomain").innerHTML=DOMAINS.map(d=>`<option>${esc(d)}</option>`).join("");
  $("careerDomain").value=state.domain;
  $("learningGrid").innerHTML=TOPICS.map(t=>`<div class="card"><h3>${esc(t)}</h3><p class="muted">Purpose → real-world use → common mistakes → practical flow → interview explanation → follow-ups.</p><button class="secondary" data-topic="${esc(t)}">Understand →</button></div>`).join("");
  document.querySelectorAll("#learningGrid button").forEach(b=>b.addEventListener("click",()=>{$("exploreMode").value="experience";$('exploreTopic').value=b.dataset.topic;$('exploreQuestion').value="Teach me this for an interview. Separate general knowledge from what my resume proves.";document.querySelector("#experience").scrollIntoView({behavior:"smooth"});explore();}));
  fetch("sources.json").then(r=>r.json()).then(x=>$("sourceList").innerHTML=x.official.map(a=>`<a href="${a[1]}" target="_blank" rel="noopener noreferrer">${esc(a[0])}</a>`).join("")).catch(()=>{});
}

$("resumeFile").addEventListener("change",e=>loadResume(e.target.files[0]));
$("deleteBtn").addEventListener("click",()=>{if(!state.resumeText)return alert("No resume is currently loaded.");if(confirm("Delete this resume session now? This clears resume text, analysis, skills and interview state."))resetResumeUI(true);});
$("analyzeBtn").addEventListener("click",analyze);$("exploreBtn").addEventListener("click",explore);$("clearOutputBtn").addEventListener("click",()=>{$("exploreOutput").textContent="Answer cleared.";$("exploreSources").innerHTML=""});$("startInterview").addEventListener("click",startInterview);$("stopInterview").addEventListener("click",stopInterview);$("answerBtn").addEventListener("click",answerInterview);$("answerInput").addEventListener("keydown",e=>{if(e.key==="Enter")answerInterview()});$("careerDomain").addEventListener("change",e=>state.domain=e.target.value);
$("architectureBtn").addEventListener("click",()=>{$("exploreMode").value="project";$('exploreTopic').value=$('exploreTopic').value||"My main project";$('exploreQuestion').value="Explain the project architecture, distinguish resume evidence from a generic reference architecture, and give a Mermaid sequence/flow diagram.";document.querySelector("#experience").scrollIntoView({behavior:"smooth"});explore();});
$("copyDiagram").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("diagramText").textContent);alert("Mermaid copied.")}catch{alert("Copy is not available in this browser.")}});
populate();resetResumeUI(true);
