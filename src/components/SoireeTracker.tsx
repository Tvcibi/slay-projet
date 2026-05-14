import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type Business } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, MessageSquare } from 'lucide-react';

const DAYS = ['L', 'M', 'Me', 'J', 'V', 'S', 'D'];

interface SoireeTrackerProps {
  businesses: Business[];
  weekStart: Date;
}

type CheckMap = Record<string, boolean>;
type NoteMap = Record<string, string>;

function makeKey(businessId: string, dayIndex: number) {
  return `${businessId}-${dayIndex}`;
}

function weekId(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function SoireeTracker({ businesses, weekStart }: SoireeTrackerProps) {
  const [checks, setChecks] = useState<CheckMap>({});
  const [notes, setNotes] = useState<NoteMap>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const noteInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const wk = weekId(weekStart);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const bizIds = businesses.map(b => b.id);
    if (bizIds.length === 0) { setLoading(false); return; }

    const [checksRes, notesRes] = await Promise.all([
      supabase.from('soiree_checks').select('business_id, day_index, status').eq('week_start', wk).in('business_id', bizIds),
      supabase.from('soiree_notes').select('business_id, note').eq('week_start', wk).in('business_id', bizIds),
    ]);

    const checkMap: CheckMap = {};
    (checksRes.data ?? []).forEach((r: any) => {
      checkMap[makeKey(r.business_id, r.day_index)] = !!r.status;
    });
    setChecks(checkMap);

    const noteMap: NoteMap = {};
    (notesRes.data ?? []).forEach((r: any) => {
      noteMap[r.business_id] = r.note;
    });
    setNotes(noteMap);
    setLoading(false);
  }, [wk, businesses]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (editingNote && noteInputRef.current) {
      noteInputRef.current.focus();
    }
  }, [editingNote]);

  const toggle = async (businessId: string, dayIndex: number) => {
    const key = makeKey(businessId, dayIndex);
    const newVal = !checks[key];
    setChecks(prev => ({ ...prev, [key]: newVal }));

    const { error } = await supabase
      .from('soiree_checks')
      .upsert({ business_id: businessId, week_start: wk, day_index: dayIndex, status: newVal ? 1 : 0 } as any, { onConflict: 'business_id,week_start,day_index' });

    if (error) {
      console.error(error);
      setChecks(prev => ({ ...prev, [key]: !newVal }));
    }
  };

  const saveNote = async (businessId: string, note: string) => {
    const { error } = await supabase
      .from('soiree_notes')
      .upsert({ business_id: businessId, week_start: wk, note } as any, { onConflict: 'business_id,week_start' });
    if (error) console.error(error);
  };

  const handleNoteChange = (businessId: string, value: string) => {
    setNoteDraft(value);
    setNotes(prev => ({ ...prev, [businessId]: value }));
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveNote(businessId, value), 600);
  };

  const openNote = (businessId: string) => {
    setEditingNote(businessId);
    setNoteDraft(notes[businessId] ?? '');
  };

  const closeNote = (businessId: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveNote(businessId, noteDraft);
    setEditingNote(null);
  };

  if (businesses.length === 0) return null;

  return (
    <div className="surface-card overflow-hidden">
      {/* Header */}
      <div className="grid items-center gap-0 border-b border-border/50 px-3 py-1.5"
        style={{ gridTemplateColumns: '1fr 28px repeat(7, 28px)' }}>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Entreprise</span>
        <span />
        {DAYS.map(d => (
          <span key={d} className="text-[10px] font-medium text-muted-foreground text-center">{d}</span>
        ))}
      </div>

      {/* Rows */}
      {businesses.map((biz, i) => (
        <div key={biz.id}>
          <div
            className={`grid items-center gap-0 px-3 py-1.5 transition-colors hover:bg-card/60 ${i < businesses.length - 1 && editingNote !== biz.id ? 'border-b border-border/20' : ''}`}
            style={{ gridTemplateColumns: '1fr 28px repeat(7, 28px)' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {biz.image ? (
                <img src={biz.image} alt={biz.name} className="w-5 h-5 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center flex-shrink-0">
                  <FileText className="w-2.5 h-2.5 text-muted-foreground" />
                </div>
              )}
              <span className="text-xs text-foreground truncate">{biz.name}</span>
            </div>

            <button
              onMouseDown={e => e.preventDefault()}
              onClick={() => editingNote === biz.id ? closeNote(biz.id) : openNote(biz.id)}
              className={`flex justify-center items-center rounded transition-colors ${notes[biz.id] ? 'text-primary' : 'text-muted-foreground/30 hover:text-muted-foreground/60'}`}
              title="Note"
            >
              <MessageSquare className="w-3 h-3" />
            </button>

            {DAYS.map((_, dayIdx) => (
              <div key={dayIdx} className="flex justify-center">
                <Checkbox
                  checked={!!checks[makeKey(biz.id, dayIdx)]}
                  onCheckedChange={() => toggle(biz.id, dayIdx)}
                  disabled={loading}
                  className="h-3.5 w-3.5 [&_svg]:h-3 [&_svg]:w-3"
                />
              </div>
            ))}
          </div>

          {editingNote === biz.id && (
            <div className={`px-3 pb-2 ${i < businesses.length - 1 ? 'border-b border-border/20' : ''}`}>
              <input
                ref={noteInputRef}
                type="text"
                value={noteDraft}
                onChange={e => handleNoteChange(biz.id, e.target.value)}
                onBlur={() => closeNote(biz.id)}
                onKeyDown={e => e.key === 'Enter' && closeNote(biz.id)}
                placeholder="Ajouter une note..."
                className="w-full text-xs bg-transparent border-b border-border/30 focus:border-primary/50 outline-none py-1 text-muted-foreground placeholder:text-muted-foreground/40 transition-colors"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
