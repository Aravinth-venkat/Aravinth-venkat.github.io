/**
 * CareerLab Cloudflare Worker - stateless AI gateway
 *
 * Environment variables:
 *   OPENAI_API_KEY = your server-side API key
 *   MODEL = gpt-5.6 (optional)
 *
 * This worker intentionally does NOT write resume text to KV, R2, D1,
 * Durable Objects, logs or any other persistent store.
 *
 * IMPORTANT:
 * - The browser sends resume text in the request body.
 * - The worker forwards the requested content to the configured AI provider.
 * - The AI provider has its own processing/retention rules.
 * - Do not claim that the resume "never leaves the device" when AI mode is on.
 */

export default {
  async fetch(request, env) {
    const headers = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") return new Response("", {headers});
    if (request.method !== "POST") return new Response(JSON.stringify({error:"POST only"}), {status:405,headers});

    try {
      const body = await request.json();
      const prompt = String(body.prompt || "").slice(0, 20000);
      const resumeText = String(body.resumeText || "").slice(0, 30000);
      const career = String(body.career || "General").slice(0, 100);

      if (!prompt) return new Response(JSON.stringify({error:"Missing prompt"}), {status:400,headers});
      if (!env.OPENAI_API_KEY) return new Response(JSON.stringify({error:"AI provider is not configured"}), {status:500,headers});

      const system = `You are CareerLab, a cautious interview-learning coach.
Use the candidate resume only as evidence of what they claim to have done.
Never invent an employer, project, tool, metric, certification, responsibility or technical result.
If the resume does not contain enough evidence, say what is missing and ask the candidate to verify it.
For current technology facts, prefer information that can be supported by official documentation; do not fabricate citations.
Separate factual explanation from interview coaching.
If the candidate says they forgot something from years ago, teach them to answer honestly: state what they remember, explain the business purpose and approach, and say what they would verify today.
Return concise, practical answers suitable for interview preparation.`;

      const input = [
        `Career: ${career}`,
        `Candidate resume (possibly redacted):\n${resumeText}`,
        `Task:\n${prompt}`
      ].join("\n\n");

      const aiRes = await fetch("https://api.openai.com/v1/responses", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer ${env.OPENAI_API_KEY}`
        },
        body:JSON.stringify({
          model: env.MODEL || "gpt-5.6",
          input: [
            {role:"system", content:[{type:"input_text", text:system}]},
            {role:"user", content:[{type:"input_text", text:input}]}
          ]
        })
      });

      const raw = await aiRes.text();
      if (!aiRes.ok) return new Response(JSON.stringify({error:"AI provider error", detail:raw.slice(0,1000)}), {status:502,headers});

      const data = JSON.parse(raw);
      const answer = data.output_text || extractOutputText(data) || "No answer returned.";
      return new Response(JSON.stringify({answer}), {status:200,headers});

    } catch (err) {
      return new Response(JSON.stringify({error:"Request failed", detail:String(err).slice(0,500)}), {status:500,headers});
    }
  }
};

function extractOutputText(data){
  try {
    return (data.output || []).flatMap(item => item.content || [])
      .filter(c => c.type === "output_text")
      .map(c => c.text).join("\n");
  } catch { return ""; }
}
