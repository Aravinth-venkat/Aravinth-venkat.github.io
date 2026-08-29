const MODEL = "@cf/openai/gpt-oss-20b";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8"
};

const MAX_RESUME_CHARS = 30000;
const MAX_HISTORY_ITEMS = 10;

const RESUME_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    score: {
      type: "integer"
    },
    summary: {
      type: "string"
    },
    strengths: {
      type: "array",
      items: {
        type: "string"
      }
    },
    gaps: {
      type: "array",
      items: {
        type: "string"
      }
    },
    skills: {
      type: "array",
      items: {
        type: "string"
      }
    },
    evidenceWarnings: {
      type: "array",
      items: {
        type: "string"
      }
    },
    interviewAreas: {
      type: "array",
      items: {
        type: "string"
      }
    },
    learningPath: {
      type: "array",
      items: {
        type: "string"
      }
    }
  },
  required: [
    "score",
    "summary",
    "strengths",
    "gaps",
    "skills",
    "evidenceWarnings",
    "interviewAreas",
    "learningPath"
  ],
  additionalProperties: false
};

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: CORS_HEADERS
    }
  );
}

function cleanText(value, max = 30000) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

function normalizeArray(value, max = 8) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(x => String(x || "").trim())
    .filter(Boolean)
    .slice(0, max);
}

function extractAnswer(result) {
  if (!result) {
    return "";
  }

  if (typeof result.response === "string") {
    return result.response.trim();
  }

  if (typeof result.text === "string") {
    return result.text.trim();
  }

  if (
    result.choices &&
    result.choices[0] &&
    result.choices[0].message
  ) {
    const content = result.choices[0].message.content;

    if (typeof content === "string") {
      return content.trim();
    }

    if (Array.isArray(content)) {
      return content
        .map(item => {
          if (typeof item === "string") {
            return item;
          }

          return item?.text || "";
        })
        .join("")
        .trim();
    }
  }

  if (
    result.choices &&
    result.choices[0] &&
    typeof result.choices[0].text === "string"
  ) {
    return result.choices[0].text.trim();
  }

  return "";
}

function extractFinishReason(result) {
  return (
    result?.choices?.[0]?.finish_reason ||
    result?.finish_reason ||
    null
  );
}

function extractReasoning(result) {
  return (
    result?.choices?.[0]?.message?.reasoning_content ||
    result?.reasoning_content ||
    ""
  );
}

function parseJson(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {}

  const cleaned = String(text)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {}

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start !== -1 && end > start) {
    try {
      return JSON.parse(
        cleaned.slice(start, end + 1)
      );
    } catch {}
  }

  return null;
}

function clampScore(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(number))
  );
}

function normalizeAnalysis(value) {
  const data = value || {};

  return {
    score: clampScore(data.score),

    summary:
      String(data.summary || "").trim() ||
      "Resume analysis completed.",

    strengths: normalizeArray(
      data.strengths,
      6
    ),

    gaps: normalizeArray(
      data.gaps,
      6
    ),

    skills: normalizeArray(
      data.skills,
      20
    ),

    evidenceWarnings: normalizeArray(
      data.evidenceWarnings,
      8
    ),

    interviewAreas: normalizeArray(
      data.interviewAreas,
      8
    ),

    learningPath: normalizeArray(
      data.learningPath,
      8
    )
  };
}

function baseSystemPrompt() {
  return `
You are CareerLab, an evidence-first AI career coach.

Your most important rule is:

NEVER INVENT EXPERIENCE.

The resume is the source of truth.

Separate:
1. What the resume explicitly proves.
2. What is reasonable general career knowledge.
3. What is missing and should be verified.

Do not claim that the candidate used a technology unless the resume supports it.

Do not create fake projects, fake employers, fake certifications,
fake responsibilities, fake metrics or fake achievements.

Keep answers practical for job interviews.

Do not reveal your internal reasoning.
Do not describe hidden reasoning.
Do not output chain-of-thought.
`;
}

async function runAI(
  env,
  messages,
  options = {}
) {
  if (!env || !env.AI) {
    throw new Error(
      "Workers AI binding 'AI' is not configured."
    );
  }

  const input = {
    messages,

    max_tokens:
      options.max_tokens || 4096,

    temperature:
      options.temperature ?? 0.2,

    top_p:
      options.top_p ?? 0.9
  };

  if (options.response_format) {
    input.response_format =
      options.response_format;
  }

  let result;

  try {
    result = await env.AI.run(
      MODEL,
      input
    );
  } catch (error) {
    throw new Error(
      `Workers AI request failed: ${error?.message || error}`
    );
  }

  let answer = extractAnswer(result);

  if (answer) {
    return {
      result,
      answer
    };
  }

  const finishReason =
    extractFinishReason(result);

  const reasoning =
    extractReasoning(result);

  /*
   * GPT-OSS can spend output tokens on reasoning.
   * If the first attempt finishes before content is produced,
   * retry with a shorter and more direct prompt.
   */

  if (
    finishReason === "length" ||
    reasoning
  ) {
    const retryMessages = [
      {
        role: "system",
        content:
          baseSystemPrompt() +
          `
IMPORTANT:
Return the final answer immediately.
Do not spend the response on reasoning.
Keep the answer concise.
`
      },
      ...messages.filter(
        message => message.role !== "system"
      )
    ];

    const retryInput = {
      messages: retryMessages,
      max_tokens:
        options.retry_max_tokens || 4096,
      temperature: 0.1,
      top_p: 0.8
    };

    if (options.response_format) {
      retryInput.response_format =
        options.response_format;
    }

    try {
      const retryResult =
        await env.AI.run(
          MODEL,
          retryInput
        );

      answer =
        extractAnswer(retryResult);

      if (answer) {
        return {
          result: retryResult,
          answer
        };
      }

      return {
        result: retryResult,
        answer: ""
      };
    } catch (error) {
      throw new Error(
        `AI retry failed: ${error?.message || error}`
      );
    }
  }

  return {
    result,
    answer: ""
  };
}

function resumeAnalysisMessages(
  domain,
  resumeText
) {
  return [
    {
      role: "system",
      content:
        baseSystemPrompt() +
        `
You are analyzing a resume for the career domain:

${domain}

Return ONLY valid JSON matching the supplied schema.

Scoring:
- 90-100: exceptionally strong and well-supported
- 80-89: strong
- 70-79: good
- 60-69: moderate
- below 60: significant gaps

The score must reflect the resume itself,
not your assumptions about the candidate.

Strengths:
Only include strengths supported by the resume.

Gaps:
Identify missing skills, missing evidence,
missing measurable impact or areas that could
be stronger.

Skills:
Only list skills explicitly supported by the resume.

Evidence warnings:
Mention claims that the candidate should be
ready to prove during an interview.

Interview areas:
Create realistic questions/topics based on
the actual resume.

Learning path:
Give practical topics that would improve
the candidate's interview readiness.

Keep arrays concise.
Do not repeat the same item.
`
    },
    {
      role: "user",
      content:
        `CAREER DOMAIN:
${domain}

RESUME:
${resumeText}`
    }
  ];
}

async function resumeAnalysis(
  env,
  domain,
  resumeText
) {
  const messages =
    resumeAnalysisMessages(
      domain,
      resumeText
    );

  const result =
    await runAI(
      env,
      messages,
      {
        max_tokens: 4096,
        retry_max_tokens: 4096,
        temperature: 0.1,
        response_format: {
          type: "json_schema",
          json_schema:
            RESUME_ANALYSIS_SCHEMA
        }
      }
    );

  if (!result.answer) {
    throw new Error(
      `AI returned no completed content. finish_reason=${extractFinishReason(result.result) || "unknown"}`
    );
  }

  const parsed =
    parseJson(result.answer);

  if (!parsed) {
    throw new Error(
      "AI returned invalid JSON for resume analysis."
    );
  }

  return normalizeAnalysis(parsed);
}

async function experienceMode(
  env,
  domain,
  topic,
  question,
  resumeText
) {
  const prompt = `
Career domain:
${domain}

Topic:
${topic || "Not specified"}

User question:
${question || "Explain this based on my resume."}

Resume:
${resumeText}

Answer the user's question.

Rules:
- First explain what the resume proves.
- Then explain the general concept if useful.
- Clearly identify anything that is not proven by the resume.
- If the user asks "how do I answer this in an interview",
  provide a safe interview answer structure.
- Never invent missing experience.
- Keep the answer practical.
`;

  const result =
    await runAI(
      env,
      [
        {
          role: "system",
          content: baseSystemPrompt()
        },
        {
          role: "user",
          content: prompt
        }
      ],
      {
        max_tokens: 3500,
        temperature: 0.2
      }
    );

  if (!result.answer) {
    throw new Error(
      "AI did not return a completed answer."
    );
  }

  return result.answer;
}

async function projectMode(
  env,
  domain,
  topic,
  question,
  resumeText
) {
  const prompt = `
Career domain:
${domain}

Project/topic:
${topic || "Main project"}

User request:
${question || "Explain the project architecture."}

Resume:
${resumeText}

Create a project explanation useful for an interview.

Structure the answer as:

1. What the resume explicitly proves
2. Project purpose
3. Likely components that are actually supported
4. Integration/data flow that is supported
5. What the candidate should NOT claim without verification
6. Interview explanation
7. Follow-up questions

If a generic architecture is useful,
clearly label it as:

"Generic reference architecture"

Do not present generic architecture as
the candidate's actual implementation.

If a Mermaid diagram is appropriate,
include one fenced mermaid block.

Never invent technologies.
`;

  const result =
    await runAI(
      env,
      [
        {
          role: "system",
          content: baseSystemPrompt()
        },
        {
          role: "user",
          content: prompt
        }
      ],
      {
        max_tokens: 4000,
        temperature: 0.2
      }
    );

  if (!result.answer) {
    throw new Error(
      "AI did not return a project explanation."
    );
  }

  return result.answer;
}

async function forgotMode(
  env,
  domain,
  topic,
  question,
  resumeText
) {
  const prompt = `
The candidate says they forgot something.

Career domain:
${domain}

Topic:
${topic || "Not specified"}

Question:
${question || "Help me remember this."}

Resume:
${resumeText}

Help the candidate prepare without inventing
their experience.

Provide:

1. What the resume proves
2. What this topic normally means
3. A simple memory explanation
4. How to discuss it safely in an interview
5. What the candidate should verify before claiming it
6. Example interview wording using placeholders
`;

  const result =
    await runAI(
      env,
      [
        {
          role: "system",
          content: baseSystemPrompt()
        },
        {
          role: "user",
          content: prompt
        }
      ],
      {
        max_tokens: 3000,
        temperature: 0.2
      }
    );

  if (!result.answer) {
    throw new Error(
      "AI did not return a completed answer."
    );
  }

  return result.answer;
}

async function rewriteMode(
  env,
  domain,
  topic,
  question,
  resumeText
) {
  const prompt = `
Career domain:
${domain}

Resume:
${resumeText}

User request:
${question || "Improve this resume content."}

Topic:
${topic || "Resume"}

Rewrite or improve the relevant content.

Rules:
- Never add experience that is not in the resume.
- Never add fake metrics.
- Never add fake certifications.
- Preserve factual meaning.
- Improve clarity and interview relevance.
- If information is missing, use [ADD DETAIL]
  instead of inventing it.

Return:
1. Improved version
2. Why it is stronger
3. Missing evidence to add
`;

  const result =
    await runAI(
      env,
      [
        {
          role: "system",
          content: baseSystemPrompt()
        },
        {
          role: "user",
          content: prompt
        }
      ],
      {
        max_tokens: 3000,
        temperature: 0.2
      }
    );

  if (!result.answer) {
    throw new Error(
      "AI did not return a rewrite."
    );
  }

  return result.answer;
}

async function skillGapMode(
  env,
  domain,
  topic,
  question,
  resumeText
) {
  const prompt = `
Career domain:
${domain}

Resume:
${resumeText}

Topic:
${topic || "Career target"}

User request:
${question || "Identify my skill gaps."}

Analyze the gap between the candidate's
documented skills and the target career area.

Return:

1. Skills already supported by the resume
2. Skills partially supported
3. Skills not demonstrated
4. Priority gaps
5. Recommended learning order
6. Interview preparation plan
7. What should be added to the resume only
   after the candidate actually gains the experience

Never claim the candidate has a skill that
the resume does not demonstrate.
`;

  const result =
    await runAI(
      env,
      [
        {
          role: "system",
          content: baseSystemPrompt()
        },
        {
          role: "user",
          content: prompt
        }
      ],
      {
        max_tokens: 3500,
        temperature: 0.2
      }
    );

  if (!result.answer) {
    throw new Error(
      "AI did not return a skill-gap analysis."
    );
  }

  return result.answer;
}

async function generalMode(
  env,
  domain,
  topic,
  question,
  resumeText
) {
  const prompt = `
Career domain:
${domain}

Resume:
${resumeText}

Topic:
${topic || "General career question"}

Question:
${question || "Help me prepare for an interview."}

Answer clearly and practically.

If the answer depends on resume evidence,
separate the evidence from general knowledge.

Do not invent experience.
`;

  const result =
    await runAI(
      env,
      [
        {
          role: "system",
          content: baseSystemPrompt()
        },
        {
          role: "user",
          content: prompt
        }
      ],
      {
        max_tokens: 3000,
        temperature: 0.2
      }
    );

  if (!result.answer) {
    throw new Error(
      "AI did not return a completed answer."
    );
  }

  return result.answer;
}

async function mockInterview(
  env,
  domain,
  interviewType,
  difficulty,
  instruction,
  history,
  resumeText
) {
  const safeHistory =
    Array.isArray(history)
      ? history.slice(-MAX_HISTORY_ITEMS)
      : [];

  const historyText =
    safeHistory.length
      ? safeHistory
          .map(
            (item, index) =>
              `Turn ${index + 1}
Question: ${item.question || ""}
Candidate answer: ${item.answer || ""}`
          )
          .join("\n\n")
      : "No previous interview turns.";

  const prompt = `
Career domain:
${domain}

Interview type:
${interviewType || "Resume Interview"}

Difficulty:
${difficulty || "Medium"}

Instruction:
${instruction || "Ask the next interview question."}

Previous interview:
${historyText}

Resume:
${resumeText}

You are conducting a real interview.

Ask ONLY ONE question.

The question must be relevant to the
candidate's resume.

Do not ask multiple questions.

Do not provide the answer unless the user
specifically asks for feedback.

If previous answers exist, ask a useful
follow-up question.

If the candidate claimed something not
supported by the resume, ask a verification
question.

Return only the interviewer question.
`;

  const result =
    await runAI(
      env,
      [
        {
          role: "system",
          content: baseSystemPrompt()
        },
        {
          role: "user",
          content: prompt
        }
      ],
      {
        max_tokens: 1200,
        temperature: 0.4
      }
    );

  if (!result.answer) {
    throw new Error(
      "AI did not return an interview question."
    );
  }

  return result.answer;
}

async function interviewAnswerFeedback(
  env,
  domain,
  question,
  answer,
  resumeText
) {
  const prompt = `
Career domain:
${domain}

Resume:
${resumeText}

Interview question:
${question}

Candidate answer:
${answer}

Evaluate this answer.

Provide:

1. What was good
2. What is missing
3. What is unclear
4. What may be unsupported by the resume
5. How to improve the answer
6. A SAMPLE ANSWER TEMPLATE

The sample answer must NOT invent experience.

Use placeholders such as:

[PROJECT]
[TECHNOLOGY]
[YOUR ROLE]
[MEASURABLE RESULT]
[ACTUAL CHALLENGE]

The goal is to teach the candidate how
to construct a truthful interview answer.

Also give a short improved answer structure
that the candidate can adapt after verifying
their real experience.

Do not pretend that the candidate performed
work that is not supported by the resume.
`;

  const result =
    await runAI(
      env,
      [
        {
          role: "system",
          content: baseSystemPrompt()
        },
        {
          role: "user",
          content: prompt
        }
      ],
      {
        max_tokens: 3500,
        temperature: 0.2
      }
    );

  if (!result.answer) {
    throw new Error(
      "AI did not return interview feedback."
    );
  }

  return result.answer;
}

function validateRequest(body) {
  if (!body || typeof body !== "object") {
    throw new Error(
      "Invalid request body."
    );
  }

  if (!body.mode) {
    throw new Error(
      "Missing mode."
    );
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    if (request.method === "GET") {
      return json({
        ok: true,
        service: "CareerLab AI",
        model: MODEL,
        status: "ready"
      });
    }

    if (request.method !== "POST") {
      return json(
        {
          error: "Method not allowed."
        },
        405
      );
    }

    try {
      const body =
        await request.json();

      validateRequest(body);

      const mode =
        String(body.mode || "").trim();

      const domain =
        cleanText(
          body.domain || "General",
          200
        );

      const resumeText =
        cleanText(
          body.resumeText,
          MAX_RESUME_CHARS
        );

      const topic =
        cleanText(
          body.topic,
          500
        );

      const question =
        cleanText(
          body.question,
          5000
        );

      /*
       * Resume is required for all current
       * CareerLab resume-based features.
       */
      if (
        [
          "resume_analysis",
          "experience",
          "project",
          "forgot",
          "rewrite",
          "skill_gap",
          "general",
          "mock_interview"
        ].includes(mode) &&
        resumeText.length < 80
      ) {
        return json(
          {
            error:
              "Resume text is missing or too short.",
            detail:
              "Upload a readable PDF or DOCX and try again."
          },
          400
        );
      }

      if (mode === "resume_analysis") {
        const analysis =
          await resumeAnalysis(
            env,
            domain,
            resumeText
          );

        return json({
          ok: true,
          mode,
          answer:
            JSON.stringify(analysis),
          analysis
        });
      }

      if (mode === "experience") {
        const answer =
          await experienceMode(
            env,
            domain,
            topic,
            question,
            resumeText
          );

        return json({
          ok: true,
          mode,
          answer,
          sources: []
        });
      }

      if (mode === "project") {
        const answer =
          await projectMode(
            env,
            domain,
            topic,
            question,
            resumeText
          );

        return json({
          ok: true,
          mode,
          answer,
          sources: []
        });
      }

      if (mode === "forgot") {
        const answer =
          await forgotMode(
            env,
            domain,
            topic,
            question,
            resumeText
          );

        return json({
          ok: true,
          mode,
          answer,
          sources: []
        });
      }

      if (mode === "rewrite") {
        const answer =
          await rewriteMode(
            env,
            domain,
            topic,
            question,
            resumeText
          );

        return json({
          ok: true,
          mode,
          answer,
          sources: []
        });
      }

      if (mode === "skill_gap") {
        const answer =
          await skillGapMode(
            env,
            domain,
            topic,
            question,
            resumeText
          );

        return json({
          ok: true,
          mode,
          answer,
          sources: []
        });
      }

      if (mode === "general") {
        const answer =
          await generalMode(
            env,
            domain,
            topic,
            question,
            resumeText
          );

        return json({
          ok: true,
          mode,
          answer,
          sources: []
        });
      }

      if (mode === "mock_interview") {
        const interviewType =
          cleanText(
            body.interviewType ||
              "Resume Interview",
            200
          );

        const difficulty =
          cleanText(
            body.difficulty ||
              "Medium",
            100
          );

        const instruction =
          cleanText(
            body.instruction ||
              "Ask the next interview question.",
            2000
          );

        const history =
          Array.isArray(body.history)
            ? body.history
                .slice(-MAX_HISTORY_ITEMS)
                .map(item => ({
                  question:
                    cleanText(
                      item?.question,
                      1500
                    ),
                  answer:
                    cleanText(
                      item?.answer,
                      3000
                    )
                }))
            : [];

        const answer =
          await mockInterview(
            env,
            domain,
            interviewType,
            difficulty,
            instruction,
            history,
            resumeText
          );

        return json({
          ok: true,
          mode,
          answer,
          sources: []
        });
      }

      return json(
        {
          error:
            "Unknown CareerLab mode.",
          detail:
            `Received mode: ${mode}`
        },
        400
      );

    } catch (error) {
      console.error(
        "CareerLab Worker Error:",
        error
      );

      return json(
        {
          error:
            "CareerLab AI request failed.",
          detail:
            error?.message ||
            String(error)
        },
        500
      );
    }
  }
};
