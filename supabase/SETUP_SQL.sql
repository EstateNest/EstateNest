-- EstateNest CRM Database Setup
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gjstfkgvytbvkewvzbla/sql/new

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'agent' CHECK (role IN ('admin', 'manager', 'agent')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONTACTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    province TEXT,
    city TEXT,
    postal_code TEXT,
    preferred_contact_method TEXT DEFAULT 'EITHER' CHECK (preferred_contact_method IN ('PHONE', 'EMAIL', 'TEXT', 'EITHER')),
    marketing_consent BOOLEAN DEFAULT false,
    consent_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LEADS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    lead_owner UUID REFERENCES users(id) ON DELETE SET NULL,
    source TEXT DEFAULT 'ORGANIC_SEARCH' CHECK (source IN ('ORGANIC_SEARCH', 'GOOGLE_BUSINESS', 'SOCIAL', 'DIRECT', 'REFERRAL', 'MARBLISM', 'EMAIL', 'PAID_ADS', 'OTHER')),
    campaign TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    landing_page TEXT,
    insurance_interest TEXT NOT NULL CHECK (insurance_interest IN ('TERM_LIFE', 'WHOLE_LIFE', 'MORTGAGE_PROTECTION', 'CRITICAL_ILLNESS', 'DISABILITY', 'TRAVEL', 'BUSINESS', 'SEGREGATED_FUNDS', 'OTHER')),
    lead_status TEXT DEFAULT 'NEW' CHECK (lead_status IN ('NEW', 'ATTEMPTED_CONTACT', 'CONTACTED', 'APPOINTMENT_BOOKED', 'QUOTE_PREPARED', 'QUOTE_PRESENTED', 'APPLICATION_STARTED', 'APPLICATION_SUBMITTED', 'UNDERWRITING', 'REQUIREMENTS_PENDING', 'APPROVED', 'POLICY_ISSUED', 'POLICY_DELIVERED', 'NOT_TAKEN', 'LOST', 'FOLLOW_UP')),
    lead_score INTEGER DEFAULT 50 CHECK (lead_score >= 0 AND lead_score <= 100),
    next_follow_up_at TIMESTAMPTZ,
    last_contacted_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LEAD ACTIVITIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('CREATED', 'STATUS_CHANGE', 'NOTE_ADDED', 'EMAIL_SENT', 'EMAIL_OPENED', 'EMAIL_CLICKED', 'CALL_MADE', 'CALL_RECEIVED', 'SMS_SENT', 'SMS_RECEIVED', 'APPOINTMENT_BOOKED', 'APPOINTMENT_COMPLETED', 'APPOINTMENT_CANCELLED', 'QUOTE_PREPARED', 'QUOTE_PRESENTED', 'APPLICATION_SUBMITTED', 'POLICY_ISSUED', 'MANUAL_ACTIVITY', 'WEBHOOK_RECEIVED')),
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LEAD NOTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS lead_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TASKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- APPOINTMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    advisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    appointment_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    meeting_type TEXT DEFAULT 'PHONE' CHECK (meeting_type IN ('PHONE', 'VIDEO', 'IN_PERSON')),
    meeting_link TEXT,
    location TEXT,
    notes TEXT,
    status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FUNNEL SUBMISSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS funnel_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    funnel_type TEXT NOT NULL CHECK (funnel_type IN ('TERM_LIFE', 'MORTGAGE_PROTECTION', 'CRITICAL_ILLNESS', 'DISABILITY', 'TRAVEL', 'BUSINESS', 'GENERAL_INQUIRY')),
    source TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    landing_page TEXT,
    referring_url TEXT,
    submission_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CAMPAIGNS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('EMAIL', 'SOCIAL', 'PAID', 'ORGANIC', 'REFERRAL')),
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2),
    target_audience JSONB,
    utm_parameters JSONB,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONTENT DRAFTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS content_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type TEXT NOT NULL CHECK (content_type IN ('BLOG_POST', 'SOCIAL_POST', 'EMAIL_CAMPAIGN', 'LANDING_PAGE', 'AD_COPY')),
    title TEXT NOT NULL,
    body TEXT,
    meta_description TEXT,
    target_url TEXT,
    status TEXT DEFAULT 'AI_GENERATED' CHECK (status IN ('AI_GENERATED', 'DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED')),
    source_agent TEXT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUDIT LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    token_hash TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LOGIN ATTEMPTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_or_username TEXT NOT NULL,
    ip_address INET,
    success BOOLEAN DEFAULT false,
    attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ADMINISTRATOR PROVISIONING
-- =============================================

-- Create administrator accounts through a private migration or encrypted
-- INITIAL_ADMIN_* environment variables. Never commit credentials or password hashes.

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_leads_contact_id ON leads(contact_id);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON leads(lead_owner);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_insurance_interest ON leads(insurance_interest);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

SELECT 'Database setup complete!' as status;
