# Supabase Setup Guide - EstateNest CRM

## ⚡ Quick Setup (15 minutes)

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with **hello@estatenest.ca**
4. Verify your email

### Step 2: Create New Project
1. Click "New Project"
2. Fill in:
   - **Name**: `EstateNest CRM`
   - **Database Password**: Click "Generate a strong password" → COPY THIS!
   - **Region**: Choose `Canada (Toronto)` or closest to you
3. Click "Create new project"
4. **Wait 2-3 minutes** for project to be ready

### Step 3: Get Your Credentials
Once project is ready, go to **Settings → API**:

```
Project URL:     https://xxxxxxxx.supabase.co
anon/public key: eyJhbGc... (copy this)
service_role key: eyJhbGc... (copy this - KEEP SECRET!)
```

### Step 4: Run Database Schema
1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy ALL contents from: `supabase/schema.sql`
4. Paste into the SQL editor
5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success" for all tables created

### Step 5: Get Resend API Key (for email notifications)
1. Go to https://resend.com
2. Sign up with **hello@estatenest.ca**
3. Click "API Keys" → "Create API Key"
4. Name it "EstateNest CRM"
5. Copy the key (starts with `re_`)

### Step 6: Share Credentials with Me
Send me these 4 values and I'll complete the setup:
```
1. Supabase Project URL: _______________
2. Supabase anon/public key: _______________
3. Supabase service_role key: _______________
4. Resend API Key: re____________
```

---

## What I'll Do With These

Once you share the credentials:

1. ✅ Create `.env.local` with all settings
2. ✅ Test the database connection
3. ✅ Verify the API server works
4. ✅ Test lead notification emails
5. ✅ Create a test lead
6. ✅ Update Vercel environment variables
7. ✅ Verify the CRM login works

---

## After Setup - Administrator Login

Open `https://www.estatenest.ca/management/login` and use the administrator credentials created privately in Supabase or encrypted Vercel environment variables. Production passwords must never be committed.

**⚠️ IMPORTANT: Change password immediately after first login!**

---

## Need Help?

If you get stuck on any step, just send me a screenshot or describe what you see and I'll guide you through it.
