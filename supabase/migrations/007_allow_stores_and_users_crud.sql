-- ============================================================================
-- Migration 007: Allow Back-Office Operations on Stores and Users
-- ============================================================================

-- 1. Stores CRUD
DROP POLICY IF EXISTS "Allow backoffice stores select" ON public.stores;
CREATE POLICY "Allow backoffice stores select" ON public.stores
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow backoffice stores update" ON public.stores;
CREATE POLICY "Allow backoffice stores update" ON public.stores
    FOR UPDATE USING (true) WITH CHECK (true);

-- 2. Users CRUD
DROP POLICY IF EXISTS "Allow backoffice users select" ON public.users;
CREATE POLICY "Allow backoffice users select" ON public.users
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow backoffice users insert" ON public.users;
CREATE POLICY "Allow backoffice users insert" ON public.users
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice users update" ON public.users;
CREATE POLICY "Allow backoffice users update" ON public.users
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice users delete" ON public.users;
CREATE POLICY "Allow backoffice users delete" ON public.users
    FOR DELETE USING (true);

