-- Add INSERT policy to user_roles table to prevent privilege escalation
-- Only allow inserts through the handle_new_user trigger (which uses SECURITY DEFINER)
-- Direct inserts are blocked - role changes must go through the manage-user-role edge function

CREATE POLICY "No direct role inserts allowed"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Also add UPDATE and DELETE policies to ensure roles can only be modified via edge function
CREATE POLICY "No direct role updates allowed"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No direct role deletes allowed"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);