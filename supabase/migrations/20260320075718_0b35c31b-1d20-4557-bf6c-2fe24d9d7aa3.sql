
ALTER TABLE public.businesses ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Initialize sort_order based on current name ordering
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY pole ORDER BY name) as rn
  FROM public.businesses
)
UPDATE public.businesses b SET sort_order = r.rn FROM ranked r WHERE b.id = r.id;
