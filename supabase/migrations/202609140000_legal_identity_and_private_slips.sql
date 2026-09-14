-- Local-only until explicitly approved for staging/production.
-- Records policy acknowledgement and prevents payment slips from being public URLs.

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS privacy_notice_version TEXT,
  ADD COLUMN IF NOT EXISTS privacy_acknowledged_at TIMESTAMPTZ;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

GRANT INSERT (privacy_notice_version, privacy_acknowledged_at)
ON public.inquiries TO anon, authenticated;

UPDATE storage.buckets
SET public = false
WHERE id = 'payment_slips';

DROP POLICY IF EXISTS "Authenticated users can upload payment slips" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read payment slips" ON storage.objects;

CREATE POLICY "Authenticated users can upload payment slips" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'payment_slips'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can read payment slips" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'payment_slips' AND public.is_admin()
);
