
-- Fix RESTRICTIVE policies to PERMISSIVE on profiles (SELECT)
-- RESTRICTIVE AND-logic breaks multi-policy access (manager OR owner)
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Managers can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Fix RESTRICTIVE policies to PERMISSIVE on user_roles (SELECT)
DROP POLICY IF EXISTS "Managers can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "No direct role inserts allowed" ON public.user_roles;
DROP POLICY IF EXISTS "No direct role updates allowed" ON public.user_roles;
DROP POLICY IF EXISTS "No direct role deletes allowed" ON public.user_roles;

CREATE POLICY "Managers can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "No direct role inserts allowed"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "No direct role updates allowed"
ON public.user_roles FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No direct role deletes allowed"
ON public.user_roles FOR DELETE
TO authenticated
USING (false);

-- Fix RESTRICTIVE policies to PERMISSIVE on messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can mark received messages as read" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own sent messages" ON public.messages;

CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark received messages as read"
ON public.messages FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (is_read = true);

CREATE POLICY "Users can delete their own sent messages"
ON public.messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);
