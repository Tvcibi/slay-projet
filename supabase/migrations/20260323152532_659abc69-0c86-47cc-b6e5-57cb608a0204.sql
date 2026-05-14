
CREATE OR REPLACE FUNCTION public.pole_to_role(p pole_type)
RETURNS app_role
LANGUAGE sql
IMMUTABLE
SET search_path = 'public'
AS $$
  SELECT CASE p
    WHEN 'Restauration' THEN 'restauration'::app_role
    WHEN 'Production' THEN 'production'::app_role
    WHEN 'Utilitaire' THEN 'utilitaire'::app_role
    WHEN 'Justice' THEN 'justice'::app_role
    WHEN 'Évènementiel' THEN 'evenementiel'::app_role
    WHEN 'EMS' THEN 'ems'::app_role
    WHEN 'Police' THEN 'police'::app_role
  END
$$;
