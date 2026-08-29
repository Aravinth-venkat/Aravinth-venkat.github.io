const MODEL="@cf/openai/gpt-oss-20b";
const ANALYSIS_MODEL="@cf/meta/llama-3.1-8b-instruct";
const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Content-Type":"application/json; charset=utf-8"};
const MAX_RESUME=30000;
const MAX_HISTORY=10;
const SCHEMA={type:"object",properties:{score:{type:"integer"},summary:{type:"string"},strengths:{type:"array",items:{type:"string"}},gaps:{type:"array",items:{type:"string"}},skills:{type:"array",items:{type:"string"}},evidenceWarnings:{type:"array",items:{type:"string"}},interviewAreas:{type:"array",items:{type:"string"}},learningPath:{type:"array",items:{type:"string"}}},required:["score","summary","strengths","gaps","skills","evidenceWarnings","interviewAreas","learningPath"],additionalProperties:false};

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:CORS});}
function clean(v,max){return String(v||"").replace(/\u0000/g,"").trim().slice(0,max);}
function arr(v,max=8){return Array.isArray(v)?v.map(x=>String(x||"").trim()).filter(Boolean).slice(0,max):[];}
function answerOf(r){
  if(typeof r?.response==="string")return r.response.trim();
  if(typeof r?.text==="string")return r.text.trim();
  const c=r?.choices?.[0]?.message?.content;
  if(typeof c==="string")return c.trim();
  if(Array.isArray(c))return c.map(x=>typeof x==="string"?x:x?.text||"").join("").trim();
  if(typeof r?.choices?.[0]?.text==="string")return r.choices[0].text.trim();
  return "";
}
function parseJson(t){
  if(!t)return null;
  try{return JSON.parse(t)}catch{}
  const s=String(t).replace(/```json/gi,"").replace(/```/g,"").trim();
  try{return JSON.parse(s)}catch{}
  const a=s.indexOf("{"),b=s.lastIndexOf("}");
  if(a>=0&&b>a)try{return JSON.parse(s.slice(a,b+1))}catch{}
  return null;
}
function analysisNormalize(x){
  x=x||{};
  return{score:Math.max(0,Math.min(100,Math.round(Number(x.score)||0))),summary:String(x.summary||"Resume analysis completed."),strengths:arr(x.strengths,6),gaps:arr(x.gaps,6),skills:arr(x.skills,20),evidenceWarnings:arr(x.evidenceWarnings,8),interviewAreas:arr(x.interviewAreas,8),learningPath:arr(x.learningPath,10)};
}
function system(){
  return `You are CareerLab, an evidence-first AI career coach. Never invent experience, employers, projects, customers, technologies, certifications, dates, metrics, responsibilities or achievements. Treat the resume as the source of truth. Separate documented evidence from general knowledge. If something is not established, say so. Do not reveal hidden reasoning or chain-of-thought. Keep answers practical and interview-ready.`;
}

async function runAI(env,messages,opt={}){
  if(!env?.AI)throw new Error("Workers AI binding AI is not configured.");
  const model=opt.model||MODEL;
  const input={messages,max_tokens:opt.max_tokens||5000,temperature:opt.temperature??0.2,top_p:opt.top_p??0.9};
  if(opt.response_format)input.response_format=opt.response_format;
  let r=await env.AI.run(model,input);
  let a=answerOf(r);
  if(a)return{result:r,answer:a};

  const retry={
    messages:[
      {role:"system",content:system()+` Return only the final user-facing answer. Do not output reasoning, analysis, planning or hidden thoughts. Complete the answer before stopping.`},
      ...messages.filter(x=>x.role!=="system")
    ],
    max_tokens:opt.retry_max_tokens||5000,
    temperature:0.1,
    top_p:0.8
  };
  if(opt.response_format)retry.response_format=opt.response_format;
  r=await env.AI.run(opt.retry_model||model,retry);
  a=answerOf(r);
  if(a)return{result:r,answer:a};

  throw new Error("AI returned no completed content. Please try again.");
}

function analysisMessages(domain,resume){
  return[
    {role:"system",content:system()+`\nAnalyze a ${domain} resume and return ONLY valid JSON matching the supplied schema. Score the resume itself. Strengths must be supported. Gaps should identify missing evidence or skills. Skills must be explicitly supported. Evidence warnings are claims the candidate should be ready to prove. Interview areas must be realistic and resume-specific. Learning path must contain 6-10 concrete topics based ONLY on documented skills, gaps and interview areas. If the resume is ServiceNow-focused, prefer relevant ServiceNow topics such as scripting, REST/SOAP integrations, Flow Designer, IntegrationHub, CMDB, ACLs, ITSM or SLA topics only when supported or identified as a gap. Do not return generic programming topics unless relevant.`},
    {role:"user",content:`CAREER DOMAIN:\n${domain}\n\nRESUME:\n${resume}`}
  ];
}

async function resumeAnalysis(env,domain,resume){
  const r=await runAI(env,analysisMessages(domain,resume),{model:ANALYSIS_MODEL,retry_model:ANALYSIS_MODEL,max_tokens:3000,retry_max_tokens:3500,temperature:0.1,response_format:{type:"json_schema",json_schema:SCHEMA}});
  if(!r.answer)throw new Error("AI returned no completed content for resume analysis.");
  const p=parseJson(r.answer);
  if(!p)throw new Error("AI returned invalid JSON for resume analysis.");
  return analysisNormalize(p);
}

const FORMAT_RULES=`
USER-FACING FORMAT:
Use simple plain English.
Do not use Markdown formatting.
Do not use **bold** markers.
Do not use * symbols for formatting.
Do not use Markdown tables.
Do not use | characters for tables.
Do not use code fences.
Do not use Mermaid diagrams.
Do not expose internal reasoning.
Use short clear section titles such as:
What your resume proves
What this topic means
Simple memory explanation
How to discuss this in an interview
What to verify
Example interview wording
Use normal paragraphs and short bullet-style lines when useful.
Clearly label CareerLab guidance when giving general advice.
Never present generic knowledge as the candidate's real experience.
`;

async function textMode(env,mode,body){
  const resume=clean(body.resumeText,MAX_RESUME),domain=clean(body.domain||"General",100),topic=clean(body.topic,500),question=clean(body.question,5000);
  let prompt="";
  if(mode==="experience")prompt=`Resume:\n${resume}\n\nTopic: ${topic}\nQuestion: ${question}\n\nExplain the answer in a way a job seeker can understand. First state what the resume proves, then explain the topic in simple language, then explain how to discuss it safely in an interview. Never invent experience.\n${FORMAT_RULES}`;
  else if(mode==="project")prompt=`Resume:\n${resume}\n\nProject: ${topic}\nQuestion: ${question}\n\nExplain the project for an interview. Separate what the resume proves from a generic reference architecture. Do not create Mermaid. Never present generic architecture as actual candidate experience.\n${FORMAT_RULES}`;
  else if(mode==="forgot")prompt=`Resume:\n${resume}\n\nTopic: ${topic}\nQuestion: ${question}\n\nExplain what the resume proves, what the topic normally means, a safe interview response template and what the candidate should verify. Do not guess missing experience.\n${FORMAT_RULES}`;
  else if(mode==="rewrite")prompt=`Resume:\n${resume}\n\nRequest: ${question}\n\nRewrite using only supported facts. Use [ADD DETAIL] for missing evidence. Do not invent metrics or technologies.\n${FORMAT_RULES}`;
  else if(mode==="skill_gap")prompt=`Resume:\n${resume}\n\nTopic: ${topic}\nQuestion: ${question}\n\nReturn current skills, gaps, priority order, learning plan and interview practice. Separate resume evidence from generic advice.\n${FORMAT_RULES}`;
  else prompt=`Resume:\n${resume}\n\nTopic: ${topic}\nQuestion: ${question}\n\nAnswer practically and separate resume evidence from general knowledge.\n${FORMAT_RULES}`;

  const r=await runAI(env,[{role:"system",content:system()},{role:"user",content:prompt}],{max_tokens:6000,retry_max_tokens:6000,temperature:0.2});
  if(!r.answer)throw new Error("AI did not return a completed answer.");
  return r.answer;
}

async function mock(env,body){
  const history=Array.isArray(body.history)?body.history.slice(-MAX_HISTORY):[];
  const prompt=`Resume:\n${clean(body.resumeText,MAX_RESUME)}\n\nCareer domain: ${clean(body.domain,100)}\nInterview type: ${clean(body.interviewType||"Resume Interview",100)}\nDifficulty: ${clean(body.difficulty||"Medium",50)}\nPrevious turns: ${JSON.stringify(history)}\nInstruction: ${clean(body.instruction,2000)}\n\nAsk ONE resume-grounded interview question only. If an earlier answer contains an unsupported claim, ask for clarification. Do not invent missing experience.`;
  const r=await runAI(env,[{role:"system",content:system()},{role:"user",content:prompt}],{max_tokens:2500,retry_max_tokens:2500,temperature:0.4});
  if(!r.answer)throw new Error("AI did not return an interview question.");
  return r.answer;
}

async function feedback(env,body){
  const prompt=`Resume:\n${clean(body.resumeText,MAX_RESUME)}\n\nQuestion:\n${clean(body.question,1500)}\n\nCandidate answer:\n${clean(body.answer,5000)}\n\nEvaluate the answer. Give WHAT IS GOOD, WHAT IS MISSING, WHAT IS UNCLEAR, UNSUPPORTED CLAIMS, HOW TO IMPROVE and SAMPLE ANSWER TEMPLATE. Never invent experience. Use placeholders such as [PROJECT], [YOUR ROLE], [TECHNOLOGY], [RESULT] where evidence is missing.\n${FORMAT_RULES}`;
  const r=await runAI(env,[{role:"system",content:system()},{role:"user",content:prompt}],{max_tokens:5000,retry_max_tokens:5000,temperature:0.2});
  if(!r.answer)throw new Error("AI did not return interview feedback.");
  return r.answer;
}

export default{async fetch(request,env){
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:CORS});
  if(request.method==="GET")return json({ok:true,service:"CareerLab AI",model:MODEL,analysisModel:ANALYSIS_MODEL,status:"ready"});
  if(request.method!=="POST")return json({error:"Method not allowed."},405);
  try{
    const body=await request.json();
    const mode=clean(body.mode,100);
    if(mode==="resume_analysis"){
      const analysis=await resumeAnalysis(env,clean(body.domain||"General",100),clean(body.resumeText,MAX_RESUME));
      return json({ok:true,mode,answer:JSON.stringify(analysis),analysis});
    }
    if(clean(body.resumeText,MAX_RESUME).length<80)return json({error:"Resume text is missing or too short.",detail:"Upload a readable PDF or DOCX and try again."},400);
    if(mode==="mock_interview")return json({ok:true,mode,answer:await mock(env,body),sources:[]});
    if(mode==="interview_feedback")return json({ok:true,mode,answer:await feedback(env,body),sources:[]});
    if(["experience","project","forgot","rewrite","skill_gap","general"].includes(mode))return json({ok:true,mode,answer:await textMode(env,mode,body),sources:[]});
    return json({error:"Unknown CareerLab mode.",detail:`Received mode: ${mode}`},400);
  }catch(e){console.error(e);return json({error:"CareerLab AI request failed.",detail:e?.message||String(e)},500);}
}};
