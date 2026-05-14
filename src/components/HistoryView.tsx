import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, Check, Clock } from 'lucide-react';
import { type Report, POLES } from '@/lib/types';
import { fetchReports, fetchBusinesses } from '@/lib/store';
import { cn } from '@/lib/utils';

export function HistoryView() {
  const [filterPole, setFilterPole] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [businesses, setBusinesses] = useState<{ id: string; pole: string }[]>([]);

  useEffect(() => {
    fetchReports().then(setAllReports).catch(console.error);
    fetchBusinesses().then(b => setBusinesses(b.map(x => ({ id: x.id, pole: x.pole })))).catch(console.error);
  }, []);

  const filtered = allReports.filter(r => {
    if (filterPole !== 'all') {
      const biz = businesses.find(b => b.id === r.businessId);
      if (biz?.pole !== filterPole) return false;
    }
    if (search && !r.businessName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-6">Archives des récapitulatifs</h2>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10 w-full" placeholder="Rechercher une entreprise..." />
        </div>
        <select value={filterPole} onChange={e => setFilterPole(e.target.value)} className="input-field w-full sm:w-auto">
          <option value="all">Tous les pôles</option>
          {POLES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="surface-card p-8 text-center">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun récapitulatif archivé pour le moment.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="surface-card overflow-hidden hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Entreprise</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Semaine</th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Effectif</th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Solde Avant</th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Solde Après</th>
                  <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((report, i) => (
                  <motion.tr
                    key={report.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{report.businessName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{report.weekStart}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{report.staffCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{report.balanceBefore.toLocaleString('fr-FR')} $</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{report.balanceAfter.toLocaleString('fr-FR')} $</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        'inline-flex px-2 py-0.5 rounded text-xs font-medium',
                        report.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                      )}>
                        {report.status === 'completed' ? 'Complété' : 'Brouillon'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 sm:hidden">
            {filtered.map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="surface-card p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{report.businessName}</p>
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                    report.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  )}>
                    {report.status === 'completed' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {report.status === 'completed' ? 'Complété' : 'Brouillon'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{report.weekStart}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Effectif: <span className="text-foreground tabular-nums">{report.staffCount}</span></span>
                  <span className="text-muted-foreground">Avant: <span className="text-foreground tabular-nums">{report.balanceBefore.toLocaleString('fr-FR')} $</span></span>
                  <span className="text-muted-foreground">Après: <span className="text-foreground tabular-nums">{report.balanceAfter.toLocaleString('fr-FR')} $</span></span>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
