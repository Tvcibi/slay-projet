CREATE TABLE public.map_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#FF0000',
  shape_type text NOT NULL DEFAULT 'polygon',
  geometry jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.map_zones ENABLE ROW LEVEL SECURITY;

-- Everyone can read zones (public page)
CREATE POLICY "Anyone can read map zones"
  ON public.map_zones FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admins can manage zones
CREATE POLICY "Admins can manage map zones"
  ON public.map_zones FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));