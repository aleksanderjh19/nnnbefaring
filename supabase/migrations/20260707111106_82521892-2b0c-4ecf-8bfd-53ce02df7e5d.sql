
CREATE POLICY "Authenticated users can read Statnett drone docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'statnett-drone-docs');

CREATE POLICY "Service role manages Statnett drone docs"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'statnett-drone-docs')
WITH CHECK (bucket_id = 'statnett-drone-docs');
