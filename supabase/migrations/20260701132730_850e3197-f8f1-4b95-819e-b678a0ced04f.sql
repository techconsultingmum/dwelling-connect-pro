REVOKE ALL ON FUNCTION public.get_chat_partners() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_chat_partners() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_chat_partners() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_chat_partners() TO service_role;