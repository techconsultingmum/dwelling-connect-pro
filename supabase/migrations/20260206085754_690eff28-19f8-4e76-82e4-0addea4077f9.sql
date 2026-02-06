
-- Create society_settings table (singleton - one row per society)
CREATE TABLE public.society_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Housing Society',
  address_line1 text DEFAULT '',
  address_line2 text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  pincode text DEFAULT '',
  contact_phone text DEFAULT '',
  contact_email text DEFAULT '',
  registration_number text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.society_settings ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read society settings
CREATE POLICY "Anyone can view society settings"
ON public.society_settings FOR SELECT
TO authenticated
USING (true);

-- Only managers can update
CREATE POLICY "Managers can update society settings"
ON public.society_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'manager'::app_role));

-- Only managers can insert (for initial seed)
CREATE POLICY "Managers can insert society settings"
ON public.society_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'manager'::app_role));

-- No delete allowed
CREATE POLICY "No one can delete society settings"
ON public.society_settings FOR DELETE
TO authenticated
USING (false);

-- Add updated_at trigger
CREATE TRIGGER update_society_settings_updated_at
BEFORE UPDATE ON public.society_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Seed default row
INSERT INTO public.society_settings (name, address_line1, city, state, pincode)
VALUES ('Harmony Heights Co-operative Housing Society', '123 Main Street, Sector 15', 'Mumbai', 'Maharashtra', '400001');

-- Add update-profile action to manage-user-role edge function
-- Managers need ability to update any profile, so add a permissive policy
CREATE POLICY "Managers can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'manager'::app_role));
