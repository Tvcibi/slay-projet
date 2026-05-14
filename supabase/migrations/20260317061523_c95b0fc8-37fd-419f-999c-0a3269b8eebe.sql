
-- Create storage bucket for business logos
INSERT INTO storage.buckets (id, name, public) VALUES ('business-logos', 'business-logos', true);

-- Allow public read access
CREATE POLICY "Public read access for business logos" ON storage.objects FOR SELECT USING (bucket_id = 'business-logos');

-- Allow public insert (will lock down with auth later)
CREATE POLICY "Allow upload business logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'business-logos');

-- Allow public delete
CREATE POLICY "Allow delete business logos" ON storage.objects FOR DELETE USING (bucket_id = 'business-logos');
