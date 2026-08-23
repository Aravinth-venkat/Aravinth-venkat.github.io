# CareerLab Worker

Secrets/variables:
- Secret: `OPENAI_API_KEY`
- Variable: `MODEL` = `gpt-5.6-luna`
- Variable: `ALLOWED_ORIGIN` = `https://aravinth-venkat.github.io`

Cloudflare Workers Builds:
- Root directory: `/worker`
- Build command: empty
- Deploy command: `npx wrangler deploy`
- Non-production deploy command: `npx wrangler deploy`

Never commit the API key.
