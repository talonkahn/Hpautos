-- ============================================================
-- STORAGE BUCKET POLICIES — run this in Supabase SQL Editor
-- (Do NOT use the Storage UI "New Policy" button — use this instead)
-- ============================================================

-- Allow anyone to VIEW images in "cars" bucket (since it's public)
CREATE POLICY "Public read access for cars bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'cars');

-- Allow logged-in users to UPLOAD to "cars" bucket
CREATE POLICY "Authenticated users can upload to cars bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cars' AND auth.role() = 'authenticated');

-- Allow logged-in users to DELETE their own uploads (optional, for admin cleanup)
CREATE POLICY "Authenticated users can delete from cars bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'cars' AND auth.role() = 'authenticated');

-- ─── Repeat the same 3 policies for "stores" bucket ───────────────────────────

CREATE POLICY "Public read access for stores bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'stores');

CREATE POLICY "Authenticated users can upload to stores bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'stores' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete from stores bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'stores' AND auth.role() = 'authenticated');

-- Done! Verify with:
SELECT policyname, tablename FROM pg_policies WHERE tablename = 'objects';
