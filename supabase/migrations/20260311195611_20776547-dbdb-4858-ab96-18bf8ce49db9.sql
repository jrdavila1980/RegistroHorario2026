-- Table for temporary remote clock-in permissions
CREATE TABLE public.remote_clock_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  granted_by uuid NOT NULL,
  permission_date date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission_date)
);

ALTER TABLE public.remote_clock_permissions ENABLE ROW LEVEL SECURITY;

-- Users can see their own permissions
CREATE POLICY "Users can view own remote permissions"
  ON public.remote_clock_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all permissions
CREATE POLICY "Admins manage remote permissions"
  ON public.remote_clock_permissions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Supervisors can manage permissions for their supervised users
CREATE POLICY "Supervisors manage supervised remote permissions"
  ON public.remote_clock_permissions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'supervisor') AND is_supervised_by(user_id, auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'supervisor') AND is_supervised_by(user_id, auth.uid()));