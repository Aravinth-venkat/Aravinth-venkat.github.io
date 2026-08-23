# Exact upload steps

## Part A — GitHub Pages website

Upload these files/folders to the ROOT of `Aravinth-venkat/Aravinth-venkat.github.io`:

- `index.html`
- `styles.css`
- `app.js`
- `privacy.html`
- `sources.json`
- `.nojekyll`
- `worker/` (optional for version control; it is not executed by GitHub Pages)

Do NOT upload the ZIP file itself as your website source.

After committing, open GitHub → Settings → Pages and keep deployment from the `main` branch and `/ (root)` if that is how your existing Pages site is configured.

## Part B — Cloudflare Worker

Create/deploy a separate Worker from the `worker/` directory.

Cloudflare dashboard settings:

Project name: `careerlab-ai`
Root directory: `/worker`
Build command: leave empty
Deploy command: `npx wrangler deploy`
Non-production deploy command: `npx wrangler deploy`

Required secret:

`OPENAI_API_KEY`

Do not enter the API key into the GitHub repository.

## Part C — connect the website to Worker

After Cloudflare deploys, copy the Worker URL, for example:

`https://careerlab-ai.example.workers.dev`

Open `app.js` and replace:

`const AI_ENDPOINT = "https://careerlab-ai.YOUR-SUBDOMAIN.workers.dev";`

with your real Worker URL.

Commit `app.js` again.

## Part D — verify

1. Open the website.
2. Upload a PDF/DOCX resume.
3. Confirm Resume Health works.
4. Confirm Experience Explorer works.
5. Start Mock Interview.
6. Test a current technical question and check Sources.
7. Click Delete resume now.
8. Confirm resume-specific content disappears.
9. Refresh the page and confirm no resume is loaded.

## Security

Never put `OPENAI_API_KEY` in:

- `app.js`
- `index.html`
- `backend-config.js`
- `wrangler.jsonc`
- GitHub Actions logs
- any public GitHub file

The Worker reads the secret at runtime.
