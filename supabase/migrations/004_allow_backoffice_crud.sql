-- ============================================================================
-- Migration 004: Allow Back-Office CRUD on Categories, Products, Units & Batches
-- Run this in Supabase SQL Editor if RLS blocks insert/update/delete from web client:
-- Dashboard -> SQL Editor -> Run
-- ============================================================================

-- 1. Categories CRUD
DROP POLICY IF EXISTS "Allow backoffice categories insert" ON public.categories;
CREATE POLICY "Allow backoffice categories insert" ON public.categories
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice categories update" ON public.categories;
CREATE POLICY "Allow backoffice categories update" ON public.categories
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice categories delete" ON public.categories;
CREATE POLICY "Allow backoffice categories delete" ON public.categories
    FOR DELETE USING (true);

-- 2. Products CRUD
DROP POLICY IF EXISTS "Allow backoffice products insert" ON public.products;
CREATE POLICY "Allow backoffice products insert" ON public.products
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice products update" ON public.products;
CREATE POLICY "Allow backoffice products update" ON public.products
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice products delete" ON public.products;
CREATE POLICY "Allow backoffice products delete" ON public.products
    FOR DELETE USING (true);

-- 3. Product Units CRUD
DROP POLICY IF EXISTS "Allow backoffice product_units insert" ON public.product_units;
CREATE POLICY "Allow backoffice product_units insert" ON public.product_units
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice product_units update" ON public.product_units;
CREATE POLICY "Allow backoffice product_units update" ON public.product_units
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice product_units delete" ON public.product_units;
CREATE POLICY "Allow backoffice product_units delete" ON public.product_units
    FOR DELETE USING (true);

-- 4. Product Batches CRUD
DROP POLICY IF EXISTS "Allow backoffice product_batches insert" ON public.product_batches;
CREATE POLICY "Allow backoffice product_batches insert" ON public.product_batches
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice product_batches update" ON public.product_batches;
CREATE POLICY "Allow backoffice product_batches update" ON public.product_batches
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice product_batches delete" ON public.product_batches;
CREATE POLICY "Allow backoffice product_batches delete" ON public.product_batches
    FOR DELETE USING (true);

-- 5. Storage bucket policy reminder:
-- Ensure bucket 'product-images' exists in Supabase Storage with Public access enabled.

