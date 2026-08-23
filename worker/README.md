# CareerLab AI Worker

This is an optional Cloudflare Worker. The GitHub Pages website can run without it.

## Why use a worker?

Never put an AI API key in `index.html` or `app.js`. The browser should call this worker; the worker calls the AI provider.

## Privacy model

The resume is not written by this worker to KV, R2, D1, a database or a file. It exists only in the request/response path.

However, when AI mode is enabled, the resume text is transmitted to the AI provider. Therefore the website should say:

> "CareerLab does not store your resume on our server. If you enable AI analysis, selected resume text is sent to our AI provider to generate your requested answer. Review the AI provider's current data-processing terms before using this feature."

Do NOT say "your resume never leaves your device" when AI mode is enabled.

## Cloudflare setup

1. Create a Cloudflare Worker.
2. Paste `worker.js`.
3. Add secret `OPENAI_API_KEY`.
4. Optionally add variable `MODEL=gpt-5.6`.
5. Add `ALLOWED_ORIGIN=https://YOUR-GITHUB-USERNAME.github.io`.
6. Deploy the worker.
7. In `app.js`, set the AI endpoint to your worker URL. For a simple first version, use the browser console:

   localStorage.setItem("careerLabAiEndpoint","https://YOUR-WORKER.workers.dev")

   Then reload the page.

For a production version, replace this localStorage configuration with a constant in a separate public config file containing only the worker URL, never an API key.

## Current AI privacy note

OpenAI states that API inputs/outputs are not used to train models by default for API customers, and qualifying organizations can configure stronger retention controls. Check the current OpenAI policy before publishing your own privacy promise.
