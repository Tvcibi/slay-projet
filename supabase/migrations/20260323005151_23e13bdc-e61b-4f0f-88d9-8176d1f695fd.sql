CREATE TABLE public.soiree_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  day_index smallint NOT NULL CHECK (day_index BETWEEN 0 AND 6),
  checked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, week_start, day_index)
);

ALTER TABLE public.soiree_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Evenementiel users can read soiree checks"
  ON public.soiree_checks FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'evenementiel'::app_role)
  );

CREATE POLICY "Evenementiel users can manage soiree checks"
  ON public.soiree_checks FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'evenementiel'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'evenementiel'::app_role)
  );