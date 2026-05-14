import { useState, useEffect, useCallback } from 'react';
import { useGtaMap } from '@/hooks/useGtaMap';
import { fetchMapZones, createMapZone, deleteMapZone, updateMapZoneName, type MapZone } from '@/lib/mapZones';
import { insertAuditLog } from '@/lib/auditLog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E', '#14B8A6',
];

async function sendZoneWebhook(username: string, discordId: string | undefined, zoneName: string, action: 'create' | 'delete') {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(`https://${projectId}.supabase.co/functions/v1/discord-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ username, discordId, type: 'zone', zoneName, action }),
    });
  } catch (e) {
    console.error('Zone webhook error:', e);
  }
}

export function MapEditor() {
  const { profile } = useAuth();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [zones, setZones] = useState<MapZone[]>([]);
  const [pendingShape, setPendingShape] = useState<{ shape_type: string; geometry: any } | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneColor, setZoneColor] = useState(PRESET_COLORS[0]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const loadZones = useCallback(async () => {
    const data = await fetchMapZones();
    setZones(data);
  }, []);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  useGtaMap({
    container,
    zones,
    editable: true,
    onZoneCreated: (shape) => {
      setPendingShape(shape);
    },
  });

  const handleSaveZone = async () => {
    if (!zoneName.trim()) {
      toast.error('Donne un nom à la zone');
      return;
    }

    const result = await createMapZone({
      name: zoneName.trim(),
      color: zoneColor,
      shape_type: pendingShape?.shape_type as any ?? 'polygon',
      geometry: pendingShape?.geometry ?? {},
    });

    if (result) {
      toast.success('Zone créée');
      setPendingShape(null);
      setShowQuickAdd(false);
      setZoneName('');
      await loadZones();
      // Audit log + Discord
      const username = profile?.discordUsername ?? 'Inconnu';
      await insertAuditLog({ action: 'create', entity_type: 'zone', entity_name: zoneName.trim() });
      sendZoneWebhook(username, profile?.discordId, zoneName.trim(), 'create');
    } else {
      toast.error('Erreur lors de la création');
    }
  };

  const handleDeleteZone = async (id: string) => {
    const zone = zones.find(z => z.id === id);
    if (await deleteMapZone(id)) {
      toast.success('Zone supprimée');
      await loadZones();
      // Audit log + Discord
      const username = profile?.discordUsername ?? 'Inconnu';
      const name = zone?.name ?? 'Zone inconnue';
      await insertAuditLog({ action: 'delete', entity_type: 'zone', entity_name: name });
      sendZoneWebhook(username, profile?.discordId, name, 'delete');
    } else {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleRenameZone = async (id: string) => {
    if (!editingName.trim()) return;
    const zone = zones.find(z => z.id === id);
    if (await updateMapZoneName(id, editingName.trim())) {
      toast.success('Zone renommée');
      setEditingId(null);
      setEditingName('');
      await loadZones();
      await insertAuditLog({ action: 'update', entity_type: 'zone', entity_name: `${zone?.name} → ${editingName.trim()}` });
    } else {
      toast.error('Erreur lors du renommage');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Planning</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dessine les zones d'évènement sur la carte
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr,320px] gap-4" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Map */}
        <div
          ref={setContainer}
          className="rounded-lg overflow-hidden border border-border"
          style={{ background: '#0FA7D1' }}
        />

        {/* Side panel */}
        <div className="space-y-4 overflow-y-auto">
          {/* Quick add without shape */}
          <div className="surface-card p-4 space-y-3">
            {pendingShape ? (
              <>
                <h3 className="text-sm font-medium text-foreground">Nouvelle zone (dessinée)</h3>
                <Input
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="Nom de la zone"
                  className="input-field"
                />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Couleur</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setZoneColor(c)}
                        className="w-7 h-7 rounded-full border-2 transition-transform btn-press"
                        style={{
                          backgroundColor: c,
                          borderColor: zoneColor === c ? 'white' : 'transparent',
                          transform: zoneColor === c ? 'scale(1.15)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveZone} size="sm" className="flex-1">
                    Sauvegarder
                  </Button>
                  <Button onClick={() => setPendingShape(null)} size="sm" variant="outline">
                    Annuler
                  </Button>
                </div>
              </>
            ) : showQuickAdd ? (
              <>
                <h3 className="text-sm font-medium text-foreground">Ajouter un évènement sans tracé</h3>
                <Input
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="Nom de l'évènement"
                  className="input-field"
                  autoFocus
                />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Couleur</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setZoneColor(c)}
                        className="w-7 h-7 rounded-full border-2 transition-transform btn-press"
                        style={{
                          backgroundColor: c,
                          borderColor: zoneColor === c ? 'white' : 'transparent',
                          transform: zoneColor === c ? 'scale(1.15)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveZone} size="sm" className="flex-1">
                    Ajouter
                  </Button>
                  <Button onClick={() => { setShowQuickAdd(false); setZoneName(''); }} size="sm" variant="outline">
                    Annuler
                  </Button>
                </div>
              </>
            ) : (
              <Button
                onClick={() => setShowQuickAdd(true)}
                size="sm"
                variant="outline"
                className="w-full"
              >
                Ajouter un évènement sans tracé
              </Button>
            )}
          </div>

          {/* Existing zones */}
          <div className="surface-card p-4 space-y-3">
            <h3 className="text-sm font-medium text-foreground">
              Zones ({zones.length})
            </h3>
            {zones.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucune zone. Utilise les outils de dessin à gauche de la carte.
              </p>
            ) : (
              <div className="space-y-2">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 group"
                  >
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: zone.color }}
                    />
                    {editingId === zone.id ? (
                      <>
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRenameZone(zone.id)}
                          className="input-field h-7 text-sm flex-1"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRenameZone(zone.id)}
                          className="p-1 rounded text-muted-foreground hover:text-green-400 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditingName(''); }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-foreground flex-1 truncate">
                          {zone.name}
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => { setEditingId(zone.id); setEditingName(zone.name); }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteZone(zone.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
