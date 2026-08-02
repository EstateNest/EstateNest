-- Estate Nest unified lead/client and advisor management foundation.
-- Review in a Supabase preview branch before applying. Do not run against production
-- as part of the Vercel preview deployment.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.login_attempts
  ADD COLUMN IF NOT EXISTS email_or_username text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'login_attempts'
      AND column_name = 'email'
  ) THEN
    EXECUTE 'UPDATE public.login_attempts SET email_or_username = COALESCE(email_or_username, email, ''unknown'') WHERE email_or_username IS NULL';
  ELSE
    UPDATE public.login_attempts SET email_or_username = 'unknown' WHERE email_or_username IS NULL;
  END IF;
END;
$$;

ALTER TABLE public.login_attempts
  ALTER COLUMN email_or_username SET NOT NULL;

CREATE OR REPLACE FUNCTION public.set_management_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_lead_public_id()
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
  SELECT 'ENL-' || TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYYMMDD') || '-' || UPPER(ENCODE(extensions.gen_random_bytes(4), 'hex'));
$$;

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS alternate_phone varchar(50),
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS postal_code varchar(20),
  ADD COLUMN IF NOT EXISTS lead_source varchar(100),
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_follow_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_reason text,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS public_id text,
  ADD COLUMN IF NOT EXISTS pipeline_stage text,
  ADD COLUMN IF NOT EXISTS dedupe_key text,
  ADD COLUMN IF NOT EXISTS outcome_reason text,
  ADD COLUMN IF NOT EXISTS future_contact_consent text,
  ADD COLUMN IF NOT EXISTS stage_notes text,
  ADD COLUMN IF NOT EXISTS stage_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS stage_changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_reason text,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.leads
SET public_id = 'ENL-' || TO_CHAR(COALESCE(created_at, NOW()) AT TIME ZONE 'UTC', 'YYYYMMDD') || '-' || UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 8))
WHERE public_id IS NULL;

UPDATE public.leads
SET pipeline_stage = CASE lead_status::text
  WHEN 'NEW' THEN 'PROSPECT'
  WHEN 'ATTEMPTED_CONTACT' THEN 'CONTACTED'
  WHEN 'CONTACTED' THEN 'CONTACTED'
  WHEN 'APPOINTMENT_BOOKED' THEN 'APPOINTMENT_BOOKED'
  WHEN 'NEEDS_ANALYSIS' THEN 'NEEDS_ANALYSIS'
  WHEN 'QUOTE_PREPARED' THEN 'QUOTE_PREPARED'
  WHEN 'QUOTE_PRESENTED' THEN 'QUOTE_PRESENTED'
  WHEN 'APPLICATION_STARTED' THEN 'APPLICATION_STARTED'
  WHEN 'APPLICATION_SUBMITTED' THEN 'APPLICATION_SUBMITTED'
  WHEN 'UNDERWRITING' THEN 'UNDERWRITING'
  WHEN 'REQUIREMENTS_PENDING' THEN 'UNDERWRITING'
  WHEN 'APPROVED' THEN 'APPROVED'
  WHEN 'POLICY_ISSUED' THEN 'POLICY_ISSUED'
  WHEN 'POLICY_DELIVERED' THEN 'POLICY_DELIVERED'
  WHEN 'FOLLOW_UP' THEN 'FOLLOW_UP_PROSPECT'
  WHEN 'NOT_TAKEN' THEN 'NOT_CONVERTED'
  WHEN 'LOST' THEN 'NOT_CONVERTED'
  ELSE 'PROSPECT'
END
WHERE pipeline_stage IS NULL;

ALTER TABLE public.leads
  ALTER COLUMN public_id SET DEFAULT public.generate_lead_public_id(),
  ALTER COLUMN public_id SET NOT NULL,
  ALTER COLUMN pipeline_stage SET DEFAULT 'PROSPECT',
  ALTER COLUMN pipeline_stage SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leads_pipeline_stage_check'
      AND conrelid = 'public.leads'::regclass
  ) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_pipeline_stage_check CHECK (pipeline_stage IN (
      'PROSPECT', 'VERIFIED_LEAD', 'CONTACTED', 'APPOINTMENT_BOOKED', 'NEEDS_ANALYSIS',
      'QUOTE_PREPARED', 'QUOTE_PRESENTED', 'APPLICATION_STARTED', 'APPLICATION_SUBMITTED',
      'UNDERWRITING', 'APPROVED', 'POLICY_ISSUED', 'POLICY_DELIVERED', 'ACTIVE_CLIENT',
      'FOLLOW_UP_PROSPECT', 'DEFERRED', 'NOT_CONVERTED', 'DUPLICATE', 'INVALID_LEAD', 'ARCHIVED'
    ));
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS leads_public_id_unique ON public.leads(public_id);
CREATE UNIQUE INDEX IF NOT EXISTS leads_dedupe_key_unique ON public.leads(dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS contacts_archived_at_idx ON public.contacts(archived_at);
CREATE INDEX IF NOT EXISTS leads_pipeline_stage_idx ON public.leads(pipeline_stage);
CREATE INDEX IF NOT EXISTS leads_archived_at_idx ON public.leads(archived_at);

CREATE TABLE IF NOT EXISTS public.advisors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  email varchar(255),
  phone varchar(50),
  alternate_phone varchar(50),
  address text,
  city varchar(100),
  province varchar(50),
  postal_code varchar(20),
  previous_mga varchar(255),
  new_mga varchar(255),
  reason_for_leaving text,
  advisor_notes text,
  goals text,
  recruitment_stage text NOT NULL DEFAULT 'ADVISOR_PROSPECT' CHECK (recruitment_stage IN (
    'ADVISOR_PROSPECT', 'ADVISOR_LEAD', 'INITIAL_CONTACT', 'DISCOVERY_MEETING',
    'RECRUITMENT_REVIEW', 'OFFER_AGREEMENT', 'ADVISOR_RECRUITED', 'ONBOARDING',
    'LICENSING_AND_CONTRACTING', 'ACTIVE_ADVISOR', 'DEFERRED', 'NOT_PROCEEDING',
    'INACTIVE', 'ARCHIVED'
  )),
  assigned_recruiter uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  next_follow_up_at timestamptz,
  stage_reason text,
  stage_changed_at timestamptz,
  stage_changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at timestamptz,
  archived_reason text,
  archived_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS advisors_email_active_unique
  ON public.advisors(lower(email))
  WHERE email IS NOT NULL AND archived_at IS NULL;
CREATE INDEX IF NOT EXISTS advisors_stage_idx ON public.advisors(recruitment_stage);
CREATE INDEX IF NOT EXISTS advisors_follow_up_idx ON public.advisors(next_follow_up_at);

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS assigned_advisor_id uuid REFERENCES public.advisors(id) ON DELETE SET NULL;
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS assigned_advisor_id uuid REFERENCES public.advisors(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.carrier_mga_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name varchar(255) NOT NULL,
  contracting_email varchar(255),
  compliance_email varchar(255),
  mga_name varchar(255),
  mga_email varchar(255),
  portal_url text,
  contact_person varchar(255),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.advisor_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id uuid NOT NULL UNIQUE REFERENCES public.advisors(id) ON DELETE CASCADE,
  life_licence_number text,
  accident_sickness_licence_number text,
  licence_province varchar(50),
  life_licence_issue_date date,
  life_licence_expiry_date date,
  accident_sickness_issue_date date,
  accident_sickness_expiry_date date,
  eo_policy_number text,
  eo_provider varchar(255),
  eo_effective_date date,
  eo_expiry_date date,
  cybersecurity_policy_number text,
  cybersecurity_provider varchar(255),
  cybersecurity_effective_date date,
  cybersecurity_expiry_date date,
  insurance_practice_sponsorship text,
  sponsoring_company varchar(255),
  mga varchar(255),
  compliance_status varchar(50) NOT NULL DEFAULT 'PENDING',
  outstanding_documents text,
  next_review_date date,
  banking_information_received boolean NOT NULL DEFAULT false,
  banking_received_date date,
  banking_verified_date date,
  banking_verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  banking_secure_document_reference text,
  banking_last_four varchar(4),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.advisor_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id uuid NOT NULL REFERENCES public.advisors(id) ON DELETE CASCADE,
  carrier_mga_id uuid REFERENCES public.carrier_mga_directory(id) ON DELETE SET NULL,
  company_name varchar(255) NOT NULL,
  advisor_code_masked varchar(50),
  sponsorship_status varchar(50),
  effective_date date,
  end_date date,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.management_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type varchar(30) NOT NULL CHECK (owner_type IN ('CONTACT', 'LEAD', 'ADVISOR', 'COMPLIANCE', 'COMMISSION', 'EMAIL')),
  owner_id uuid NOT NULL,
  storage_bucket varchar(100) NOT NULL DEFAULT 'management-documents',
  storage_path text NOT NULL,
  original_name varchar(255) NOT NULL,
  mime_type varchar(150) NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  sha256 varchar(64),
  scan_status varchar(30) NOT NULL DEFAULT 'PENDING' CHECK (scan_status IN ('PENDING', 'CLEAN', 'BLOCKED', 'FAILED')),
  retention_until date,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quote_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  notification_type varchar(50) NOT NULL DEFAULT 'NEW_QUOTE',
  channel varchar(20) NOT NULL DEFAULT 'GMAIL',
  recipients text[] NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED', 'FAILED')),
  provider_message_id text,
  attempt_count integer NOT NULL DEFAULT 0,
  last_error_code varchar(100),
  last_error_message varchar(500),
  queued_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  last_attempt_at timestamptz,
  next_retry_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_notifications_status_idx ON public.quote_notifications(status, next_retry_at);
CREATE INDEX IF NOT EXISTS quote_notifications_lead_idx ON public.quote_notifications(lead_id);

CREATE TABLE IF NOT EXISTS public.email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context_type varchar(30) NOT NULL CHECK (context_type IN ('CLIENT', 'ADVISOR', 'REPORT', 'COMPLIANCE', 'COMMISSION')),
  context_id uuid,
  template_key varchar(100),
  to_addresses text[] NOT NULL DEFAULT '{}',
  cc_addresses text[] NOT NULL DEFAULT '{}',
  bcc_addresses text[] NOT NULL DEFAULT '{}',
  subject varchar(500) NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  body_text text,
  status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PREVIEWED', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED')),
  previewed_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_at timestamptz,
  schedule_approved boolean NOT NULL DEFAULT false,
  provider_message_id text,
  attempt_count integer NOT NULL DEFAULT 0,
  last_error_code varchar(100),
  last_error_message varchar(500),
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_message_id uuid NOT NULL REFERENCES public.email_messages(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.management_documents(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email_message_id, document_id)
);

CREATE TABLE IF NOT EXISTS public.commission_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id uuid NOT NULL REFERENCES public.advisors(id) ON DELETE RESTRICT,
  policy_reference varchar(255) NOT NULL,
  policy_number_masked varchar(100),
  insurer varchar(255) NOT NULL,
  product_type varchar(255),
  commission_percentage numeric(7,4),
  commission_amount numeric(14,2),
  commission_status varchar(50) NOT NULL DEFAULT 'PENDING',
  policy_effective_date date,
  commission_release_date date,
  payment_date date,
  annual_reminder_date date,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.commission_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid NOT NULL REFERENCES public.commission_records(id) ON DELETE CASCADE,
  previous_values jsonb,
  new_values jsonb NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.record_commission_history()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.commission_history (commission_id, previous_values, new_values, changed_by)
  VALUES (NEW.id, CASE WHEN TG_OP = 'UPDATE' THEN TO_JSONB(OLD) ELSE NULL END, TO_JSONB(NEW), NEW.updated_by);
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.compliance_reminder_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  province varchar(50) NOT NULL,
  licence_type varchar(100) NOT NULL,
  deadline_rule text NOT NULL,
  reminder_days integer[] NOT NULL DEFAULT ARRAY[90, 60, 30, 7],
  regulator varchar(255),
  mga varchar(255),
  insurance_company varchar(255),
  apexa_requirement text,
  required_documents text,
  is_active boolean NOT NULL DEFAULT true,
  automatic_scheduling_enabled boolean NOT NULL DEFAULT false,
  scheduling_approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduling_approved_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(province, licence_type)
);

CREATE TABLE IF NOT EXISTS public.report_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  report_type varchar(50) NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}',
  export_format varchar(20) NOT NULL DEFAULT 'CSV' CHECK (export_format IN ('CSV', 'EXCEL', 'PDF')),
  recipients text[] NOT NULL DEFAULT '{}',
  schedule_expression varchar(100),
  schedule_enabled boolean NOT NULL DEFAULT false,
  schedule_approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  schedule_approved_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.report_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_definition_id uuid REFERENCES public.report_definitions(id) ON DELETE SET NULL,
  report_type varchar(50) NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}',
  export_format varchar(20) NOT NULL,
  recipient varchar(255),
  row_count integer NOT NULL DEFAULT 0,
  delivery_status varchar(20) NOT NULL DEFAULT 'PREVIEWED',
  error_message varchar(500),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.management_settings (
  setting_key varchar(150) PRIMARY KEY,
  setting_value jsonb NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.management_settings (setting_key, setting_value)
VALUES ('email.default_bcc', '{"addresses":["kanwar@estatenest.ca"]}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_future_contact_consent_check' AND conrelid = 'public.leads'::regclass) THEN
    ALTER TABLE public.leads ADD CONSTRAINT leads_future_contact_consent_check
      CHECK (future_contact_consent IS NULL OR future_contact_consent IN ('CONSENTED', 'DECLINED', 'UNKNOWN'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'advisor_compliance_status_check' AND conrelid = 'public.advisor_compliance'::regclass) THEN
    ALTER TABLE public.advisor_compliance ADD CONSTRAINT advisor_compliance_status_check
      CHECK (compliance_status IN ('PENDING', 'COMPLIANT', 'REVIEW_REQUIRED', 'NON_COMPLIANT'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'advisor_compliance_banking_last_four_check' AND conrelid = 'public.advisor_compliance'::regclass) THEN
    ALTER TABLE public.advisor_compliance ADD CONSTRAINT advisor_compliance_banking_last_four_check
      CHECK (banking_last_four IS NULL OR banking_last_four ~ '^[0-9]{4}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'commission_percentage_check' AND conrelid = 'public.commission_records'::regclass) THEN
    ALTER TABLE public.commission_records ADD CONSTRAINT commission_percentage_check
      CHECK (commission_percentage IS NULL OR commission_percentage BETWEEN 0 AND 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'commission_amount_check' AND conrelid = 'public.commission_records'::regclass) THEN
    ALTER TABLE public.commission_records ADD CONSTRAINT commission_amount_check
      CHECK (commission_amount IS NULL OR commission_amount >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'commission_status_check' AND conrelid = 'public.commission_records'::regclass) THEN
    ALTER TABLE public.commission_records ADD CONSTRAINT commission_status_check
      CHECK (commission_status IN ('PENDING', 'APPROVED', 'RELEASED', 'PAID', 'HELD'));
  END IF;
END;
$$;

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS actor_auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS audit_log_actor_auth_user_idx ON public.audit_log(actor_auth_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS commission_records_advisor_idx ON public.commission_records(advisor_id);
CREATE INDEX IF NOT EXISTS advisor_compliance_expiry_idx ON public.advisor_compliance(life_licence_expiry_date, eo_expiry_date);
CREATE INDEX IF NOT EXISTS email_messages_status_idx ON public.email_messages(status, created_at DESC);

DROP TRIGGER IF EXISTS advisors_updated_at ON public.advisors;
CREATE TRIGGER advisors_updated_at BEFORE UPDATE ON public.advisors
FOR EACH ROW EXECUTE FUNCTION public.set_management_updated_at();
DROP TRIGGER IF EXISTS carrier_mga_directory_updated_at ON public.carrier_mga_directory;
CREATE TRIGGER carrier_mga_directory_updated_at BEFORE UPDATE ON public.carrier_mga_directory
FOR EACH ROW EXECUTE FUNCTION public.set_management_updated_at();
DROP TRIGGER IF EXISTS advisor_compliance_updated_at ON public.advisor_compliance;
CREATE TRIGGER advisor_compliance_updated_at BEFORE UPDATE ON public.advisor_compliance
FOR EACH ROW EXECUTE FUNCTION public.set_management_updated_at();
DROP TRIGGER IF EXISTS advisor_contracts_updated_at ON public.advisor_contracts;
CREATE TRIGGER advisor_contracts_updated_at BEFORE UPDATE ON public.advisor_contracts
FOR EACH ROW EXECUTE FUNCTION public.set_management_updated_at();
DROP TRIGGER IF EXISTS quote_notifications_updated_at ON public.quote_notifications;
CREATE TRIGGER quote_notifications_updated_at BEFORE UPDATE ON public.quote_notifications
FOR EACH ROW EXECUTE FUNCTION public.set_management_updated_at();
DROP TRIGGER IF EXISTS email_messages_updated_at ON public.email_messages;
CREATE TRIGGER email_messages_updated_at BEFORE UPDATE ON public.email_messages
FOR EACH ROW EXECUTE FUNCTION public.set_management_updated_at();
DROP TRIGGER IF EXISTS commission_records_updated_at ON public.commission_records;
CREATE TRIGGER commission_records_updated_at BEFORE UPDATE ON public.commission_records
FOR EACH ROW EXECUTE FUNCTION public.set_management_updated_at();
DROP TRIGGER IF EXISTS commission_records_history ON public.commission_records;
CREATE TRIGGER commission_records_history AFTER INSERT OR UPDATE ON public.commission_records
FOR EACH ROW EXECUTE FUNCTION public.record_commission_history();
DROP TRIGGER IF EXISTS compliance_reminder_rules_updated_at ON public.compliance_reminder_rules;
CREATE TRIGGER compliance_reminder_rules_updated_at BEFORE UPDATE ON public.compliance_reminder_rules
FOR EACH ROW EXECUTE FUNCTION public.set_management_updated_at();
DROP TRIGGER IF EXISTS report_definitions_updated_at ON public.report_definitions;
CREATE TRIGGER report_definitions_updated_at BEFORE UPDATE ON public.report_definitions
FOR EACH ROW EXECUTE FUNCTION public.set_management_updated_at();
DROP TRIGGER IF EXISTS management_settings_updated_at ON public.management_settings;
CREATE TRIGGER management_settings_updated_at BEFORE UPDATE ON public.management_settings
FOR EACH ROW EXECUTE FUNCTION public.set_management_updated_at();

CREATE OR REPLACE FUNCTION public.accept_quote_lead(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_province text,
  p_insurance_interest text,
  p_insurance_type text,
  p_insurance_amount text,
  p_ready_to_proceed text,
  p_smoking_disclosed boolean,
  p_medical_disclosed boolean,
  p_dedupe_key text,
  p_referring_url text,
  p_ip_address text,
  p_user_agent text,
  p_notification_recipients text[]
)
RETURNS TABLE (
  lead_id uuid,
  lead_public_id text,
  notification_id uuid,
  duplicate boolean,
  accepted_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_id uuid;
  v_lead_id uuid;
  v_public_id text;
  v_notification_id uuid;
  v_funnel_type text;
  v_interest_type text;
BEGIN
  SELECT c.id INTO v_contact_id
  FROM public.contacts c
  WHERE c.archived_at IS NULL
    AND (
      (c.email IS NOT NULL AND LOWER(c.email) = LOWER(TRIM(p_email)))
      OR (c.phone IS NOT NULL AND REGEXP_REPLACE(c.phone, '\D', '', 'g') = REGEXP_REPLACE(p_phone, '\D', '', 'g'))
    )
  ORDER BY c.created_at ASC
  LIMIT 1;

  IF v_contact_id IS NULL THEN
    INSERT INTO public.contacts (
      first_name, last_name, email, phone, province, preferred_contact_method,
      marketing_consent, lead_source
    ) VALUES (
      TRIM(p_first_name), TRIM(p_last_name), LOWER(TRIM(p_email)), TRIM(p_phone),
      NULLIF(TRIM(p_province), ''), 'EITHER', false, 'WEBSITE_QUOTE'
    )
    RETURNING id INTO v_contact_id;
  ELSE
    UPDATE public.contacts
    SET first_name = TRIM(p_first_name),
        last_name = TRIM(p_last_name),
        phone = TRIM(p_phone),
        province = COALESCE(NULLIF(TRIM(p_province), ''), province),
        lead_source = COALESCE(lead_source, 'WEBSITE_QUOTE'),
        updated_at = NOW()
    WHERE id = v_contact_id;
  END IF;

  SELECT l.id, l.public_id INTO v_lead_id, v_public_id
  FROM public.leads l
  WHERE l.dedupe_key = p_dedupe_key
    AND l.archived_at IS NULL
  LIMIT 1;

  IF v_lead_id IS NOT NULL THEN
    SELECT qn.id INTO v_notification_id
    FROM public.quote_notifications qn
    WHERE qn.lead_id = v_lead_id
    ORDER BY qn.created_at DESC
    LIMIT 1;

    RETURN QUERY SELECT v_lead_id, v_public_id, v_notification_id, true, NOW();
    RETURN;
  END IF;

  SELECT format_type(attribute.atttypid, attribute.atttypmod)
  INTO v_interest_type
  FROM pg_attribute attribute
  WHERE attribute.attrelid = 'public.leads'::regclass
    AND attribute.attname = 'insurance_interest'
    AND NOT attribute.attisdropped;

  IF v_interest_type IS NULL THEN
    RAISE EXCEPTION 'leads.insurance_interest is unavailable';
  END IF;

  BEGIN
    EXECUTE format(
      'INSERT INTO public.leads (
        contact_id, source, landing_page, insurance_interest, lead_status, pipeline_stage,
        lead_score, notes, dedupe_key
      ) VALUES (
        $1, ''ORGANIC_SEARCH'', ''/quote'', $2::%s, ''NEW'', ''PROSPECT'', $3, $4, $5
      ) RETURNING id, public_id',
      v_interest_type
    )
    INTO v_lead_id, v_public_id
    USING
      v_contact_id,
      p_insurance_interest,
      CASE WHEN p_ready_to_proceed = 'yes' THEN 70 ELSE 50 END,
      'Quote request accepted. Sensitive details are intentionally excluded from notification email.',
      p_dedupe_key;
  EXCEPTION WHEN unique_violation THEN
    SELECT l.id, l.public_id INTO v_lead_id, v_public_id
    FROM public.leads l
    WHERE l.dedupe_key = p_dedupe_key
      AND l.archived_at IS NULL
    LIMIT 1;

    IF v_lead_id IS NULL THEN
      RAISE;
    END IF;

    SELECT qn.id INTO v_notification_id
    FROM public.quote_notifications qn
    WHERE qn.lead_id = v_lead_id
    ORDER BY qn.created_at DESC
    LIMIT 1;

    RETURN QUERY SELECT v_lead_id, v_public_id, v_notification_id, true, NOW();
    RETURN;
  END;

  v_funnel_type := CASE
    WHEN p_insurance_interest IN ('TERM_LIFE', 'MORTGAGE_PROTECTION', 'CRITICAL_ILLNESS', 'DISABILITY', 'TRAVEL', 'BUSINESS')
      THEN p_insurance_interest
    ELSE 'GENERAL_INQUIRY'
  END;

  INSERT INTO public.funnel_submissions (
    lead_id, contact_id, funnel_type, source, landing_page, referring_url,
    submission_data, ip_address, user_agent
  ) VALUES (
    v_lead_id, v_contact_id, v_funnel_type, 'ORGANIC_SEARCH', '/quote', p_referring_url,
    JSONB_BUILD_OBJECT(
      'insuranceType', p_insurance_type,
      'insuranceAmount', NULLIF(p_insurance_amount, ''),
      'readyToProceed', p_ready_to_proceed,
      'smokingHistoryDisclosed', p_smoking_disclosed,
      'medicalHistoryDisclosed', p_medical_disclosed
    ),
    NULLIF(TRIM(p_ip_address), '')::inet,
    LEFT(p_user_agent, 1000)
  );

  INSERT INTO public.quote_notifications (lead_id, recipients, status)
  VALUES (v_lead_id, p_notification_recipients, 'QUEUED')
  RETURNING id INTO v_notification_id;

  RETURN QUERY SELECT v_lead_id, v_public_id, v_notification_id, false, NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.accept_quote_lead(text, text, text, text, text, text, text, text, text, boolean, boolean, text, text, text, text, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_quote_lead(text, text, text, text, text, text, text, text, text, boolean, boolean, text, text, text, text, text[]) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_quote_lead(text, text, text, text, text, text, text, text, text, boolean, boolean, text, text, text, text, text[]) TO service_role;

ALTER TABLE public.advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_mga_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reminder_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_settings ENABLE ROW LEVEL SECURITY;

-- The deployed application uses server-only service-role access. Remove the
-- legacy permissive Data API policies so contact, lead, login, and CRM data
-- cannot be queried directly with a public/publishable key.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select ON public.users;
DROP POLICY IF EXISTS users_update ON public.users;
DROP POLICY IF EXISTS contacts_all ON public.contacts;
DROP POLICY IF EXISTS leads_all ON public.leads;
DROP POLICY IF EXISTS lead_activities_all ON public.lead_activities;
DROP POLICY IF EXISTS lead_notes_all ON public.lead_notes;
DROP POLICY IF EXISTS tasks_all ON public.tasks;
DROP POLICY IF EXISTS appointments_all ON public.appointments;
DROP POLICY IF EXISTS funnel_submissions_select ON public.funnel_submissions;
DROP POLICY IF EXISTS funnel_submissions_insert ON public.funnel_submissions;
DROP POLICY IF EXISTS campaigns_all ON public.campaigns;
DROP POLICY IF EXISTS content_drafts_all ON public.content_drafts;
DROP POLICY IF EXISTS audit_log_admin ON public.audit_log;

REVOKE ALL ON public.users, public.contacts, public.leads, public.lead_activities,
  public.lead_notes, public.tasks, public.appointments, public.funnel_submissions,
  public.campaigns, public.content_drafts, public.audit_log, public.sessions,
  public.login_attempts FROM anon, authenticated;

REVOKE ALL ON public.advisors, public.carrier_mga_directory, public.advisor_compliance,
  public.advisor_contracts, public.management_documents, public.quote_notifications,
  public.email_messages, public.email_attachments, public.commission_records,
  public.commission_history, public.compliance_reminder_rules, public.report_definitions,
  public.report_runs, public.management_settings FROM anon, authenticated;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;

DO $$
BEGIN
  IF to_regclass('public.lead_pipeline_summary') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON public.lead_pipeline_summary FROM anon, authenticated';
  END IF;
  IF to_regclass('public.leads_by_source') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON public.leads_by_source FROM anon, authenticated';
  END IF;
  IF to_regclass('public.leads_needing_followup') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON public.leads_needing_followup FROM anon, authenticated';
  END IF;
  IF to_regclass('public.todays_appointments') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON public.todays_appointments FROM anon, authenticated';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_management_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_lead_public_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_commission_history() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_management_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_lead_public_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.record_commission_history() TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'management-documents',
  'management-documents',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMIT;
