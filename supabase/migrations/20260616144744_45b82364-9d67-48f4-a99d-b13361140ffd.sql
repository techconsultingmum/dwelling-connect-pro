
-- 1) society_settings: restrict SELECT to managers only (page is manager-only in UI)
DROP POLICY IF EXISTS "Anyone can view society settings" ON public.society_settings;
CREATE POLICY "Managers can view society settings"
  ON public.society_settings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'manager'::public.app_role));

-- 2) profiles: prevent non-managers from altering identity fields on their own row
CREATE OR REPLACE FUNCTION public.prevent_self_profile_identity_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Managers may modify anything
  IF public.has_role(auth.uid(), 'manager'::public.app_role) THEN
    RETURN NEW;
  END IF;

  -- For everyone else: lock identity-sensitive fields and user_id
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Not allowed to change user_id';
  END IF;
  IF NEW.member_id IS DISTINCT FROM OLD.member_id THEN
    RAISE EXCEPTION 'Only managers can change member_id';
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Only managers can change email';
  END IF;
  IF NEW.flat_no IS DISTINCT FROM OLD.flat_no THEN
    RAISE EXCEPTION 'Only managers can change flat_no';
  END IF;
  IF NEW.wing IS DISTINCT FROM OLD.wing THEN
    RAISE EXCEPTION 'Only managers can change wing';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_profile_identity_change ON public.profiles;
CREATE TRIGGER prevent_self_profile_identity_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_profile_identity_change();

-- 3) Realtime: lock down broadcast/presence on the messages topic.
-- The app only uses postgres_changes (filtered by public.messages RLS).
-- Enable RLS on realtime.messages and add a deny-all default so unrelated
-- broadcast/presence subscriptions are blocked.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny broadcast and presence by default" ON realtime.messages;
CREATE POLICY "Deny broadcast and presence by default"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (false);

-- 4) Restrict EXECUTE on SECURITY DEFINER functions to only what is needed.
-- Trigger-only functions: revoke from public roles entirely.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_self_profile_identity_change() FROM PUBLIC, anon, authenticated;

-- Helpers used inside RLS: keep callable by signed-in users only.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;
