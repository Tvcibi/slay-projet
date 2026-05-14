import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { formatWeekRange, getWeekStart } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface WeekSelectorProps {
  currentWeek: Date;
  onChange: (week: Date) => void;
}

export function WeekSelector({ currentWeek, onChange }: WeekSelectorProps) {
  // Max allowed week is the previous week (not the current one)
  const maxWeek = (() => {
    const w = getWeekStart();
    w.setDate(w.getDate() - 7);
    return w;
  })();

  const goToPrev = () => {
    const prev = new Date(currentWeek);
    prev.setDate(prev.getDate() - 7);
    onChange(prev);
  };

  const goToNext = () => {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() + 7);
    if (next > maxWeek) return;
    onChange(next);
  };

  const goToLatest = () => {
    onChange(new Date(maxWeek));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const week = getWeekStart(date);
      if (week > maxWeek) return;
      onChange(week);
    }
  };

  const isLatestWeek = maxWeek.toISOString() === currentWeek.toISOString();
  const isFutureBlocked = new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000) > maxWeek;

  return (
    <div className="flex items-center gap-1">
      <button onClick={goToPrev} className="p-2 rounded-lg hover:bg-secondary transition-colors btn-press">
        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
      </button>

      <button
        onClick={goToLatest}
        disabled={isLatestWeek}
        className={cn(
          'text-center min-w-0 sm:min-w-[280px] px-2 sm:px-3 py-1.5 rounded-lg transition-colors',
          !isLatestWeek && 'hover:bg-secondary cursor-pointer'
        )}
        title={!isLatestWeek ? 'Revenir à la semaine la plus récente' : undefined}
      >
        <p className="text-xs sm:text-sm font-medium text-foreground">{formatWeekRange(currentWeek)}</p>
      </button>

      <button onClick={goToNext} disabled={isFutureBlocked} className={cn("p-2 rounded-lg transition-colors btn-press", isFutureBlocked ? "opacity-30 cursor-not-allowed" : "hover:bg-secondary")}>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>

      <Popover>
        <PopoverTrigger asChild>
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors btn-press ml-1">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={currentWeek}
            onSelect={handleDateSelect}
            disabled={{ after: maxWeek }}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
