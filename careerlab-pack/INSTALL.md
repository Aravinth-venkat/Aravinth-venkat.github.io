# CareerLab authentication + plans + payments

This pack adds:
- Email/password sign up and sign in
- Google and GitHub sign-in
- Magic-link sign-in
- Account display and sign out
- Admin-only feature flags
- Free/Pro UI hidden by default until the admin enables plans
- Razorpay payment order + server-side signature verification foundation
- Payment tracking tables and admin dashboard

## 1. Supabase
Create a Supabase project and enable Email, Google and GitHub providers. Supabase supports password auth and OAuth providers.
Run `supabase/schema.sql` in the SQL Editor.
Put your project URL and publishable key into `app-config.js`.

## 2. Cloudflare Worker secrets
Keep these only in Worker secrets:
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
ADMIN_EMAILS=your-admin-email@example.com
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET

Do NOT put the Razorpay secret or Supabase secret key in GitHub/frontend code.

## 3. Worker
Merge the account/payment endpoint extension into the existing `worker/worker.js`. The existing AI routes must remain unchanged.
Required routes:
GET /config
GET /me
GET/POST /admin/config
GET /admin/payments
POST /payment/order
POST /payment/verify
POST /payment/webhook

## 4. Frontend
Add these files to the GitHub Pages root:
app-config.js
auth.html
auth.js
account.js
admin.html
admin.js

Then update index.html to load Supabase + app-config.js before app.js and account.js after app.js. Add `id="accountArea"` to the topbar.
Load Razorpay checkout on the main page with:
https://checkout.razorpay.com/v1/checkout.js

## 5. Plan behavior
Default is intentionally simple:
- plans_enabled=false
- no FREE badge
- no PRO badge
- no upgrade prompts
- no plan gating

When you switch “Show Free & Pro plans” ON in Admin, the plan UI and Pro controls appear.

## 6. Razorpay
Create the order on the server, open checkout in the browser, verify the signature on the server, and only then mark the user Pro. Configure a Razorpay webhook to the Worker `/payment/webhook` endpoint. Never expose the Key Secret in frontend code.
