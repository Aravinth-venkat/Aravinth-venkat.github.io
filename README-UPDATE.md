# Aravinth.dev Chess Lab v4

Replace:
- `chess.html`
- `Backend/Code.gs`

What changed:
- One large responsive square chess board.
- Works as a single board on Android, tablet, PC and desktop.
- Board style selector: Classic Green, Midnight Blue, Warm Wood.
- Quick Checkmate mode.
- Page reload/new puzzle selects a different puzzle pattern.
- Reset keeps the exact current puzzle.
- Puzzle patterns include Queen, Rook, Bishop, Knight and Pawn.
- Selecting a piece highlights all legal destinations.
- Challenge mode has no clock/time limit.
- Visitor challenge waits with “Aravinth will join shortly.”
- Backend stores challenge and sends an email notification.
- Owner view uses `?owner=1` and shows waiting matches.
- Owner can select a waiting match and join the same room.
- Room state/history is stored in Google Sheets.
- Visitor ID remains internal and is not displayed.

Backend deployment:
1. Replace Backend/Code.gs in Apps Script.
2. Run setup() once.
3. Set OWNER_EMAIL.
4. Deploy as Web app, Execute as Me, access Anyone.
5. Put the /exec URL into backend-config.js.
6. Open your normal chess page for visitors.
7. Open `chess.html?owner=1` for your private owner view.

Important:
The `owner=1` route is a lightweight portfolio owner view, not strong authentication. For a truly private admin console, use real authentication before exposing sensitive controls.
