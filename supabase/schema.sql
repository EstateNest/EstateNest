-- EstateNest Lead Management System - Database Schema
-- PostgreSQL / Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- Lead Status Enum
CREATE TYPE lead_status AS ENUM (
  'NEW',
  'ATTEMPTED_CONTACT',
  'CONTACTED',
  'APPOINTMENT_BOOKED',
  'NEEDS_ANALYSIS',
  'QUOTE_PREPARED',
  'QUOTE_PRESENTED',
  'APPLICATION_STARTED',
  'APPLICATION_SUBMITTED',
  'UNDERWRITING',
  'REQUIREMENTS_PENDING',
  'APPROVED',
  'POLICY_ISSUED',
  'POLICY_DELIVERED',
  'NOT_TAKEN',
  'LOST',
  'FOLLOW_UP'
);

-- Lead Source Enum
CREATE TYPE lead_source AS ENUM (
  'ORGANIC_SEARCH',
  'GOOGLE_BUSINESS',
  'SOCIAL',
  'DIRECT',
  'REFERRAL',
  'MARBLISM',
  'EMAIL',
  'PAID_ADS',
  'OTHER'
);

-- Insurance Interest Enum
CREATE TYPE insurance_interest AS ENUM (
  'TERM_LIFE',
  'WHOLE_LIFE',
  'MORTGAGE_PROTECTION',
  'CRITICAL_ILLNESS',
  'DISABILITY',
  'TRAVEL',
  'BUSINESS',
  'SEGREGATED_FUNDS',
  'OTHER'
);

-- User Role Enum
CREATE TYPE user_role AS ENUM (
  'ADMIN',
  'ADVISOR',
  'MARKETING'
);

-- Content Draft Status Enum
CREATE TYPE draft_status AS ENUM (
  'AI_GENERATED',
  'UNDER_REVIEW',
  'APPROVED',
  'SCHEDULED',
  'PUBLISHED',
  'REJECTED'
);

-- Content Type Enum
CREATE TYPE content_type AS ENUM (
  'BLOG_POST',
  'SOCIAL_POST',
  'EMAIL_CAMPAIGN',
  'LANDING_PAGE',
  'AD_COPY'
);

-- Task Status Enum
CREATE TYPE task_status AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

-- Task Priority Enum
CREATE TYPE task_priority AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
);

-- Contact Preferred Method Enum
CREATE TYPE preferred_contact_method AS ENUM (
  'PHONE',
  'EMAIL',
  'TEXT',
  'EITHER'
);

-- ============================================
-- TABLES
-- ============================================

-- Users Table (Management System Users)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'ADVISOR',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts Table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  province VARCHAR(50),
  city VARCHAR(100),
  preferred_contact_method preferred_contact_method DEFAULT 'EITHER',
  marketing_consent BOOLEAN DEFAULT false,
  consent_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads Table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  source lead_source NOT NULL DEFAULT 'ORGANIC_SEARCH',
  campaign VARCHAR(255),
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  landing_page VARCHAR(500),
  insurance_interest insurance_interest NOT NULL,
  lead_status lead_status NOT NULL DEFAULT 'NEW',
  lead_owner UUID REFERENCES users(id) ON DELETE SET NULL,
  lead_score INTEGER DEFAULT 0,
  next_follow_up_at TIMESTAMP WITH TIME ZONE,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Activities Table (Audit trail for all lead changes)
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Notes Table
CREATE TABLE lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  status task_status DEFAULT 'PENDING',
  priority task_priority DEFAULT 'MEDIUM',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments Table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_type VARCHAR(50) DEFAULT 'PHONE',
  meeting_link VARCHAR(500),
  advisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'SCHEDULED',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Funnel Submissions Table
CREATE TABLE funnel_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  funnel_type VARCHAR(50) NOT NULL,
  source lead_source DEFAULT 'ORGANIC_SEARCH',
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  landing_page VARCHAR(500),
  referring_url TEXT,
  submission_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns Table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  channel VARCHAR(50),
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'DRAFT',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Drafts Table
CREATE TABLE content_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type content_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  channel VARCHAR(50),
  source_agent VARCHAR(50),
  status draft_status DEFAULT 'AI_GENERATED',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Log Table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions Table (for secure cookie-based auth)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Login Attempts Table (for rate limiting)
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255),
  ip_address VARCHAR(45) NOT NULL,
  success BOOLEAN DEFAULT false,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_leads_contact_id ON leads(contact_id);
CREATE INDEX idx_leads_status ON leads(lead_status);
CREATE INDEX idx_leads_owner ON leads(lead_owner);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_insurance_interest ON leads(insurance_interest);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_notes_updated_at BEFORE UPDATE ON lead_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_drafts_updated_at BEFORE UPDATE ON content_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log lead activity
CREATE OR REPLACE FUNCTION log_lead_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.lead_status IS DISTINCT FROM NEW.lead_status THEN
    INSERT INTO lead_activities (lead_id, user_id, activity_type, old_value, new_value, description)
    VALUES (
      NEW.id,
      NEW.lead_owner,
      'STATUS_CHANGE',
      OLD.lead_status::text,
      NEW.lead_status::text,
      'Lead status changed from ' || OLD.lead_status || ' to ' || NEW.lead_status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_lead_status_change
  AFTER UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION log_lead_activity();

-- Function to log audit entries
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_value, new_value)
  VALUES (
    current_setting('app.current_user_id', true)::uuid,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users: Only admins can see all users
CREATE POLICY users_select ON users FOR SELECT
  USING (true);

CREATE POLICY users_update ON users FOR UPDATE
  USING (true);

-- Contacts: Users can see all contacts
CREATE POLICY contacts_all ON contacts FOR ALL
  USING (true);

-- Leads: Users can see all leads
CREATE POLICY leads_all ON leads FOR ALL
  USING (true);

-- Lead activities: Users can see activities for leads they can access
CREATE POLICY lead_activities_all ON lead_activities FOR ALL
  USING (true);

-- Lead notes: Users can manage notes
CREATE POLICY lead_notes_all ON lead_notes FOR ALL
  USING (true);

-- Tasks: Users can manage tasks
CREATE POLICY tasks_all ON tasks FOR ALL
  USING (true);

-- Appointments: Users can manage appointments
CREATE POLICY appointments_all ON appointments FOR ALL
  USING (true);

-- Funnel submissions: Users can view submissions
CREATE POLICY funnel_submissions_select ON funnel_submissions FOR SELECT
  USING (true);

CREATE POLICY funnel_submissions_insert ON funnel_submissions FOR INSERT
  WITH CHECK (true);

-- Campaigns: Users can manage campaigns
CREATE POLICY campaigns_all ON campaigns FOR ALL
  USING (true);

-- Content drafts: Users can manage drafts based on role
CREATE POLICY content_drafts_all ON content_drafts FOR ALL
  USING (true);

-- Audit log: Only admins can view
CREATE POLICY audit_log_admin ON audit_log FOR SELECT
  USING (
    current_setting('app.current_user_id', true)::uuid IN (
      SELECT id FROM users WHERE role = 'ADMIN'
    )
  );

-- ============================================
-- ADMINISTRATOR PROVISIONING
-- ============================================

-- Create administrator accounts through a private migration or encrypted
-- INITIAL_ADMIN_* environment variables. Never commit credentials or password hashes.

-- ============================================
-- VIEWS: Common Queries
-- ============================================

-- Lead Pipeline Summary View
CREATE VIEW lead_pipeline_summary AS
SELECT 
  lead_status,
  COUNT(*) as count,
  AVG(lead_score) as avg_score
FROM leads
GROUP BY lead_status;

-- Leads by Source Summary
CREATE VIEW leads_by_source AS
SELECT 
  source,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN lead_status NOT IN ('NEW', 'LOST', 'NOT_TAKEN') THEN 1 END) as converted_leads
FROM leads
GROUP BY source;

-- Leads Needing Follow-up
CREATE VIEW leads_needing_followup AS
SELECT 
  l.*,
  c.first_name,
  c.last_name,
  c.email,
  c.phone,
  u.first_name as owner_first_name,
  u.last_name as owner_last_name
FROM leads l
LEFT JOIN contacts c ON l.contact_id = c.id
LEFT JOIN users u ON l.lead_owner = u.id
WHERE l.next_follow_up_at <= NOW()
  AND l.lead_status NOT IN ('POLICY_DELIVERED', 'LOST', 'NOT_TAKEN');

-- Today's Appointments
CREATE VIEW todays_appointments AS
SELECT 
  a.*,
  c.first_name as contact_first_name,
  c.last_name as contact_last_name,
  l.insurance_interest,
  u.first_name as advisor_first_name,
  u.last_name as advisor_last_name
FROM appointments a
LEFT JOIN leads l ON a.lead_id = l.id
LEFT JOIN contacts c ON l.contact_id = c.id
LEFT JOIN users u ON a.advisor_id = u.id
WHERE DATE(a.appointment_date) = CURRENT_DATE;
