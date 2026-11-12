-- ============================================================================
-- Migration 005: Allow Back-Office Audit Logs Insert and Select
-- ============================================================================

DROP POLICY IF EXISTS "Allow backoffice audit_logs insert" ON public.audit_logs;
CREATE POLICY "Allow backoffice audit_logs insert" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backoffice audit_logs select" ON public.audit_logs;
CREATE POLICY "Allow backoffice audit_logs select" ON public.audit_logs
    FOR SELECT USING (true);

