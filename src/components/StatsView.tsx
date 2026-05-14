import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Users } from 'lucide-react';
import type { Pole } from '@/lib/types';

const ROLE_TO_POLE: Record<string, Pole> = {
  restauration: 'Restauration',
  production: 'Production',
  utilitaire: 'Utilitaire',
  justice: 'Justice',
  evenementiel: 'Évènementiel',
  ems: 'EMS',
  police: 'Police',
};

interface UserStat {
  userId: string;
  username: string;
  avatar: string | null;
  reportCount: number;
}

interface PoleStat {
  pole: Pole;
  role: string;
  users: UserStat[];
}

export function StatsView() {
  const [stats, setStats] = useState<PoleStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPole, setExpandedPole] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Get all user_roles (admin can read all)
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (!roles) { setLoading(false); return; }

    // Get all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, discord_username, discord_avatar');

    // Get report counts per user
    const { data: reports } = await supabase
      .from('reports')
      .select('created_by');

    const profileMap = new Map(
      (profiles ?? []).map(p => [p.id, { username: p.discord_username, avatar: p.discord_avatar }])
    );

    // Count reports per username
    const reportCounts = new Map<string, number>();
    (reports ?? []).forEach(r => {
      const by = r.created_by ?? '';
      reportCounts.set(by, (reportCounts.get(by) ?? 0) + 1);
    });

    // Build pole stats
    const poleMap = new Map<string, UserStat[]>();

    for (const r of roles) {
      const roleName = r.role as string;
      if (roleName === 'admin' || !ROLE_TO_POLE[roleName]) continue;

      if (!poleMap.has(roleName)) poleMap.set(roleName, []);

      const profile = profileMap.get(r.user_id);
      const username = profile?.username ?? 'Inconnu';

      poleMap.get(roleName)!.push({
        userId: r.user_id,
        username,
        avatar: profile?.avatar ?? null,
        reportCount: reportCounts.get(username) ?? 0,
      });
    }

    const result: PoleStat[] = Object.entries(ROLE_TO_POLE).map(([role, pole]) => ({
      pole,
      role,
      users: poleMap.get(role) ?? [],
    }));

    setStats(result);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-semibold text-foreground">Statistiques</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vue d'ensemble des responsables légal
        </p>
      </div>

      <div className="grid gap-4">
        {stats.map((poleStat) => {
          const isExpanded = expandedPole === poleStat.role;
          const totalReports = poleStat.users.reduce((sum, u) => sum + u.reportCount, 0);

          return (
            <div key={poleStat.role} className="surface-card overflow-hidden">
              <button
                onClick={() => setExpandedPole(isExpanded ? null : poleStat.role)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-foreground">{poleStat.pole}</h2>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {poleStat.users.length} membre{poleStat.users.length !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" />
                    {totalReports} récap{totalReports !== 1 ? 's' : ''}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-border"
                >
                  {poleStat.users.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-4">Aucun membre dans ce pôle</p>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {poleStat.users
                        .sort((a, b) => b.reportCount - a.reportCount)
                        .map((user) => (
                        <div key={user.userId} className="flex items-center gap-3 px-4 py-3">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium text-primary">
                              {user.username.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm text-foreground flex-1">{user.username}</span>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs text-muted-foreground">
                            <BarChart3 className="w-3 h-3" />
                            {user.reportCount}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
