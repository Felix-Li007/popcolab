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
   - `cloudflared tunnel --url http://localhost:3000`
   - The command prints a `https://*.trycloudflare.com` URL.

6. Bind a custom domain to local port `3000` (named tunnel)
   - Login once (creates `~/.cloudflared/cert.pem`):
     - `cloudflared tunnel login`
   - Create tunnel:
     - `cloudflared tunnel create popcolab-dev`
   - Route DNS (replace with your domain):
     - `cloudflared tunnel route dns popcolab-dev dev.example.com`
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
