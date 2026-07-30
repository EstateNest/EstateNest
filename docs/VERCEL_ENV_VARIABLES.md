# Vercel Environment Variables Guide

This document lists all required and optional environment variables for the EstateNest application deployment on Vercel.

## Required Environment Variables

### For All Environments (Production, Preview, Development)

| Variable Name | Required | Description | Example Value |
|-------------|----------|-------------|---------------|
| `VITE_PUBLIC_GA_ID` | **Yes** | Google Analytics 4 Measurement ID | `G-20HKYHFVLK` |
| `VITE_SUPABASE_URL` | **Conditional** | Supabase project URL (if using Supabase) | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | **Conditional** | Supabase anonymous key (if using Supabase) | `eyJhbGci...` |

## Optional Environment Variables

### Email Configuration (Choose One Method)

#### Option 1: Gmail SMTP
| Variable Name | Required | Description | Example Value |
|-------------|----------|-------------|---------------|
| `GMAIL_USER` | Conditional | Gmail address for sending emails | `your-email@gmail.com` |
| `GMAIL_APP_PASSWORD` | Conditional | Gmail App Password (NOT your regular password) | `xxxx xxxx xxxx xxxx` |

#### Option 2: Resend (Recommended)
| Variable Name | Required | Description | Example Value |
|-------------|----------|-------------|---------------|
| `RESEND_API_KEY` | Conditional | Resend API key for email delivery | `re_xxxxxxxxxxxxxxxxxxxx` |

### Integrations

| Variable Name | Required | Description | Example Value |
|-------------|----------|-------------|---------------|
| `VITE_N8N_WEBHOOK_URL` | Optional | N8N workflow webhook URL for lead notifications | `https://your-n8n.webhook.io/lead` |
| `N8N_WEBHOOK_URL` | Optional | Alternative N8N webhook URL (server-side) | `https://your-n8n.webhook.io/lead` |

### API Configuration

| Variable Name | Required | Description | Example Value |
|-------------|----------|-------------|---------------|
| `VITE_API_BASE_URL` | Optional | Base URL for API endpoints | `https://www.estatenest.ca/api` |

---

## How to Configure Environment Variables in Vercel

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. Click on **Settings** tab

### Step 2: Navigate to Environment Variables
1. In the left sidebar, click **Environment Variables**
2. Click **Add New**

### Step 3: Add Variables
For each variable:
1. Enter the **Name** (exact variable name from tables above)
2. Enter the **Value**
3. Select the **Environments** (Production, Preview, Development)
4. Click **Save**

### Recommended Configuration

| Environment | Variables to Include |
|-------------|---------------------|
| **Production** | All required + email method of choice |
| **Preview** | `VITE_PUBLIC_GA_ID` only (for testing) |
| **Development** | All variables for local testing |

---

## Verification Checklist

After setting up environment variables, verify:

- [ ] `VITE_PUBLIC_GA_ID` is set (required for Google Analytics 4)
- [ ] Email configuration is complete (either Gmail or Resend)
- [ ] Supabase variables are set if using database features
- [ ] Deploy preview branch to test
- [ ] Check browser console for any configuration errors

---

## Troubleshooting

### Google Analytics Not Working
- Verify `VITE_PUBLIC_GA_ID` is correctly formatted (starts with `G-`)
- Clear browser cache and reload
- Check browser console for errors

### Emails Not Sending
- For Gmail: Ensure App Password is correct (16 characters with spaces)
- For Resend: Verify API key starts with `re_`
- Check Vercel function logs for errors

### Supabase Connection Issues
- Verify URL starts with `https://`
- Ensure Anon Key is from the Supabase project API settings
- Check CORS settings in Supabase dashboard
