import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Calendar, Clock, Trash2, Trophy, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { type Business } from '@/lib/types';
import { fetchBusinesses } from '@/lib/store';

interface RaceEvent {
  id: string;
  name: string;
  event_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export function EventsView() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<RaceEvent[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });
    if (!error && data) setEvents(data as RaceEvent[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    fetchBusinesses().then(setBusinesses).catch(console.error);
  }, []);

  const handleAdd = async () => {
    const biz = businesses.find(b => b.id === selectedBusinessId);
    if (!biz || !selectedDate) return;
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const { error } = await supabase.from('events').insert({
      name: biz.name,
      event_date: dateStr,
      created_by: profile?.discordUsername ?? 'unknown',
    });
    if (error) {
      toast.error("Erreur lors de l'ajout");
      return;
    }
    toast.success('Événement ajouté');
    setSelectedBusinessId(''); setSelectedDate(undefined);
    setOpen(false);
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) { toast.error("Erreur lors de la suppression"); return; }
    toast.success('Événement supprimé');
    fetchEvents();
  };

  // Compute next allowed date (2 months after last event)
  const lastEvent = events.length > 0 ? events[0] : null;
  const nextAllowedDate = lastEvent
    ? (() => { const [y, m, d] = lastEvent.event_date.split('-').map(Number); const dt = new Date(y, m - 1, d); dt.setMonth(dt.getMonth() + 2); return dt; })()
    : null;
  const now = new Date();
  const canCreateNew = !nextAllowedDate || now >= nextAllowedDate;
  const daysUntilNext = nextAllowedDate
    ? Math.max(0, Math.ceil((nextAllowedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Suivis Course</h1>
          <p className="text-sm text-muted-foreground mt-1">Suivi des événements course autorisés tous les 2 mois</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Nouvel événement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un événement course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Entreprise</label>
                <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Sélectionner une entreprise" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date de l'événement</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(
                      "w-full flex items-center gap-2 input-field px-3 py-2 rounded-md text-sm text-left",
                      !selectedDate && "text-muted-foreground"
                    )}>
                      <CalendarIcon className="w-4 h-4" />
                      {selectedDate
                        ? selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Sélectionner une date'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={!selectedBusinessId || !selectedDate}>
                Ajouter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>



      {/* Events list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <Card className="surface-card">
          <CardContent className="p-12 text-center">
            <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun événement course enregistré</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event, i) => {
            const [y, m, d] = event.event_date.split('-').map(Number);
            const eventDate = new Date(y, m - 1, d);
            const nextAllowed = new Date(eventDate);
            nextAllowed.setMonth(nextAllowed.getMonth() + 2);
            const now = new Date();
            const canAgain = now >= nextAllowed;
            const daysLeft = Math.max(0, Math.ceil((nextAllowed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            const matchedBiz = businesses.find(b => b.name === event.name);

            return (
              <Card key={event.id} className="surface-card group">
                <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                  {matchedBiz?.image ? (
                    <img src={matchedBiz.image} alt={event.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${i === 0 ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted-foreground'}`}>
                      <Calendar className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{event.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {eventDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <div className="sm:hidden mt-1">
                      {canAgain ? (
                        <span className="text-xs font-medium text-emerald-400">Peut refaire un event</span>
                      ) : (
                        <p className="text-xs font-medium text-amber-400">
                          Prochain le {nextAllowed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right mr-2 hidden sm:block">
                    {canAgain ? (
                      <span className="text-xs font-medium text-emerald-400">Peut refaire un event</span>
                    ) : (
                      <p className="text-xs font-medium text-amber-400">
                        Prochain le {nextAllowed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
