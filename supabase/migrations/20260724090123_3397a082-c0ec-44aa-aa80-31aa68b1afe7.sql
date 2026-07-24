
-- Tildel eier-rollen til Aleksander
INSERT INTO public.user_roles (user_id, role)
VALUES ('bc4190f7-9417-4cfa-9e9b-3c51811326d2', 'equipment_owner')
ON CONFLICT (user_id, role) DO NOTHING;

-- Ny kolonne for eiers innleverings-signatur
ALTER TABLE public.utlans_skjemaer
  ADD COLUMN IF NOT EXISTS signatur_innlevering_eier text;

-- Ny RLS-policy: eier kan se og oppdatere alle skjemaer
DROP POLICY IF EXISTS "Owner can view all skjemaer" ON public.utlans_skjemaer;
CREATE POLICY "Owner can view all skjemaer"
  ON public.utlans_skjemaer FOR SELECT
  USING (public.has_role(auth.uid(), 'equipment_owner'));

DROP POLICY IF EXISTS "Owner can update all skjemaer" ON public.utlans_skjemaer;
CREATE POLICY "Owner can update all skjemaer"
  ON public.utlans_skjemaer FOR UPDATE
  USING (public.has_role(auth.uid(), 'equipment_owner'))
  WITH CHECK (public.has_role(auth.uid(), 'equipment_owner'));
