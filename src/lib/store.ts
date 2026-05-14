import { supabase } from '@/integrations/supabase/client';
import { type Business, type Report, type Pole } from './types';
import { deleteBusinessLogo } from './storage';

// ---- Businesses ----

export async function fetchBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('sort_order')
    .order('name');
  if (error) throw error;
  return (data ?? []).map(b => ({
    id: b.id,
    name: b.name,
    pole: b.pole as Pole,
    image: b.image_url ?? undefined,
    sortOrder: b.sort_order,
  }));
}

export async function addBusiness(name: string, pole: Pole, imageUrl?: string): Promise<Business> {
  const { data, error } = await supabase
    .from('businesses')
    .insert({ name, pole, image_url: imageUrl ?? null })
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, name: data.name, pole: data.pole as Pole, image: data.image_url ?? undefined, sortOrder: data.sort_order };
}

export async function reorderBusinesses(orderedIds: { id: string; sortOrder: number }[]): Promise<void> {
  const updates = orderedIds.map(({ id, sortOrder }) =>
    supabase.from('businesses').update({ sort_order: sortOrder }).eq('id', id)
  );
  await Promise.all(updates);
}

export async function removeBusiness(id: string): Promise<void> {
  // Fetch image URL to clean up storage
  const { data: biz } = await supabase
    .from('businesses')
    .select('image_url')
    .eq('id', id)
    .maybeSingle();
  
  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', id);
  if (error) throw error;

  // Clean up logo from storage
  if (biz?.image_url) {
    await deleteBusinessLogo(biz.image_url).catch(console.error);
  }
}

export async function updateBusinessImage(id: string, imageUrl: string): Promise<void> {
  const { error } = await supabase
    .from('businesses')
    .update({ image_url: imageUrl })
    .eq('id', id);
  if (error) throw error;
}

export async function renameBusiness(id: string, newName: string): Promise<void> {
  const { error } = await supabase
    .from('businesses')
    .update({ name: newName })
    .eq('id', id);
  if (error) throw error;
}

// ---- Reports ----

export async function fetchReports(weekId?: string): Promise<Report[]> {
  let query = supabase.from('reports').select('*');
  if (weekId) {
    query = query.eq('week_start', weekId);
  }
  const { data, error } = await query;
  console.log('[fetchReports] weekId:', weekId, 'count:', data?.length, 'error:', error);
  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id,
    businessId: r.business_id,
    businessName: r.business_name,
    weekStart: r.week_start,
    hoursPatron: Number(r.hours_patron),
    hoursCoPatron: Number(r.hours_co_patron),
    hoursEm: Array.isArray((r as any).hours_em) ? (r as any).hours_em.map(Number) : [],
    staffCount: r.staff_count,
    balanceBefore: Number(r.balance_before),
    balanceAfter: Number(r.balance_after),
    notes: r.notes ?? '',
    status: r.status as 'draft' | 'completed',
    createdBy: r.created_by ?? 'demo-user',
    createdAt: r.created_at,
  }));
}

export async function fetchReport(businessId: string, weekId: string): Promise<Report | undefined> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('business_id', businessId)
    .eq('week_start', weekId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return {
    id: data.id,
    businessId: data.business_id,
    businessName: data.business_name,
    weekStart: data.week_start,
    hoursPatron: Number(data.hours_patron),
    hoursCoPatron: Number(data.hours_co_patron),
    hoursEm: Array.isArray((data as any).hours_em) ? (data as any).hours_em.map(Number) : [],
    staffCount: data.staff_count,
    balanceBefore: Number(data.balance_before),
    balanceAfter: Number(data.balance_after),
    notes: data.notes ?? '',
    status: data.status as 'draft' | 'completed',
    createdBy: data.created_by ?? 'demo-user',
    createdAt: data.created_at,
  };
}

export async function deleteReport(businessId: string, weekStart: string): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('business_id', businessId)
    .eq('week_start', weekStart);
  if (error) throw error;
}

export async function saveReport(report: Omit<Report, 'id' | 'createdAt'>): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .upsert({
      business_id: report.businessId,
      business_name: report.businessName,
      week_start: report.weekStart,
      hours_patron: report.hoursPatron,
      hours_co_patron: report.hoursCoPatron,
      hours_em: report.hoursEm as any,
      staff_count: report.staffCount,
      balance_before: report.balanceBefore,
      balance_after: report.balanceAfter,
      notes: report.notes,
      status: report.status,
      created_by: report.createdBy,
    } as any, { onConflict: 'business_id,week_start' })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    businessId: data.business_id,
    businessName: data.business_name,
    weekStart: data.week_start,
    hoursPatron: Number(data.hours_patron),
    hoursCoPatron: Number(data.hours_co_patron),
    hoursEm: Array.isArray((data as any).hours_em) ? (data as any).hours_em.map(Number) : [],
    staffCount: data.staff_count,
    balanceBefore: Number(data.balance_before),
    balanceAfter: Number(data.balance_after),
    notes: data.notes ?? '',
    status: data.status as 'draft' | 'completed',
    createdBy: data.created_by ?? 'demo-user',
    createdAt: data.created_at,
  };
}
