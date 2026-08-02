BEGIN;

CREATE INDEX IF NOT EXISTS chatbot_sessions_client_rate_limit_idx
  ON public.chatbot_sessions(ip_hash, user_agent_hash, created_at DESC);

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
  IF p_session_token_hash !~ '^[0-9a-f]{64}$'
    OR p_ip_hash !~ '^[0-9a-f]{64}$'
    OR p_user_agent_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'chatbot_request_invalid';
  END IF;

  IF (
    SELECT COUNT(*)
    FROM public.chatbot_sessions session_record
    WHERE session_record.ip_hash = p_ip_hash
      AND session_record.user_agent_hash = p_user_agent_hash
      AND session_record.created_at >= now() - interval '1 hour'
  ) >= 8 THEN
    RAISE EXCEPTION 'chatbot_rate_limited';
  END IF;

  IF (
    SELECT COUNT(*)
    FROM public.chatbot_sessions session_record
    WHERE session_record.ip_hash = p_ip_hash
      AND session_record.created_at >= now() - interval '1 hour'
  ) >= 40 THEN
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
    p_user_agent_hash,
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

REVOKE ALL ON FUNCTION public.start_chatbot_session(text, text, text, jsonb, text, text, integer, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_chatbot_session(text, text, text, jsonb, text, text, integer, text, text, text, text, text) TO service_role;

COMMIT;
