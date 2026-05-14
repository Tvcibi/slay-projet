ALTER TABLE public.soiree_checks ADD COLUMN note text DEFAULT '' NOT NULL;
-- Drop the unique constraint on per-day rows since notes are per business per week
-- We'll add a separate table for business-level weekly notes instead

CREATE TABLE public.soiree_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, week_start)
);

ALTER TABLE public.soiree_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Evenementiel users can read soiree notes"
  ON public.soiree_notes FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'evenementiel'::app_role));

CREATE POLICY "Evenementiel users can manage soiree notes"
  ON public.soiree_notes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'evenementiel'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'evenementiel'::app_role));