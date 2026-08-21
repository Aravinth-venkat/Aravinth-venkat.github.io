# Aravinth Portfolio 3.0

Enhanced GitHub Pages portfolio package.

### New features
- Separate **Refer Aravinth** and **Ask Aravinth** pages
- Mandatory name/email with client-side email format validation
- Resume/job-description upload UI
- Google Sheets + Google Drive + email notification backend
- Permanent random visitor ID and visit-frequency tracking
- Online/availability indicator for Aravinth owner session
- Two real checkmate-in-one puzzle boards with legal chess movement
- Separate challenge room with room ID and move synchronization through the backend
- Challenge notification to Aravinth
- Dark/light mode following device preference plus manual toggle
- Custom cursor on mouse/trackpad
- Service-worker offline recovery and 404 game page
- GitHub Actions deployment that injects global site functionality into every existing HTML topic page
- Responsive design for phone, tablet, laptop, desktop and larger displays

## Upload

Replace the root files in the GitHub repository with this package's root files and add:
- `backend/`
- `.github/workflows/`

Keep your existing `topics/` folder and its pages.

Then set GitHub Pages source to **GitHub Actions**.

Finally deploy the Google Apps Script backend and put its `/exec` URL into `backend-config.js`.
