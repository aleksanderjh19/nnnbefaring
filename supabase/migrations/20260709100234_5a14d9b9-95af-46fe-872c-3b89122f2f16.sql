
CREATE TABLE public.sf6_round_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.sf6_rounds(id) ON DELETE CASCADE,
  voltage_level text NOT NULL,
  breaker_name text NOT NULL,
  storage_path text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sf6_round_photos_lookup_idx
  ON public.sf6_round_photos (round_id, voltage_level, breaker_name);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sf6_round_photos TO authenticated;
GRANT ALL ON public.sf6_round_photos TO service_role;

ALTER TABLE public.sf6_round_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view photos for their own rounds or admins view all"
  ON public.sf6_round_photos
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.sf6_rounds r
      WHERE r.id = sf6_round_photos.round_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert photos for their own rounds"
  ON public.sf6_round_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.sf6_rounds r
        WHERE r.id = sf6_round_photos.round_id AND r.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users delete their own photos or admins delete any"
  ON public.sf6_round_photos
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR created_by = auth.uid()
  );

-- Storage policies for sf6-round-photos bucket
CREATE POLICY "SF6 photos: authenticated read own or admin"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'sf6-round-photos'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR owner = auth.uid()
    )
  );

CREATE POLICY "SF6 photos: authenticated insert own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'sf6-round-photos'
    AND owner = auth.uid()
  );

CREATE POLICY "SF6 photos: delete own or admin"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'sf6-round-photos'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR owner = auth.uid()
    )
  );
