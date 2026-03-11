-- Create work_agreements (convenios colectivos) table
CREATE TABLE public.work_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sector text NOT NULL,
  region text NOT NULL DEFAULT 'Nacional',
  weekly_hours numeric NOT NULL DEFAULT 40,
  annual_hours numeric NOT NULL DEFAULT 1760,
  vacation_days integer NOT NULL DEFAULT 22,
  friday_reduced_hours numeric DEFAULT NULL,
  summer_intensive boolean NOT NULL DEFAULT false,
  summer_start_month integer DEFAULT NULL,
  summer_end_month integer DEFAULT NULL,
  notes text DEFAULT NULL,
  is_template boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_agreements ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Agreements viewable by authenticated" ON public.work_agreements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage agreements" ON public.work_agreements
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update agreements" ON public.work_agreements
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete agreements" ON public.work_agreements
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Add work_agreement_id to profiles
ALTER TABLE public.profiles ADD COLUMN work_agreement_id uuid REFERENCES public.work_agreements(id) ON DELETE SET NULL;