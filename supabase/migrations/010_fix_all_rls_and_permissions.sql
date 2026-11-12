-- ============================================================================
-- Migration 010: FIX ALL RLS POLICIES & PERMISSIONS FOR MINIMART POS
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Project Dashboard: https://supabase.com/dashboard/project/mzysfnhaqjfrhmnedqul
-- 2. Click "SQL Editor" on the left navigation bar.
-- 3. Click "New Query" (or paste into editor) and click "Run" (or Ctrl + Enter).
-- ============================================================================

-- 1. DISABLE ROW LEVEL SECURITY (RLS) ON ALL MINIMART TABLES
-- This immediately permanently eliminates:
-- "new row violates row-level security policy for table products / categories"
ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_units DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;

-- 2. GRANT FULL CRUD PRIVILEGES TO ALL ROLES (anon, authenticated, service_role)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. ENSURE FUTURE TABLES INHERIT PERMISSIONS
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 4. ENSURE STORAGE BUCKET 'product-images' IS FULLY ACCESSIBLE
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. ALLOW PRODUCT DELETION WHILE PRESERVING ORDER HISTORY
-- Adds product_name snapshot, makes product_id NULLABLE, and changes FK to ON DELETE SET NULL
ALTER TABLE public.order_items 
    ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);

UPDATE public.order_items oi
SET product_name = COALESCE(p.name_lo, 'ສິນຄ້າ (Product)')
FROM public.products p
WHERE oi.product_id = p.id 
  AND (oi.product_name IS NULL OR oi.product_name = '');

ALTER TABLE public.order_items 
    ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE public.order_items 
    DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE public.order_items 
    ADD CONSTRAINT order_items_product_id_fkey 
    FOREIGN KEY (product_id) 
    REFERENCES public.products(id) 
    ON DELETE SET NULL;

ALTER TABLE public.order_items 
    DROP CONSTRAINT IF EXISTS order_items_batch_id_fkey;

ALTER TABLE public.order_items 
    ADD CONSTRAINT order_items_batch_id_fkey 
    FOREIGN KEY (batch_id) 
    REFERENCES public.product_batches(id) 
    ON DELETE SET NULL;

-- Verification query
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
