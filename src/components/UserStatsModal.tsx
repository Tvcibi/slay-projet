import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface UserReport {
  id: string;
  business_name: string;
  week_start: string;
  status: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

interface UserStatsModalProps {
  open: boolean;
  onClose: () => void;
}

export function UserStatsModal({ open, onClose }: UserStatsModalProps) {
  const { profile, poles, isAdmin } = useAuth();
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !profile) return;
    setLoading(true);

    supabase
      .from('reports')
      .select('id, business_name, week_start, status, balance_before, balance_after, created_at')
      .eq('created_by', profile.discordUsername)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReports((data as UserReport[]) ?? []);
        setLoading(false);
      });
  }, [open, profile]);

  const completedCount = reports.filter(r => r.status === 'completed').length;
  const draftCount = reports.filter(r => r.status === 'draft').length;
  const totalReports = reports.length;

  // Unique weeks
  const uniqueWeeks = new Set(reports.map(r => r.week_start)).size;

  // Unique businesses
  const uniqueBusinesses = new Set(reports.map(r => r.business_name)).size;

   const completedReports = reports.filter(r => r.status === 'completed');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="surface-card w-full max-w-md max-h-[85vh] overflow-y-auto relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-4">
                {profile?.discordAvatar ? (
                  <img src={profile.discordAvatar} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/30" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-lg font-semibold text-primary">
                    {profile?.discordUsername?.slice(0, 2).toUpperCase() ?? '??'}
                  </div>
                )}
                <div>
                  <h2 className="text-base font-semibold text-foreground">{profile?.discordUsername ?? 'Utilisateur'}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAdmin ? 'Administrateur' : poles.join(', ')}
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="p-6">
                  <div className="surface-card !bg-secondary/40 p-5 rounded-xl text-center">
                    <p className="text-3xl font-bold text-foreground tabular-nums">{completedCount}</p>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Récaps complétés</p>
                  </div>
                </div>


                {/* Recent reports */}
                <div className="px-6 pb-6">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    Derniers récapitulatifs
                  </h3>
                  {completedReports.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucun récapitulatif soumis</p>
                  ) : (
                    <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                      {completedReports.map(report => (
                        <div key={report.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                          <div className="w-2 h-2 rounded-full flex-shrink-0 bg-success" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{report.business_name}</p>
                            <p className="text-[10px] text-muted-foreground">{report.week_start}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
