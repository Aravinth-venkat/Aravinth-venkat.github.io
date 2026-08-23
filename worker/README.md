# CareerLab AI Worker

Deploy this folder as a Cloudflare Worker.

## Dashboard build settings

Root directory: `/worker`

Build command: leave empty

Deploy command: `npx wrangler deploy`

## Secret

Create a Worker Secret:

`OPENAI_API_KEY`

Never put the API key in `vars`, `wrangler.jsonc`, GitHub Pages JavaScript, HTML, or the repository.

## Test

After deployment, open the Worker URL. A GET request intentionally returns a health message. The website uses POST.
