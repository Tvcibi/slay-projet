import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DISCORD_SVG = (
  <svg width="20" height="15" viewBox="0 0 71 55" fill="white">
    <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.4 37.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.8 58.8 0 0017.7 9 .2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.6.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4c-1.8 1-3.6 1.9-5.5 2.6a.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1 58.6 58.6 0 0017.7-9v-.1c1.4-15-2.3-28.4-9.8-40.1a.2.2 0 00-.1-.1zM23.7 37.3c-3.5 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7zm23.3 0c-3.5 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7z" />
  </svg>
);

interface WebhookCardProps {
  title: string;
  description: string;
  preview: React.ReactNode;
  webhookKey: string;
  testPayload: Record<string, any>;
}

function WebhookCard({ title, description, preview, webhookKey, testPayload }: WebhookCardProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('webhook_config' as any)
      .select('value')
      .eq('key', webhookKey)
      .single()
      .then(({ data }: any) => {
        if (data) setUrl(data.value);
        setLoading(false);
      });
  }, [webhookKey]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('webhook_config' as any)
      .update({ value: url, updated_at: new Date().toISOString() } as any)
      .eq('key', webhookKey);

    if (error) {
      toast.error('Erreur lors de la sauvegarde');
    } else {
      toast.success('Webhook sauvegardé');
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!url.trim()) {
      toast.error("Configure d'abord une URL de webhook");
      return;
    }
    await handleSave();

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/discord-webhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(testPayload),
      }
    );

    const data = await res.json();
    if (data.success) {
      toast.success('Message de test envoyé sur Discord !');
    } else {
      toast.error(data.error || 'Erreur lors du test');
    }
  };

  if (loading) return null;

  return (
    <div className="surface-card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#5865F2] flex items-center justify-center">
          {DISCORD_SVG}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">URL du Webhook</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="input-field"
          placeholder="https://discord.com/api/webhooks/..."
        />
      </div>

      <div className="surface-card !bg-secondary/30 p-4 rounded-lg">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Aperçu</h3>
        {preview}
      </div>

      <div className="flex items-center justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg transition-colors btn-press flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Check className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
          Sauvegarder
        </button>
      </div>
    </div>
  );
}

export function LogsView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-semibold text-foreground">Logs & Webhooks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure les webhooks Discord
        </p>
      </div>

      {/* Webhook Récapitulatifs */}
      <WebhookCard
        title="Webhook Récapitulatifs"
        description="Notifie quand un récapitulatif est soumis"
        webhookKey="discord_webhook_url"
        testPayload={{ username: 'Test', businessName: 'Entreprise Test' }}
        preview={
          <div className="border-l-4 border-[#57f287] pl-3 py-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">@utilisateur</span> vient de faire le récapitulatif{' '}
              <span className="font-bold text-foreground">Nom de l'entreprise</span>
            </p>
          </div>
        }
      />

      {/* Webhook Zones */}
      <WebhookCard
        title="Webhook Zones"
        description="Notifie quand une zone est ajoutée ou supprimée"
        webhookKey="discord_webhook_zones"
        testPayload={{ username: 'Test', type: 'zone', zoneName: 'Zone Test', action: 'create' }}
        preview={
          <div className="space-y-2">
            <div className="border-l-4 border-[#57f287] pl-3 py-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">@utilisateur</span> a ajouté la zone{' '}
                <span className="font-bold text-foreground">Burger Shot - 20/03</span>
              </p>
            </div>
            <div className="border-l-4 border-destructive pl-3 py-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">@utilisateur</span> a supprimé la zone{' '}
                <span className="font-bold text-foreground">Burger Shot - 20/03</span>
              </p>
            </div>
          </div>
        }
      />



    </motion.div>
  );
}
