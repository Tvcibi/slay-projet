import { supabase } from '@/integrations/supabase/client';

export interface MapZone {
  id: string;
  name: string;
  color: string;
  shape_type: 'polygon' | 'circle' | 'rectangle';
  geometry: any; // GeoJSON-like structure
  created_at: string;
}

export async function fetchMapZones(): Promise<MapZone[]> {
  const { data, error } = await supabase
    .from('map_zones')
    .select('id, name, geometry, color, shape_type, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching map zones:', error);
    return [];
  }
  return (data ?? []) as unknown as MapZone[];
}

export async function createMapZone(zone: Omit<MapZone, 'id' | 'created_at'>): Promise<MapZone | null> {
  const { data, error } = await supabase
    .from('map_zones')
    .insert(zone as any)
    .select('id, name, geometry, color, shape_type, created_at')
    .single();

  if (error) {
    console.error('Error creating map zone:', error);
    return null;
  }
  return data as unknown as MapZone;
}

export async function updateMapZoneName(id: string, name: string): Promise<boolean> {
  const { error } = await supabase
    .from('map_zones')
    .update({ name } as any)
    .eq('id', id);

  if (error) {
    console.error('Error updating map zone:', error);
    return false;
  }
  return true;
}

export async function deleteMapZone(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('map_zones')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting map zone:', error);
    return false;
  }
  return true;
}
