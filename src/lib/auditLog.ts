import { supabase } from '@/integrations/supabase/client';

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_name: string;
  performed_by: string | null;
  created_at: string;
}

export async function insertAuditLog(log: {
  action: string;
  entity_type: string;
  entity_name: string;
}) {
  const { error } = await supabase
    .from('audit_logs' as any)
    .insert({
      action: log.action,
      entity_type: log.entity_type,
      entity_name: log.entity_name,
    } as any);
  if (error) console.error('Audit log error:', error);
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs' as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
  return (data ?? []) as unknown as AuditLog[];
}
