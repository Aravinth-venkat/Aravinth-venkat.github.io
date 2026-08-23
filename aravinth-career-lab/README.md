# Aravinth CareerLab v1

A GitHub-Pages-friendly starter website for:

- Resume analysis
- Interview questions
- Mock interview practice
- Confidence coaching
- Career/topic learning
- Project examples
- Mermaid diagrams
- Trusted source links
- Optional AI integration
- Browser-only resume processing

## Upload to GitHub Pages

Upload these files to the root of your repository:

- `index.html`
- `styles.css`
- `app.js`
- `privacy.html`
- `sources.json`

The `worker/` folder is optional and is not executed by GitHub Pages.

## Resume privacy

The browser reads PDF/DOCX locally. Resume text is held in JavaScript memory only. It is not intentionally saved to a CareerLab database, file store, cookie, localStorage or sessionStorage.

Clicking **Delete resume now** clears the resume from the page state.

A browser refresh or crash can also clear it, so this is deliberately a single-page session workflow.

### Important AI disclosure

When the optional AI worker is enabled, resume text is sent to the configured AI provider. Therefore the product must not claim that the resume never leaves the device.

The UI uses the wording:

> CareerLab does not store your resume on our server. If AI analysis is enabled, selected resume text is sent to our AI provider to generate the requested answer.

The default UI also offers PII redaction for common email, phone and LinkedIn patterns.

## Production roadmap

1. Add authentication only if needed.
2. Keep resume files out of persistent storage.
3. Keep the AI API key server-side.
4. Add official source retrieval/search through a server-side source layer.
5. Cache only public documentation, never resumes.
6. Add source timestamps and citations to AI answers.
7. Add a “not enough evidence” guardrail.
8. Add user-controlled resume deletion.
9. Add audit/security controls before accepting sensitive resumes at scale.
10. Add a dedicated privacy policy and terms reviewed for your target countries.

## Current source strategy

The site starts with official source links. For a real production AI system, implement retrieval so the backend searches approved sources and supplies relevant passages to the model. Do not allow unrestricted web text to be treated as authoritative.
