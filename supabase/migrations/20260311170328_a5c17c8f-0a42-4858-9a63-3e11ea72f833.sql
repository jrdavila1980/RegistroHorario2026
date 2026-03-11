
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Employees can only see their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Supervisors and admins can view all profiles
CREATE POLICY "Supervisors and admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'supervisor'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );
