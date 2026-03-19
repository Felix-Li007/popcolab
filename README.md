## Pop CoLab

Pop CoLab is a `Next.js` application for personality-driven experiences, requests, invitations, proposals, and checkout.

## Tech Stack

Application:

- `Next.js 16` with App Router
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`

Authentication and user management:

- `Clerk`
- Webhook sync for user create, update, and delete events

Database and data access:

- `PostgreSQL`
- `Prisma ORM`
- `@prisma/adapter-pg` with `pg`

Payments:

- `Stripe`
- `@stripe/react-stripe-js`
- `@stripe/stripe-js`
- `Stripe Elements`
- `Stripe webhooks`

Email:

- `Resend`
- `@react-email/render`

Async jobs and scheduling:

- `Upstash QStash`
- `PGMQ` queue tables in Postgres
- `Supabase` is used as the managed Postgres/queue host in the current infrastructure setup

Charts and UI helpers:

- `@nivo/bar`
- `@nivo/line`
- `@nivo/pie`
- `lucide-react`

Infra and deployment:

- `Vercel`
- `Terraform` for `vercel` and `supabase` providers
- `Cloudflared` for exposing local webhooks during development

Testing and tooling:

- `ESLint`
- `Prettier`
- `Jest`
- `Playwright`
- `Cucumber`
- `Husky`

## Environment Variables by Service

Database and Prisma:

- `DATABASE_URL`
- `DIRECT_URL`

Clerk:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SIGNING_SECRET`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_ACTION_DASHBOARD_URL`

Stripe:

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`

Resend:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Upstash QStash:

- `QSTASH_APP_URL`
- `QSTASH_ENDPOINT_PATH`
- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`

Supabase / queue:

- `SUPABASE_QUEUE_NAME`

Testing:

- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

Key service entry points:

- Clerk auth helpers: `src/services/clerk-service.ts`
- Clerk webhook: `src/app/api/webhooks/clerk/route.ts`
- Prisma client: `src/libs/prisma-client.ts`
- Stripe checkout action: `src/actions/stripe-actions.ts`
- Stripe webhook: `src/app/api/webhooks/stripe/route.ts`
- Resend mailer: `src/services/resend-service.ts`
- QStash webhook: `src/app/api/qstash/route.ts`
- Queue helpers: `src/services/qstash-service.ts`, `src/services/queue-service.ts`

## Deploy on Vercel

To deploy this Next.js app, we use the Vercel Platform (https://vercel.com). Below are concise, step-by-step instructions.

1. Configure build settings (defaults usually work)
   - Build Command: `npm run build`
   - Install Command: `npm install` (leave blank to use default)
   - Output Directory: leave blank (Next.js builds to `.next`)

2. Add required Environment Variables
   - Go to the Vercel Project settings → Environment Variables and add values for the production environment.
   - Common variables used by this project (set these to your production values):
     - `DATABASE_URL` — Postgres connection string (used by Prisma)
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (public)
     - `CLERK_SECRET_KEY` — Clerk secret key (server-side)
     - Any other `NEXT_PUBLIC_*` keys shown in `.env` if your app relies on them (for example sign-in / redirect URLs)

3. Run Prisma migrations (one-time / manual step)
   - Vercel build will generate Prisma client, but applying DB migrations should be done once against your production database.
   - Recommended: locally or from a CI job with production env vars set run:

   ```
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

4. Deploy from the CLI (optional)
   - Install Vercel CLI: `npm i -g vercel`
   - From the repo root: `vercel --prod`

5. Notes & troubleshooting
   - If a build fails, check Vercel's build logs for missing environment variables or failing `prisma generate` steps.
   - For scheduled or automated migrations, run `npx prisma migrate deploy` from a CI job (GitHub Actions) or a one-off server task that has `DATABASE_URL` and `CLERK` secrets configured.

## Run Docker Compose

ENV_FILE=.env.development docker-compose up --build

## Run Docker container

docker run -d \
 -p 80:80 \
 -e CLERK_SECRET_KEY=${{ secrets.CLERK_SECRET_KEY }} \
    -e DATABASE_URL=${{ secrets.DATABASE_URL }} \
 ghcr.io/${{ github.repository_owner }}/popcolab-app:latest

## Stripe Integration

This project uses `Next.js + Stripe Elements` for experience checkout.

Current checkout flow:

1. User opens `/dashboard/experiences`
2. User selects an experience and goes to `/dashboard/experiences/[experienceId]/checkout`
3. The frontend calls a Server Action to:
   - create `payment`
   - create `order`
   - create `order_item`
   - create a Stripe `PaymentIntent`
4. The action returns a `clientSecret`
5. Stripe `PaymentElement` confirms the payment on the client
6. Stripe webhook updates local `order` and `payment` statuses

Relevant files:

- `src/actions/stripe-actions.ts`
- `src/components/dashboard/checkout-client.tsx`
- `src/services/order-service.ts`
- `src/app/api/webhooks/stripe/route.ts`

Required environment variables:

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`

Notes:

- Payment intent creation now uses a Server Action, not a custom API route.
- Stripe webhook handling still uses `/api/webhooks/stripe` because Stripe must call a public HTTP endpoint.
- Currency is currently `CAD`.

## Stripe Local Testing

0. Install Stripe CLI

- macOS with Homebrew:

```bash
brew install stripe/stripe-cli/stripe
```

- Verify installation:

```bash
stripe version
```

- Authenticate once:

```bash
stripe login
```

1. Add Stripe env vars to `.env`

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. Start the app

```bash
npm run dev
```

3. Start Stripe webhook forwarding

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. Copy the printed webhook signing secret into `.env`

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

5. Complete a checkout from the dashboard

- Open `/dashboard/experiences`
- Choose an experience
- Load the payment form
- Confirm payment with a Stripe test card such as `4242 4242 4242 4242`

6. Verify webhook-driven status sync

- `payment.payment_status` should update after Stripe sends the event
- `order.order_status` should update with the corresponding local status
- The result page at `/dashboard/experiences/[experienceId]/checkout/result` should reflect the latest payment state

Useful Stripe CLI commands:

```bash
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger payment_intent.canceled
stripe trigger payment_intent.processing
```

Webhook endpoint:

- `POST /api/webhooks/stripe`

## Expose Local Port with Cloudflared

### Install cloudflared

1. macOS (Homebrew)
   - `brew install cloudflared`

2. Linux (official install script)
   - `curl -fsSL https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/install-and-update.sh | sudo bash`

3. Verify installation
   - `cloudflared --version`

4. Start the app on port `3000`
   - `npm run dev`

5. Temporary public URL (no custom domain)
   - `npx cloudflared tunnel --url http://localhost:3000`
   - The command prints a `https://*.trycloudflare.com` URL.

6. Bind a custom domain to local port `3000` (named tunnel)
   - Login once (creates `~/.cloudflared/cert.pem`):
     - `npx cloudflared tunnel login`
   - Create tunnel:
     - `npx cloudflared tunnel create popcolab-dev`
   - Route DNS (replace with your domain):
     - `npx cloudflared tunnel route dns popcolab-dev dev.example.com`
   - Create `~/.cloudflared/config.yml`:

```yaml
tunnel: popcolab-dev
credentials-file: /Users/<YOUR_USERNAME>/.cloudflared/<TUNNEL-UUID>.json

ingress:
  - hostname: dev.example.com
    service: http://localhost:3000
  - service: http_status:404
```

4. Run the named tunnel
   - `cloudflared tunnel run popcolab-dev`

5. Common error
   - If you see `Error locating origin cert` or missing `cert.pem`, run `cloudflared tunnel login` first.

## Upstash QStash

This project includes a minimal QStash integration for delayed messages and cron schedules.

Required environment variables:

- `QSTASH_APP_URL`
- `QSTASH_ENDPOINT_PATH`
- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`
- `SUPABASE_QUEUE_NAME` (optional, defaults to `default_queue`)

Webhook endpoint:

- `POST ${QSTASH_ENDPOINT_PATH}` (for example `POST /api/qstash`)

Current server-side helpers:

- `publishQStashTask(payload, options)` in [src/services/qstash-service.ts](src/services/qstash-service.ts)
- `upsertQueueSchedule(cron, batchSize)` in [src/services/qstash-service.ts](src/services/qstash-service.ts)
- `deleteQueueSchedule(scheduleId)` in [src/services/qstash-service.ts](src/services/qstash-service.ts)
- `handleQStashTask(payload)` in [src/services/qstash-service.ts](src/services/qstash-service.ts)
- `scheduleRequestExpiry(requestId)` in [src/services/request-service.ts](src/services/request-service.ts)
- `handleUserConfirmed(userId)` in [src/services/request-service.ts](src/services/request-service.ts)
- `handleRejectedProposal(proposalId)` in [src/services/request-service.ts](src/services/request-service.ts)
- `enqueueRequestReady(requestId, trigger, rejectedProposalId?)` in [src/services/request-service.ts](src/services/request-service.ts)

The proposal orchestration flow uses PGMQ in Postgres/Supabase:

- request creation schedules a delayed QStash trigger at `expired_at`
- invite confirmations can enqueue proposal generation as soon as everyone accepts
- proposal rejections enqueue a new proposal generation job
- a QStash cron worker reads from the queue, generates proposals, and deletes successful jobs

Setup command:

- `npm run qstash:setup`
- `npm run qstash:setup -- "*/5 * * * *" 20`

Delete command:

- `npm run qstash:delete -- request-queue-process`
