/*
 * Aravinth.dev backend configuration
 *
 * IMPORTANT:
 * 1. Replace BACKEND_URL below with your deployed Google Apps Script Web App URL.
 * 2. Upload this file to the ROOT of your GitHub Pages repository.
 * 3. Do not put Google service-account keys, passwords, or private tokens here.
 */

window.ARAVINTH_BACKEND = {
  backendUrl: "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE",

  // Frontend can use these paths for visitor/referral/chess events.
  endpoints: {
    visitor: "/visitor",
    referral: "/referral",
    question: "/question",
    feedback: "/feedback",
    challenge: "/challenge",
    presence: "/presence",
    chessMove: "/chess-move"
  },

  // Public frontend settings.
  challenge: {
    playerName: "Aravinth",
    noTimeLimit: true
  }
};
