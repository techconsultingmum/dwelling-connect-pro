
-- Fix: Re-run only the policies and triggers (realtime already set up)

-- PROFILES TABLE
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can update any profile" ON public.profiles;

CREATE POLICY "Managers can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Managers can update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'manager'::app_role));

-- USER_ROLES TABLE
DROP POLICY IF EXISTS "Managers can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "No direct role inserts allowed" ON public.user_roles;
DROP POLICY IF EXISTS "No direct role updates allowed" ON public.user_roles;
DROP POLICY IF EXISTS "No direct role deletes allowed" ON public.user_roles;

CREATE POLICY "Managers can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "No direct role inserts allowed"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "No direct role updates allowed"
ON public.user_roles FOR UPDATE TO authenticated
USING (false);

CREATE POLICY "No direct role deletes allowed"
ON public.user_roles FOR DELETE TO authenticated
USING (false);

-- MESSAGES TABLE
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can mark received messages as read" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own sent messages" ON public.messages;

CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT TO authenticated
USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark received messages as read"
ON public.messages FOR UPDATE TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (is_read = true);

CREATE POLICY "Users can delete their own sent messages"
ON public.messages FOR DELETE TO authenticated
USING (auth.uid() = sender_id);

-- SOCIETY_SETTINGS TABLE
DROP POLICY IF EXISTS "Anyone can view society settings" ON public.society_settings;
DROP POLICY IF EXISTS "Managers can update society settings" ON public.society_settings;
DROP POLICY IF EXISTS "Managers can insert society settings" ON public.society_settings;
DROP POLICY IF EXISTS "No one can delete society settings" ON public.society_settings;

CREATE POLICY "Anyone can view society settings"
ON public.society_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Managers can update society settings"
ON public.society_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can insert society settings"
ON public.society_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "No one can delete society settings"
ON public.society_settings FOR DELETE TO authenticated
USING (false);

-- Create missing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

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
