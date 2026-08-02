# EstateNest Lead Management System - Setup Guide

## Overview

This document covers the setup and configuration of the EstateNest Lead Management System, built as an extension to the existing EstateNest.ca website.

## Architecture

```
EstateNest.ca (Public) ──► API Server (Port 3001) ──► Supabase (PostgreSQL)
     React SPA                    Hono + Node              Database
```

## Prerequisites

1. Node.js 18+ installed
2. Supabase account (free tier works)
3. Git access to the EstateNest repository

---

## Phase 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to supabase.com and sign up/login
2. Click "New Project"
3. Enter details:
   - **Name**: EstateNest CRM
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users

### 1.2 Get Your Project Credentials

1. Go to Project Settings → API
2. Copy the following values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: (safe for client-side)
   - **service_role key**: (KEEP SECRET - server-side only)

### 1.3 Run Database Schema

1. Go to SQL Editor in Supabase Dashboard
2. Copy the contents of `supabase/schema.sql`
3. Paste and click "Run"
4. Verify tables created

For Preview validation, apply migrations in timestamp order to a separate staging Supabase project. Do not apply `supabase/migrations/20260801230000_lead_advisor_management.sql` to the production project until the Preview release gate and human review are complete.

---

## Phase 2: Local Development Setup

### 2.1 Clone & Checkout Branch

```bash
git checkout feature/estate-nest-backend-test
```

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Create Environment File

```bash
cp management.env.example .env.local
```

### 2.4 Configure .env.local

Edit `.env.local` with your actual values:

```env
# Supabase Auth and server API (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key

# Gmail lead notifications
GMAIL_USER=kanwar@estatenest.ca
GMAIL_APP_PASSWORD=configure-as-a-sensitive-vercel-variable

# Management security and protected CRM links
MANAGEMENT_MFA_REQUIRED=true
PUBLIC_SITE_URL=https://www.estatenest.ca
```

### 2.5 Configure Supabase Management Authorization

Apply `supabase/migrations/20260801163000_management_user_roles.sql` in the staging Supabase SQL Editor, followed by `supabase/migrations/20260801230000_lead_advisor_management.sql`. Management credentials remain exclusively in Supabase Auth; never add passwords to this repository. Preview and Production must not share a database for migration testing.

---

## Phase 3: Running Development

### Start the API Server

```bash
npm run dev:api
```

### Start the Frontend (separate terminal)

```bash
npm run dev
```

---

## API Endpoints

### Authentication
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout
- GET `/api/auth/me` - Get current user
- GET/POST `/api/auth/mfa` - Inspect, enrol, verify, confirm, or remove a TOTP factor

### Leads
- GET `/api/crm?resource=dashboard` - Dashboard metrics
- GET/POST/PATCH/DELETE `/api/crm?resource=leads` - Authenticated lead management
- GET/POST/PATCH/DELETE `/api/crm?resource=contacts` - Authenticated contact management
- POST `/api/submit-quote` - Public quote capture into Supabase CRM
- GET/POST/PATCH/DELETE `/api/crm?resource=advisors` - Advisor recruitment and lifecycle
- GET/POST/PATCH `/api/crm?resource=compliance` - Restricted advisor compliance records
- GET/POST/PATCH `/api/crm?resource=advisor-contracts` - Restricted insurance-company contracts and masked advisor codes
- GET/POST/PATCH `/api/crm?resource=carriers` - Carrier/MGA directory with owner-verified contact details
- GET/POST/PATCH `/api/crm?resource=reminder-rules` - Configurable licence-renewal rules; automatic scheduling remains disabled
- GET/POST/PATCH `/api/crm?resource=commissions` - Restricted commission records and history
- GET/POST/PATCH `/api/crm?resource=emails` - Gmail draft, preview, confirmation, send, and retry
- GET/POST `/api/crm?resource=documents` - Private attachment metadata and signed quarantine uploads
- GET/POST `/api/crm?resource=notifications` - Quote email status and retry controls
- GET/POST `/api/crm?resource=reports` - Preview-token-bound export, delivery, and approved inactive scheduling

### Webhooks (Public)
- POST `/api/webhooks/inbound-lead` - Public lead capture
- POST `/api/webhooks/marblism` - Marblism integration

---

## Administrator Login

Administrator credentials must be created privately in Supabase or supplied through encrypted Vercel environment variables. Never store production credentials in this repository.

**⚠️ IMPORTANT: Change password immediately after first login!**
