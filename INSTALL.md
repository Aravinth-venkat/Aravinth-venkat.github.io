# CareerLab — Email Authentication Update

This package keeps CareerLab's existing product/dashboard features, but the account screen now uses **email authentication only**.

## Account features enabled
- Email + password sign in
- Email + password account creation
- Supabase email confirmation
- 30-second confirmation-email resend timer
- Forgot-password email flow
- Password reset page
- Production redirect to `https://aravinth-venkat.github.io/auth.html`
- Automatic return to CareerLab after successful authentication

## Account features removed from the UI
- Phone OTP
- Google sign-in
- GitHub sign-in
- Microsoft sign-in
- Magic-link sign-in

No phone/SMS/OAuth provider is required for this version.

## 1. Configure Supabase
In `app-config.js`, set the public project URL and publishable key:

```js
window.CAREERLAB_CONFIG = {
  AI_ENDPOINT: "https://careerlab-ai.leoaravind007.workers.dev",
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_YOUR_KEY"
};
```

The Supabase project URL shown for the CareerLab project is:
`https://uwebhcenkyxiktcwdgus.supabase.co`

Paste your real publishable key in `app-config.js`. Do not put a Supabase secret/service-role key in GitHub Pages.

## 2. Supabase email settings
Use:

- Authentication → Providers → Email: enabled
- Authentication → URL Configuration → Site URL:
  `https://aravinth-venkat.github.io`
- Redirect URL:
  `https://aravinth-venkat.github.io/auth.html`
- Recovery redirect:
  `https://aravinth-venkat.github.io/auth.html?mode=recovery`

You can keep your localhost URL as an additional redirect while developing locally.

## 3. Confirmation flow

```text
Visitor
  ↓
Try CareerLab
  ↓
Limited access
  ↓
Sign in / Create account
  ↓
Email + password
  ↓
Supabase sends confirmation email
  ↓
User taps Confirm email address
  ↓
https://aravinth-venkat.github.io/auth.html
  ↓
CareerLab detects the authenticated session
  ↓
CareerLab dashboard
```

The confirmation email must no longer redirect to `http://localhost:3000` once the Supabase URL Configuration and this package are deployed.

## 4. 30-second resend behavior
After account creation, CareerLab shows a confirmation panel. The resend button is disabled for 30 seconds, then becomes available again.

The browser timer is only a user-experience control. Supabase also applies its own email/rate limits, so the application does not pretend that a message was sent when Supabase returns an error.

## 5. Forgot password
The user enters their email and selects **Forgot password?**. CareerLab sends the Supabase reset email and returns to:

`https://aravinth-venkat.github.io/auth.html?mode=recovery`

The user can then set a new password.

## 6. GitHub Pages
Upload the frontend files from this package to the repository root. At minimum:

- `index.html`
- `styles.css`
- `app.js`
- `account.js`
- `auth.html`
- `auth.js`
- `admin.html`
- `admin.js`
- `app-config.js`
- `privacy.html`
- `.nojekyll`

The Worker files remain under `worker/` for the existing AI/payment backend.

## Security
Only public Supabase configuration belongs in `app-config.js`. Keep server secrets such as payment secrets, Supabase secret/service-role keys, and other backend credentials out of GitHub Pages.
