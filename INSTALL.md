# CareerLab complete SaaS flow

This package is a complete frontend + Cloudflare Worker + Supabase schema foundation for:

Landing → Try CareerLab → Limited visitor access → Sign in → Free dashboard → Feature usage → Pro trigger → Subscription → Payment status → Pro dashboard

## Included
- Visitor trial limits before sign-in
- Email/password sign-up and sign-in
- Phone number OTP sign-in
- Forgot-password email flow
- Magic-link sign-in
- Google, GitHub and Microsoft OAuth buttons
- Admin-controlled Free/Pro visibility and feature flags
- Daily Free limits and Pro access checks on the backend
- Razorpay secure server-created orders
- UPI-enabled Razorpay Checkout (UPI Intent / QR availability depends on your Razorpay account configuration)
- Server-side payment signature verification
- Server-side payment capture check before Pro activation
- Razorpay webhook verification and automated Pro activation
- Payment receipt number tracking
- Optional receipt email via Resend
- Optional receipt SMS via Twilio
- Admin payment tracking dashboard
- New-feature-unlocked toast notifications
- English voice-to-text for interview answers using browser SpeechRecognition
- Night Mode and Reading Mode
- Resume analysis, Explorer, Mock Interview, Learning Lab and Job Finder flow
- No Mermaid diagram in the user experience
- CareerLab-branded guidance output

## 1. Supabase
Create a Supabase project, enable Email, Phone and the OAuth providers you want, then run `supabase/schema.sql`.

Set in `app-config.js`:
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY

Configure the redirect URL for your deployed site, for example:
`https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPO/auth.html`

## 2. Worker secrets
Set these in Cloudflare Worker secrets/variables:
- OPENAI_API_KEY
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SECRET_KEY
- ADMIN_EMAILS
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- RAZORPAY_WEBHOOK_SECRET

Optional receipt delivery:
- RESEND_API_KEY
- RECEIPT_FROM
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_FROM

Never put RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, SUPABASE_SECRET_KEY, Resend secret or Twilio auth token in GitHub frontend files.

## 3. Razorpay payment setup
CareerLab creates the Razorpay order on the server, sends the order ID to Checkout, verifies the returned signature on the server, checks the Razorpay payment is actually captured, and only then grants Pro.

Configure the webhook URL as:
`https://YOUR-WORKER-DOMAIN/payment/webhook`

Subscribe to payment events including `payment.captured`, `payment.failed`, and `order.paid`.

Razorpay Standard Checkout handles the available payment methods configured for your account. UPI Intent and UPI QR are the current UPI paths; do not build a manual UPI Collect flow.

## 4. Admin flow
Open `admin.html` using an account whose email is in `ADMIN_EMAILS`.

You can turn on:
- Free/Pro plan visibility
- Feature availability
- Visitor trial limit
- Free daily Explorer limit
- Free daily Mock Interview limit
- Visitor sign-in trigger
- Pro price

Users do not see Free/Pro labels until the administrator enables the plan system.

## 5. GitHub Pages
Upload all frontend files to the repository root:
- index.html
- styles.css
- app.js
- account.js
- auth.html
- auth.js
- admin.html
- admin.js
- app-config.js
- privacy.html
- .nojekyll

Deploy the Worker separately with `worker/worker.js` and `worker/wrangler.jsonc`.

## 6. Important production notes
- Test Supabase OAuth providers and phone OTP before launch.
- Test Razorpay in Test Mode before using Live Mode.
- Do not grant Pro from a frontend success message alone.
- The Worker verifies the payment signature and then checks the payment state before activation.
- The webhook is also verified so late/asynchronous payment events can activate Pro.
- Receipt email/SMS delivery is best-effort and is recorded in `careerlab_notifications`.
- Browser speech recognition depends on the user's browser and microphone permissions; it is English-only in this implementation.

## Account page troubleshooting
The account page intentionally does not create a Supabase client until valid public credentials are present. This prevents a blank/broken `auth.html` when `app-config.js` still has empty values.

Before testing sign-in, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `app-config.js`. In Supabase, enable the providers you want: Email, Phone/SMS, Google, GitHub and/or Azure (Microsoft). Add your exact GitHub Pages callback URLs under Authentication → URL Configuration and each provider's settings.

For GitHub Pages, use the deployed origin consistently. Example:
`https://YOUR-USERNAME.github.io/YOUR-REPO/auth.html`

For OAuth, the provider must also be configured in Supabase. The buttons cannot authenticate until that provider is enabled and its client credentials/callback settings are valid.
