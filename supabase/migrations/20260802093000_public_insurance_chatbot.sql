BEGIN;

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_source_check CHECK (source IN (
  'ORGANIC_SEARCH', 'GOOGLE_BUSINESS', 'SOCIAL', 'DIRECT', 'REFERRAL',
  'MARBLISM', 'EMAIL', 'PAID_ADS', 'CHATBOT', 'OTHER'
));

CREATE TABLE IF NOT EXISTS public.chatbot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  session_token_hash varchar(64) NOT NULL UNIQUE CHECK (session_token_hash ~ '^[0-9a-f]{64}$'),
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  status varchar(40) NOT NULL DEFAULT 'CONSENTED' CHECK (status IN (
    'CONSENTED', 'CONTACT_CONFIRMED', 'INTEREST_SELECTED', 'HANDOFF_CREATED',
    'QUOTE_STARTED', 'QUOTE_SUBMITTED', 'FOLLOW_UP_REQUESTED', 'ENDED',
    'DECLINED', 'ABANDONED', 'EXPIRED'
  )),
  source_page varchar(500) NOT NULL,
  referrer varchar(1000),
  utm_parameters jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(utm_parameters) = 'object'),
  interests text[] NOT NULL DEFAULT '{}',
  ip_hash varchar(64) NOT NULL CHECK (ip_hash ~ '^[0-9a-f]{64}$'),
  user_agent_hash varchar(64) CHECK (user_agent_hash IS NULL OR user_agent_hash ~ '^[0-9a-f]{64}$'),
  contact_confirmed_at timestamptz,
  quote_started_at timestamptz,
  quote_completed_at timestamptz,
  ended_at timestamptz,
  last_interaction_at timestamptz NOT NULL DEFAULT now(),
  retention_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (interests <@ ARRAY[
    'LIFE_INSURANCE', 'CRITICAL_ILLNESS', 'DISABILITY', 'TRAVEL',
    'GROUP_BENEFITS', 'BUSINESS_INSURANCE', 'MORTGAGE_PROTECTION',
    'SEGREGATED_FUNDS', 'NOT_SURE'
  ]::text[])
);

CREATE TABLE IF NOT EXISTS public.chatbot_consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_session_id uuid NOT NULL REFERENCES public.chatbot_sessions(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  consent_type varchar(30) NOT NULL CHECK (consent_type IN ('ENQUIRY', 'MARKETING')),
  status varchar(20) NOT NULL CHECK (status IN ('GRANTED', 'DECLINED', 'WITHDRAWN')),
  wording_version varchar(80) NOT NULL,
  wording_snapshot text NOT NULL,
  source varchar(30) NOT NULL DEFAULT 'CHATBOT' CHECK (source IN ('CHATBOT', 'QUOTE_FORM')),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz,
  UNIQUE (chatbot_session_id, consent_type)
);

CREATE TABLE IF NOT EXISTS public.lead_source_attributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  chatbot_session_id uuid REFERENCES public.chatbot_sessions(id) ON DELETE SET NULL,
  source varchar(40) NOT NULL CHECK (source IN ('CHATBOT', 'WEBSITE_QUOTE')),
  source_page varchar(500),
  referrer varchar(1000),
  utm_parameters jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(utm_parameters) = 'object'),
  first_interaction_at timestamptz NOT NULL DEFAULT now(),
  last_interaction_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS lead_source_attributions_unique
  ON public.lead_source_attributions (lead_id, chatbot_session_id, source)
  WHERE chatbot_session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.chatbot_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_session_id uuid NOT NULL REFERENCES public.chatbot_sessions(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  token_hash varchar(64) NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  purpose varchar(40) NOT NULL DEFAULT 'QUOTE_PREFILL' CHECK (purpose = 'QUOTE_PREFILL'),
  expires_at timestamptz NOT NULL,
  viewed_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.funnel_submissions
  ADD COLUMN IF NOT EXISTS submission_key varchar(64);

CREATE UNIQUE INDEX IF NOT EXISTS funnel_submissions_submission_key_unique
  ON public.funnel_submissions(submission_key)
  WHERE submission_key IS NOT NULL;

ALTER TABLE public.quote_notifications
  ADD COLUMN IF NOT EXISTS chatbot_session_id uuid REFERENCES public.chatbot_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS submission_key varchar(64);

CREATE UNIQUE INDEX IF NOT EXISTS quote_notifications_chatbot_session_type_unique
  ON public.quote_notifications(chatbot_session_id, notification_type)
  WHERE chatbot_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS quote_notifications_submission_key_unique
  ON public.quote_notifications(submission_key)
  WHERE submission_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS chatbot_sessions_rate_limit_idx
  ON public.chatbot_sessions(ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS chatbot_sessions_retention_idx
  ON public.chatbot_sessions(retention_until, status);
CREATE INDEX IF NOT EXISTS chatbot_sessions_lead_idx
  ON public.chatbot_sessions(lead_id);
CREATE INDEX IF NOT EXISTS chatbot_consent_lead_idx
  ON public.chatbot_consent_records(lead_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS chatbot_handoffs_expiry_idx
  ON public.chatbot_handoffs(expires_at)
  WHERE consumed_at IS NULL;

DROP TRIGGER IF EXISTS chatbot_sessions_updated_at ON public.chatbot_sessions;
CREATE TRIGGER chatbot_sessions_updated_at BEFORE UPDATE ON public.chatbot_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_management_updated_at();

CREATE OR REPLACE FUNCTION public.start_chatbot_session(
  p_session_token_hash text,
  p_source_page text,
  p_referrer text,
  p_utm_parameters jsonb,
  p_ip_hash text,
  p_user_agent_hash text,
  p_retention_days integer,
  p_enquiry_version text,
  p_enquiry_wording text,
  p_marketing_status text,
  p_marketing_version text,
  p_marketing_wording text
)
RETURNS TABLE (session_id uuid, session_public_id uuid, session_status text, retention_until timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
  v_public_id uuid;
  v_retention_until timestamptz;
BEGIN
  IF p_session_token_hash !~ '^[0-9a-f]{64}$' OR p_ip_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'chatbot_request_invalid';
  END IF;

  IF (
    SELECT COUNT(*)
    FROM public.chatbot_sessions session_record
    WHERE session_record.ip_hash = p_ip_hash
      AND session_record.created_at >= now() - interval '1 hour'
  ) >= 8 THEN
    RAISE EXCEPTION 'chatbot_rate_limited';
  END IF;

  v_retention_until := now() + make_interval(days => LEAST(GREATEST(COALESCE(p_retention_days, 180), 30), 730));

  INSERT INTO public.chatbot_sessions (
    session_token_hash, source_page, referrer, utm_parameters, ip_hash,
    user_agent_hash, retention_until
  ) VALUES (
    p_session_token_hash,
    LEFT(p_source_page, 500),
    NULLIF(LEFT(p_referrer, 1000), ''),
    COALESCE(p_utm_parameters, '{}'::jsonb),
    p_ip_hash,
    NULLIF(p_user_agent_hash, ''),
    v_retention_until
  )
  RETURNING id, public_id INTO v_session_id, v_public_id;

  INSERT INTO public.chatbot_consent_records (
    chatbot_session_id, consent_type, status, wording_version, wording_snapshot, source
  ) VALUES
    (v_session_id, 'ENQUIRY', 'GRANTED', LEFT(p_enquiry_version, 80), p_enquiry_wording, 'CHATBOT'),
    (v_session_id, 'MARKETING', CASE WHEN p_marketing_status = 'GRANTED' THEN 'GRANTED' ELSE 'DECLINED' END,
      LEFT(p_marketing_version, 80), p_marketing_wording, 'CHATBOT');

  INSERT INTO public.audit_log (action, entity_type, entity_id, metadata)
  VALUES (
    'CHATBOT_CONSENT_RECORDED', 'chatbot_session', v_session_id,
    jsonb_build_object(
      'enquiryConsent', 'GRANTED',
      'marketingConsent', CASE WHEN p_marketing_status = 'GRANTED' THEN 'GRANTED' ELSE 'DECLINED' END,
      'enquiryVersion', LEFT(p_enquiry_version, 80),
      'marketingVersion', LEFT(p_marketing_version, 80)
    )
  );

  RETURN QUERY SELECT v_session_id, v_public_id, 'CONSENTED'::text, v_retention_until;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_chatbot_prospect(
  p_session_token_hash text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
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
  v_session public.chatbot_sessions%ROWTYPE;
  v_contact_ids uuid[];
  v_contact_id uuid;
  v_lead_id uuid;
  v_public_id text;
  v_notification_id uuid;
  v_marketing_consent boolean;
  v_existing boolean := false;
  v_phone_digits text;
BEGIN
  SELECT * INTO v_session
  FROM public.chatbot_sessions session_record
  WHERE session_record.session_token_hash = p_session_token_hash
    AND session_record.retention_until > now()
  FOR UPDATE;

  IF v_session.id IS NULL OR v_session.status NOT IN ('CONSENTED', 'CONTACT_CONFIRMED') THEN
    RAISE EXCEPTION 'chatbot_session_invalid';
  END IF;

  IF v_session.lead_id IS NOT NULL AND v_session.contact_id IS NOT NULL THEN
    SELECT public_id INTO v_public_id FROM public.leads WHERE id = v_session.lead_id;
    SELECT id INTO v_notification_id
    FROM public.quote_notifications
    WHERE chatbot_session_id = v_session.id AND notification_type = 'NEW_CHATBOT_PROSPECT'
    LIMIT 1;
    RETURN QUERY SELECT v_session.lead_id, v_public_id, v_notification_id, true, now();
    RETURN;
  END IF;

  v_phone_digits := regexp_replace(p_phone, '\D', '', 'g');
  PERFORM pg_advisory_xact_lock(hashtextextended(lower(trim(p_email)) || '|' || v_phone_digits, 0));

  SELECT array_agg(contact_match.id ORDER BY contact_match.created_at ASC)
  INTO v_contact_ids
  FROM public.contacts contact_match
  WHERE contact_match.archived_at IS NULL
    AND (
      (contact_match.email IS NOT NULL AND lower(contact_match.email) = lower(trim(p_email)))
      OR (contact_match.phone IS NOT NULL AND regexp_replace(contact_match.phone, '\D', '', 'g') = v_phone_digits)
    );

  IF COALESCE(array_length(v_contact_ids, 1), 0) > 1 THEN
    RAISE EXCEPTION 'chatbot_contact_conflict';
  END IF;

  v_contact_id := v_contact_ids[1];
  SELECT EXISTS (
    SELECT 1 FROM public.chatbot_consent_records consent
    WHERE consent.chatbot_session_id = v_session.id
      AND consent.consent_type = 'MARKETING'
      AND consent.status = 'GRANTED'
  ) INTO v_marketing_consent;

  IF v_contact_id IS NULL THEN
    INSERT INTO public.contacts (
      first_name, last_name, email, phone, preferred_contact_method,
      marketing_consent, consent_timestamp, lead_source
    ) VALUES (
      trim(p_first_name), trim(p_last_name), lower(trim(p_email)), trim(p_phone), 'EITHER',
      v_marketing_consent, now(), 'CHATBOT'
    )
    RETURNING id INTO v_contact_id;
  ELSE
    UPDATE public.contacts
    SET first_name = trim(p_first_name),
        last_name = trim(p_last_name),
        email = lower(trim(p_email)),
        phone = trim(p_phone),
        marketing_consent = marketing_consent OR v_marketing_consent,
        consent_timestamp = COALESCE(consent_timestamp, now()),
        lead_source = COALESCE(lead_source, 'CHATBOT'),
        updated_at = now()
    WHERE id = v_contact_id;
  END IF;

  SELECT lead_record.id, lead_record.public_id
  INTO v_lead_id, v_public_id
  FROM public.leads lead_record
  WHERE lead_record.contact_id = v_contact_id
    AND lead_record.archived_at IS NULL
    AND lead_record.pipeline_stage NOT IN (
      'POLICY_DELIVERED', 'ACTIVE_CLIENT', 'NOT_CONVERTED', 'DUPLICATE', 'INVALID_LEAD', 'ARCHIVED'
    )
  ORDER BY lead_record.updated_at DESC, lead_record.created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_lead_id IS NULL THEN
    INSERT INTO public.leads (
      contact_id, source, campaign, utm_source, utm_medium, utm_campaign,
      landing_page, insurance_interest, lead_status, pipeline_stage,
      lead_score, notes, dedupe_key
    ) VALUES (
      v_contact_id,
      'CHATBOT',
      NULLIF(v_session.utm_parameters ->> 'campaign', ''),
      NULLIF(v_session.utm_parameters ->> 'source', ''),
      NULLIF(v_session.utm_parameters ->> 'medium', ''),
      NULLIF(v_session.utm_parameters ->> 'campaign', ''),
      v_session.source_page,
      'OTHER',
      'NEW',
      'PROSPECT',
      50,
      'Chatbot enquiry accepted after explicit contact confirmation. No raw chat transcript is stored.',
      'chatbot:' || v_session.public_id::text
    )
    RETURNING id, public_id INTO v_lead_id, v_public_id;
  ELSE
    v_existing := true;
    UPDATE public.leads
    SET updated_at = now()
    WHERE id = v_lead_id;
  END IF;

  UPDATE public.chatbot_sessions
  SET contact_id = v_contact_id,
      lead_id = v_lead_id,
      status = 'CONTACT_CONFIRMED',
      contact_confirmed_at = COALESCE(contact_confirmed_at, now()),
      last_interaction_at = now()
  WHERE id = v_session.id;

  UPDATE public.chatbot_consent_records
  SET contact_id = v_contact_id, lead_id = v_lead_id
  WHERE chatbot_session_id = v_session.id;

  INSERT INTO public.lead_source_attributions (
    lead_id, contact_id, chatbot_session_id, source, source_page,
    referrer, utm_parameters, first_interaction_at, last_interaction_at
  ) VALUES (
    v_lead_id, v_contact_id, v_session.id, 'CHATBOT', v_session.source_page,
    v_session.referrer, v_session.utm_parameters, v_session.created_at, now()
  )
  ON CONFLICT (lead_id, chatbot_session_id, source) WHERE chatbot_session_id IS NOT NULL
  DO UPDATE SET last_interaction_at = now();

  INSERT INTO public.quote_notifications (
    lead_id, chatbot_session_id, notification_type, channel, recipients, status
  ) VALUES (
    v_lead_id, v_session.id, 'NEW_CHATBOT_PROSPECT', 'GMAIL', p_notification_recipients, 'QUEUED'
  )
  ON CONFLICT (chatbot_session_id, notification_type) WHERE chatbot_session_id IS NOT NULL DO NOTHING
  RETURNING id INTO v_notification_id;

  IF v_notification_id IS NULL THEN
    SELECT id INTO v_notification_id
    FROM public.quote_notifications
    WHERE chatbot_session_id = v_session.id AND notification_type = 'NEW_CHATBOT_PROSPECT'
    LIMIT 1;
  END IF;

  INSERT INTO public.audit_log (action, entity_type, entity_id, metadata)
  VALUES (
    'CHATBOT_PROSPECT_ACCEPTED', 'lead', v_lead_id,
    jsonb_build_object('sessionId', v_session.public_id, 'matchedExistingOpenLead', v_existing, 'source', 'CHATBOT')
  );

  RETURN QUERY SELECT v_lead_id, v_public_id, v_notification_id, false, now();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_chatbot_interests(
  p_session_token_hash text,
  p_interests text[],
  p_primary_interest text
)
RETURNS TABLE (lead_id uuid, lead_public_id text, interests text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.chatbot_sessions%ROWTYPE;
  v_public_id text;
BEGIN
  SELECT * INTO v_session
  FROM public.chatbot_sessions session_record
  WHERE session_record.session_token_hash = p_session_token_hash
    AND session_record.retention_until > now()
  FOR UPDATE;

  IF v_session.id IS NULL OR v_session.lead_id IS NULL OR v_session.contact_id IS NULL THEN
    RAISE EXCEPTION 'chatbot_session_invalid';
  END IF;

  IF COALESCE(array_length(p_interests, 1), 0) < 1
    OR NOT (p_interests <@ ARRAY[
      'LIFE_INSURANCE', 'CRITICAL_ILLNESS', 'DISABILITY', 'TRAVEL',
      'GROUP_BENEFITS', 'BUSINESS_INSURANCE', 'MORTGAGE_PROTECTION',
      'SEGREGATED_FUNDS', 'NOT_SURE'
    ]::text[])
    OR p_primary_interest NOT IN (
      'TERM_LIFE', 'CRITICAL_ILLNESS', 'DISABILITY', 'TRAVEL',
      'BUSINESS', 'MORTGAGE_PROTECTION', 'SEGREGATED_FUNDS', 'OTHER'
    ) THEN
    RAISE EXCEPTION 'chatbot_interest_invalid';
  END IF;

  UPDATE public.chatbot_sessions
  SET interests = p_interests,
      status = 'INTEREST_SELECTED',
      last_interaction_at = now()
  WHERE id = v_session.id;

  UPDATE public.leads
  SET insurance_interest = p_primary_interest,
      updated_at = now()
  WHERE id = v_session.lead_id
  RETURNING public_id INTO v_public_id;

  UPDATE public.lead_source_attributions
  SET last_interaction_at = now()
  WHERE chatbot_session_id = v_session.id AND source = 'CHATBOT';

  INSERT INTO public.lead_activities (lead_id, activity_type, description, metadata)
  VALUES (
    v_session.lead_id,
    'MANUAL_ACTIVITY',
    'Visitor selected broad insurance interests in the public chatbot.',
    jsonb_build_object('source', 'CHATBOT', 'interests', p_interests)
  );

  INSERT INTO public.audit_log (action, entity_type, entity_id, metadata)
  VALUES ('CHATBOT_INTERESTS_RECORDED', 'lead', v_session.lead_id, jsonb_build_object('interests', p_interests));

  RETURN QUERY SELECT v_session.lead_id, v_public_id, p_interests;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_chatbot_quote_handoff(
  p_session_token_hash text,
  p_handoff_token_hash text,
  p_expires_seconds integer
)
RETURNS TABLE (handoff_id uuid, handoff_expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.chatbot_sessions%ROWTYPE;
  v_handoff_id uuid;
  v_expires_at timestamptz;
BEGIN
  SELECT * INTO v_session
  FROM public.chatbot_sessions session_record
  WHERE session_record.session_token_hash = p_session_token_hash
    AND session_record.retention_until > now()
  FOR UPDATE;

  IF v_session.id IS NULL OR v_session.lead_id IS NULL OR COALESCE(array_length(v_session.interests, 1), 0) < 1 THEN
    RAISE EXCEPTION 'chatbot_session_invalid';
  END IF;

  IF p_handoff_token_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'chatbot_request_invalid';
  END IF;

  v_expires_at := now() + make_interval(secs => LEAST(GREATEST(COALESCE(p_expires_seconds, 1200), 300), 1800));

  UPDATE public.chatbot_handoffs
  SET expires_at = now()
  WHERE chatbot_session_id = v_session.id AND consumed_at IS NULL;

  INSERT INTO public.chatbot_handoffs (chatbot_session_id, lead_id, token_hash, expires_at)
  VALUES (v_session.id, v_session.lead_id, p_handoff_token_hash, v_expires_at)
  RETURNING id INTO v_handoff_id;

  UPDATE public.chatbot_sessions
  SET status = 'HANDOFF_CREATED', last_interaction_at = now()
  WHERE id = v_session.id;

  INSERT INTO public.audit_log (action, entity_type, entity_id, metadata)
  VALUES ('CHATBOT_HANDOFF_CREATED', 'lead', v_session.lead_id, jsonb_build_object('expiresAt', v_expires_at));

  RETURN QUERY SELECT v_handoff_id, v_expires_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.read_chatbot_quote_handoff(p_handoff_token_hash text)
RETURNS TABLE (
  lead_id uuid,
  lead_public_id text,
  first_name text,
  last_name text,
  email text,
  phone text,
  province text,
  interests text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_handoff public.chatbot_handoffs%ROWTYPE;
  v_session public.chatbot_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_handoff
  FROM public.chatbot_handoffs handoff_record
  WHERE handoff_record.token_hash = p_handoff_token_hash
    AND handoff_record.purpose = 'QUOTE_PREFILL'
    AND handoff_record.expires_at > now()
    AND handoff_record.consumed_at IS NULL
  FOR UPDATE;

  IF v_handoff.id IS NULL THEN
    RAISE EXCEPTION 'chatbot_handoff_invalid';
  END IF;

  SELECT * INTO v_session FROM public.chatbot_sessions WHERE id = v_handoff.chatbot_session_id FOR UPDATE;

  UPDATE public.chatbot_handoffs
  SET viewed_at = COALESCE(viewed_at, now())
  WHERE id = v_handoff.id;

  UPDATE public.chatbot_sessions
  SET status = 'QUOTE_STARTED',
      quote_started_at = COALESCE(quote_started_at, now()),
      last_interaction_at = now()
  WHERE id = v_session.id;

  INSERT INTO public.audit_log (action, entity_type, entity_id, metadata)
  VALUES ('CHATBOT_QUOTE_STARTED', 'lead', v_handoff.lead_id, jsonb_build_object('sessionId', v_session.public_id));

  RETURN QUERY
  SELECT
    lead_record.id,
    lead_record.public_id,
    contact_record.first_name,
    contact_record.last_name,
    contact_record.email,
    contact_record.phone,
    contact_record.province,
    v_session.interests
  FROM public.leads lead_record
  JOIN public.contacts contact_record ON contact_record.id = lead_record.contact_id
  WHERE lead_record.id = v_handoff.lead_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_chatbot_session_outcome(
  p_session_token_hash text,
  p_status text
)
RETURNS TABLE (lead_id uuid, session_status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.chatbot_sessions%ROWTYPE;
BEGIN
  IF p_status NOT IN ('FOLLOW_UP_REQUESTED', 'ENDED', 'ABANDONED') THEN
    RAISE EXCEPTION 'chatbot_status_invalid';
  END IF;

  SELECT * INTO v_session
  FROM public.chatbot_sessions session_record
  WHERE session_record.session_token_hash = p_session_token_hash
    AND session_record.retention_until > now()
  FOR UPDATE;

  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'chatbot_session_invalid';
  END IF;

  UPDATE public.chatbot_sessions
  SET status = p_status,
      ended_at = CASE WHEN p_status IN ('ENDED', 'ABANDONED') THEN now() ELSE ended_at END,
      last_interaction_at = now()
  WHERE id = v_session.id;

  INSERT INTO public.audit_log (action, entity_type, entity_id, metadata)
  VALUES ('CHATBOT_SESSION_' || p_status, 'chatbot_session', v_session.id, jsonb_build_object('leadId', v_session.lead_id));

  RETURN QUERY SELECT v_session.lead_id, p_status;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_chatbot_quote_lead(
  p_handoff_token_hash text,
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
  p_submission_key text,
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
  v_handoff public.chatbot_handoffs%ROWTYPE;
  v_session public.chatbot_sessions%ROWTYPE;
  v_contact_id uuid;
  v_public_id text;
  v_notification_id uuid;
  v_funnel_type text;
BEGIN
  SELECT * INTO v_handoff
  FROM public.chatbot_handoffs handoff_record
  WHERE handoff_record.token_hash = p_handoff_token_hash
    AND handoff_record.purpose = 'QUOTE_PREFILL'
  FOR UPDATE;

  IF v_handoff.id IS NULL THEN
    RAISE EXCEPTION 'chatbot_handoff_invalid';
  END IF;

  SELECT * INTO v_session
  FROM public.chatbot_sessions
  WHERE id = v_handoff.chatbot_session_id
  FOR UPDATE;

  IF v_handoff.consumed_at IS NOT NULL THEN
    IF v_session.status = 'QUOTE_SUBMITTED' THEN
      SELECT public_id INTO v_public_id FROM public.leads WHERE id = v_handoff.lead_id;
      SELECT id INTO v_notification_id
      FROM public.quote_notifications
      WHERE submission_key = p_submission_key
      LIMIT 1;
      RETURN QUERY SELECT v_handoff.lead_id, v_public_id, v_notification_id, true, now();
      RETURN;
    END IF;
    RAISE EXCEPTION 'chatbot_handoff_invalid';
  END IF;

  IF v_handoff.expires_at <= now() OR v_session.lead_id IS DISTINCT FROM v_handoff.lead_id THEN
    RAISE EXCEPTION 'chatbot_handoff_invalid';
  END IF;

  SELECT contact_id, public_id INTO v_contact_id, v_public_id
  FROM public.leads
  WHERE id = v_handoff.lead_id
  FOR UPDATE;

  IF v_contact_id IS NULL THEN
    RAISE EXCEPTION 'chatbot_contact_invalid';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.contacts contact_record
    WHERE contact_record.id <> v_contact_id
      AND contact_record.archived_at IS NULL
      AND (
        lower(contact_record.email) = lower(trim(p_email))
        OR regexp_replace(contact_record.phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
      )
  ) THEN
    RAISE EXCEPTION 'chatbot_contact_conflict';
  END IF;

  UPDATE public.contacts
  SET first_name = trim(p_first_name),
      last_name = trim(p_last_name),
      email = lower(trim(p_email)),
      phone = trim(p_phone),
      province = NULLIF(trim(p_province), ''),
      updated_at = now()
  WHERE id = v_contact_id;

  UPDATE public.leads
  SET insurance_interest = p_insurance_interest,
      pipeline_stage = 'VERIFIED_LEAD',
      lead_status = 'CONTACTED',
      lead_score = GREATEST(lead_score, CASE WHEN p_ready_to_proceed = 'yes' THEN 75 ELSE 60 END),
      stage_changed_at = now(),
      updated_at = now()
  WHERE id = v_handoff.lead_id;

  v_funnel_type := CASE
    WHEN p_insurance_interest IN ('TERM_LIFE', 'MORTGAGE_PROTECTION', 'CRITICAL_ILLNESS', 'DISABILITY', 'TRAVEL', 'BUSINESS')
      THEN p_insurance_interest
    ELSE 'GENERAL_INQUIRY'
  END;

  INSERT INTO public.funnel_submissions (
    lead_id, contact_id, funnel_type, source, landing_page, referring_url,
    submission_data, submission_key, ip_address, user_agent
  ) VALUES (
    v_handoff.lead_id, v_contact_id, v_funnel_type, 'CHATBOT', '/quote', p_referring_url,
    jsonb_build_object(
      'insuranceType', p_insurance_type,
      'insuranceAmount', NULLIF(p_insurance_amount, ''),
      'readyToProceed', p_ready_to_proceed,
      'smokingHistoryDisclosed', p_smoking_disclosed,
      'medicalHistoryDisclosed', p_medical_disclosed,
      'chatbotHandoff', true
    ),
    p_submission_key,
    NULLIF(trim(p_ip_address), '')::inet,
    LEFT(p_user_agent, 1000)
  )
  ON CONFLICT (submission_key) WHERE submission_key IS NOT NULL DO NOTHING;

  INSERT INTO public.lead_source_attributions (
    lead_id, contact_id, chatbot_session_id, source, source_page,
    referrer, utm_parameters, first_interaction_at, last_interaction_at
  ) VALUES (
    v_handoff.lead_id, v_contact_id, v_session.id, 'WEBSITE_QUOTE', '/quote',
    NULLIF(LEFT(p_referring_url, 1000), ''), v_session.utm_parameters, now(), now()
  )
  ON CONFLICT (lead_id, chatbot_session_id, source) WHERE chatbot_session_id IS NOT NULL
  DO UPDATE SET last_interaction_at = now();

  INSERT INTO public.quote_notifications (
    lead_id, chatbot_session_id, submission_key, notification_type, channel, recipients, status
  ) VALUES (
    v_handoff.lead_id, v_session.id, p_submission_key, 'NEW_QUOTE', 'GMAIL', p_notification_recipients, 'QUEUED'
  )
  ON CONFLICT (submission_key) WHERE submission_key IS NOT NULL DO NOTHING
  RETURNING id INTO v_notification_id;

  IF v_notification_id IS NULL THEN
    SELECT id INTO v_notification_id
    FROM public.quote_notifications
    WHERE submission_key = p_submission_key
    LIMIT 1;
  END IF;

  UPDATE public.chatbot_handoffs SET consumed_at = now() WHERE id = v_handoff.id;
  UPDATE public.chatbot_sessions
  SET status = 'QUOTE_SUBMITTED', quote_completed_at = now(), last_interaction_at = now()
  WHERE id = v_session.id;

  INSERT INTO public.lead_activities (lead_id, activity_type, description, metadata)
  VALUES (
    v_handoff.lead_id,
    'STATUS_CHANGE',
    'Chatbot prospect completed the secure quote request.',
    jsonb_build_object('oldStage', 'PROSPECT', 'newStage', 'VERIFIED_LEAD', 'source', 'CHATBOT')
  );

  INSERT INTO public.audit_log (action, entity_type, entity_id, metadata)
  VALUES (
    'CHATBOT_QUOTE_ACCEPTED', 'lead', v_handoff.lead_id,
    jsonb_build_object('sessionId', v_session.public_id, 'pipelineStage', 'VERIFIED_LEAD')
  );

  RETURN QUERY SELECT v_handoff.lead_id, v_public_id, v_notification_id, false, now();
END;
$$;

ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_source_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_handoffs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.chatbot_sessions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.chatbot_consent_records FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.lead_source_attributions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.chatbot_handoffs FROM PUBLIC, anon, authenticated;

GRANT ALL ON TABLE public.chatbot_sessions TO service_role;
GRANT ALL ON TABLE public.chatbot_consent_records TO service_role;
GRANT ALL ON TABLE public.lead_source_attributions TO service_role;
GRANT ALL ON TABLE public.chatbot_handoffs TO service_role;

REVOKE ALL ON FUNCTION public.start_chatbot_session(text, text, text, jsonb, text, text, integer, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accept_chatbot_prospect(text, text, text, text, text, text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_chatbot_interests(text, text[], text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_chatbot_quote_handoff(text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_chatbot_quote_handoff(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_chatbot_session_outcome(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accept_chatbot_quote_lead(text, text, text, text, text, text, text, text, text, text, boolean, boolean, text, text, text, text, text[]) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.start_chatbot_session(text, text, text, jsonb, text, text, integer, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.accept_chatbot_prospect(text, text, text, text, text, text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_chatbot_interests(text, text[], text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_chatbot_quote_handoff(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_chatbot_quote_handoff(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_chatbot_session_outcome(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.accept_chatbot_quote_lead(text, text, text, text, text, text, text, text, text, text, boolean, boolean, text, text, text, text, text[]) TO service_role;

COMMIT;
