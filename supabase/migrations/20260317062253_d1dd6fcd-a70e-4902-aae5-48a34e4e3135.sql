
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'restauration', 'production', 'utilitaire', 'justice', 'evenementiel');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_id TEXT NOT NULL UNIQUE,
  discord_username TEXT NOT NULL,
  discord_avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user has any role (is authenticated member)
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id
  )
$$;

-- Get user's pole roles
CREATE OR REPLACE FUNCTION public.get_user_poles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- Profiles RLS: users can read own profile, admins can read all
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage profiles" ON public.profiles
  FOR ALL USING (true) WITH CHECK (true);

-- User roles RLS
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage roles" ON public.user_roles
  FOR ALL USING (true) WITH CHECK (true);

-- Update businesses RLS: only authenticated users with roles can access
DROP POLICY IF EXISTS "Allow all access to businesses" ON public.businesses;
CREATE POLICY "Authenticated users can read businesses" ON public.businesses
  FOR SELECT USING (public.has_any_role(auth.uid()));
CREATE POLICY "Admins can manage businesses" ON public.businesses
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update reports RLS: pole-based access
DROP POLICY IF EXISTS "Allow all access to reports" ON public.reports;

-- Users can read reports for businesses in their pole
CREATE POLICY "Users can read reports for their poles" ON public.reports
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = reports.business_id
      AND public.has_role(auth.uid(), LOWER(b.pole::text)::app_role)
    )
  );

-- Users can insert/update reports for businesses in their pole
CREATE POLICY "Users can manage reports for their poles" ON public.reports
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = reports.business_id
      AND public.has_role(auth.uid(), LOWER(b.pole::text)::app_role)
    )
  ) WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = reports.business_id
      AND public.has_role(auth.uid(), LOWER(b.pole::text)::app_role)
    )
  );
