
-- CRITICAL: Re-create all required triggers that are missing from the live database

-- 1. Trigger: Auto-create profile + default role on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Trigger: Auto-update updated_at on profiles table
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Trigger: Auto-update updated_at on society_settings table
DROP TRIGGER IF EXISTS on_society_settings_updated ON public.society_settings;
CREATE TRIGGER on_society_settings_updated
  BEFORE UPDATE ON public.society_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Seed a default society_settings row if none exists
INSERT INTO public.society_settings (name)
SELECT 'My Housing Society'
WHERE NOT EXISTS (SELECT 1 FROM public.society_settings LIMIT 1);
