-- Revoke EXECUTE from public/anon/authenticated on SECURITY DEFINER trigger/helper functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_self_profile_identity_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon, authenticated;

-- has_role is referenced from RLS policies; RLS expressions are evaluated as the
-- querying role, so authenticated must retain EXECUTE. Revoke from PUBLIC/anon.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
