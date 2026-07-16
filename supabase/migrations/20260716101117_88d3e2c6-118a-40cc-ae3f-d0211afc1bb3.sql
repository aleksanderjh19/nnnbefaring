
CREATE TABLE public.utlans_skjemaer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  laantaker_navn text NOT NULL DEFAULT '',
  ansattnr text NOT NULL DEFAULT '',
  utlaant_gjenstand text NOT NULL DEFAULT '',
  regnr text NOT NULL DEFAULT '',
  dato_fra date,
  dato_til date,
  dato_sted text NOT NULL DEFAULT '',
  signatur_laantaker text,
  signatur_statnett text,
  innlevert_dato date,
  innlevert_kvittering text,
  signatur_innlevering text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.utlans_skjemaer TO authenticated;
GRANT ALL ON public.utlans_skjemaer TO service_role;

ALTER TABLE public.utlans_skjemaer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own skjemaer"
  ON public.utlans_skjemaer FOR ALL
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_utlans_skjemaer_updated_at
  BEFORE UPDATE ON public.utlans_skjemaer
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
