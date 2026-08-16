BEGIN;

ALTER TABLE public.waitlist_signups
  ADD COLUMN IF NOT EXISTS clerk_user_id text,
  ADD COLUMN IF NOT EXISTS account_email text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'marketing',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS tester_added_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS invite_sent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

ALTER TABLE public.waitlist_signups
  ALTER COLUMN status SET DEFAULT 'pending';

UPDATE public.waitlist_signups
SET status = 'pending'
WHERE status = 'requested';

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_signups_clerk_user_id_key
  ON public.waitlist_signups (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS waitlist_signups_android_pending_idx
  ON public.waitlist_signups (created_at)
  WHERE invite_sent_at IS NULL;

CREATE OR REPLACE FUNCTION public.request_android_access(
  p_clerk_user_id text,
  p_account_email text,
  p_tester_email text
)
RETURNS TABLE (
  id uuid,
  email text,
  clerk_user_id text,
  account_email text,
  source text,
  status text,
  notified_at timestamp with time zone,
  tester_added_at timestamp with time zone,
  invite_sent_at timestamp with time zone,
  last_error text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  was_created boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_account_email text := lower(trim(p_account_email));
  v_created boolean := false;
  v_email_row_id uuid;
  v_invite_sent_at timestamp with time zone;
  v_row_id uuid;
  v_tester_email text := lower(trim(p_tester_email));
  v_user_id text := trim(p_clerk_user_id);
BEGIN
  IF nullif(v_user_id, '') IS NULL
    OR nullif(v_account_email, '') IS NULL
    OR nullif(v_tester_email, '') IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'Clerk user id, account email, and tester email are required.';
  END IF;

  SELECT w.id, w.invite_sent_at
  INTO v_row_id, v_invite_sent_at
  FROM public.waitlist_signups AS w
  WHERE w.clerk_user_id = v_user_id
  FOR UPDATE;

  SELECT w.id
  INTO v_email_row_id
  FROM public.waitlist_signups AS w
  WHERE lower(w.email) = v_tester_email
  FOR UPDATE;

  IF v_row_id IS NOT NULL THEN
    IF v_invite_sent_at IS NULL
      AND v_email_row_id IS NOT NULL
      AND v_email_row_id <> v_row_id THEN
      RAISE EXCEPTION USING
        ERRCODE = '23505',
        MESSAGE = 'That Google Play email already has an access request.';
    END IF;

    UPDATE public.waitlist_signups AS w
    SET
      account_email = v_account_email,
      email = CASE
        WHEN w.invite_sent_at IS NULL THEN v_tester_email
        ELSE w.email
      END,
      notified_at = CASE
        WHEN lower(w.email) <> v_tester_email AND w.invite_sent_at IS NULL
          THEN NULL
        ELSE w.notified_at
      END,
      source = 'onboarding',
      updated_at = now()
    WHERE w.id = v_row_id;
  ELSIF v_email_row_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.waitlist_signups AS w
      WHERE w.id = v_email_row_id
        AND w.clerk_user_id IS NOT NULL
        AND w.clerk_user_id <> v_user_id
    ) THEN
      RAISE EXCEPTION USING
        ERRCODE = '23505',
        MESSAGE = 'That Google Play email already has an access request.';
    END IF;

    v_row_id := v_email_row_id;
    UPDATE public.waitlist_signups AS w
    SET
      account_email = v_account_email,
      clerk_user_id = v_user_id,
      source = 'onboarding',
      updated_at = now()
    WHERE w.id = v_row_id;
  ELSE
    INSERT INTO public.waitlist_signups (
      account_email,
      clerk_user_id,
      email,
      source,
      status,
      updated_at
    )
    VALUES (
      v_account_email,
      v_user_id,
      v_tester_email,
      'onboarding',
      'pending',
      now()
    )
    RETURNING waitlist_signups.id INTO v_row_id;

    v_created := true;
  END IF;

  RETURN QUERY
  SELECT
    w.id,
    w.email,
    w.clerk_user_id,
    w.account_email,
    w.source,
    w.status,
    w.notified_at,
    w.tester_added_at,
    w.invite_sent_at,
    w.last_error,
    w.created_at,
    w.updated_at,
    v_created
  FROM public.waitlist_signups AS w
  WHERE w.id = v_row_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_android_access_invite(
  p_request_id uuid
)
RETURNS TABLE (
  id uuid,
  email text,
  clerk_user_id text,
  account_email text,
  source text,
  status text,
  notified_at timestamp with time zone,
  tester_added_at timestamp with time zone,
  invite_sent_at timestamp with time zone,
  last_error text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  claim_outcome text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_outcome text;
  v_row_id uuid;
BEGIN
  SELECT w.id
  INTO v_row_id
  FROM public.waitlist_signups AS w
  WHERE w.id = p_request_id
  FOR UPDATE;

  IF v_row_id IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.waitlist_signups AS w
    WHERE w.id = v_row_id
      AND w.invite_sent_at IS NOT NULL
  ) THEN
    v_outcome := 'already_sent';
  ELSIF EXISTS (
    SELECT 1
    FROM public.waitlist_signups AS w
    WHERE w.id = v_row_id
      AND w.status = 'invite_sending'
  ) THEN
    v_outcome := 'in_progress';
  ELSE
    UPDATE public.waitlist_signups AS w
    SET
      last_error = NULL,
      status = 'invite_sending',
      tester_added_at = coalesce(w.tester_added_at, now()),
      updated_at = now()
    WHERE w.id = v_row_id;

    v_outcome := 'send';
  END IF;

  RETURN QUERY
  SELECT
    w.id,
    w.email,
    w.clerk_user_id,
    w.account_email,
    w.source,
    w.status,
    w.notified_at,
    w.tester_added_at,
    w.invite_sent_at,
    w.last_error,
    w.created_at,
    w.updated_at,
    v_outcome
  FROM public.waitlist_signups AS w
  WHERE w.id = v_row_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_android_access_invite_sent(
  p_request_id uuid
)
RETURNS SETOF public.waitlist_signups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.waitlist_signups AS w
  SET
    invite_sent_at = coalesce(w.invite_sent_at, now()),
    last_error = NULL,
    status = 'invite_sent',
    tester_added_at = coalesce(w.tester_added_at, now()),
    updated_at = now()
  WHERE w.id = p_request_id
  RETURNING w.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_android_access_invite_error(
  p_request_id uuid,
  p_error text
)
RETURNS SETOF public.waitlist_signups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.waitlist_signups AS w
  SET
    last_error = p_error,
    status = 'tester_added',
    tester_added_at = coalesce(w.tester_added_at, now()),
    updated_at = now()
  WHERE w.id = p_request_id
    AND w.invite_sent_at IS NULL;

  RETURN QUERY
  SELECT w.*
  FROM public.waitlist_signups AS w
  WHERE w.id = p_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_android_access(text, text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_android_access_invite(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_android_access_invite_sent(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_android_access_invite_error(uuid, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.request_android_access(text, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_android_access_invite(uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_android_access_invite_sent(uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.record_android_access_invite_error(uuid, text)
  TO service_role;

COMMIT;
