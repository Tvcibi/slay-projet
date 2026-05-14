
-- Create pole enum
CREATE TYPE public.pole_type AS ENUM ('Restauration', 'Production', 'Utilitaire', 'Justice', 'Évènementiel');

-- Businesses table
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pole pole_type NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  week_start DATE NOT NULL,
  hours_patron NUMERIC NOT NULL DEFAULT 0,
  hours_co_patron NUMERIC NOT NULL DEFAULT 0,
  staff_count INTEGER NOT NULL DEFAULT 0,
  balance_before NUMERIC NOT NULL DEFAULT 0,
  balance_after NUMERIC NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  created_by TEXT DEFAULT 'demo-user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, week_start)
);

-- Enable RLS (permissive for now, will lock down with auth later)
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Temporary public policies (will be replaced by auth-based policies)
CREATE POLICY "Allow all access to businesses" ON public.businesses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to reports" ON public.reports FOR ALL USING (true) WITH CHECK (true);

-- Seed initial businesses
INSERT INTO public.businesses (name, pole) VALUES
  ('Burgershot', 'Restauration'),
  ('UwU Cafe', 'Restauration'),
  ('Pizza Stack', 'Restauration'),
  ('Taco Bomb', 'Restauration'),
  ('Bean Machine', 'Restauration'),
  ('Los Santos Customs', 'Production'),
  ('Dynasty 8', 'Production'),
  ('Maze Bank', 'Production'),
  ('Weazel News', 'Utilitaire'),
  ('LS Medical', 'Utilitaire'),
  ('Tribunal de LS', 'Justice'),
  ('Cabinet Goldberg', 'Justice'),
  ('Galaxy Events', 'Évènementiel'),
  ('Vinewood Productions', 'Évènementiel');
