-- Add new enum values
ALTER TYPE public.pole_type ADD VALUE IF NOT EXISTS 'EMS';
ALTER TYPE public.pole_type ADD VALUE IF NOT EXISTS 'Police';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ems';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'police';