import { supabase } from '@/integrations/supabase/client';

export async function uploadBusinessLogo(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'png';
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('business-logos')
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (error) throw error;

  const { data } = supabase.storage
    .from('business-logos')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function deleteBusinessLogo(url: string): Promise<void> {
  const parts = url.split('/business-logos/');
  if (parts.length < 2) return;
  const fileName = parts[1];
  await supabase.storage.from('business-logos').remove([fileName]);
}
