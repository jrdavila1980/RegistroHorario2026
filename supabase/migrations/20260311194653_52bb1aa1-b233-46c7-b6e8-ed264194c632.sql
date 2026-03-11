ALTER TABLE public.profiles 
  ADD COLUMN employee_code text,
  ADD COLUMN first_name text,
  ADD COLUMN last_name text;

-- Populate first_name/last_name from existing name field
UPDATE public.profiles 
SET first_name = split_part(name, ' ', 1),
    last_name = CASE 
      WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1)
      ELSE ''
    END;

-- Update handle_new_user trigger to populate new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, first_name, last_name, employee_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), ' ', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.raw_user_meta_data->>'employee_code'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'employee');
  RETURN NEW;
END;
$$;