
-- Re-create triggers on public tables with DROP IF EXISTS to be idempotent

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_society_settings_updated ON public.society_settings;
CREATE TRIGGER on_society_settings_updated
  BEFORE UPDATE ON public.society_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
