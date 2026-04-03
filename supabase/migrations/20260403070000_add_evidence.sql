-- Add evidence_urls to test_runs
ALTER TABLE public.test_runs ADD COLUMN IF NOT EXISTS evidence_urls text[] DEFAULT '{}';

-- Create evidence storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('evidence', 'evidence', true, 10485760, ARRAY['image/png','image/jpeg','image/webp','image/gif','video/mp4'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Evidence public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'evidence');

CREATE POLICY "Evidence upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'evidence');

CREATE POLICY "Evidence delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'evidence');
