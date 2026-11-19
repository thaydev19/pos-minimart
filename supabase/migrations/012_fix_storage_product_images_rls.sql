-- ============================================================================
-- Migration 012: Fix Supabase Storage RLS Policies for 'product-images'
-- Ensures both anonymous and authenticated users can upload, view, update, and delete product images.
-- ============================================================================

-- 1. Ensure the 'product-images' bucket exists with public access enabled
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  52428800, -- 50MB max file size limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'];

-- 2. Enable Row Level Security (RLS) on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop any conflicting existing policies on 'product-images'
DROP POLICY IF EXISTS "Public Access product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes product-images" ON storage.objects;

-- 4. Create explicit RLS policies for 'product-images' bucket:

-- A. Allow anyone (public, anon, authenticated) to view/download product images
CREATE POLICY "Public Access product-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- B. Allow anyone (anon and authenticated) to upload product images
CREATE POLICY "Allow public uploads product-images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'product-images');

-- C. Allow anyone to update existing product images
CREATE POLICY "Allow public updates product-images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- D. Allow anyone to delete product images
CREATE POLICY "Allow public deletes product-images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'product-images');
