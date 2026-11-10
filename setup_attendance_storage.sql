-- ============================================================================
-- SETUP ATTENDANCE PHOTOS STORAGE AND COLUMNS
-- ============================================================================

-- Create storage bucket for attendance photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('attendance-photos', 'attendance-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for attendance photos
CREATE POLICY "Allow authenticated users to upload attendance photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attendance-photos');

CREATE POLICY "Allow public read access to attendance photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attendance-photos');

-- ============================================================================
-- ENSURE ATTENDANCE TABLE HAS PHOTO AND LOCATION COLUMNS
-- ============================================================================

-- Add photo and location columns if they don't exist
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS time_in_photo TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS time_in_latitude DECIMAL(10, 8);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS time_in_longitude DECIMAL(11, 8);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS time_out_photo TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS time_out_latitude DECIMAL(10, 8);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS time_out_longitude DECIMAL(11, 8);

-- ============================================================================
-- COMPLETE
-- ============================================================================
