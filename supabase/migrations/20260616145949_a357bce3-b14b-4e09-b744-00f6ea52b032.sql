
-- NOTICES
CREATE TABLE public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text NOT NULL DEFAULT 'Manager',
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read notices"
  ON public.notices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers can insert notices"
  ON public.notices FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'manager'::public.app_role));
CREATE POLICY "Managers can update notices"
  ON public.notices FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'manager'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'manager'::public.app_role));
CREATE POLICY "Managers can delete notices"
  ON public.notices FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'manager'::public.app_role));

CREATE TRIGGER notices_updated_at
  BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- COMPLAINTS
CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id text,
  user_name text NOT NULL,
  flat_no text,
  category text NOT NULL,
  description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 1000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in-progress','resolved')),
  resolved_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX complaints_user_idx ON public.complaints(user_id);
CREATE INDEX complaints_status_idx ON public.complaints(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read own, managers read all"
  ON public.complaints FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'manager'::public.app_role));
CREATE POLICY "Members insert own"
  ON public.complaints FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Managers update complaints"
  ON public.complaints FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'manager'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'manager'::public.app_role));
CREATE POLICY "Managers delete complaints"
  ON public.complaints FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'manager'::public.app_role));

CREATE TRIGGER complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- MAINTENANCE PAYMENTS
CREATE TABLE public.maintenance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  period text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('paid','pending','overdue','failed','refunded')),
  reference text,
  source text NOT NULL DEFAULT 'manual',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, period)
);
CREATE INDEX maintenance_payments_member_idx ON public.maintenance_payments(member_id);
CREATE INDEX maintenance_payments_user_idx ON public.maintenance_payments(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_payments TO authenticated;
GRANT ALL ON public.maintenance_payments TO service_role;
ALTER TABLE public.maintenance_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read own payments, managers all"
  ON public.maintenance_payments FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR member_id IN (SELECT p.member_id FROM public.profiles p WHERE p.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'manager'::public.app_role)
  );
CREATE POLICY "Managers insert payments"
  ON public.maintenance_payments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'manager'::public.app_role));
CREATE POLICY "Managers update payments"
  ON public.maintenance_payments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'manager'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'manager'::public.app_role));
CREATE POLICY "Managers delete payments"
  ON public.maintenance_payments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'manager'::public.app_role));

CREATE TRIGGER maintenance_payments_updated_at
  BEFORE UPDATE ON public.maintenance_payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for live UI refresh
ALTER PUBLICATION supabase_realtime ADD TABLE public.notices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_payments;
