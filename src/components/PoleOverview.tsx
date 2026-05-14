import { motion } from 'framer-motion';
import { Check, Utensils, Factory, Wrench, Scale, PartyPopper, HeartPulse, Shield, type LucideIcon } from 'lucide-react';
import { POLES, type Pole, type Report, type Business } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PoleOverviewProps {
  reports: Report[];
  businesses: Business[];
  onSelectPole: (pole: Pole) => void;
  selectedPole?: Pole;
}

const poleIcons: Record<Pole, LucideIcon> = {
  'Restauration': Utensils,
  'Production': Factory,
  'Utilitaire': Wrench,
  'Justice': Scale,
  'Évènementiel': PartyPopper,
  'EMS': HeartPulse,
  'Police': Shield,
};

export function PoleOverview({ reports, businesses, onSelectPole, selectedPole }: PoleOverviewProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {POLES.map((pole, i) => {
        const poleBiz = businesses.filter(b => b.pole === pole);
        const completed = poleBiz.filter(b =>
          reports.some(r => r.businessId === b.id && r.status === 'completed')
        ).length;
        const total = poleBiz.length;
        const allDone = completed === total && total > 0;
        const isSelected = selectedPole === pole;

        return (
          <motion.button
            key={pole}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 30 }}
            onClick={() => onSelectPole(pole)}
            className={cn(
              'surface-card p-4 text-left btn-press cursor-pointer transition-colors',
              isSelected && 'ring-1 ring-primary/50'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              {(() => { const Icon = poleIcons[pole]; return <Icon className="w-5 h-5 text-primary" />; })()}
              {allDone ? (
                <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                  <Check className="w-3 h-3 text-success-foreground" />
                </div>
              ) : (
                <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="none" strokeWidth="2.5" className="stroke-muted" />
                  <circle
                    cx="12" cy="12" r="10" fill="none" strokeWidth="2.5"
                    className="stroke-primary transition-all duration-700"
                    strokeDasharray={2 * Math.PI * 10}
                    strokeDashoffset={2 * Math.PI * 10 * (1 - (total > 0 ? completed / total : 0))}
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
            <p className="text-xs font-medium text-foreground">{pole}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {completed}/{total} récap.
            </p>
            <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', allDone ? 'bg-success' : 'bg-primary')}
                style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
              />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
