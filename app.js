const AI_ENDPOINT="https://careerlab-ai.leoaravind007.workers.dev";

const PLAN="free";

const DOMAINS=[
"ServiceNow","Software Engineering","Frontend Development","Backend Development","Full Stack Development","Mobile Development","Java","Python","JavaScript / TypeScript","C / C++","Data Structures & Algorithms","Data Engineering","Data Science","Artificial Intelligence / Machine Learning","Generative AI","Cloud / AWS","Microsoft Azure","Google Cloud","DevOps","SRE","Cybersecurity","Networking","Database / SQL","API / Integration","System Design","Solution Architecture","IT Support","IT Operations","ITSM","CRM","SAP","Salesforce","Testing / QA","Automation Testing","Embedded Systems","Electronics / Electrical","Mechanical / Engineering","Business Analysis","Product Management","Project Management","Program Management","Operations","Supply Chain","Procurement","Quality Management","Risk Management","Compliance","Consulting","Finance","Accounting","Banking","Investment Banking","Financial Analysis","Audit","Taxation","Insurance","FinTech","Sales","Business Development","Marketing","Digital Marketing","Product Marketing","Market Research","Customer Success","Customer Support","Human Resources","Recruitment / Talent Acquisition","Learning & Development","Payroll","Employee Relations","Mechanical Engineering","Civil Engineering","Electrical Engineering","Electronics Engineering","Automobile Engineering","Aerospace Engineering","Manufacturing","Production Engineering","Industrial Engineering","Quality Engineering","Healthcare","Pharmaceutical","Legal","Education","Research","Architecture / Design","Content / Writing","Media","Hospitality","Retail","Logistics","Entrepreneurship","Other IT","Other Non-IT","Custom"
];

const TOPICS=[
"Software Development","Frontend Development","Backend Development","Full Stack Development","Mobile Development","Java","Python","JavaScript / TypeScript","C / C++","Data Structures & Algorithms","Object-Oriented Programming","Database / SQL","REST APIs","API Integration","System Design","Solution Architecture","Incident Management","Problem Management","Change Management","Release Management","CMDB","CSDM","ITSM","ITOM","Service Catalog","Flow Designer","Business Rules","Client Scripts","Virtual Agent","Now Assist / AI","Cloud Architecture","AWS","Microsoft Azure","Google Cloud","DevOps","CI/CD","Docker","Kubernetes","Site Reliability Engineering","Infrastructure as Code","Data Engineering","Data Science","Machine Learning","Generative AI","Prompt Engineering","AI Agents","Data Analytics","SQL Analytics","Cybersecurity","Application Security","Cloud Security","Network Security","Security Operations","OWASP","Software Testing","Manual Testing","Automation Testing","API Testing","Performance Testing","Quality Assurance","Business Analysis","Product Management","Project Management","Program Management","Operations Management","Process Improvement","Consulting","Financial Analysis","Accounting","Banking","Investment Banking","Audit","Taxation","Risk Management","FinTech","Sales","Business Development","Marketing","Digital Marketing","Product Marketing","Market Research","Customer Success","Customer Support","Human Resources","Recruitment","Talent Acquisition","Learning & Development","Payroll","Employee Relations","Mechanical Engineering","Civil Engineering","Electrical Engineering","Electronics Engineering","Automobile Engineering","Aerospace Engineering","Manufacturing","Production Engineering","Industrial Engineering","Quality Engineering","Healthcare","Pharmaceutical","Legal","Education","Research","Architecture / Design","Content Writing","Media","Hospitality","Retail","Logistics","Entrepreneurship"
];

let state={
fileName:"",
resumeText:"",
skills:[],
analysis:null,
domain:"ServiceNow",
isPro:localStorage.getItem("careerlab_plan")==="pro",
interview:{
running:false,
type:"",
difficulty:"Medium",
question:"",
turns:[]
}
};

const $=id=>document.getElementById(id);

const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({
"&":"&amp;",
"<":"&lt;",
">":"&gt;",
"\"":"&quot;",
"'":"&#039;"
}[c]));

const redact=x=>String(x||"")
.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,"[EMAIL]")
.replace(/\b(?:\+?\d[\d\s().-]{8,}\d)\b/g,"[PHONE]");

async function api(body){

  if(!AI_ENDPOINT){
    throw new Error("AI endpoint is not configured.");
  }

  const r=await fetch(AI_ENDPOINT,{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify(body)
  });

  const d=await r.json().catch(()=>({}));

  if(!r.ok){
    throw new Error(
      d.detail
      ? `${d.error||"AI request failed"}: ${d.detail}`
      : (d.error||"AI request failed")
    );
  }

  return d;
}

function parseJson(text){

  try{
    return JSON.parse(text);
  }catch{}

  const m=String(text||"").match(/\{[\s\S]*\}/);

  if(!m)return null;

  try{
    return JSON.parse(m[0]);
  }catch{
    return null;
  }
}

async function pdfText(file){

  const pdfjs=await import(
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs"
  );

  pdfjs.GlobalWorkerOptions.workerSrc=
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

  const pdf=await pdfjs.getDocument({
    data:await file.arrayBuffer()
  }).promise;

  const pages=[];

  for(let i=1;i<=pdf.numPages;i++){

    const page=await pdf.getPage(i);

    const content=await page.getTextContent();

    pages.push(
      content.items.map(x=>x.str).join(" ")
    );
  }

  return pages.join("\n");
}

async function docxText(file){

  if(!window.mammoth){
    throw new Error(
      "DOCX parser is still loading. Try again in a moment."
    );
  }

  const result=await window.mammoth.extractRawText({
    arrayBuffer:await file.arrayBuffer()
  });

  return result.value;
}

async function loadResume(file){

  if(!file)return;

  if(file.size>8*1024*1024){
    alert("Please upload a resume smaller than 8 MB.");
    return;
  }

  $("fileStatus").innerHTML=
    "<span class='dot'></span>Reading resume locally…";

  try{

    let text;

    if(file.name.toLowerCase().endsWith(".pdf")){
      text=await pdfText(file);
    }else if(file.name.toLowerCase().endsWith(".docx")){
      text=await docxText(file);
    }else{
      throw new Error("Please upload a PDF or DOCX file.");
    }

    text=text
      .replace(/\u0000/g,"")
      .replace(/[ \t]+\n/g,"\n")
      .slice(0,36000)
      .trim();

    if(text.length<80){
      throw new Error(
        "Not enough readable text. Try a text-based PDF or DOCX."
      );
    }

    state.fileName=file.name;
    state.resumeText=text;
    state.skills=[];
    state.analysis=null;

    resetResumeUI(false);

    $("fileStatus").innerHTML=
      "<span class='dot'></span>"+
      esc(file.name)+
      " · browser memory only";

  }catch(e){

    $("fileStatus").textContent=
      "⚠️ "+e.message;
  }
}

function resetResumeUI(full=true){

  if(full){

    state={
      fileName:"",
      resumeText:"",
      skills:[],
      analysis:null,
      domain:$("careerDomain")?.value||"ServiceNow",
      isPro:localStorage.getItem("careerlab_plan")==="pro",
      interview:{
        running:false,
        type:"",
        difficulty:"Medium",
        question:"",
        turns:[]
      }
    };

    if($("resumeFile")){
      $("resumeFile").value="";
    }
  }

  $("score").textContent="—";

  $("scorebar").style.width="0";

  $("scoreReason").textContent=
    "Upload a resume to generate analysis.";

  $("analysisSummary").textContent=
    "Your resume-specific analysis will appear here.";

  $("skillMap").innerHTML=
    "Your supported skills, evidence warnings and interview areas will appear here.";

  $("skillMap").className="skillmap empty";

  $("exploreOutput").textContent=
    "Upload a resume and ask a question.";

  $("exploreSources").innerHTML="";

  $("diagramText").textContent=
    "Your Mermaid flow or sequence diagram will appear here.";

  $("chat").innerHTML=
    "<div class='msg ai'>Start a mock interview and I will ask one question at a time.</div>";

  $("sampleAnswer").textContent=
    "Sample answer guidance will appear after you submit an interview answer.";

  $("interviewState").textContent=
    "No interview running.";

  $("fileStatus").innerHTML=
    "<span class='dot'></span>No resume loaded";
}

async function analyze(){

  if(!state.resumeText){
    alert("Upload a resume first.");
    return;
  }

  $("analysisSummary").textContent=
    "Analyzing your resume…";

  $("analyzeBtn").disabled=true;

  $("analyzeBtn").textContent=
    "Analyzing…";

  try{

    const d=await api({
      mode:"resume_analysis",
      domain:state.domain,
      resumeText:redact(state.resumeText)
    });

    const j=parseJson(d.answer)||{};

    state.analysis=j;

    state.skills=
      Array.isArray(j.skills)
      ?j.skills
      :[];

    const score=Math.max(
      0,
      Math.min(
        100,
        Number(j.score)||0
      )
    );

    $("score").textContent=
      score+"/100";

    $("scorebar").style.width=
      score+"%";

    $("scoreReason").textContent=
      j.summary||
      "Analysis completed.";

    $("analysisSummary").textContent=[
      j.strengths?.length
      ?"Strengths:\n• "+j.strengths.join("\n• "):"",

      j.gaps?.length
      ?"Gaps:\n• "+j.gaps.join("\n• "):"",

      j.evidenceWarnings?.length
      ?"Evidence warnings:\n• "+j.evidenceWarnings.join("\n• "):"",

      j.interviewAreas?.length
      ?"Interview areas:\n• "+j.interviewAreas.join("\n• "):"",

      j.learningPath?.length
      ?"Learning path:\n• "+j.learningPath.join("\n• "):""

    ].filter(Boolean).join("\n\n")||
      d.answer||
      "Analysis completed.";

    const tags=[
      ...new Set([
        ...state.skills,
        ...(j.interviewAreas||[])
      ])
    ];

    $("skillMap").className="skillmap";

    $("skillMap").innerHTML=
      tags.length
      ?tags.map(x=>`<span class="skill">${esc(x)}</span>`).join("")
      :"No supported skills detected yet.";

    updateJobDefaults();

  }catch(e){

    $("analysisSummary").textContent=
      "⚠️ "+e.message;

  }finally{

    $("analyzeBtn").disabled=false;

    $("analyzeBtn").textContent=
      "Analyze My Resume";
  }
}

function renderSources(sources){

  $("exploreSources").innerHTML=
    (sources||[])
    .map(s=>
      `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title||s.url)}</a>`
    )
    .join("");
}

function renderDiagram(answer){

  const m=String(answer||"")
    .match(/```mermaid\s*([\s\S]*?)```/i);

  if(m){
    $("diagramText").textContent=
      m[1].trim();
  }
}

async function explore(){

  if(!state.resumeText){
    alert("Upload a resume first.");
    return;
  }

  const mode=$("exploreMode").value;

  const proModes=[
    "project",
    "skill_gap"
  ];

  if(proModes.includes(mode)&&!state.isPro){

    openUpgrade();

    $("exploreOutput").textContent=
      "This feature is available in CareerLab Pro.";

    return;
  }

  $("exploreOutput").textContent=
    "Thinking…";

  $("exploreSources").innerHTML="";

  try{

    const d=await api({
      mode,
      resumeText:redact(state.resumeText),
      domain:state.domain,
      topic:$("exploreTopic").value,
      question:$("exploreQuestion").value
    });

    $("exploreOutput").textContent=
      d.answer||
      "No answer returned.";

    renderSources(d.sources);

    renderDiagram(d.answer);

  }catch(e){

    $("exploreOutput").textContent=
      "⚠️ "+e.message;
  }
}

function openUpgrade(){
  $("upgradeModal").classList.remove("hidden");
}

function closeUpgrade(){
  $("upgradeModal").classList.add("hidden");
}

function activateTestPro(){

  state.isPro=true;

  localStorage.setItem(
    "careerlab_plan",
    "pro"
  );

  updatePlanUI();

  closeUpgrade();

  alert(
    "CareerLab Pro test mode activated."
  );
}

function updatePlanUI(){

  const badge=$("planBadge");

  if(state.isPro){

    badge.textContent="PRO";

    badge.className="plan pro";

    $("upgradeBtn").textContent=
      "Pro Active";

  }else{

    badge.textContent="FREE";

    badge.className="plan free";

    $("upgradeBtn").textContent=
      "Upgrade to Pro";
  }
}

async function startInterview(){

  if(!state.resumeText){
    alert("Upload a resume first.");
    return;
  }

  state.interview={
    running:true,
    type:$("interviewType").value,
    difficulty:$("difficulty").value,
    question:"",
    turns:[]
  };

  $("chat").innerHTML="";

  $("interviewState").textContent=
    "Interview running · one question at a time · resume evidence first";

  await nextInterview(
    "Start the interview. Ask one realistic question based on the resume."
  );
}

async function nextInterview(instruction){

  try{

    const d=await api({
      mode:"mock_interview",
      resumeText:redact(state.resumeText),
      domain:state.domain,
      interviewType:state.interview.type,
      difficulty:state.interview.difficulty,
      history:state.interview.turns,
      instruction
    });

    state.interview.question=
      d.answer||
      "Tell me about one project on your resume.";

    $("chat").insertAdjacentHTML(
      "beforeend",
      `<div class="msg ai">${esc(state.interview.question)}</div>`
    );

    $("chat").scrollTop=
      $("chat").scrollHeight;

  }catch(e){

    $("chat").insertAdjacentHTML(
      "beforeend",
      `<div class="msg ai">⚠️ ${esc(e.message)}</div>`
    );
  }
}

async function evaluateInterviewAnswer(answer){

  if(!state.isPro){

    $("sampleAnswer").textContent=
      "Upgrade to CareerLab Pro for detailed answer improvement and sample answer guidance.";

    return;
  }

  try{

    const d=await api({
      mode:"experience",
      resumeText:redact(state.resumeText),
      domain:state.domain,
      topic:state.interview.question,
      question:
        `The interviewer asked: "${state.interview.question}"

The candidate answered:
"${answer}"

Evaluate this interview answer.

Explain:
1. What is good
2. What is missing
3. What may be inaccurate or unsupported
4. How the candidate can improve it
5. Give a SAMPLE ANSWER TEMPLATE using placeholders where resume evidence is missing.

Do not invent experience.`
    });

    $("sampleAnswer").textContent=
      d.answer||
      "No sample guidance returned.";

  }catch(e){

    $("sampleAnswer").textContent=
      "⚠️ "+e.message;
  }
}

async function answerInterview(){

  const answer=
    $("answerInput").value.trim();

  if(
    !answer||
    !state.interview.running
  ){
    return;
  }

  $("chat").insertAdjacentHTML(
    "beforeend",
    `<div class="msg user">${esc(answer)}</div>`
  );

  state.interview.turns.push({
    question:state.interview.question,
    answer
  });

  $("answerInput").value="";

  $("chat").insertAdjacentHTML(
    "beforeend",
    `<div class="msg ai">Checking your answer…</div>`
  );

  $("chat").scrollTop=
    $("chat").scrollHeight;

  await evaluateInterviewAnswer(answer);

  const messages=
    $("chat").querySelectorAll(".msg.ai");

  const last=
    messages[messages.length-1];

  if(last&&last.textContent==="Checking your answer…"){
    last.remove();
  }

  await nextInterview(
    "Briefly evaluate the previous answer in 2-3 lines, then ask one focused follow-up question. If the answer claims unsupported experience, ask the candidate to verify it."
  );
}

function stopInterview(){

  state.interview.running=false;

  $("interviewState").textContent=
    "Interview ended. Your interview data remains only in this page memory until you reload or delete the resume.";
}

function populate(){

  $("careerDomain").innerHTML=
    DOMAINS
    .map(d=>`<option>${esc(d)}</option>`)
    .join("");

  $("careerDomain").value=
    state.domain;

  $("learningGrid").innerHTML=
    TOPICS.map(t=>
      `<div class="card">
        <h3>${esc(t)}</h3>
        <p class="muted">
          Purpose → real-world use → common mistakes →
          practical flow → interview explanation → follow-ups.
        </p>
        <button class="secondary" data-topic="${esc(t)}">
          Understand →
        </button>
      </div>`
    ).join("");

  document
    .querySelectorAll("#learningGrid button")
    .forEach(b=>{

      b.addEventListener(
        "click",
        ()=>{

          $("exploreMode").value=
            "experience";

          $("exploreTopic").value=
            b.dataset.topic;

          $("exploreQuestion").value=
            "Teach me this for an interview. Separate general knowledge from what my resume proves.";

          document
            .querySelector("#experience")
            .scrollIntoView({
              behavior:"smooth"
            });

          explore();
        }
      );

    });
}

function updateJobDefaults(){

  if(state.skills.length){

    $("jobKeyword").value=
      state.skills.slice(0,2).join(" ");
  }else{

    $("jobKeyword").value=
      state.domain;
  }
}

function buildJobLinks(keyword,location){

  const q=
    encodeURIComponent(
      `${keyword} ${location}`.trim()
    );

  const title=
    encodeURIComponent(
      keyword||state.domain
    );

  const loc=
    encodeURIComponent(
      location||""
    );

  return [

    {
      name:"LinkedIn Jobs",
      url:`https://www.linkedin.com/jobs/search/?keywords=${title}&location=${loc}`
    },

    {
      name:"Indeed",
      url:`https://www.indeed.com/jobs?q=${q}`
    },

    {
      name:"Google Jobs",
      url:`https://www.google.com/search?q=${q}+jobs`
    },

    {
      name:"Glassdoor",
      url:`https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword=${title}`
    },

    {
      name:"Naukri",
      url:`https://www.naukri.com/${keyword.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-jobs`
    }

  ];
}

function searchJobs(){

  if(!state.isPro){

    openUpgrade();

    return;
  }

  if(!state.resumeText){

    alert(
      "Upload and analyze your resume first."
    );

    return;
  }

  const keyword=
    $("jobKeyword").value.trim()||
    state.skills.slice(0,2).join(" ")||
    state.domain;

  const location=
    $("jobLocation").value.trim();

  const jobs=
    buildJobLinks(
      keyword,
      location
    );

  $("jobResults").innerHTML=
    jobs.map(job=>
      `<div class="job-card">
        <div>
          <h3>${esc(job.name)}</h3>
          <p>
            Search for "${esc(keyword)}"
            ${location?`in ${esc(location)}`:""}
          </p>
        </div>
        <a
          href="${esc(job.url)}"
          target="_blank"
          rel="noopener noreferrer"
          class="primary"
          style="padding:10px 14px;border-radius:9px;color:white"
        >
          Search Jobs →
        </a>
      </div>`
    ).join("");
}

$("resumeFile").addEventListener(
  "change",
  e=>loadResume(e.target.files[0])
);

$("deleteBtn").addEventListener(
  "click",
  ()=>{

    if(!state.resumeText){

      alert(
        "No resume is currently loaded."
      );

      return;
    }

    if(
      confirm(
        "Delete this resume session now? This clears resume text, analysis, skills and interview state."
      )
    ){

      resetResumeUI(true);
    }
  }
);

$("analyzeBtn").addEventListener(
  "click",
  analyze
);

$("exploreBtn").addEventListener(
  "click",
  explore
);

$("clearOutputBtn").addEventListener(
  "click",
  ()=>{

    $("exploreOutput").textContent=
      "Answer cleared.";

    $("exploreSources").innerHTML="";

    $("diagramText").textContent=
      "Your Mermaid flow or sequence diagram will appear here.";
  }
);

$("startInterview").addEventListener(
  "click",
  startInterview
);

$("stopInterview").addEventListener(
  "click",
  stopInterview
);

$("answerBtn").addEventListener(
  "click",
  answerInterview
);

$("answerInput").addEventListener(
  "keydown",
  e=>{

    if(
      e.key==="Enter"&&
      !e.shiftKey
    ){

      e.preventDefault();

      answerInterview();
    }
  }
);

$("careerDomain").addEventListener(
  "change",
  e=>{

    state.domain=
      e.target.value;

    updateJobDefaults();
  }
);

$("architectureBtn").addEventListener(
  "click",
  ()=>{

    if(!state.isPro){

      openUpgrade();

      return;
    }

    $("exploreMode").value=
      "project";

    $("exploreTopic").value=
      $("exploreTopic").value||
      "My main project";

    $("exploreQuestion").value=
      "Explain the project architecture, distinguish resume evidence from a generic reference architecture, and give a Mermaid sequence/flow diagram.";

    document
      .querySelector("#experience")
      .scrollIntoView({
        behavior:"smooth"
      });

    explore();
  }
);

$("copyDiagram").addEventListener(
  "click",
  async()=>{

    try{

      await navigator.clipboard.writeText(
        $("diagramText").textContent
      );

      alert(
        "Mermaid copied."
      );

    }catch{

      alert(
        "Copy is not available in this browser."
      );
    }
  }
);

$("upgradeBtn").addEventListener(
  "click",
  ()=>{

    if(state.isPro){

      alert(
        "CareerLab Pro is active."
      );

    }else{

      openUpgrade();
    }
  }
);

$("pricingUpgradeBtn").addEventListener(
  "click",
  openUpgrade
);

$("closeModal").addEventListener(
  "click",
  closeUpgrade
);

$("activateTestPro").addEventListener(
  "click",
  activateTestPro
);

$("jobSearchBtn").addEventListener(
  "click",
  searchJobs
);

populate();

updatePlanUI();

resetResumeUI(true);

updateJobDefaults();
