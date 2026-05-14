-- Supprimer les politiques permissives existantes
DROP POLICY IF EXISTS "anon upload business logos" ON storage.objects;
DROP POLICY IF EXISTS "anon delete business logos" ON storage.objects;
DROP POLICY IF EXISTS "public_read_business_logos" ON storage.objects;
DROP POLICY IF EXISTS "admin_write_business_logos" ON storage.objects;
DROP POLICY IF EXISTS "admin_delete_business_logos" ON storage.objects;

-- Lecture publique OK (pour afficher les logos)
CREATE POLICY "public_read_business_logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-logos');

-- Upload réservé aux admins
CREATE POLICY "admin_write_business_logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-logos' AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Suppression réservée aux admins
CREATE POLICY "admin_delete_business_logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-logos' AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);