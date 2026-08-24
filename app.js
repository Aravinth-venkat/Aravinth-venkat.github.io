const AI_ENDPOINT="https://careerlab-ai.leoaravind007.workers.dev";
const DOMAINS=["ServiceNow","Software Engineering","Frontend Development","Backend Development","Full Stack Development","Mobile Development","Java","Python","JavaScript / TypeScript","C / C++","Data Structures & Algorithms","Data Engineering","Data Science","Artificial Intelligence / Machine Learning","Generative AI","Cloud / AWS","Microsoft Azure","Google Cloud","DevOps","SRE","Cybersecurity","Networking","Database / SQL","API / Integration","System Design","Solution Architecture","IT Support","IT Operations","ITSM","CRM","SAP","Salesforce","Testing / QA","Automation Testing","Embedded Systems","Electronics / Electrical","Mechanical / Engineering","Business Analysis","Product Management","Project Management","Program Management","Operations","Supply Chain","Procurement","Quality Management","Risk Management","Compliance","Consulting","Finance","Accounting","Banking","Investment Banking","Financial Analysis","Audit","Taxation","Insurance","FinTech","Sales","Business Development","Marketing","Digital Marketing","Product Marketing","Market Research","Customer Success","Customer Support","Human Resources","Recruitment / Talent Acquisition","Learning & Development","Payroll","Employee Relations","Mechanical Engineering","Civil Engineering","Electrical Engineering","Electronics Engineering","Automobile Engineering","Aerospace Engineering","Manufacturing","Production Engineering","Industrial Engineering","Quality Engineering","Healthcare","Pharmaceutical","Legal","Education","Research","Architecture / Design","Content / Writing","Media","Hospitality","Retail","Logistics","Entrepreneurship","Other IT","Other Non-IT","Custom"];
const TOPICS=["Software Development","Frontend Development","Backend Development","Full Stack Development","Mobile Development","Java","Python","JavaScript / TypeScript","C / C++","Data Structures & Algorithms","Object-Oriented Programming","Database / SQL","REST APIs","API Integration","System Design","Solution Architecture","Incident Management","Problem Management","Change Management","Release Management","CMDB","CSDM","ITSM","ITOM","Service Catalog","Flow Designer","Business Rules","Client Scripts","Virtual Agent","Now Assist / AI","Cloud Architecture","AWS","Microsoft Azure","Google Cloud","DevOps","CI/CD","Docker","Kubernetes","Site Reliability Engineering","Infrastructure as Code","Data Engineering","Data Science","Machine Learning","Generative AI","Prompt Engineering","AI Agents","Data Analytics","SQL Analytics","Cybersecurity","Application Security","Cloud Security","Network Security","Security Operations","OWASP","Software Testing","Manual Testing","Automation Testing","API Testing","Performance Testing","Quality Assurance","Business Analysis","Product Management","Project Management","Program Management","Operations Management","Process Improvement","Consulting","Financial Analysis","Accounting","Banking","Investment Banking","Audit","Taxation","Risk Management","FinTech","Sales","Business Development","Marketing","Digital Marketing","Product Marketing","Market Research","Customer Success","Customer Support","Human Resources","Recruitment","Talent Acquisition","Learning & Development","Payroll","Employee Relations","Mechanical Engineering","Civil Engineering","Electrical Engineering","Electronics Engineering","Automobile Engineering","Aerospace Engineering","Manufacturing","Production Engineering","Industrial Engineering","Quality Engineering","Healthcare","Pharmaceutical","Legal","Education","Research","Architecture / Design","Content Writing","Media","Hospitality","Retail","Logistics","Entrepreneurship"];
const TOPIC_ALIASES={
"ServiceNow":["servicenow","snow","service now"],
"Incident Management":["incident","incident management","itsm incident"],
"Problem Management":["problem management","problem"],
"Change Management":["change management","change request","change"],
"Release Management":["release management","release"],
"CMDB":["cmdb","configuration management database","configuration item","ci class"],
"CSDM":["csdm","common service data model"],
"ITSM":["itsm","it service management"],
"ITOM":["itom","it operations management"],
"Service Catalog":["service catalog","catalog item","catalog"],
"Flow Designer":["flow designer","flows","flow design"],
"Business Rules":["business rule","business rules"],
"Client Scripts":["client script","client scripts"],
"Virtual Agent":["virtual agent","chatbot"],
"Now Assist / AI":["now assist","generative ai","ai","genai","virtual agent ai"],
"REST APIs":["rest api","rest apis","rest","web service"],
"API Integration":["api integration","integration","integrations","integration hub"],
"Database / SQL":["sql","database","gliderecord","glideaggregate"],
"Software Development":["software development","development"],
"System Design":["system design","architecture","design"],
"Solution Architecture":["solution architecture","reference architecture"],
"AWS":["aws","amazon web services"],
"Microsoft Azure":["azure"],
"Google Cloud":["gcp","google cloud"],
"DevOps":["devops"],
"CI/CD":["ci/cd","cicd","continuous integration","continuous delivery"],
"Docker":["docker","container"],
"Kubernetes":["kubernetes","k8s"],
"Cybersecurity":["cybersecurity","security"],
"Application Security":["application security","appsec","owasp"],
"Data Engineering":["data engineering"],
"Data Science":["data science"],
"Machine Learning":["machine learning","ml"],
"Generative AI":["generative ai","genai","llm"],
"Prompt Engineering":["prompt engineering","prompts"],
"AI Agents":["ai agents","agentic ai","agents"],
"Data Analytics":["data analytics","analytics"],
"Testing / QA":["testing","qa","quality assurance"],
"Automation Testing":["automation testing","selenium","test automation"],
"API Testing":["api testing","postman"],
"Business Analysis":["business analysis","business analyst"],
"Project Management":["project management","project"],
"Process Improvement":["process improvement","process optimization"],
"Mechanical Engineering":["mechanical engineering","mechanical"],
"Aerospace Engineering":["aerospace","aerospace engineering"]
};
let state={fileName:"",resumeText:"",skills:[],analysis:null,domain:"ServiceNow",interview:{running:false,type:"",difficulty:"Medium",question:"",turns:[]}};
const $=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const redact=x=>String(x||"").replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,"[EMAIL]").replace(/\b(?:\+?\d[\d\s().-]{8,}\d)\b/g,"[PHONE]");
const normalize=text=>String(text||"").toLowerCase().replace(/[^a-z0-9+#/. -]/g," ").replace(/\s+/g," ").trim();

async function api(body){
if(AI_ENDPOINT.includes("YOUR-SUBDOMAIN"))throw new Error("Deploy the Cloudflare Worker first, then replace AI_ENDPOINT in app.js with your Worker URL.");
const r=await fetch(AI_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
const d=await r.json().catch(()=>({}));
if(!r.ok){const detail=d.detail||d.message||"";throw new Error(detail?`${d.error||"AI request failed"}: ${detail}`:(d.error||"AI request failed"))}
return d;
}

async function pdfText(file){
const pdfjs=await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs");
pdfjs.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;
const pages=[];
for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);const c=await page.getTextContent();pages.push(c.items.map(x=>x.str).join(" "))}
return pages.join("\n");
}

async function docxText(file){
if(!window.mammoth)throw new Error("DOCX parser is still loading. Try again in a moment.");
const r=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
return r.value;
}

async function loadResume(file){
if(!file)return;
if(file.size>8*1024*1024){alert("Please upload a resume smaller than 8 MB.");return}
$("fileStatus").innerHTML="<span class='dot'></span>Reading resume locally…";
try{
let text=file.name.toLowerCase().endsWith(".pdf")?await pdfText(file):await docxText(file);
text=text.replace(/\u0000/g,"").replace(/[ \t]+\n/g,"\n").slice(0,36000).trim();
if(text.length<80)throw new Error("Not enough readable text. Try a text-based PDF or DOCX.");
state.fileName=file.name;
state.resumeText=text;
state.skills=[];
state.analysis=null;
state.interview={running:false,type:"",difficulty:"Medium",question:"",turns:[]};
resetResumeUI(false);
$("fileStatus").innerHTML="<span class='dot'></span>"+esc(file.name)+" · browser memory only";
renderLearningTopics();
}catch(e){$("fileStatus").textContent="⚠️ "+e.message}
}

function resetResumeUI(full=true){
if(full){state={fileName:"",resumeText:"",skills:[],analysis:null,domain:$("careerDomain")?.value||"ServiceNow",interview:{running:false,type:"",difficulty:"Medium",question:"",turns:[]}};$("resumeFile").value=""}
$("score").textContent="—";
$("scorebar").style.width="0";
$("scoreReason").textContent="Upload a resume to generate analysis.";
$("analysisSummary").textContent="Your resume-specific analysis will appear here.";
$("skillMap").innerHTML="Your supported skills, evidence warnings and interview areas will appear here.";
$("skillMap").className="skillmap empty";
$("exploreOutput").textContent="Upload a resume and ask a question.";
$("exploreSources").innerHTML="";
$("diagramText").textContent="Your Mermaid flow or sequence diagram will appear here.";
$("chat").innerHTML='<div class="msg ai">Start a mock interview and I will ask one question at a time.</div>';
$("interviewState").textContent="No interview running.";
$("fileStatus").innerHTML='<span class="dot"></span>No resume loaded';
renderLearningTopics();
}

function parseJson(text){
try{return JSON.parse(text)}catch{}
const m=String(text||"").match(/\{[\s\S]*\}/);
if(!m)return null;
try{return JSON.parse(m[0])}catch{return null}
}

function topicMatchesText(topic,text){
const haystack=normalize(text);
const aliases=TOPIC_ALIASES[topic]||[topic];
return aliases.some(alias=>{const a=normalize(alias);return a&&haystack.includes(a)});
}

function scoreTopic(topic,analysisText){
const haystack=normalize(analysisText);
const aliases=TOPIC_ALIASES[topic]||[topic];
let score=0;
aliases.forEach(alias=>{const a=normalize(alias);if(a&&haystack.includes(a))score+=a.length>=6?4:2});
const related={
"Business Rules":["gliderecord","server side","scripting","servicenow"],
"Client Scripts":["client script","catalog client","javascript","servicenow"],
"Flow Designer":["flow designer","workflow","automation","servicenow"],
"API Integration":["integration","rest","api","web service"],
"REST APIs":["rest","api","integration"],
"Database / SQL":["gliderecord","glideaggregate","database","sql"],
"ITSM":["incident","problem","change","request","service management"],
"Change Management":["change","cab","change management"],
"Release Management":["release","deployment"],
"Now Assist / AI":["now assist","genai","generative ai","ai"],
"Virtual Agent":["virtual agent","chatbot","conversational"],
"Solution Architecture":["architecture","integration","system design"]
};
(related[topic]||[]).forEach(term=>{if(haystack.includes(normalize(term)))score+=1});
return score;
}

function getPersonalizedTopics(){
if(!state.analysis)return [];
const a=state.analysis;
const learningPath=Array.isArray(a.learningPath)?a.learningPath:[];
const gaps=Array.isArray(a.gaps)?a.gaps:[];
const skills=Array.isArray(a.skills)?a.skills:state.skills;
const interviewAreas=Array.isArray(a.interviewAreas)?a.interviewAreas:[];
const sourceText=[...skills,...gaps,...learningPath,...interviewAreas,a.summary||""].join(" ");
const scored=TOPICS.map(topic=>({topic,score:scoreTopic(topic,sourceText)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
if(scored.length<6&&state.domain){TOPICS.forEach(topic=>{if(topicMatchesText(topic,state.domain)&&!scored.some(x=>x.topic===topic))scored.push({topic,score:3})})}
return scored.slice(0,18).map(x=>x.topic);
}

function renderLearningTopics(showAll=false){
const grid=$("learningGrid");
if(!grid)return;
if(!state.analysis&&!showAll){
grid.innerHTML=`<div class="card"><h3>🎯 Personalized learning is waiting</h3><p class="muted">Upload your resume and click <strong>Analyze with AI</strong>. CareerLab will then show learning topics based on your actual skills, gaps and interview areas.</p><button class="secondary" id="showAllTopicsBtn">Explore all topics →</button></div>`;
$("showAllTopicsBtn").addEventListener("click",()=>renderLearningTopics(true));
return;
}
const topics=showAll?TOPICS:getPersonalizedTopics();
const title=showAll?"📚 All CareerLab topics":"🎯 Recommended for your resume";
const description=showAll?"Explore the complete CareerLab topic library.":"These topics are selected from your resume analysis, skills, gaps and interview areas.";
const backButton=showAll&&state.analysis?`<button class="secondary" id="showRecommendedBtn">← Back to my recommendations</button>`:"";
if(!topics.length&&!showAll){
grid.innerHTML=`<div class="card"><h3>🎯 No strong matches yet</h3><p class="muted">Your resume was analyzed, but the returned skills did not map strongly to the topic library. You can explore all topics below.</p><button class="secondary" id="showAllTopicsBtn">Explore all topics →</button></div>`;
$("showAllTopicsBtn").addEventListener("click",()=>renderLearningTopics(true));
return;
}
grid.innerHTML=`<div class="card" style="grid-column:1/-1"><h3>${title}</h3><p class="muted">${description}</p>${backButton}</div>`+topics.map(topic=>`<div class="card"><h3>${esc(topic)}</h3><p class="muted">Purpose → real-world use → common mistakes → practical flow → interview explanation → follow-ups.</p><button class="secondary" data-topic="${esc(topic)}">Understand →</button></div>`).join("");
grid.querySelectorAll("button[data-topic]").forEach(button=>{button.addEventListener("click",()=>{$("exploreMode").value="experience";$("exploreTopic").value=button.dataset.topic;$("exploreQuestion").value="Teach me this for an interview. Separate general knowledge from what my resume proves.";document.querySelector("#experience").scrollIntoView({behavior:"smooth"});explore()})});
if(showAll&&state.analysis)$("showRecommendedBtn").addEventListener("click",()=>renderLearningTopics(false));
}

async function analyze(){
if(!state.resumeText){alert("Upload a resume first.");return}
$("analysisSummary").textContent="Analyzing your resume…";
try{
const d=await api({mode:"resume_analysis",domain:state.domain,resumeText:redact(state.resumeText)});
const j=parseJson(d.answer)||{};
state.analysis=j;
state.skills=Array.isArray(j.skills)?j.skills:[];
const score=Math.max(0,Math.min(100,Number(j.score)||0));
$("score").textContent=score+"/100";
$("scorebar").style.width=score+"%";
$("scoreReason").textContent=j.summary||"Analysis completed.";
$("analysisSummary").textContent=[
j.strengths?.length?"Strengths:\n• "+j.strengths.join("\n• "):"",
j.gaps?.length?"Gaps:\n• "+j.gaps.join("\n• "):"",
j.evidenceWarnings?.length?"Evidence warnings:\n• "+j.evidenceWarnings.join("\n• "):"",
j.interviewAreas?.length?"Interview areas:\n• "+j.interviewAreas.join("\n• "):"",
j.learningPath?.length?"Learning path:\n• "+j.learningPath.join("\n• "):""
].filter(Boolean).join("\n\n")||d.answer;
const tags=[...new Set([...state.skills,...(j.interviewAreas||[])])];
$("skillMap").className="skillmap";
$("skillMap").innerHTML=tags.map(x=>`<span class="skill">${esc(x)}</span>`).join("")||"No supported skills detected yet.";
renderLearningTopics(false);
}catch(e){$("analysisSummary").textContent="⚠️ "+e.message}
}

function renderSources(sources){
$("exploreSources").innerHTML=(sources||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title||s.url)}</a>`).join("");
}

function renderDiagram(answer){
const m=String(answer||"").match(/```mermaid\s*([\s\S]*?)```/i);
if(m)$("diagramText").textContent=m[1].trim();
}

async function explore(){
if(!state.resumeText){alert("Upload a resume first.");return}
$("exploreOutput").textContent="Thinking…";
$("exploreSources").innerHTML="";
try{
const d=await api({mode:$("exploreMode").value,resumeText:redact(state.resumeText),domain:state.domain,topic:$("exploreTopic").value,question:$("exploreQuestion").value});
$("exploreOutput").textContent=d.answer||"No answer returned.";
renderSources(d.sources);
renderDiagram(d.answer);
}catch(e){$("exploreOutput").textContent="⚠️ "+e.message}
}

async function startInterview(){
if(!state.resumeText){alert("Upload a resume first.");return}
state.interview={running:true,type:$("interviewType").value,difficulty:$("difficulty").value,question:"",turns:[]};
$("chat").innerHTML="";
$("interviewState").textContent="Interview running · one question at a time · resume evidence first";
await nextInterview("Start the interview. Ask one realistic question based on the resume.");
}

async function nextInterview(instruction){
try{
const d=await api({mode:"mock_interview",resumeText:redact(state.resumeText),domain:state.domain,interviewType:state.interview.type,difficulty:state.interview.difficulty,history:state.interview.turns,instruction});
state.interview.question=d.answer||"Tell me about one project on your resume.";
$("chat").insertAdjacentHTML("beforeend",`<div class="msg ai">${esc(state.interview.question)}</div>`);
$("chat").scrollTop=$("chat").scrollHeight;
}catch(e){$("chat").insertAdjacentHTML("beforeend",`<div class="msg ai">⚠️ ${esc(e.message)}</div>`)}
}

async function answerInterview(){
const answer=$("answerInput").value.trim();
if(!answer||!state.interview.running)return;
$("chat").insertAdjacentHTML("beforeend",`<div class="msg user">${esc(answer)}</div>`);
state.interview.turns.push({question:state.interview.question,answer});
$("answerInput").value="";
await nextInterview("Briefly evaluate the answer in 2-3 lines, then ask one focused follow-up question. If the answer claims unsupported experience, ask the candidate to verify it.");
}

function stopInterview(){
state.interview.running=false;
$("interviewState").textContent="Interview ended. Your interview data remains only in this page memory until you reload or delete the resume.";
}

function populate(){
$("careerDomain").innerHTML=DOMAINS.map(d=>`<option>${esc(d)}</option>`).join("");
$("careerDomain").value=state.domain;
renderLearningTopics();
fetch("sources.json").then(r=>r.json()).then(x=>$("sourceList").innerHTML=x.official.map(a=>`<a href="${esc(a[1])}" target="_blank" rel="noopener noreferrer">${esc(a[0])}</a>`).join("")).catch(()=>{});
}

$("resumeFile").addEventListener("change",e=>loadResume(e.target.files[0]));
$("deleteBtn").addEventListener("click",()=>{if(!state.resumeText){alert("No resume is currently loaded.");return}if(confirm("Delete this resume session now? This clears resume text, analysis, skills and interview state."))resetResumeUI(true)});
$("analyzeBtn").addEventListener("click",analyze);
$("exploreBtn").addEventListener("click",explore);
$("clearOutputBtn").addEventListener("click",()=>{$("exploreOutput").textContent="Answer cleared.";$("exploreSources").innerHTML=""});
$("startInterview").addEventListener("click",startInterview);
$("stopInterview").addEventListener("click",stopInterview);
$("answerBtn").addEventListener("click",answerInterview);
$("answerInput").addEventListener("keydown",e=>{if(e.key==="Enter")answerInterview()});
$("careerDomain").addEventListener("change",e=>{state.domain=e.target.value;renderLearningTopics(false)});
$("architectureBtn").addEventListener("click",()=>{$("exploreMode").value="project";$("exploreTopic").value=$("exploreTopic").value||"My main project";$("exploreQuestion").value="Explain the project architecture, distinguish resume evidence from a generic reference architecture, and give a Mermaid sequence/flow diagram.";document.querySelector("#experience").scrollIntoView({behavior:"smooth"});explore()});
$("copyDiagram").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("diagramText").textContent);alert("Mermaid copied.")}catch{alert("Copy is not available in this browser.")}});
populate();
resetResumeUI(true);
  "Other IT",
  "Other Non-IT",
  "Custom"
];
const TOPICS = [
  // IT / Software
  "Software Development",
  "Frontend Development",
  "Backend Development",
  "Full Stack Development",
  "Mobile Development",
  "Java",
  "Python",
  "JavaScript / TypeScript",
  "C / C++",
  "Data Structures & Algorithms",
  "Object-Oriented Programming",
  "Database / SQL",
  "REST APIs",
  "API Integration",
  "System Design",
  "Solution Architecture",

  // Service Management / Enterprise IT
  "Incident Management",
  "Problem Management",
  "Change Management",
  "Release Management",
  "CMDB",
  "CSDM",
  "ITSM",
  "ITOM",
  "Service Catalog",
  "Flow Designer",
  "Business Rules",
  "Client Scripts",
  "Virtual Agent",
  "Now Assist / AI",

  // Cloud / DevOps
  "Cloud Architecture",
  "AWS",
  "Microsoft Azure",
  "Google Cloud",
  "DevOps",
  "CI/CD",
  "Docker",
  "Kubernetes",
  "Site Reliability Engineering",
  "Infrastructure as Code",

  // Data / AI
  "Data Engineering",
  "Data Science",
  "Machine Learning",
  "Generative AI",
  "Prompt Engineering",
  "AI Agents",
  "Data Analytics",
  "SQL Analytics",

  // Security
  "Cybersecurity",
  "Application Security",
  "Cloud Security",
  "Network Security",
  "Security Operations",
  "OWASP",

  // Testing
  "Software Testing",
  "Manual Testing",
  "Automation Testing",
  "API Testing",
  "Performance Testing",
  "Quality Assurance",

  // Business
  "Business Analysis",
  "Product Management",
  "Project Management",
  "Program Management",
  "Operations Management",
  "Process Improvement",
  "Consulting",

  // Finance
  "Financial Analysis",
  "Accounting",
  "Banking",
  "Investment Banking",
  "Audit",
  "Taxation",
  "Risk Management",
  "FinTech",

  // Sales / Marketing
  "Sales",
  "Business Development",
  "Marketing",
  "Digital Marketing",
  "Product Marketing",
  "Market Research",
  "Customer Success",
  "Customer Support",

  // HR
  "Human Resources",
  "Recruitment",
  "Talent Acquisition",
  "Learning & Development",
  "Payroll",
  "Employee Relations",

  // Core Engineering
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Electronics Engineering",
  "Automobile Engineering",
  "Aerospace Engineering",
  "Manufacturing",
  "Production Engineering",
  "Industrial Engineering",
  "Quality Engineering",

  // Professional
  "Healthcare",
  "Pharmaceutical",
  "Legal",
  "Education",
  "Research",
  "Architecture / Design",
  "Content Writing",
  "Media",
  "Hospitality",
  "Retail",
  "Logistics",
  "Entrepreneurship"
];
let state = { fileName:"", resumeText:"", skills:[], analysis:null, domain:"ServiceNow", interview:{running:false,type:"",difficulty:"Medium",question:"",turns:[]} };
const $ = id => document.getElementById(id);
const esc = x => String(x ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const redact = x => String(x||"").replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,"[EMAIL]").replace(/\b(?:\+?\d[\d\s().-]{8,}\d)\b/g,"[PHONE]");

async function api(body){
  if(AI_ENDPOINT.includes("YOUR-SUBDOMAIN")){
    throw new Error(
      "Deploy the Cloudflare Worker first, then replace AI_ENDPOINT in app.js with your Worker URL."
    );
  }

  const r = await fetch(AI_ENDPOINT,{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify(body)
  });

  const d = await r.json().catch(()=>({}));

  if(!r.ok){
    const detail = d.detail || d.message || "";
    throw new Error(
      detail
        ? `${d.error || "AI request failed"}: ${detail}`
        : (d.error || "AI request failed")
    );
  }

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
    state.fileName=file.name;
state.resumeText=text;
state.skills=[];
state.analysis=null;

resetResumeUI(false);

$("fileStatus").innerHTML =
  "<span class='dot'></span>" +
  esc(file.name) +
  " · browser memory only";
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
