# Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
1. GitHub account
2. Vercel account (sign up at [vercel.com](https://vercel.com))
3. PostgreSQL database (Vercel Postgres or external)

---

## Step 1: Database Migration (Critical)

**⚠️ SQLite will NOT work on Vercel** (serverless environment). You must migrate to PostgreSQL.

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel project dashboard
2. Click **Storage** → **Create Database** → **Postgres**
3. Copy the `DATABASE_URL` connection string
4. Add it to your environment variables (see Step 3)

### Option B: External PostgreSQL

Use any PostgreSQL provider:
- [Supabase](https://supabase.com/) (Free tier available)
- [Neon](https://neon.tech/) (Serverless Postgres)
- [Railway](https://railway.app/)
- AWS RDS, Google Cloud SQL, etc.

### Update Prisma Schema

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

### Run Migration Locally (Optional Test)

```bash
# Set your PostgreSQL connection string
export DATABASE_URL="postgresql://user:password@host:5432/database"

# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push
```

---

## Step 2: Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Prepare for Vercel deployment"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/meridian.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Vercel

### Via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Project**
3. Select your GitHub repository
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `prisma generate && next build`
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

5. **Add Environment Variables:**

   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   LLM_API_KEY=your-z-ai-api-key
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
   NODE_ENV=production
   ```

   To generate `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

6. Click **Deploy**

### Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts to configure project
```

---

## Step 4: Post-Deployment Configuration

### Set Environment Variables in Vercel

1. Go to **Project Settings** → **Environment Variables**
2. Add all variables from `.env.example`:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://...` | **Required** - Postgres connection string |
| `LLM_API_KEY` | Your API key | **Required** - AI SDK key |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | **Required** - Your Vercel URL |
| `NEXTAUTH_SECRET` | Generated secret | **Required** - Run `openssl rand -base64 32` |
| `NODE_ENV` | `production` | **Required** |
| `HERMES_MAX_EVENTS` | `10000` | Optional |
| `HERMES_CHECKPOINT_INTERVAL` | `100` | Optional |
| `MAX_CONCURRENT_RUNS` | `5` | Optional |
| `AGENT_MAX_STEPS` | `20` | Optional |
| `AGENT_TIMEOUT_MS` | `300000` | Optional |

3. **Redeploy** after adding environment variables (Vercel will auto-deploy on git push)

---

## Step 5: Database Initialization

After first deployment, initialize your database:

```bash
# Option 1: Use Vercel CLI
vercel env pull .env.production
export $(cat .env.production | xargs)
bun run db:push

# Option 2: Use Prisma Studio
npx prisma studio
# Then manually create initial data if needed
```

---

## Step 6: Verify Deployment

1. Visit your deployed URL: `https://your-app.vercel.app`
2. Check these endpoints:
   - `/` - Homepage should load
   - `/api/agent/list` - Should return `[]` (empty array)
   - `/api/tools/list` - Should return tool list

---

## Automatic Deployments

Vercel will automatically deploy on every push to `main` branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

**Preview Deployments:** Vercel creates preview deployments for every branch and PR.

---

## Troubleshooting

### Build Fails: "Can't find Prisma Client"

**Solution:** Ensure `prisma generate` runs in build command:
```json
{
  "buildCommand": "prisma generate && next build"
}
```

### Database Connection Error

**Solution:** 
1. Verify `DATABASE_URL` is set in Vercel environment variables
2. Check connection string format: `postgresql://user:password@host:5432/database`
3. Ensure database is accessible from Vercel (check firewall/security groups)

### Build Timeout

**Solution:**
1. Optimize build by removing unused dependencies
2. Increase Vercel timeout in project settings (Pro plan)
3. Use Vercel's build cache

### TypeScript Errors During Build

**Solution:** 
- Current config has `ignoreBuildErrors: true` in `next.config.ts`
- For production, consider fixing TypeScript errors and removing this flag

---

## Performance Optimization

### Enable Vercel Edge Caching

Add to `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  // ... existing config
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate' }
      ]
    }
  ]
};
```

### Database Connection Pooling

For PostgreSQL, use connection pooling:
```
DATABASE_URL="postgresql://user:password@host:5432/database?connection_limit=5"
```

---

## Monitoring

### Vercel Analytics

Enable in Vercel dashboard:
- **Project Settings** → **Analytics** → Enable

### Logging

View logs in real-time:
```bash
vercel logs --follow
```

Or in Vercel dashboard: **Deployments** → Select deployment → **Logs**

---

## Cost Considerations

### Vercel Free Tier Limits
- 100 GB bandwidth/month
- 6,000 build minutes/month
- Serverless function execution time limits

### Upgrade to Pro if needed:
- Unlimited bandwidth
- Increased build minutes
- Higher serverless function limits

---

## Security Checklist

- [ ] `NEXTAUTH_SECRET` is properly generated and set
- [ ] `DATABASE_URL` contains credentials (not exposed in client)
- [ ] `LLM_API_KEY` is set and not in source code
- [ ] Environment variables are set to **Production** scope
- [ ] CORS is configured if API is public
- [ ] Rate limiting is enabled (Phase 4 planned)

---

## Next Steps After Deployment

1. **Enable Authentication** (Phase 4 - Security Hardening)
2. **Add Rate Limiting** (Phase 4)
3. **Set up monitoring and alerts**
4. **Configure custom domain** (optional)
5. **Set up CI/CD tests** before deployment

---

## Useful Commands

```bash
# View deployment logs
vercel logs

# View environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local

# Redeploy latest deployment
vercel --prod

# Roll back to previous deployment
vercel rollback
```

---

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deploying-to-vercel)

---

**Status:** ✅ Ready for Vercel deployment after PostgreSQL migration
