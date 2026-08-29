# CareerLab Updated Package

This package contains the full frontend and backend scripts for the current CareerLab version.

## Included changes

- CareerLab-branded Explorer answers
- Cleaner plain-English answer formatting
- Removes Markdown stars, pipes, code fences and Mermaid from user-facing answers
- Stronger backend instructions to separate resume evidence from general knowledge
- Increased Workers AI output limits to reduce the "AI returned an empty response" problem caused by responses stopping during reasoning
- Resume-driven Learning Lab
- Mock Interview and Pro answer feedback
- Pro job finder with location suggestions
- Night Mode
- Reading Mode for easier reading and lower visual strain
- Display mode is remembered in browser localStorage

## Files

- `index.html` — frontend page
- `app.js` — frontend logic
- `styles.css` — frontend styling, Night Mode and Reading Mode
- `worker/worker.js` — Cloudflare Worker backend
- `README.md` — setup notes

## Deploy

### Frontend
Upload/replace:
- `index.html`
- `app.js`
- `styles.css`

### Backend
Replace:
- `worker/worker.js`

Keep the existing Cloudflare Workers AI binding named `AI`.

### Important
The frontend currently points to:

`https://careerlab-ai.leoaravind007.workers.dev`

If your Worker URL changes, update `AI_ENDPOINT` at the top of `app.js`.

## Test sequence

1. Open the website.
2. Upload a PDF or DOCX resume.
3. Select the career domain.
4. Click Analyze My Resume.
5. Confirm Resume Readiness appears.
6. Confirm Learning Lab contains resume-specific topics.
7. Open CareerLab Explorer.
8. Ask a question such as "Explain REST integration for my interview."
9. Confirm the response is readable and starts with CareerLab Guidance.
10. Test Night Mode.
11. Test Reading Mode.
12. Test Mock Interview.
13. Activate Test Pro and test Project Architecture, Skill Gap, Answer Assistant and Job Finder.

## Night Mode
Night Mode changes the whole interface to a dark, low-light friendly theme.

## Reading Mode
Reading Mode uses warmer colors, softer contrast, larger typography and more relaxed line spacing. It is intended to make longer CareerLab explanations easier to read.

This is a comfort feature, not medical eye-care treatment. If the user experiences persistent eye pain, headaches or vision problems, they should take breaks and consult an eye-care professional.
