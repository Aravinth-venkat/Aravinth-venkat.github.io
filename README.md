# CareerLab Full Resume + Learning Lab

This version removes the Mermaid UI and makes Learning Lab resume-driven.

## Frontend
- PDF/DOCX resume upload
- Resume analysis
- Resume score
- Evidence warnings
- Resume-based Learning Lab
- Mock interview
- Pro sample answer feedback
- Project architecture without Mermaid output
- Resume-based job search links

## Backend
- Cloudflare Worker
- Workers AI binding `AI`
- `@cf/meta/llama-3.1-8b-instruct` for structured resume analysis
- `@cf/openai/gpt-oss-20b` for interview/coaching responses

## Deploy
1. Deploy `worker.js` with the `AI` Workers AI binding.
2. Use the deployed Worker URL in `app.js` as `AI_ENDPOINT`.
3. Deploy the frontend files to GitHub Pages.
4. Test resume upload → Analyze → Learning Lab.
