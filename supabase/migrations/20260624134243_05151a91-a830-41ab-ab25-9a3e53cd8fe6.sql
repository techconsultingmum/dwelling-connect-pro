-- SECURITY DEFINER function returning the minimal chat partner directory
-- the current user is allowed to see. Avoids broadening profiles RLS.
CREATE OR REPLACE FUNCTION public.get_chat_partners()
RETURNS TABLE (
  user_id uuid,
  name text,
  flat_no text,
  role public.app_role
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  caller_is_manager boolean;
BEGIN
  IF caller IS NULL THEN
    RETURN;
  END IF;

  caller_is_manager := public.has_role(caller, 'manager'::public.app_role);

  IF caller_is_manager THEN
    -- Managers: every other authenticated profile
    RETURN QUERY
      SELECT p.user_id,
             COALESCE(p.name, 'Member')::text AS name,
             COALESCE(p.flat_no, '')::text   AS flat_no,
             COALESCE(ur.role, 'user'::public.app_role) AS role
      FROM public.profiles p
      LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
      WHERE p.user_id <> caller;
  ELSE
    -- Members: only manager profiles
    RETURN QUERY
      SELECT p.user_id,
             COALESCE(p.name, 'Manager')::text AS name,
             COALESCE(p.flat_no, '')::text    AS flat_no,
             ur.role
      FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.user_id
      WHERE ur.role = 'manager'::public.app_role
        AND p.user_id <> caller;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_chat_partners() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_chat_partners() TO authenticated;
