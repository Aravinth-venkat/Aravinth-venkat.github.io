# Aravinth CareerLab v2

Upload the frontend files to GitHub Pages and deploy the `worker/` folder as a Cloudflare Worker.

Features: secure AI connection, browser-only PDF/DOCX parsing, AI resume analysis, experience explorer, resume-specific interview questions, interactive mock interview + follow-ups, forgotten-experience honesty coach, skill-gap learning, project/architecture explanations, Mermaid diagrams, current web-source retrieval, resume rewriting, and multiple career domains.

Privacy model: the original resume file stays in browser memory. The Worker does not intentionally persist resume text. AI requests use `store:false`. The AI provider still receives the text needed to answer.

Frontend: replace `AI_ENDPOINT` in `app.js` with your Worker URL.
Worker secret: `OPENAI_API_KEY`.
Worker variables: `MODEL=gpt-5.6-luna`, `ALLOWED_ORIGIN=https://aravinth-venkat.github.io`.
