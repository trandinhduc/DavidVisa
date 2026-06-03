-- Private bucket: no public URL, accessible only via service role / signed URLs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'applications',
  'applications',
  false,
  6291456,
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated (operator) can access storage objects
CREATE POLICY "authenticated_storage_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'applications');

CREATE POLICY "authenticated_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'applications');

CREATE POLICY "authenticated_storage_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'applications');

CREATE POLICY "authenticated_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'applications');

-- Note: Form image uploads go through Next.js API Route using service role key
-- (service role bypasses RLS entirely) — anon needs no storage policy
