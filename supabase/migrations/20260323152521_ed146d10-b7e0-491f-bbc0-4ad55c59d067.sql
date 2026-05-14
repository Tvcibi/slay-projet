
CREATE OR REPLACE FUNCTION public.pole_to_role(p pole_type)
RETURNS app_role
LANGUAGE sql
IMMUTABLE
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

DROP POLICY IF EXISTS "Users can manage reports for their poles" ON reports;
DROP POLICY IF EXISTS "Users can read reports for their poles" ON reports;

CREATE POLICY "Users can manage reports for their poles"
ON reports FOR ALL TO public
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = reports.business_id
    AND has_role(auth.uid(), pole_to_role(b.pole))
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = reports.business_id
    AND has_role(auth.uid(), pole_to_role(b.pole))
  )
);

CREATE POLICY "Users can read reports for their poles"
ON reports FOR SELECT TO public
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = reports.business_id
    AND has_role(auth.uid(), pole_to_role(b.pole))
  )
);
