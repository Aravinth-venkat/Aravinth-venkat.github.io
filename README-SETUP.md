# Aravinth.dev backend setup

## Website files
Replace these files in the GitHub Pages repository:
- `chess.html`
- `refer.html`
- `site.js`
- `backend-config.js`

Replace the backend script:
- `Backend/Code.gs`

## Google storage
1. Create a Google Sheet named `Aravinth Portfolio Data` (or any name).
2. Open **Extensions -> Apps Script**.
3. Paste `Backend/Code.gs`.
4. Replace `YOUR_EMAIL@example.com` with the email where you want notifications.
5. Save.
6. Run `setup()` once and approve Google permissions.
7. Deploy -> New deployment -> Web app.
8. Execute as: **Me**.
9. Who has access: **Anyone**.
10. Copy the `/exec` URL.
11. Put that URL into `backend-config.js` as `backendUrl`.
12. Commit the changed files to GitHub Pages.

The backend creates Sheets tabs for visitors, events, referrals, questions, feedback, challenges, rooms and moves. Resume files go into a Google Drive folder created by `setup()`.

The visitor identifier is used internally for continuity and is not rendered in the public UI.

## Important
GitHub Pages itself cannot securely store private form submissions. Keep the Google Apps Script URL public but never put API secrets in frontend files.
