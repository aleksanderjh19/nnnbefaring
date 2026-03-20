
CREATE TABLE public.waste_notification_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waste_category text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (waste_category, email)
);

ALTER TABLE public.waste_notification_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read waste_notification_recipients"
  ON public.waste_notification_recipients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage waste_notification_recipients"
  ON public.waste_notification_recipients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.waste_pickup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waste_category text NOT NULL,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  note text
);

ALTER TABLE public.waste_pickup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read waste_pickup_requests"
  ON public.waste_pickup_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert waste_pickup_requests"
  ON public.waste_pickup_requests FOR INSERT TO authenticated WITH CHECK (true);
