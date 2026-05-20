# danielphilip.com Marketing Dashboard

A complete marketing dashboard with a **fragrance quiz funnel** and **admin lead management system** for danielphilip.com.

## Features

### Public Funnel
- **Fragrance Quiz** — 5-question scent compatibility quiz (`/quiz`)
- **Smart Matching** — Proprietary algorithm matches users to scent lines
- **Lead Capture** — Collects name, email, phone before revealing match
- **Auto-enrollment** — Quiz leads auto-enroll in welcome sequence with instant email

### Admin Dashboard
- **Lead Management** — View, filter, and segment leads collected from quizzes and sales funnels
- **Email Sequences** — Create multi-step drip campaigns with behavioral triggers
- **Broadcast Composer** — Send one-off emails to segmented audiences
- **Analytics** — Track open rates, click rates, and unsubscribes
- **Webhook Tracking** — Resend integration automatically updates email statuses

## Quick Start

### 1. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL editor, run all statements from `/Dp 2026 Launch /src/lib/supabase-server.ts` (the SQL schema)
3. Copy your project URL and API keys

### 2. Set Up Resend

1. Go to [resend.com](https://resend.com) and create an account
2. Get your API key from the dashboard
3. Go to **Webhooks** and add this URL: `https://your-domain.com/api/email/webhook`
4. Copy the **Webhook Secret** (whsec_...)

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend
RESEND_API_KEY=your_api_key
RESEND_WEBHOOK_SECRET=your_webhook_secret

# Email
EMAIL_FROM="Daniel Philip <daniel@danielphilip.com>"

# Site
NEXT_PUBLIC_SITE_URL=https://danielphilip.com

# Auth (generate with: openssl rand -hex 32)
ADMIN_SECRET=your_random_secret_here
CRON_SECRET=your_random_cron_secret_here

# Features
EMAIL_CAMPAIGN_ENABLED=false  # Set to true when ready to send emails
```

### 4. Run Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000/admin-login` and log in with your `ADMIN_SECRET`.

## Project Structure

```
src/
├── lib/
│   ├── supabase-server.ts    # Supabase types & client
│   ├── resend.ts             # Resend client setup
│   ├── drip-engine.ts        # DB-driven sequence logic
│   ├── email-sender.ts       # Email sending & broadcast
│   └── utils.ts              # Utility functions
├── middleware.ts              # Auth gate for /admin routes
└── app/
    ├── quiz/                  # Public fragrance quiz
    │   ├── layout.tsx        # Quiz layout (dark luxe aesthetic)
    │   └── page.tsx          # 5-question quiz with lead capture
    ├── thank-you/            # Post-quiz thank you page
    │   └── page.tsx          # Results + Instagram CTA
    ├── admin/                # Protected admin dashboard
    │   ├── layout.tsx        # Admin layout with sidebar
    │   ├── page.tsx          # Dashboard homepage
    │   ├── leads/            # Lead management
    │   ├── sequences/        # Sequence builder
    │   ├── composer/         # Broadcast composer
    │   └── analytics/        # Email analytics
    └── api/
        ├── admin/            # Protected admin APIs
        │   ├── login         # Authentication
        │   ├── leads         # Lead management
        │   ├── sequences     # Sequence CRUD
        │   └── broadcasts    # Broadcast sending
        ├── email/            # Email processing
        │   ├── webhook       # Resend webhook handler
        │   ├── cron          # Daily drip processor
        │   └── unsubscribe   # One-click unsubscribe
        └── leads             # Public lead collection API
```

## How It Works

### Fragrance Quiz Funnel

1. User visits `/quiz` landing page
2. Clicks "Start Quiz" → enters 5-question fragrance compatibility questionnaire
3. Questions cover: vibe, occasion, style, scent preferences, desired feeling
4. On question 5, redirected to lead capture form (name, email, phone)
5. On form submit:
   - `POST /api/leads` creates lead with quiz answers and calculated scent match
   - Lead auto-enrolled in active welcome sequence
   - Welcome email sent immediately
   - Redirects to `/thank-you?scent=[oud|citrus|rose|noir]`
6. Thank you page shows matched scent + Instagram DM CTA

**Scent Matching Algorithm:**
- Each answer maps to one of 4 scent lines: Oud Royale, Citrus Bloom, Rose Amber, Noir Smoke
- Points tallied for each scent based on answer matches
- Highest-scoring scent returned to user

### Lead Collection → Enrollment

1. Internal quiz or external funnel calls `POST /api/leads` with lead data
2. Lead is upserted into database (email = primary key)
3. Lead is automatically enrolled in the active sequence
4. Welcome email (day_offset=0) is sent immediately
5. Returns `lead_id`

### Daily Email Processing

1. Vercel Cron triggers `GET /api/email/cron` at **1 PM UTC** (9 AM ET)
2. Cron processor fetches active enrollments
3. For each enrollment, determines which step is due based on:
   - Days since enrollment
   - Behavioral conditions (if any)
   - Previously sent emails
4. Sends due emails with 200ms throttle between sends
5. Logs each send to `email_logs` with Resend's email_id

### Webhook Tracking

1. When leads open/click emails, Resend fires webhooks
2. `POST /api/email/webhook` verifies Svix signature
3. Updates `email_logs` with status (opened, clicked, bounced, etc.)
4. If bounced/complained: automatically marks lead as unsubscribed

### Broadcasting

1. Admin goes to `/admin/composer`
2. Writes subject + HTML body
3. Selects segment (Lead, Checkout Started, Buyer, Abandoned)
4. Clicks Send
5. System queries all leads matching that status
6. Sends email to each with 200ms throttle
7. Logs all sends to `email_logs` with `campaign_type='broadcast'`

## Key API Endpoints

### Public

- `POST /api/leads` — Create/update lead and auto-enroll
- `GET /api/email/unsubscribe` — One-click unsubscribe
- `POST /api/email/webhook` — Resend webhook (requires Svix signature)
- `GET /api/email/cron` — Daily cron processor (requires CRON_SECRET)

### Admin (Protected)

- `POST /api/admin/login` — Authenticate with password
- `POST /api/admin/logout` — Clear auth cookie
- `GET /api/admin/leads` — Paginated lead list with filters
- `GET /api/admin/sequences` — List all sequences
- `POST /api/admin/sequences` — Create sequence
- `POST /api/admin/sequences/[id]/steps` — Add sequence step
- `POST /api/admin/broadcasts` — Send broadcast email

## Authentication

Uses simple cookie-based auth:

1. Admin enters password on `/admin-login`
2. `POST /api/admin/login` verifies against `ADMIN_SECRET`
3. Sets `httpOnly; secure; sameSite=lax` cookie named `admin_auth`
4. Middleware checks cookie on all `/admin` and `/api/admin` requests
5. Mismatch → redirect to login (pages) or 401 (APIs)

## Email Campaign Control

Set `EMAIL_CAMPAIGN_ENABLED=false` to **test without sending real emails**:

- Cron processor runs but doesn't call Resend API
- Broadcasts don't send
- Perfect for testing before going live

When ready: set `EMAIL_CAMPAIGN_ENABLED=true` in Vercel's environment variables.

## Testing the Cron

Test locally before deploying:

1. Set `EMAIL_CAMPAIGN_ENABLED=false`
2. Create a test sequence with a welcome step (day_offset=0)
3. Add a test lead via `POST /api/leads`
4. Run the cron manually:
   ```bash
   curl "http://localhost:3000/api/email/cron" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
5. Verify email_logs were created (but not actually sent)
6. Check the response for `{ processed, sent, skipped, failed }`

## Deploying to Vercel

1. Push to GitHub
2. Create a new Vercel project from the repo
3. Set all environment variables in Vercel's project settings
4. Deploy
5. Verify cron fires at 1 PM UTC (check Vercel dashboard → Crons)
6. Resend webhook URL should point to your Vercel domain

## Troubleshooting

### Leads not receiving emails

1. Check `EMAIL_CAMPAIGN_ENABLED=true` in Vercel
2. Verify Resend API key is valid
3. Check `email_logs` table — are sends being logged?
4. Check Resend dashboard for bounces/complaints
5. Verify webhook secret is correct (Resend → Webhooks)

### Webhook not updating statuses

1. Verify `RESEND_WEBHOOK_SECRET` matches Resend dashboard
2. Check `/api/email/webhook` logs in Vercel
3. Send a test email from Resend dashboard, check for 200 response

### Cron not firing

1. Verify `CRON_SECRET` is set in Vercel
2. Check Vercel Crons dashboard (Project → Settings → Crons)
3. Look for 200 responses in Vercel logs at 1 PM UTC

## Future Enhancements

- Behavioral condition builder UI (for conditional steps)
- Segment presets (VIP, Engaged, At-risk)
- Email template library
- A/B testing for subject lines
- Lead import CSV
- Unsubscribe rate by step
- Revenue tracking (if using Stripe)

---

Built with Next.js 15, Tailwind CSS, Supabase, and Resend. 🚀
