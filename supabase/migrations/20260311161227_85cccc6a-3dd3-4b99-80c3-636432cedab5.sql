
-- Indexes for time_entries: optimize lookups by user+date
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date ON public.time_entries (user_id, date);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON public.time_entries (date);

-- Indexes for presence_logs: optimize lookups by user+created_at
CREATE INDEX IF NOT EXISTS idx_presence_logs_user_created ON public.presence_logs (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_presence_logs_created ON public.presence_logs (created_at);

-- Index for absence_requests by user
CREATE INDEX IF NOT EXISTS idx_absence_requests_user ON public.absence_requests (user_id, created_at DESC);

-- Index for profiles supervisor lookup
CREATE INDEX IF NOT EXISTS idx_profiles_supervisor ON public.profiles (supervisor_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles (department_id);
