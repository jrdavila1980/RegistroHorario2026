
-- Add new request type
ALTER TYPE public.request_type ADD VALUE IF NOT EXISTS 'personal_day';

-- Add overtime time range columns
ALTER TABLE public.absence_requests 
  ADD COLUMN IF NOT EXISTS overtime_start_time time without time zone,
  ADD COLUMN IF NOT EXISTS overtime_end_time time without time zone;
