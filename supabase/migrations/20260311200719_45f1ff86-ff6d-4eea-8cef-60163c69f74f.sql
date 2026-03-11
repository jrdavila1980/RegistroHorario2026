
CREATE OR REPLACE FUNCTION public.notify_supervisor_unknown_location(
  _user_id uuid,
  _event_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _supervisor_user_id uuid;
  _user_name text;
BEGIN
  SELECT sup.user_id, p.name INTO _supervisor_user_id, _user_name
  FROM profiles p
  LEFT JOIN profiles sup ON p.supervisor_id = sup.id
  WHERE p.user_id = _user_id;

  IF _supervisor_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      _supervisor_user_id,
      'Fichaje desde ubicación desconocida',
      _user_name || ' ha fichado ' || _event_type || ' desde una ubicación fuera de los centros de trabajo registrados. Contacte con RRHH.',
      'geofence_alert'
    );
  END IF;
END;
$$;
