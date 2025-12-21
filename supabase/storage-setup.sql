-- Create storage bucket for course assets (thumbnails, videos, etc.)
-- Run this in Supabase SQL Editor

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-assets', 'course-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for course-assets bucket
-- Allow public read access
CREATE POLICY "Public can view course assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-assets');

-- Allow authenticated admins to upload
CREATE POLICY "Admins can upload course assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-assets' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = TRUE
  )
);

-- Allow authenticated admins to update
CREATE POLICY "Admins can update course assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-assets' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = TRUE
  )
);

-- Allow authenticated admins to delete
CREATE POLICY "Admins can delete course assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-assets' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = TRUE
  )
);

