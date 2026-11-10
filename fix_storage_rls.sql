-- ============================================================================
-- FIX STORAGE POLICIES FOR STUDENT LOGIN (DEVELOPMENT MODE)
-- Allow photo uploads without requiring Supabase Auth
-- ============================================================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow authenticated users to upload attendance photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to attendance photos" ON storage.objects;

-- Allow public upload to attendance-photos bucket (development only)
CREATE POLICY "Allow public upload to attendance photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'attendance-photos');

-- Allow public read access to attendance photos
CREATE POLICY "Allow public read access to attendance photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attendance-photos');

-- ============================================================================
-- COMPLETE
-- ============================================================================
