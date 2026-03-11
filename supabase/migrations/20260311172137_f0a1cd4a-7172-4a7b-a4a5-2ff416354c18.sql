
-- Helper function: check if a user is supervised by another user
CREATE OR REPLACE FUNCTION public.is_supervised_by(_user_id uuid, _supervisor_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.profiles sup ON p.supervisor_id = sup.id
    WHERE p.user_id = _user_id AND sup.user_id = _supervisor_user_id
  )
$$;

-- PROFILES: drop old supervisor SELECT policy, create restricted one
DROP POLICY IF EXISTS "Supervisors and admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Supervisors can view supervised profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'supervisor'::app_role)
    AND is_supervised_by(user_id, auth.uid())
  );

-- TIME_ENTRIES: drop old supervisor SELECT policy, create restricted one
DROP POLICY IF EXISTS "Supervisors can view all entries" ON public.time_entries;

CREATE POLICY "Admins can view all entries"
  ON public.time_entries FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Supervisors can view supervised entries"
  ON public.time_entries FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'supervisor'::app_role)
    AND is_supervised_by(user_id, auth.uid())
  );

-- PRESENCE_LOGS: drop old supervisor SELECT policy, create restricted one
DROP POLICY IF EXISTS "Supervisors can view all presence" ON public.presence_logs;

CREATE POLICY "Admins can view all presence"
  ON public.presence_logs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Supervisors can view supervised presence"
  ON public.presence_logs FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'supervisor'::app_role)
    AND is_supervised_by(user_id, auth.uid())
  );

-- ABSENCE_REQUESTS: drop old supervisor policies, create restricted ones
DROP POLICY IF EXISTS "Supervisors can view all requests" ON public.absence_requests;
DROP POLICY IF EXISTS "Supervisors can update requests" ON public.absence_requests;

CREATE POLICY "Admins can view all requests"
  ON public.absence_requests FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Supervisors can view supervised requests"
  ON public.absence_requests FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'supervisor'::app_role)
    AND is_supervised_by(user_id, auth.uid())
  );

CREATE POLICY "Admins can update requests"
  ON public.absence_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Supervisors can update supervised requests"
  ON public.absence_requests FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'supervisor'::app_role)
    AND is_supervised_by(user_id, auth.uid())
  );
