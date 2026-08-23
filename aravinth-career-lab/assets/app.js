
const CAREERS=[
["ServiceNow","ITSM, CMDB, ITOM, integrations, scripting, Flow Designer and AI.","🧩"],
["Java Developer","Java, Spring Boot, REST APIs, SQL, microservices and testing.","☕"],
["Python Developer","Python, APIs, automation, Django/FastAPI and testing.","🐍"],
["Full Stack","HTML, CSS, JavaScript, React, APIs, databases and deployment.","🌐"],
["Networking","TCP/IP, DNS, DHCP, routing, switching, VPN and troubleshooting.","📡"],
["IT / Application Support","Incidents, SLA, RCA, monitoring, escalation and communication.","🛠️"],
["Mechanical","Manufacturing, quality, CAD, inspection, machines and production.","⚙️"],
["Data / Database","SQL, data modeling, ETL, reporting, performance and data quality.","📊"]
];
const TOPICS={
"ServiceNow":["Incident Management","Problem Management","Change Management","Release Management","CMDB","CSDM","REST Integration","Flow Designer","Business Rules","Client Scripts","Virtual Agent","Now Assist / AI","ITOM","Service Catalog"],
"Java Developer":["Core Java","OOP","Collections","Spring Boot","REST API","Microservices","SQL","Testing","Docker","System Design"],
"Python Developer":["Python","OOP","FastAPI / Django","REST API","Automation","SQL","Testing","Async programming","Git"],
"Full Stack":["HTML/CSS","JavaScript","React","Node.js","REST API","Authentication","SQL/NoSQL","Testing","Deployment"],
"Networking":["OSI/TCP-IP","DNS","DHCP","Routing","Switching","NAT","VPN","Firewalls","Wi-Fi","Troubleshooting"],
"IT / Application Support":["Incident Management","SLA","Monitoring","RCA","Troubleshooting","Escalation","Change Management","Customer Communication"],
"Mechanical":["Manufacturing","Quality","Inspection","CAD","Production","Materials","Machines","Safety","Root Cause Analysis"],
"Data / Database":["SQL","Joins","Indexes","Normalization","Data Modeling","ETL","Data Quality","Performance","Reporting"]
};
const QUESTIONS={
"ServiceNow":["Explain your current project.","Business Rule vs Client Script?","Explain CMDB Identification and Reconciliation.","Design a REST integration.","How would you troubleshoot a P1 incident?"],
"Java Developer":["Explain dependency injection.","Design a REST API.","How do you handle exceptions?","Explain transactions.","Describe a production issue you solved."],
"Python Developer":["Explain decorators and generators.","How would you build a REST API?","How do you handle errors?","Explain async programming.","Describe an automation you built."],
"Full Stack":["Explain your architecture.","How does authentication work?","How does the browser call your backend?","How do you optimize a slow API?","Describe a production bug."],
"Networking":["What happens when a user opens a website?","How troubleshoot packet loss?","Explain DNS resolution.","TCP vs UDP?","Describe a difficult incident."],
"IT / Application Support":["Walk through your incident process.","How handle P1?","Explain SLA and escalation.","How perform RCA?","Describe a customer escalation."],
"Mechanical":["Explain your responsibilities.","How handle a quality issue?","Explain inspection.","Describe a production problem.","How approach root cause analysis?"],
"Data / Database":["Explain indexes.","How optimize a slow query?","Explain normalization.","Design an order database.","Describe a data-quality problem."]
};
function $(id){return document.getElementById(id)}
function layout(){
$("app").innerHTML=`<header class="top"><nav class="nav container"><a class="brand" href="#home">Aravinth<b>.CareerLab</b></a><div id="navlinks" class="navlinks"><a href="#learn">Learn</a><a href="#interview">Interview</a><a href="#resume">Resume</a><a href="#projects">Projects</a><a href="#diagram">Diagrams</a><a href="#mentor">AI Mentor</a></div><button class="btn menu" onclick="navlinks.classList.toggle('open')">☰</button></nav></header>
<main>
<section id="home" class="hero container"><div class="eyebrow">CAREER • SKILLS • INTERVIEW • CONFIDENCE</div><h1>Your experience is valuable. Learn how to explain it.</h1><p class="lead">A career preparation lab for IT and non-IT professionals. Understand real experience, improve skills, build stronger resumes and practice interviews without inventing experience.</p><div class="actions"><a class="btn primary" href="#interview">🎤 Start Mock Interview</a><a class="btn" href="#resume">📄 Improve Resume</a><a class="btn" href="#mentor">🤖 Ask Mentor</a></div></section>
<section class="section container"><div class="grid grid-3">${[["🧠","Experience Recovery","Forgot what you worked on years ago? Reconstruct the project using guided questions and create an honest interview explanation."],["🎤","Interview Confidence","Practice one question at a time and get feedback on structure, technical depth, clarity and confidence."],["🗺️","Personal Skill Map","See what you already know, what needs revision and what skills can move your career forward."]].map(x=>`<article class="card feature"><div class="icon">${x[0]}</div><h3>${x[1]}</h3><p class="muted">${x[2]}</p></article>`).join("")}</div></section>
<section id="learn" class="section container"><div class="eyebrow">CAREER ACADEMY</div><h2>Learn by career, not random questions.</h2><p class="muted">Choose a sector and get topics, examples, scenarios and interview questions.</p><div class="grid grid-3">${CAREERS.map(c=>`<article class="card topic-card"><div class="icon">${c[2]}</div><h3>${c[0]}</h3><p class="muted">${c[1]}</p><button class="btn" onclick="openCareer('${c[0]}')">Explore →</button></article>`).join("")}</div></section>
<section id="interview" class="section container"><div class="eyebrow">INTERVIEW LAB</div><h2>Practice like a real interview.</h2><div class="grid grid-2"><div class="card"><div class="field"><label>Career / role</label><select id="role">${CAREERS.map(c=>`<option>${c[0]}</option>`).join("")}</select></div><div class="field"><label>Experience</label><select><option>0–1 years</option><option>2–3 years</option><option>4–6 years</option><option>7+ years</option></select></div><div class="field"><label>Difficulty</label><select><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div><button class="btn primary" onclick="startInterview()">Start Interview</button></div><div class="card"><div id="interviewBox"><h3>What gets evaluated?</h3><p class="muted">Technical accuracy • Project explanation • Problem solving • Communication • Structure • Confidence.</p><div class="notice">If you forgot an old project detail, say what you genuinely remember and explain what you would verify. Never invent experience.</div></div></div></div></section>
<section id="resume" class="section container"><div class="eyebrow">RESUME STUDIO</div><h2>Turn responsibilities into professional evidence.</h2><div class="grid grid-2"><div class="card"><div class="field"><label>Paste your real experience</label><textarea id="resumeText" placeholder="Example: Worked on incidents, supported users and fixed production issues..."></textarea></div><button class="btn primary" onclick="improveResume()">Improve & Explain</button></div><div class="card"><div id="resumeResult"><h3>You'll receive</h3><p class="muted">A stronger version, why it is stronger, likely follow-up questions and a safe interview explanation.</p></div></div></div></section>
<section id="projects" class="section container"><div class="eyebrow">PROJECT LAB</div><h2>Understand your work visually.</h2><div class="grid grid-2"><div class="card"><h3>Experience → Architecture</h3><p class="muted">Convert a project description into responsibilities, systems, integrations, data flow and interview stories.</p><button class="btn" onclick="buildProjectMap()">Generate example map</button><div id="projectMap" style="margin-top:14px"></div></div><div class="card"><h3>Project thinking</h3><p class="muted">Requirements → design → implementation → testing → production → troubleshooting → improvement.</p><div>${["Requirements","Architecture","Implementation","Testing","Production","RCA","Optimization"].map(x=>`<span class="tag">${x}</span>`).join("")}</div></div></div></section>
<section id="diagram" class="section container"><div class="eyebrow">DIAGRAM LAB</div><h2>Explain technical ideas with visuals.</h2><div class="grid grid-2"><div class="card"><div class="field"><label>Describe a process</label><textarea id="diagramText" placeholder="User creates an incident, support investigates, escalation happens and issue is resolved."></textarea></div><button class="btn primary" onclick="makeDiagram()">Generate Flow</button></div><div class="card"><h3>Preview</h3><div id="diagramOut" class="diagram">Your flow will appear here.</div></div></div></section>
<section id="mentor" class="section container"><div class="eyebrow">AI CAREER MENTOR</div><h2>Ask questions without fear.</h2><div class="card chat"><div id="messages" class="messages"><div class="bubble bot">Hi! I'm your Career Mentor. Ask about interviews, resumes, explaining old experience, learning plans or technical topics.</div></div><div class="chatbar"><input id="chatInput" placeholder="How do I explain a project I worked on 2 years ago?"><button class="btn primary" onclick="askMentor()">Send</button></div></div></section>
</main><footer class="footer container">Aravinth Career Lab • Build skills, explain real experience, practice with confidence.</footer>`;
}
function openCareer(name){const topics=TOPICS[name]||[],qs=QUESTIONS[name]||[];document.querySelector("main").insertAdjacentHTML("beforeend",`<section class="section container"><div class="eyebrow">${name.toUpperCase()}</div><h2>${name} Learning Path</h2><p class="muted">Understand → visualize → practice → explain in an interview.</p><div class="grid grid-3">${topics.map(t=>`<article class="card"><h3>${t}</h3><p class="muted">Learn the purpose, real-world use, scenario, practice idea and interview angle.</p><button class="btn" onclick="topicExplain('${name}','${t.replace(/'/g,"\\'")}')">Understand →</button></article>`).join("")}</div><div class="card" style="margin-top:16px"><h3>Interview questions</h3>${qs.map((q,i)=>`<div class="notice" style="margin:8px 0"><b>${i+1}.</b> ${q}</div>`).join("")}</div></section>`);window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"})}
function topicExplain(career,topic){$("messages").insertAdjacentHTML("beforeend",`<div class="bubble user">Explain ${topic} for ${career}.</div><div class="bubble bot"><b>${topic}</b><br><br>Learn its purpose, where it is used, one real example, common mistakes and how you would explain it in an interview. Practice with a real example from your own experience.</div>`);location.hash="mentor"}
let interview={role:"",q:0,total:0};
function startInterview(){interview={role:$("role").value,q:0,total:0};renderQuestion()}
function renderQuestion(){const qs=QUESTIONS[interview.role],q=qs[interview.q];$("interviewBox").innerHTML=`<div class="eyebrow">QUESTION ${interview.q+1} / ${qs.length}</div><h3>${q}</h3><textarea id="answer" class="field textarea" style="width:100%;min-height:150px;padding:12px;border:1px solid var(--line);background:#061827;color:var(--text);border-radius:11px" placeholder="Type your genuine answer..."></textarea><div class="actions"><button class="btn primary" onclick="gradeAnswer()">Evaluate</button></div>`}
function gradeAnswer(){const a=$("answer").value.trim();if(!a)return;let s=Math.min(95,Math.max(35,45+a.split(/\s+/).length/4));if(/project|role|problem|solution|result|implemented|handled/i.test(a))s+=10;interview.total+=Math.min(100,Math.round(s));interview.q++;const qs=QUESTIONS[interview.role];if(interview.q<qs.length){$("interviewBox").innerHTML=`<div class="notice"><b>Feedback:</b> Add your role, problem, action, result and lesson. Keep it truthful.</div><div class="score">${Math.round(s)}/100</div><button class="btn primary" onclick="renderQuestion()">Next</button>`}else{const f=Math.round(interview.total/qs.length);$("interviewBox").innerHTML=`<div class="eyebrow">INTERVIEW COMPLETE</div><div class="score">${f}%</div><p class="muted">Focus next on project structure, technical depth and confident explanation.</p><div class="bar"><i style="width:${f}%"></i></div><button class="btn" onclick="startInterview()">Try again</button>`}}
function improveResume(){const t=$("resumeText").value.trim();if(!t)return;const improved=t.replace(/\bworked on\b/ig,"supported and contributed to").replace(/\bfixed\b/ig,"troubleshot and resolved");$("resumeResult").innerHTML=`<h3>Suggested version</h3><p>${improved}</p><div class="notice"><b>Why:</b> Use action + technical context + outcome. Be ready to explain every statement.</div><h3>Likely follow-ups</h3><div class="notice">What was your role?<br>What problem did you solve?<br>Which tools did you use?<br>How did you test it?<br>What happened in production?</div>`}
function buildProjectMap(){$("projectMap").innerHTML=`<div class="diagram">REQUIREMENT
   ↓
BUSINESS PROCESS
   ↓
ARCHITECTURE
 ├─ Application
 ├─ Database
 └─ Integrations
   ↓
IMPLEMENTATION
   ↓
TESTING
   ↓
PRODUCTION
   ↓
MONITORING / INCIDENT
   ↓
RCA → FIX → IMPROVEMENT</div>`}
function makeDiagram(){const t=$("diagramText").value.trim()||"User → Application → Processing → Database → Response";const p=t.split(/→|->|,/).map(x=>x.trim()).filter(Boolean);$("diagramOut").textContent=p.join("\n   ↓\n")}
function askMentor(){const q=$("chatInput").value.trim();if(!q)return;$("messages").insertAdjacentHTML("beforeend",`<div class="bubble user">${q.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>`);let a="Break your answer into context, your role, action, challenge, result and lesson. Explain only what you genuinely know.";if(/forgot|remember|old project|2 years/i.test(q))a="Use Experience Recovery: identify the project, users, tools, daily tasks, common incidents, your decisions and outcomes. Rebuild the story from facts you remember. If unsure, say what you remember and what you would verify instead of inventing.";if(/resume|cv/i.test(q))a="Use action + technical context + outcome. Then prepare to explain every resume bullet.";if(/panic|fear|nervous|confidence/i.test(q))a="Pause, breathe and structure the answer. You do not need to know everything. Explain what you actually did and show your reasoning.";setTimeout(()=>$("messages").insertAdjacentHTML("beforeend",`<div class="bubble bot">${a}</div>`),180);$("chatInput").value=""}
layout();
