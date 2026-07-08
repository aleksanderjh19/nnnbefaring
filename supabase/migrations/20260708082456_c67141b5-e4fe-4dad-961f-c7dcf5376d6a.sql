
ALTER TABLE public.sf6_rounds
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'in_progress',
  ALTER COLUMN temperature DROP NOT NULL;

DROP POLICY IF EXISTS "Users update own sf6 rounds" ON public.sf6_rounds;
DROP POLICY IF EXISTS "Users delete own sf6 rounds" ON public.sf6_rounds;

CREATE POLICY "Authenticated update in-progress or own sf6 rounds"
  ON public.sf6_rounds FOR UPDATE
  TO authenticated
  USING (status = 'in_progress' OR auth.uid() = user_id)
  WITH CHECK (status = 'in_progress' OR auth.uid() = user_id);

CREATE POLICY "Authenticated delete sf6 rounds"
  ON public.sf6_rounds FOR DELETE
  TO authenticated
  USING (true);
