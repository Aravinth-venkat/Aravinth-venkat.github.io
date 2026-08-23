const state = {
  resumeFile: null,
  resumeText: "",
  career: "ServiceNow",
  currentQuestion: null,
  questionIndex: 0,
  aiEndpoint: localStorage.getItem("careerLabAiEndpoint") || "",
  sessionId: crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
};

const topics = {
  ServiceNow:["Incident Management","Problem Management","Change Management","Release Management","CMDB","CSDM","REST Integration","Flow Designer","Business Rules","Client Scripts","Virtual Agent","Now Assist / AI","ITOM","Service Catalog"],
  Java:["Core Java","OOP","Collections","Streams","Concurrency","Spring Boot","REST APIs","JVM","SQL","Testing","Microservices"],
  Python:["Python Core","OOP","Data Structures","FastAPI","Django","REST APIs","Testing","AsyncIO","SQL","Automation"],
  "Full Stack":["HTML/CSS","JavaScript","React","Node.js","REST APIs","Authentication","Databases","Testing","Deployment","System Design"],
  Networking:["OSI Model","TCP/IP","DNS","DHCP","Routing","Switching","VPN","Firewalls","Troubleshooting","Monitoring"],
  "IT Support":["Incident Triage","Windows/Linux","Networking","Active Directory","Ticket Handling","SLA","Remote Support","Root Cause","Escalation","Knowledge Management"],
  Mechanical:["Engineering Drawing","Quality","Manufacturing","CNC/Lathe","Materials","Inspection","Maintenance","Root Cause","Safety","Production"]
};

const questions = {
  ServiceNow:[
    ["Tell me about a ServiceNow project you actually worked on. Walk me through the business problem, your role and the solution.","REALISTIC"],
    ["Explain a REST integration you implemented. How did you handle authentication, failures and logging?","TECHNICAL"],
    ["You mention CMDB on your resume. Explain identification and reconciliation in a real scenario.","DEEP DIVE"],
    ["A production change caused an incident. How would you investigate and communicate it?","SCENARIO"]
  ],
  Java:[
    ["Explain a Java project you worked on and one difficult production issue you solved.","REALISTIC"],
    ["Why would you use an interface instead of a concrete class? Give a practical example.","TECHNICAL"],
    ["How would you diagnose a slow Java service in production?","SCENARIO"]
  ],
  Python:[
    ["Explain a Python automation or application you built and how you tested it.","REALISTIC"],
    ["When would you use async programming in Python?","TECHNICAL"],
    ["A Python API is slow in production. How would you investigate it?","SCENARIO"]
  ],
  "Full Stack":[
    ["Walk me through a full-stack feature you built from browser to database.","REALISTIC"],
    ["How would you secure a REST API used by a browser application?","TECHNICAL"],
    ["A page is slow only for some users. How would you troubleshoot it?","SCENARIO"]
  ],
  Networking:[
    ["Describe a network issue you handled and how you isolated the root cause.","REALISTIC"],
    ["Explain what happens when a user enters a website URL in a browser.","TECHNICAL"],
    ["Users can reach some sites but not others. What would you check?","SCENARIO"]
  ],
  "IT Support":[
    ["Describe a difficult support ticket and how you handled the user and the technical problem.","REALISTIC"],
    ["How do you prioritize multiple incidents with different business impact?","SCENARIO"],
    ["A user's machine is connected to Wi-Fi but cannot access internal applications. What do you check?","TECHNICAL"]
  ],
  Mechanical:[
    ["Explain a manufacturing or quality problem you worked on and how you solved it.","REALISTIC"],
    ["How would you investigate repeated dimensional defects from a machine?","SCENARIO"],
    ["Explain how you would communicate a technical problem to a non-technical manager.","BEHAVIORAL"]
  ]
};

const sources = [
  ["ServiceNow Docs","https://www.servicenow.com/docs/","Official documentation"],
  ["ServiceNow Developer","https://developer.servicenow.com/","Official developer resources"],
  ["Oracle Java Docs","https://docs.oracle.com/en/java/","Official Java documentation"],
  ["Python Docs","https://docs.python.org/3/","Official Python documentation"],
  ["MDN Web Docs","https://developer.mozilla.org/","Web platform reference"],
  ["Microsoft Learn","https://learn.microsoft.com/","Official Microsoft technical docs"],
  ["AWS Documentation","https://docs.aws.amazon.com/","Official AWS documentation"],
  ["Cisco Documentation","https://www.cisco.com/c/en/us/support/index.html","Official networking documentation"],
  ["GitHub Docs","https://docs.github.com/","Official GitHub documentation"]
];

const $ = id => document.getElementById(id);

function renderTopics() {
  const career = $("careerSelect").value;
  $("topicGrid").innerHTML = topics[career].map(t => `
    <article class="card topic">
      <span class="pill">${career}</span>
      <h3>${escapeHtml(t)}</h3>
      <p>Purpose → real example → common mistakes → practical flow → interview explanation → follow-up questions.</p>
      <button class="linkbtn" data-topic="${escapeAttr(t)}">Understand →</button>
    </article>`).join("");
}

function renderSources() {
  $("sourceGrid").innerHTML = sources.map(s => `
    <a class="source" href="${s[1]}" target="_blank" rel="noopener noreferrer">
      <strong>${escapeHtml(s[0])}</strong><small>${escapeHtml(s[2])}</small>
    </a>`).join("");
}

function setQuestion() {
  const career = $("careerSelect").value;
  const list = questions[career] || questions.ServiceNow;
  const q = list[state.questionIndex % list.length];
  state.currentQuestion = q;
  $("questionText").textContent = q[0];
  $("difficultyTag").textContent = q[1];
  $("answerBox").value = "";
  $("interviewFeedback").innerHTML = "";
  state.questionIndex++;
}

function localEvaluate(answer, q) {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const hasStructure = /problem|situation|approach|solution|result|impact|because|then|finally|issue|customer|user/i.test(answer);
  const hasEvidence = /I |we |implemented|configured|built|tested|troubleshoot|resolved|monitored|measured/i.test(answer);
  if (words.length < 25) return {kind:"warn", html:"Your answer is too short for a strong interview response. Add <strong>context → your responsibility → action → result</strong>."};
  if (!hasEvidence) return {kind:"warn", html:"You explained the concept, but I cannot hear enough evidence of <strong>your own work</strong>. Add what you personally configured, tested, fixed or communicated."};
  if (!hasStructure) return {kind:"warn", html:"Good start. Make the story easier to follow: <strong>problem → your role → action → result → lesson</strong>."};
  return {kind:"good", html:"Strong structure. For an even better answer, add one measurable result, one challenge and one technical detail you personally handled."};
}

function redactPII(text) {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,"[EMAIL REDACTED]")
    .replace(/(?:\+?\d[\d\s().-]{8,}\d)/g,"[PHONE REDACTED]")
    .replace(/https?:\/\/(www\.)?linkedin\.com\/[^\s)]+/gi,"[LINKEDIN REDACTED]");
}

async function extractPDF(file) {
  const pdfjs = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({data}).promise;
  let out = "";
  for (let i=1;i<=pdf.numPages;i++){
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map(x => x.str).join(" ") + "\n";
  }
  return out;
}

async function extractDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({arrayBuffer});
  return result.value || "";
}

function analyzeResume(text) {
  const lower = text.toLowerCase();
  const skillWords = [
    "servicenow","java","python","javascript","react","node","sql","rest","api","aws","azure",
    "network","linux","windows","support","cmdb","itom","flow designer","mechanical","quality",
    "manufacturing","cisco","spring boot","docker","git","incident","change","problem"
  ];
  const found = skillWords.filter(s => lower.includes(s));
  const hasMetrics = /\b\d+%|\b\d+\+?\s*(years?|months?|users?|tickets?|incidents?|clients?|systems?)\b/i.test(text);
  const hasAction = /\b(implemented|developed|built|automated|configured|designed|resolved|optimized|managed|supported|integrated)\b/i.test(text);
  const score = Math.min(95, 45 + found.length*3 + (hasMetrics?10:0) + (hasAction?10:0));
  $("resumeScore").textContent = score + "/100";
  $("resumeSummary").textContent = `Detected ${found.length} relevant skill/technology terms. This is a local heuristic, not a recruiter decision.`;
  const findings = [];
  if (!hasMetrics) findings.push("Add measurable impact where truthful: users, tickets, response time, automation time, defect reduction, SLA, etc.");
  if (!hasAction) findings.push("Use stronger action verbs and describe what you personally did.");
  if (!/project/i.test(text)) findings.push("Add 1–3 project stories with business problem, your role, solution and result.");
  if (!/responsib|experience/i.test(text)) findings.push("Make responsibilities and achievements clearly distinguishable.");
  $("resumeFindings").innerHTML = findings.length ? findings.map(x=>`<div class="finding">💡 ${escapeHtml(x)}</div>`).join("") : `<div class="finding">✓ Good baseline. Next step: practise interview questions from each resume claim.</div>`;
  $("skillMap").innerHTML = found.map(x=>`<span class="chip">${escapeHtml(x)}</span>`).join("") || `<span class="muted">No obvious technology keywords detected.</span>`;
}

function clearResume() {
  state.resumeFile = null;
  state.resumeText = "";
  $("resumeFile").value = "";
  $("resumeState").textContent = "No resume loaded";
  $("resumeScore").textContent = "—";
  $("resumeSummary").textContent = "Resume deleted from this browser session.";
  $("resumeFindings").innerHTML = "";
  $("skillMap").innerHTML = `<span class="muted">Resume memory cleared.</span>`;
}

async function loadResume(file) {
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) throw new Error("Please use a resume smaller than 8 MB.");
  const name = file.name.toLowerCase();
  let text = "";
  if (name.endsWith(".pdf")) text = await extractPDF(file);
  else if (name.endsWith(".docx")) text = await extractDocx(file);
  else throw new Error("Only PDF and DOCX are supported.");
  if (!text.trim()) throw new Error("Could not extract text. Try a text-based PDF or DOCX.");
  state.resumeFile = file.name;
  state.resumeText = text;
  $("resumeState").textContent = `${file.name} · in memory only`;
  analyzeResume(text);
}

async function askAI(prompt) {
  if (!state.aiEndpoint) return null;
  const payload = {
    sessionId: state.sessionId,
    career: $("careerSelect").value,
    prompt,
    resumeText: $("privacyRedact").checked ? redactPII(state.resumeText) : state.resumeText
  };
  const res = await fetch(state.aiEndpoint, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("AI service returned " + res.status);
  return await res.json();
}

$("careerSelect").addEventListener("change", () => { state.questionIndex=0; renderTopics(); setQuestion(); });
$("newInterview").addEventListener("click", setQuestion);
$("showHint").addEventListener("click", () => {
  $("interviewFeedback").className = "feedback warn";
  $("interviewFeedback").innerHTML = "<strong>Hint:</strong> Answer using <em>Situation/Problem → Your role → Actions → Technical detail → Result → What you learned</em>. Never invent a tool or responsibility you did not actually perform.";
});
$("evaluateAnswer").addEventListener("click", async () => {
  const answer = $("answerBox").value;
  if (!answer.trim()) return;
  try {
    const ai = await askAI(`Evaluate this candidate answer to the interview question. Do not invent facts. Give concise strengths, gaps, a better structure, and 2 follow-up questions. Question: ${state.currentQuestion?.[0]}\nCandidate answer:\n${answer}`);
    if (ai?.answer) {
      $("interviewFeedback").className = "feedback good";
      $("interviewFeedback").innerHTML = escapeHtml(ai.answer).replace(/\n/g,"<br>");
      return;
    }
  } catch(e) { console.warn(e); }
  const result = localEvaluate(answer, state.currentQuestion?.[0] || "");
  $("interviewFeedback").className = "feedback " + result.kind;
  $("interviewFeedback").innerHTML = result.html;
});

$("resumeFile").addEventListener("change", async e => {
  try { await loadResume(e.target.files[0]); }
  catch(err) { alert(err.message); clearResume(); }
});
$("clearResume").addEventListener("click", clearResume);
$("copyDiagram").addEventListener("click", async () => {
  await navigator.clipboard.writeText($("mermaidCode").textContent);
  $("copyDiagram").textContent = "Copied ✓";
  setTimeout(()=> $("copyDiagram").textContent="Copy Mermaid",1200);
});
document.addEventListener("click", e => {
  const btn = e.target.closest("[data-topic]");
  if (!btn) return;
  const topic = btn.dataset.topic;
  $("questionText").textContent = `Explain ${topic} as if you are in an interview.`;
  $("answerBox").focus();
  location.hash = "interview";
});

function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function escapeAttr(s){return escapeHtml(s).replace(/`/g,"&#96;");}

renderTopics();
renderSources();
setQuestion();

window.addEventListener("pagehide", () => {
  // Explicitly release resume data from the page's JS memory.
  state.resumeFile = null;
  state.resumeText = "";
});
