-- ============================================
-- Storage Policies for Public Access
-- ============================================
-- Run this in Supabase SQL Editor to allow public uploads

-- Policy for videos bucket - Allow public read
CREATE POLICY "Public Access to videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Policy for videos bucket - Allow uploads (for demo)
CREATE POLICY "Allow uploads to videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos');

-- Policy for images bucket - Allow public read
CREATE POLICY "Public Access to images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Policy for images bucket - Allow uploads (for demo)
CREATE POLICY "Allow uploads to images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');

-- Verify policies
SELECT * FROM storage.objects WHERE bucket_id IN ('videos', 'images');
