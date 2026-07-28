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
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `eyJhbGc...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | **Production only** (secret) |
| `AUTH_SECRET` | Generate below | Production |
| `RESEND_API_KEY` | `re_...` | Production |
| `LEAD_NOTIFICATION_EMAIL_1` | `hello@estatenest.ca` | Production |
| `LEAD_NOTIFICATION_EMAIL_2` | `kanwar@estatenest.ca` | Production |
| `ALLOWED_ORIGINS` | `https://www.estatenest.ca,https://estatenest.ca` | Production |

### 3. Generate AUTH_SECRET
Run this command on your computer:
```bash
openssl rand -base64 32
```
Copy the output and paste it as the value for `AUTH_SECRET`.

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
3. Login to CRM at https://www.estatenest.ca/management/login
