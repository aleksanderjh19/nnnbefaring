
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.sf6_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  station_id text NOT NULL,
  station_name text NOT NULL,
  month_label text NOT NULL,
  temperature numeric NOT NULL,
  technician_name text NOT NULL,
  measurements jsonb NOT NULL DEFAULT '{}'::jsonb,
  unit text NOT NULL DEFAULT 'MPa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sf6_rounds TO authenticated;
GRANT ALL ON public.sf6_rounds TO service_role;

ALTER TABLE public.sf6_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all sf6 rounds"
  ON public.sf6_rounds FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users insert own sf6 rounds"
  ON public.sf6_rounds FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own sf6 rounds"
  ON public.sf6_rounds FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own sf6 rounds"
  ON public.sf6_rounds FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_sf6_rounds_updated_at
  BEFORE UPDATE ON public.sf6_rounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
