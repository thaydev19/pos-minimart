-- ============================================================================
-- Migration 013: Database-Level Orphaned Product Image Cleanup (pg_cron)
-- Optional: For stores that want native database cron scheduling in Supabase
-- ============================================================================

-- Function to identify and return orphaned product image storage paths
CREATE OR REPLACE FUNCTION public.get_orphaned_product_images(grace_period_days INT DEFAULT 7)
RETURNS TABLE (
  storage_name TEXT,
  storage_created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    obj.name::TEXT AS storage_name,
    obj.created_at AS storage_created_at
  FROM storage.objects obj
  WHERE obj.bucket_id = 'product-images'
    AND obj.name != '.emptyFolderPlaceholder'
    AND obj.created_at < (NOW() - (grace_period_days || ' days')::INTERVAL)
    AND NOT EXISTS (
      -- Check if any active product references this image
      SELECT 1 
      FROM public.products p
      WHERE p.image_url IS NOT NULL 
        AND p.image_url LIKE ('%' || obj.name || '%')
    );
END;
$$;
