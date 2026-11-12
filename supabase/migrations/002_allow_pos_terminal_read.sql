-- ============================================================================
-- Migration 002: Allow POS Terminal Public/Anon Read & Order Ingestion
-- Required for POS Terminals using Supabase Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
-- ============================================================================

-- 1. Allow POS terminal (anon & authenticated) to read store information
DROP POLICY IF EXISTS "Allow public read store" ON public.stores;
CREATE POLICY "Allow public read store" ON public.stores
    FOR SELECT USING (true);

-- 2. Allow POS terminal to read product categories
DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
CREATE POLICY "Allow public read categories" ON public.categories
    FOR SELECT USING (true);

-- 3. Allow POS terminal to read active products (barcode, prices, names)
DROP POLICY IF EXISTS "Allow public read active products" ON public.products;
CREATE POLICY "Allow public read active products" ON public.products
    FOR SELECT USING (is_active = true);

-- 4. Allow POS terminal to read product units (pack, crate conversion)
DROP POLICY IF EXISTS "Allow public read product units" ON public.product_units;
CREATE POLICY "Allow public read product units" ON public.product_units
    FOR SELECT USING (true);

-- 5. Allow POS terminal to read product batches (FEFO expiry dates)
DROP POLICY IF EXISTS "Allow public read product batches" ON public.product_batches;
CREATE POLICY "Allow public read product batches" ON public.product_batches
    FOR SELECT USING (true);

-- 6. Allow POS terminal to insert completed orders
DROP POLICY IF EXISTS "Allow POS to insert orders" ON public.orders;
CREATE POLICY "Allow POS to insert orders" ON public.orders
    FOR INSERT WITH CHECK (true);

-- 7. Allow POS terminal to insert order items
DROP POLICY IF EXISTS "Allow POS to insert order items" ON public.order_items;
CREATE POLICY "Allow POS to insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

-- 8. Allow POS terminal to insert audit logs
DROP POLICY IF EXISTS "Allow POS to insert audit logs" ON public.audit_logs;
CREATE POLICY "Allow POS to insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

