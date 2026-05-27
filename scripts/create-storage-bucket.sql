-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Creates the match-proofs storage bucket for casual match result photos

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'match-proofs',
  'match-proofs',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload match proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'match-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access
CREATE POLICY "Match proofs are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'match-proofs');
