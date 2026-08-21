# Aravinth.dev backend setup

This backend turns the static GitHub Pages portfolio into a real data-collection layer using Google Apps Script, Google Sheets and Google Drive.

## What it stores

- Permanent random visitor ID
- First/last seen and visit count
- Page/path events and basic device/screen metadata
- Referral submissions
- Questions
- Ratings/comments/suggestions
- Chess challenge requests
- Chess room state and moves
- Resume/job-description files in Google Drive
- Email notifications to you

Google Apps Script web apps support `doGet`/`doPost` and can be published as web apps. The script uses Sheets/Drive/Mail services for storage and notifications.

## Setup

1. Create a Google Sheet named `Aravinth Portfolio Data` (or any name).
2. Open **Extensions -> Apps Script**.
3. Paste `Code.gs`.
4. Replace `YOUR_EMAIL@example.com` with the email where you want notifications.
5. Save.
6. Run `setup()` once and approve the requested Google permissions.
7. Deploy -> New deployment -> Web app.
8. Execute as **Me**.
9. Who has access: **Anyone**.
10. Copy the `/exec` URL.
11. Put that URL into `backend-config.js` as `backendUrl`.
12. Commit `backend-config.js` to GitHub.

## GitHub Pages

This package includes `.github/workflows/deploy.yml`. After uploading it, open **Repository -> Settings -> Pages** and set **Source = GitHub Actions**. GitHub's official Pages workflow uses `configure-pages`, `upload-pages-artifact` and `deploy-pages`.

The workflow injects `site.js` into every HTML page at deploy time, so existing `topics/*.html` pages also get visitor tracking, presence heartbeat, theme switching and the enhanced cursor without you manually editing every topic page.

## Owner availability

Open your portfolio once with:

`https://aravinth-venkat.github.io/?owner=1`

That marks your browser as the owner session. Keep the page open when you want visitors to see that you are online. This is an availability indicator, not an authentication mechanism.

## Important privacy/security note

Do not put Google API keys, passwords or service-account credentials in GitHub. The frontend only contains the public Apps Script web-app URL. Resume uploads contain personal data, so use this only after you have reviewed the privacy/retention rules that apply to you.

For high traffic, move analytics/room state to a real database/realtime service instead of using Sheets as the primary datastore.
