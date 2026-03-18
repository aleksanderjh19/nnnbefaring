
-- Allow public access to training-files storage bucket
CREATE POLICY "Anyone can upload training files"
ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'training-files');

CREATE POLICY "Anyone can read training files"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'training-files');

CREATE POLICY "Anyone can update training files"
ON storage.objects FOR UPDATE TO public
USING (bucket_id = 'training-files');

CREATE POLICY "Anyone can delete training files"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'training-files');
