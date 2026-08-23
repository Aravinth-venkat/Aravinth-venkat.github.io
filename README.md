# Aravinth CareerLab v3

Resume-first AI career lab for GitHub Pages + Cloudflare Workers.

## Included features

- Secure server-side AI connection
- Browser-only PDF/DOCX resume parsing
- AI resume analysis and health score
- Experience Explorer
- Resume-specific interview questions
- Interactive mock interview with follow-ups
- Honest "I forgot this experience" coach
- Skill-gap learning path
- Project and architecture explanation
- Mermaid flow/sequence diagrams
- Current source retrieval through AI web search
- Resume improvement/rewrite
- Multiple career domains
- Delete-session privacy reset

## Architecture

GitHub Pages hosts only static files. Cloudflare Worker is the server-side AI gateway. The OpenAI API key is stored as a Cloudflare Worker secret and never placed in browser code.

## GitHub Pages upload

Upload the files in the root of this package to the root of your `Aravinth-venkat.github.io` repository. Keep the `worker/` folder in the repository if you want the Worker source version-controlled; GitHub Pages will simply serve the static root files.

## Cloudflare Worker

The Worker is deployed separately from `/worker`.

Recommended build settings:

- Project name: `careerlab-ai`
- Root directory: `/worker`
- Build command: empty
- Deploy command: `npx wrangler deploy`
- Non-production deploy command: `npx wrangler deploy`

Required Worker secret:

`OPENAI_API_KEY`

The Worker config also declares this secret as required.

After deployment, copy the Worker HTTPS URL and put it into `app.js` at `AI_ENDPOINT`.

## Important

Do not put the OpenAI API key in `app.js`, HTML, GitHub Actions, `wrangler.jsonc`, or any public repository file.
