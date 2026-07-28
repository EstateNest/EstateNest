# EstateNest CRM - One-Page Setup Sheet

## STEP 1: Supabase (15 min)
1. Go to https://supabase.com
2. Sign up with **hello@estatenest.ca**
3. Click **New Project** → Name: `EstateNest CRM`
4. Wait 2 min for setup
5. Go to **Settings → API** → Copy:
   - Project URL
   - anon/public key
   - service_role key

## STEP 2: Database Setup (2 min)
1. In Supabase → **SQL Editor**
2. Click **New query**
3. Copy-paste everything from `supabase/schema.sql`
4. Click **Run**

## STEP 3: Resend Email (5 min)
1. Go to https://resend.com
2. Sign up with **hello@estatenest.ca**
3. Click **API Keys** → **Create API Key**
4. Copy the key (starts with `re_`)

## STEP 4: Send Me Your Credentials
Text/email me:
```
Supabase URL: https://______.supabase.co
Supabase anon key: eyJ____
Supabase service key: eyJ____
Resend key: re____
```

## What I'll Do:
✅ Create .env.local
✅ Test database connection  
✅ Verify email works
✅ Configure Vercel
✅ Test everything
✅ Create test lead
✅ Verify CRM login

## Your Login (after setup):
```
https://www.estatenest.ca/management/login
Username: EstateNest2026
Password: TestEN
```
⚠️ Change password on first login!
