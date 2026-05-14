
CREATE TABLE public.organigramme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pole public.pole_type NOT NULL UNIQUE,
  referent text NOT NULL DEFAULT '',
  entries jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organigramme ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone with role can read organigramme"
  ON public.organigramme FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid()));

CREATE POLICY "Admins can manage organigramme"
  ON public.organigramme FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Pre-populate with all poles
INSERT INTO public.organigramme (pole, referent, entries) VALUES
  ('Restauration', '', '[]'),
  ('Production', '', '[]'),
  ('Utilitaire', '', '[]'),
  ('Justice', '', '[]'),
  ('Évènementiel', '', '[]'),
  ('EMS', '', '[]'),
  ('Police', '', '[]');
