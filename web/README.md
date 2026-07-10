# Shop Guard — SaaS Web App

Production-ready Next.js SaaS starter with Supabase authentication, Stripe billing, Tailwind CSS, and a protected dashboard.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** — email/password auth with SSR session handling
- **Stripe** — subscriptions, checkout, customer portal, webhooks
- **Tailwind CSS v4** — modern dark UI

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/pricing` | Pricing plans with Stripe checkout |
| `/login` | Sign in |
| `/signup` | Create account |
| `/forgot-password` | Request password reset |
| `/reset-password` | Set new password (from email link) |
| `/dashboard` | Protected dashboard (requires auth) |
| `/dashboard/settings` | Account & billing settings |

## Getting started

### 1. Install dependencies

```bash
cd web
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migrations in order via the SQL editor:
   - Prefer: `001_profiles.sql` → `002_core_domain.sql` → `003_rls_and_shop_auth.sql` → remaining files through `009_canonicalize_profiles_auth.sql`
   - Skip deprecated `001_initial.sql` on new projects (it kept a competing `users_profile` path)
   - On an existing project that already ran older migrations, run **`009_canonicalize_profiles_auth.sql`** to fix signup triggers and FKs
3. Enable **Email** auth provider under Authentication → Providers
4. Add your site URL and redirect URLs under Authentication → URL Configuration:
   - Site URL: `http://localhost:3000` (and your production URL)
   - Redirect URLs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/auth/update-password`
     - `http://localhost:3000/api/auth/callback`
     - Matching production URLs for each of the above

### 3. Set up Stripe

1. Create products and recurring prices in the [Stripe Dashboard](https://dashboard.stripe.com)
2. Copy the price IDs for Starter and Pro plans
3. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) for local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 4. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See `.env.example` for the full list. Required variables:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (webhooks only, server-side)
- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — Webhook signing secret
- `STRIPE_STARTER_PRICE_ID` / `STRIPE_PRO_PRICE_ID`
- `NEXT_PUBLIC_SITE_URL` — App URL (e.g. `http://localhost:3000`)

## Production deployment

1. Deploy to [Vercel](https://vercel.com) or your preferred host
2. Set all environment variables in the hosting dashboard
3. Update Supabase redirect URLs to your production domain
4. Create a Stripe webhook endpoint pointing to `https://yourdomain.com/api/stripe/webhook` with these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## Auth & shop access

- On signup, each user gets a `users` row, a default shop, and an `owner` entry in `shop_members`
- Users can belong to multiple shops via `shop_members`
- Row-level security restricts all shop-scoped tables to active members of that `shop_id`
- Middleware protects `/dashboard` and authenticated Stripe API routes
- Server helpers in `src/lib/supabase/shops.ts` provide `getUserShops()`, `requireUser()`, and `requireShopAccess()`

## Billing & plans

| Plan | Price | Scans | Appeals | Uploads | Alerts | Team |
|------|-------|-------|---------|---------|--------|------|
| **Free trial** | $0 (14 days) | 10/month | — | — | — | 1 |
| **Starter** | $29/mo | 100/month | ✓ | ✓ | ✓ | 3 |
| **Pro** | $79/mo | Unlimited | ✓ | ✓ | ✓ | Unlimited |

- New signups automatically start a 14-day free trial (`plan_id: trial`)
- Stripe Checkout subscribes users to Starter or Pro (includes 14-day trial on first subscription)
- Webhooks sync `subscription_status`, `price_id`, and `plan_id` on `profiles`
- Feature gating lives in `src/lib/billing/entitlements.ts` and is enforced in API routes
- Billing portal: **Settings → Manage billing** (Stripe Customer Portal)

## Project structure

```
web/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, signup, password reset
│   │   ├── (marketing)/     # Landing & pricing
│   │   ├── dashboard/       # Protected routes
│   │   └── api/stripe/      # Checkout, portal, webhooks
│   ├── components/
│   ├── lib/
│   │   ├── billing/         # Entitlements & feature gating
│   │   ├── supabase/        # Browser, server, middleware clients
│   │   └── stripe/          # Stripe config & server client
│   └── middleware.ts        # Auth session refresh & route guards
└── supabase/migrations/     # Database schema
```
