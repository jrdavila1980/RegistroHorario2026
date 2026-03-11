
-- 3. INDEXES for performance with millions of records
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON public.time_entries (date);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date ON public.time_entries (user_id, date);
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles (department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_supervisor_id ON public.profiles (supervisor_id);
CREATE INDEX IF NOT EXISTS idx_presence_logs_user_id ON public.presence_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_presence_logs_created_at ON public.presence_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_absence_requests_user_id ON public.absence_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_absence_requests_status ON public.absence_requests (status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);

-- 8. SYSTEM LOGS table for errors, login failures, GPS failures
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL, -- 'error', 'login_failure', 'gps_failure', 'geo_block'
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_logs_event_type ON public.system_logs (event_type);
CREATE INDEX idx_system_logs_created_at ON public.system_logs (created_at);
CREATE INDEX idx_system_logs_user_id ON public.system_logs (user_id);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read system logs
CREATE POLICY "Admins can view system logs"
  ON public.system_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone authenticated can insert (to log their own errors)
CREATE POLICY "Authenticated can insert system logs"
  ON public.system_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Also allow anon to insert (for login failure logging before auth)
CREATE POLICY "Anon can insert system logs"
  ON public.system_logs FOR INSERT TO anon
  WITH CHECK (true);
