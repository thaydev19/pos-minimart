-- ============================================================================
-- Migration 006: Allow Back-Office & POS Operations on Shifts, Orders & Order Items
-- ============================================================================

-- 1. Shifts CRUD
DROP POLICY IF EXISTS "Allow backoffice shifts select" ON public.shifts;
CREATE POLICY "Allow backoffice shifts select" ON public.shifts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow backoffice shifts insert" ON public.shifts;
CREATE POLICY "Allow backoffice shifts insert" ON public.shifts
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice shifts update" ON public.shifts;
CREATE POLICY "Allow backoffice shifts update" ON public.shifts
    FOR UPDATE USING (true) WITH CHECK (true);

-- 2. Orders CRUD
DROP POLICY IF EXISTS "Allow backoffice orders select" ON public.orders;
CREATE POLICY "Allow backoffice orders select" ON public.orders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow backoffice orders insert" ON public.orders;
CREATE POLICY "Allow backoffice orders insert" ON public.orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice orders update" ON public.orders;
CREATE POLICY "Allow backoffice orders update" ON public.orders
    FOR UPDATE USING (true) WITH CHECK (true);

-- 3. Order Items CRUD
DROP POLICY IF EXISTS "Allow backoffice order_items select" ON public.order_items;
CREATE POLICY "Allow backoffice order_items select" ON public.order_items
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow backoffice order_items insert" ON public.order_items;
CREATE POLICY "Allow backoffice order_items insert" ON public.order_items
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice order_items update" ON public.order_items;
CREATE POLICY "Allow backoffice order_items update" ON public.order_items
    FOR UPDATE USING (true) WITH CHECK (true);

