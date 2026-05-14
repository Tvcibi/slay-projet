import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Discord role ID → app_role mapping
const ROLE_MAP: Record<string, string> = {
  '1144275966286364716': 'admin',
  '1392560064765755462': 'admin',
  '1054383850819682344': 'restauration',
  '1054383850853257218': 'production',
  '1054383850819682343': 'utilitaire',
  '1054383850853257216': 'evenementiel',
  '1054383850853257217': 'justice',
  '1054383850853257220': 'ems',
  '1054383850853257219': 'police',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  const DISCORD_CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID')!;
  const DISCORD_CLIENT_SECRET = Deno.env.get('DISCORD_CLIENT_SECRET')!;
  const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!;
  const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID')!;
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_REDIRECT_ORIGINS') || '').split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean);

  // Step 1: Redirect user to Discord OAuth
  if (action === 'login') {
    const redirectUri = url.searchParams.get('redirect_uri') || url.origin;

    // Validate redirect_uri against allowlist
    if (!ALLOWED_ORIGINS.some(o => redirectUri === o || redirectUri.startsWith(o + '/'))) {
      return new Response(JSON.stringify({ error: 'Invalid redirect_uri' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate CSRF nonce
    const nonce = crypto.randomUUID();
    const state = btoa(JSON.stringify({ redirect_uri: redirectUri, nonce }));
    const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(SUPABASE_URL + '/functions/v1/discord-auth?action=callback')}&response_type=code&scope=identify%20guilds.members.read&state=${state}`;
    
    return new Response(null, {
      status: 302,
      headers: { Location: discordUrl },
    });
  }

  // Step 2: Handle Discord callback
  if (action === 'callback') {
    try {
      const code = url.searchParams.get('code');
      const stateParam = url.searchParams.get('state');
      if (!code) throw new Error('No code provided');

      const parsedState = JSON.parse(atob(stateParam || btoa('{}')));
      const frontendRedirect = parsedState.redirect_uri;

      // Validate redirect_uri on callback as well
      if (!frontendRedirect || !ALLOWED_ORIGINS.some((o: string) => frontendRedirect === o || frontendRedirect.startsWith(o + '/'))) {
        return new Response(JSON.stringify({ error: 'Invalid redirect_uri' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Exchange code for token
      const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri: `${SUPABASE_URL}/functions/v1/discord-auth?action=callback`,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);

      // Get Discord user info
      const userRes = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const discordUser = await userRes.json();
      if (!userRes.ok) throw new Error(`Failed to get user: ${JSON.stringify(discordUser)}`);

      // Get guild member roles using bot token
      const memberRes = await fetch(
        `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${discordUser.id}`,
        { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
      );
      
      if (!memberRes.ok) {
        const errorBody = await memberRes.text();
        // Redirect with error if user not in guild
        return new Response(null, {
          status: 302,
          headers: { Location: `${frontendRedirect || '/'}?error=not_in_guild` },
        });
      }
      
      const member = await memberRes.json();
      const memberRoles: string[] = member.roles || [];

      // Map Discord roles to app roles
      const appRoles = [...new Set(
        memberRoles
          .filter((r: string) => ROLE_MAP[r])
          .map((r: string) => ROLE_MAP[r])
      )];

      if (appRoles.length === 0) {
        return new Response(null, {
          status: 302,
          headers: { Location: `${frontendRedirect || '/'}?error=no_role` },
        });
      }

      // Create/update Supabase user using admin API
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const email = `${discordUser.id}@discord.user`;
      const encoder = new TextEncoder();
      const data = encoder.encode(`${discordUser.id}:${DISCORD_CLIENT_SECRET}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const password = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Try to sign in first, create if doesn't exist
      let userId: string;
      const metadata = {
        discord_id: discordUser.id,
        discord_username: discordUser.username,
        avatar_url: discordUser.avatar
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : null,
      };

      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // User might exist with old password (e.g. after secret rotation)
        // Try to find by email and update password, otherwise create new
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users?.find(u => u.email === email);

        if (existingUser) {
          // Update password and metadata for existing user
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password,
            user_metadata: metadata,
          });
          userId = existingUser.id;
        } else {
          // Create new user
          const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: metadata,
          });
          if (signUpError) throw signUpError;
          userId = signUpData.user.id;
        }
      } else {
        userId = signInData.user.id;
        // Update metadata
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: metadata,
        });
      }

      // Upsert profile
      const avatarUrl = discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : null;

      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        discord_id: discordUser.id,
        discord_username: member.nick || discordUser.global_name || discordUser.username,
        discord_avatar: avatarUrl,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      // Sync roles: delete old, insert new
      await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
      if (appRoles.length > 0) {
        await supabaseAdmin.from('user_roles').insert(
          appRoles.map((role: string) => ({ user_id: userId, role }))
        );
      }

      // Generate session for the user
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });
      if (sessionError) throw sessionError;

      const accessToken = sessionData.session.access_token;
      const refreshToken = sessionData.session.refresh_token;

      // Redirect to frontend with tokens
      const redirectUrl = new URL(frontendRedirect || '/');
      redirectUrl.hash = `access_token=${accessToken}&refresh_token=${refreshToken}&type=discord`;

      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      });

    } catch (error) {
      console.error('Discord auth error:', error);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Step 3: Resync current user's Discord roles
  if (action === 'sync_roles') {
    try {
      const authHeader = req.headers.get('Authorization') || '';
      const token = authHeader.replace('Bearer ', '');
      if (!token) throw new Error('Missing authorization token');

      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (userError || !userData.user) throw new Error('Invalid session');

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('discord_id')
        .eq('id', userData.user.id)
        .maybeSingle();
      if (profileError || !profile?.discord_id) throw new Error('Discord profile not found');

      const memberRes = await fetch(
        `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${profile.discord_id}`,
        { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
      );

      const member = memberRes.ok ? await memberRes.json() : null;
      const appRoles = [...new Set(
        ((member?.roles || []) as string[])
          .filter((r: string) => ROLE_MAP[r])
          .map((r: string) => ROLE_MAP[r])
      )];

      await supabaseAdmin.from('user_roles').delete().eq('user_id', userData.user.id);
      if (memberRes.ok && appRoles.length > 0) {
        await supabaseAdmin.from('user_roles').insert(
          appRoles.map((role: string) => ({ user_id: userData.user.id, role }))
        );
      }

      return new Response(JSON.stringify({ roles: appRoles }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Discord role sync error:', error);
      return new Response(JSON.stringify({ error: 'Role sync failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
