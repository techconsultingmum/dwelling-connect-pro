
-- Ensure triggers exist (idempotent)

-- 1. Auto-create profile and role on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Auto-update updated_at on profiles
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Auto-update updated_at on society_settings
DROP TRIGGER IF EXISTS on_society_settings_updated ON public.society_settings;
CREATE TRIGGER on_society_settings_updated
  BEFORE UPDATE ON public.society_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
