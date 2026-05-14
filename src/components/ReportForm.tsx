import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, Check, TrendingUp, TrendingDown, Minus, Plus, X, Trash2 } from 'lucide-react';
import { type Business, type Report, getWeekId } from '@/lib/types';
import { fetchReport, saveReport, deleteReport } from '@/lib/store';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ReportFormProps {
  business: Business;
  weekStart: Date;
  onBack: () => void;
  onSaved: () => void;
  readOnly?: boolean;
}

function CompareValue({ label, current, previous, suffix = '' }: { label: string; current: number; previous: number; suffix?: string }) {
  const diff = current - previous;
  const hasPrev = previous > 0;
  if (!hasPrev) return null;

  return (
    <div className="flex items-center justify-between text-xs py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground/60">{previous.toLocaleString('fr-FR')}{suffix}</span>
        <span className="text-muted-foreground/40">→</span>
        <span className="text-foreground font-medium">{current.toLocaleString('fr-FR')}{suffix}</span>
        <span className={cn(
          'flex items-center gap-0.5 font-medium',
          diff > 0 ? 'text-success' : diff < 0 ? 'text-destructive' : 'text-muted-foreground'
        )}>
          {diff > 0 ? <TrendingUp className="w-3 h-3" /> : diff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {diff > 0 ? '+' : ''}{diff.toLocaleString('fr-FR')}{suffix}
        </span>
      </div>
    </div>
  );
}

const MAX_EM = 7;

export function ReportForm({ business, weekStart, onBack, onSaved, readOnly = false }: ReportFormProps) {
  const { profile, isAdmin } = useAuth();
  const weekId = getWeekId(weekStart);
  const isPolice = business.pole === 'Police';
  const [confirmDeleteReport, setConfirmDeleteReport] = useState(false);
  const [existing, setExisting] = useState<Report | undefined>();
  const [prevReport, setPrevReport] = useState<Report | undefined>();
  const [loading, setLoading] = useState(true);

  const [hoursPatron, setHoursPatron] = useState(0);
  const [hoursCoPatron, setHoursCoPatron] = useState(0);
  const [hoursEm, setHoursEm] = useState<number[]>([0]);
  const [staffCount, setStaffCount] = useState(0);
  const [balanceBefore, setBalanceBefore] = useState(0);
  const [balanceAfter, setBalanceAfter] = useState(0);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    const prevWeek = new Date(weekStart);
    prevWeek.setDate(prevWeek.getDate() - 7);

    Promise.all([
      fetchReport(business.id, weekId),
      fetchReport(business.id, getWeekId(prevWeek)),
    ]).then(([report, prev]) => {
      setExisting(report);
      setPrevReport(prev);
      if (report) {
        setHoursPatron(report.hoursPatron);
        setHoursCoPatron(report.hoursCoPatron);
        setHoursEm(report.hoursEm.length > 0 ? report.hoursEm : [0]);
        setStaffCount(report.staffCount);
        setBalanceBefore(report.balanceBefore);
        setBalanceAfter(report.balanceAfter);
        setNotes(report.notes);
      }
      setLoading(false);
    });
  }, [business.id, weekId, weekStart]);

  const isLocked = readOnly || existing?.status === 'completed';

  const isComplete = isPolice
    ? hoursEm[0] >= 0 && staffCount >= 0 && balanceBefore >= 0 && balanceAfter >= 0
    : hoursPatron >= 0 && hoursCoPatron >= 0 && staffCount >= 0 && balanceBefore >= 0 && balanceAfter >= 0;

  const handleSave = async (status: 'draft' | 'completed') => {
    await saveReport({
      businessId: business.id,
      businessName: business.name,
      weekStart: weekId,
      hoursPatron: isPolice ? 0 : hoursPatron,
      hoursCoPatron: isPolice ? 0 : hoursCoPatron,
      hoursEm: isPolice ? hoursEm : [],
      staffCount,
      balanceBefore,
      balanceAfter,
      notes,
      status,
      createdBy: profile?.discordUsername ?? 'unknown',
    });

    if (status === 'completed') {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const { data: { session } } = await supabase.auth.getSession();
      fetch(`https://${projectId}.supabase.co/functions/v1/discord-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          username: profile?.discordUsername ?? 'Inconnu',
          businessName: business.name,
          discordId: profile?.discordId ?? null,
        }),
      }).catch(console.error);
    }

    setSaved(true);
    setTimeout(() => {
      onSaved();
      onBack();
    }, 800);
  };

  const updateEmHour = (index: number, value: number) => {
    setHoursEm(prev => prev.map((h, i) => i === index ? value : h));
  };

  const addEm = () => {
    if (hoursEm.length < MAX_EM) {
      setHoursEm(prev => [...prev, 0]);
    }
  };

  const removeEm = (index: number) => {
    if (hoursEm.length > 1) {
      setHoursEm(prev => prev.filter((_, i) => i !== index));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 btn-press">
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{business.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">Récapitulatif - {business.pole}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && existing && (
              <button
                onClick={() => setConfirmDeleteReport(true)}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Supprimer le récapitulatif"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {saved && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 text-success text-sm">
                <Check className="w-4 h-4" /> Enregistré
              </motion.div>
            )}
          </div>
        </div>

        {isPolice ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Activité État-Major</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {hoursEm.map((hours, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">Heures EM {idx + 1}</label>
                      {!isLocked && hoursEm.length > 1 && (
                        <button onClick={() => removeEm(idx)} className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">h</span>
                      <input type="number" value={hours ?? ''} onChange={e => updateEmHour(idx, Number(e.target.value))} disabled={isLocked} className="input-field pr-8 tabular-nums disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Ex: 14" />
                    </div>
                  </div>
                ))}
              </div>
              {!isLocked && hoursEm.length < MAX_EM && (
                <button onClick={addEm} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors btn-press">
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter EM {hoursEm.length + 1}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Nombre d'employés</label>
                <input type="number" value={staffCount ?? ''} onChange={e => setStaffCount(Number(e.target.value))} disabled={isLocked} className="input-field tabular-nums disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Ex: 8" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Solde Avant Paies</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input type="number" value={balanceBefore ?? ''} onChange={e => setBalanceBefore(Number(e.target.value))} disabled={isLocked} className="input-field pr-8 tabular-nums disabled:opacity-60 disabled:cursor-not-allowed" placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Solde Après Paies</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input type="number" value={balanceAfter ?? ''} onChange={e => setBalanceAfter(Number(e.target.value))} disabled={isLocked} className="input-field pr-8 tabular-nums disabled:opacity-60 disabled:cursor-not-allowed" placeholder="0" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Activité Direction</h3>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Heures Patron</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">h</span>
                  <input type="number" value={hoursPatron === 0 ? '0' : hoursPatron || ''} onChange={e => setHoursPatron(Number(e.target.value))} disabled={isLocked} className="input-field pr-8 tabular-nums disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Ex: 14" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Heures Co-Patron</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">h</span>
                  <input type="number" value={hoursCoPatron === 0 ? '0' : hoursCoPatron || ''} onChange={e => setHoursCoPatron(Number(e.target.value))} disabled={isLocked} className="input-field pr-8 tabular-nums disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Ex: 12" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Nombre d'employés</label>
                <input type="number" value={staffCount ?? ''} onChange={e => setStaffCount(Number(e.target.value))} disabled={isLocked} className="input-field tabular-nums disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Ex: 8" />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Finances</h3>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Solde Avant Paies</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input type="number" value={balanceBefore ?? ''} onChange={e => setBalanceBefore(Number(e.target.value))} disabled={isLocked} className="input-field pr-8 tabular-nums disabled:opacity-60 disabled:cursor-not-allowed" placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Solde Après Paies</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input type="number" value={balanceAfter ?? ''} onChange={e => setBalanceAfter(Number(e.target.value))} disabled={isLocked} className="input-field pr-8 tabular-nums disabled:opacity-60 disabled:cursor-not-allowed" placeholder="0" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Observations</h3>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} disabled={isLocked} className="input-field min-h-[100px] resize-y disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Ex: Patron absent cette semaine, le co-patron a assuré la gestion..." />
        </div>

        {prevReport && (
          <div className="mt-6 surface-card p-4 !bg-secondary/30">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Évolution vs semaine précédente
            </h3>
            <div className="divide-y divide-border/50">
              <CompareValue label="Nombre d'employés" current={staffCount} previous={prevReport.staffCount} />
              {isPolice ? (
                hoursEm.map((h, idx) => (
                  <CompareValue key={idx} label={`Heures EM ${idx + 1}`} current={h} previous={prevReport.hoursEm[idx] ?? 0} suffix="h" />
                ))
              ) : (
                <>
                  <CompareValue label="Heures Patron" current={hoursPatron} previous={prevReport.hoursPatron} suffix="h" />
                  <CompareValue label="Heures Co-Patron" current={hoursCoPatron} previous={prevReport.hoursCoPatron} suffix="h" />
                </>
              )}
              <CompareValue label="Solde avant paies" current={balanceBefore} previous={prevReport.balanceBefore} suffix=" $" />
              <CompareValue label="Solde après paies" current={balanceAfter} previous={prevReport.balanceAfter} suffix=" $" />
            </div>
          </div>
        )}

        {!isLocked && (
          <div className="mt-6 flex items-center gap-3 justify-end">
            <button onClick={() => handleSave('draft')} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-secondary rounded-lg transition-colors btn-press">
              Sauvegarder brouillon
            </button>
            <button onClick={() => handleSave('completed')} disabled={!isComplete} className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg transition-colors btn-press flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
              <Save className="w-4 h-4" />
              Enregistrer le récapitulatif
            </button>
          </div>
        )}
      </div>

      {/* Confirmation suppression recap */}
      <AnimatePresence>
        {confirmDeleteReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmDeleteReport(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface-card p-6 w-full max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Supprimer le récapitulatif</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Cette action est irréversible</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Voulez-vous vraiment supprimer le récapitulatif de <span className="text-foreground font-medium">{business.name}</span> pour cette semaine ?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDeleteReport(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-secondary rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    await deleteReport(business.id, weekId);
                    setConfirmDeleteReport(false);
                    onSaved();
                    onBack();
                  }}
                  className="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-lg transition-colors hover:bg-destructive/90 btn-press"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
