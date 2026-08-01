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
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key

# Authentication
AUTH_SECRET=generate-with-openssl-rand-base64-32

# Initial Admin User
INITIAL_ADMIN_USERNAME=replace-with-private-admin-username
INITIAL_ADMIN_EMAIL=replace-with-private-admin-email
INITIAL_ADMIN_PASSWORD=replace-with-a-random-password-at-least-16-characters

# Email (for lead notifications)
RESEND_API_KEY=re_your_resend_api_key
```

### 2.5 Generate AUTH_SECRET

```bash
openssl rand -base64 32
```

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

### Leads
- GET `/api/crm?resource=dashboard` - Dashboard metrics
- GET/POST/PATCH/DELETE `/api/crm?resource=leads` - Authenticated lead management
- GET/POST/PATCH/DELETE `/api/crm?resource=contacts` - Authenticated contact management
- POST `/api/submit-quote` - Public quote capture into Supabase CRM

### Webhooks (Public)
- POST `/api/webhooks/inbound-lead` - Public lead capture
- POST `/api/webhooks/marblism` - Marblism integration

---

## Administrator Login

Administrator credentials must be created privately in Supabase or supplied through encrypted Vercel environment variables. Never store production credentials in this repository.

**⚠️ IMPORTANT: Change password immediately after first login!**
