CREATE TABLE public.deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  row_id TEXT NOT NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  UNIQUE (table_name, row_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deletion_requests TO authenticated;
GRANT ALL ON public.deletion_requests TO service_role;

ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alle innloggede kan se sletteforespørsler"
  ON public.deletion_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Innloggede kan opprette sletteforespørsler"
  ON public.deletion_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Selv eller admin kan fjerne sletteforespørsel"
  ON public.deletion_requests FOR DELETE TO authenticated
  USING (auth.uid() = requested_by OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_deletion_requests_table ON public.deletion_requests(table_name);
