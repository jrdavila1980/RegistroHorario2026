
-- Holiday calendars table (per region/comunidad autónoma)
CREATE TABLE public.holiday_calendars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.holiday_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Calendars viewable by authenticated" ON public.holiday_calendars FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage calendars" ON public.holiday_calendars FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update calendars" ON public.holiday_calendars FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete calendars" ON public.holiday_calendars FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Add calendar_id to holidays table
ALTER TABLE public.holidays ADD COLUMN calendar_id UUID REFERENCES public.holiday_calendars(id) ON DELETE CASCADE;

-- Add holiday_calendar_id and expected_start_time to profiles
ALTER TABLE public.profiles ADD COLUMN holiday_calendar_id UUID REFERENCES public.holiday_calendars(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN expected_start_time TIME NOT NULL DEFAULT '08:30';

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'reminder',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
