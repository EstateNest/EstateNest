# Vercel Environment Variables Setup

## After Supabase is Ready

### 1. Go to Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select the **EstateNest** project
3. Click **Settings** (top right)

### 2. Add Environment Variables
Click **Environment Variables** and add each of these:

| Name | Value | Environments |
|------|-------|--------------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Production; Preview uses staging |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Production; Preview uses staging |
| `SUPABASE_SECRET_KEY` | `sb_secret_...` | Production; Preview uses a branch-scoped staging secret |
| `GMAIL_USER` | `kanwar@estatenest.ca` | Verified Gmail SMTP login for approved Preview testing; recipients remain separately configured |
| `GMAIL_APP_PASSWORD` | Google app password | Production and approved Preview testing (sensitive) |
| `LEAD_NOTIFICATION_EMAIL_1` | `hello@estatenest.ca` | Production and Preview |
| `LEAD_NOTIFICATION_EMAIL_2` | `kanwar@estatenest.ca` | Production and Preview |
| `ALLOWED_ORIGINS` | Production and Preview origins | Environment-specific |
| `CHATBOT_RETENTION_DAYS` | `180` | Optional; Production and Preview |
| `CHATBOT_HANDOFF_SECONDS` | `1200` | Optional; Production and Preview |
| `CHATBOT_HASH_SECRET` | Dedicated random secret | Optional; falls back to existing server `AUTH_SECRET` |

The public website is a Vite application. Browser code only receives variables explicitly referenced as `import.meta.env.VITE_*`; never use that prefix for passwords, Supabase secret keys, authentication secrets, or email credentials. Management authentication calls same-origin `/api` routes and does not require browser Supabase variables.

Preview deployments must not receive the Production Supabase secret. Configure a separate staging Supabase project and add its `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` only to the approved feature branch before enabling CRM, quote, or chatbot persistence in Preview. Supabase Auth login and role checks use the same staging URL and publishable key.

The chatbot does not require Dify, Crawl4AI, Firecrawl, Resend, or a browser Supabase key. It uses same-origin Vercel Functions, server-only Supabase access, the existing Gmail SMTP credentials, and HttpOnly cookies.

### 3. Apply Management Role Migration
Run `supabase/migrations/20260801163000_management_user_roles.sql` in the Supabase SQL Editor before testing management login. The migration creates the protected role mapping and assigns the verified owner Auth user the `super_admin` role.

### 4. Redeploy
After adding all variables:
1. Go to **Deployments**
2. Click **...** menu on the latest deployment
3. Select **Redeploy**
4. Wait 2-3 minutes

---

## Test the Setup

After redeployment, test:
1. Submit a quote request at https://www.estatenest.ca/quote
2. Check if email arrives at hello@estatenest.ca
3. Login to CRM with the confirmed Supabase Auth email at https://www.estatenest.ca/management/login
