
-- Fix: Make audit_logs insert policy more restrictive (only the user's own audit entries)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
-- Audit logs are inserted by triggers (SECURITY DEFINER), not directly by users
-- Remove the permissive insert policy since triggers bypass RLS
