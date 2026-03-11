
-- =============================================
-- FIX 1: Convert ALL RESTRICTIVE policies to PERMISSIVE
-- =============================================

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Supervisors and admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Supervisors and admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'supervisor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- time_entries
DROP POLICY IF EXISTS "Users can view own entries" ON public.time_entries;
DROP POLICY IF EXISTS "Supervisors can view all entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON public.time_entries;

CREATE POLICY "Users can view own entries" ON public.time_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Supervisors can view all entries" ON public.time_entries FOR SELECT TO authenticated USING (has_role(auth.uid(), 'supervisor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own entries" ON public.time_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON public.time_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- absence_requests
DROP POLICY IF EXISTS "Users can view own requests" ON public.absence_requests;
DROP POLICY IF EXISTS "Supervisors can view all requests" ON public.absence_requests;
DROP POLICY IF EXISTS "Users can insert own requests" ON public.absence_requests;
DROP POLICY IF EXISTS "Supervisors can update requests" ON public.absence_requests;
DROP POLICY IF EXISTS "Users can update own pending/approved requests" ON public.absence_requests;

CREATE POLICY "Users can view own requests" ON public.absence_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Supervisors can view all requests" ON public.absence_requests FOR SELECT TO authenticated USING (has_role(auth.uid(), 'supervisor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own requests" ON public.absence_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Supervisors can update requests" ON public.absence_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'supervisor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
-- FIX 2: Restrict users to only edit PENDING requests
CREATE POLICY "Users can update own pending requests" ON public.absence_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id AND status = 'pending'::request_status) WITH CHECK (auth.uid() = user_id AND status = 'pending'::request_status);

-- presence_logs
DROP POLICY IF EXISTS "Users can view own presence" ON public.presence_logs;
DROP POLICY IF EXISTS "Supervisors can view all presence" ON public.presence_logs;
DROP POLICY IF EXISTS "Users can insert own presence" ON public.presence_logs;

CREATE POLICY "Users can view own presence" ON public.presence_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Supervisors can view all presence" ON public.presence_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'supervisor'::app_role));
CREATE POLICY "Users can insert own presence" ON public.presence_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- audit_logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- monthly_signatures
DROP POLICY IF EXISTS "Users can view own signatures" ON public.monthly_signatures;
DROP POLICY IF EXISTS "Admins can view all signatures" ON public.monthly_signatures;
DROP POLICY IF EXISTS "Users can insert own signatures" ON public.monthly_signatures;
DROP POLICY IF EXISTS "Users can update own signatures" ON public.monthly_signatures;

CREATE POLICY "Users can view own signatures" ON public.monthly_signatures FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all signatures" ON public.monthly_signatures FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own signatures" ON public.monthly_signatures FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own signatures" ON public.monthly_signatures FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- departments
DROP POLICY IF EXISTS "Departments viewable by authenticated" ON public.departments;
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Admins can update departments" ON public.departments;
DROP POLICY IF EXISTS "Admins can delete departments" ON public.departments;

CREATE POLICY "Departments viewable by authenticated" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage departments" ON public.departments FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update departments" ON public.departments FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete departments" ON public.departments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- offices
DROP POLICY IF EXISTS "Offices viewable by authenticated" ON public.offices;
DROP POLICY IF EXISTS "Admins can manage offices" ON public.offices;
DROP POLICY IF EXISTS "Admins can update offices" ON public.offices;
DROP POLICY IF EXISTS "Admins can delete offices" ON public.offices;

CREATE POLICY "Offices viewable by authenticated" ON public.offices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage offices" ON public.offices FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update offices" ON public.offices FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete offices" ON public.offices FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- holidays
DROP POLICY IF EXISTS "Holidays viewable by authenticated" ON public.holidays;
DROP POLICY IF EXISTS "Admins manage holidays" ON public.holidays;

CREATE POLICY "Holidays viewable by authenticated" ON public.holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage holidays" ON public.holidays FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- holiday_calendars
DROP POLICY IF EXISTS "Calendars viewable by authenticated" ON public.holiday_calendars;
DROP POLICY IF EXISTS "Admins can manage calendars" ON public.holiday_calendars;
DROP POLICY IF EXISTS "Admins can update calendars" ON public.holiday_calendars;
DROP POLICY IF EXISTS "Admins can delete calendars" ON public.holiday_calendars;

CREATE POLICY "Calendars viewable by authenticated" ON public.holiday_calendars FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage calendars" ON public.holiday_calendars FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update calendars" ON public.holiday_calendars FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete calendars" ON public.holiday_calendars FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- work_agreements
DROP POLICY IF EXISTS "Agreements viewable by authenticated" ON public.work_agreements;
DROP POLICY IF EXISTS "Admins can manage agreements" ON public.work_agreements;
DROP POLICY IF EXISTS "Admins can update agreements" ON public.work_agreements;
DROP POLICY IF EXISTS "Admins can delete agreements" ON public.work_agreements;

CREATE POLICY "Agreements viewable by authenticated" ON public.work_agreements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage agreements" ON public.work_agreements FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update agreements" ON public.work_agreements FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete agreements" ON public.work_agreements FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
