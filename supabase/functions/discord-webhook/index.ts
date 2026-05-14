import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();

    // Validate allowed fields
    const allowedFields = ['username', 'businessName', 'discordId', 'type', 'zoneName', 'action'];
    const hasUnknownFields = Object.keys(body).some(k => !allowedFields.includes(k));
    if (hasUnknownFields) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Block abusive mentions
    const allValues = Object.values(body).filter(v => typeof v === 'string') as string[];
    for (const val of allValues) {
      if (val.includes('@everyone') || val.includes('@here') || /<@\d+>/.test(val)) {
        return new Response(JSON.stringify({ error: 'Mentions not allowed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { username, businessName, discordId, type, zoneName, action } = body;

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const webhookKey = type === 'zone' ? 'discord_webhook_zones' : 'discord_webhook_url';

    const { data: config, error: configError } = await supabase
      .from("webhook_config")
      .select("value")
      .eq("key", webhookKey)
      .single();

    if (configError || !config?.value || config.value.trim() === "") {
      return new Response(
        JSON.stringify({ success: false, error: "Webhook URL not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const webhookUrl = config.value;
    const mention = discordId ? `<@${discordId}>` : `@${username}`;

    let embed;

    if (type === 'zone') {
      const isDelete = action === 'delete';
      embed = {
        description: `${mention} a ${isDelete ? 'supprimé' : 'ajouté'} la zone **${zoneName}**`,
        color: isDelete ? 0xed4245 : 0x57f287,
      };
    } else {
      embed = {
        description: `${mention} vient de faire le récapitulatif **${businessName}**`,
        color: 0x57f287,
      };
    }

    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      throw new Error(`Discord webhook failed [${discordRes.status}]: ${errText}`);
    }

    await discordRes.text().catch(() => {});

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Discord webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
