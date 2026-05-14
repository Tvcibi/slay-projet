import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import type { Pole } from '@/lib/types';

interface Profile {
  discordId: string;
  discordUsername: string;
  discordAvatar: string | null;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: string[];
  poles: Pole[];
  isAdmin: boolean;
  loading: boolean;
  signInWithDiscord: () => void;
  syncDiscordRoles: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const ROLE_TO_POLE: Record<string, Pole> = {
  restauration: 'Restauration',
  production: 'Production',
  utilitaire: 'Utilitaire',
  justice: 'Justice',
  evenementiel: 'Évènementiel',
  ems: 'EMS',
  police: 'Police',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndRoles = async (userId: string) => {
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);

    if (profileRes.data) {
      setProfile({
        discordId: profileRes.data.discord_id,
        discordUsername: profileRes.data.discord_username,
        discordAvatar: profileRes.data.discord_avatar,
      });
    }

    if (rolesRes.data) {
      setRoles(rolesRes.data.map((r: { role: string }) => r.role));
    }
  };

  const syncDiscordRoles = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token || !session.user) return;

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    await fetch(`https://${projectId}.supabase.co/functions/v1/discord-auth?action=sync_roles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    await fetchProfileAndRoles(session.user.id);
  };

  useEffect(() => {
    // Handle Discord callback tokens in hash
    const hash = window.location.hash;
    if (hash.includes('access_token') && hash.includes('type=discord')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(() => {
            // Clean URL
            window.history.replaceState(null, '', window.location.pathname);
          });
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        // Only hit Discord on actual sign-in, not on every token refresh
        if (event === 'SIGNED_IN') {
          setTimeout(() => syncDiscordRoles(), 0);
        } else {
          setTimeout(() => fetchProfileAndRoles(session.user.id), 0);
        }
      } else {
        setProfile(null);
        setRoles([]);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // Just load existing roles from DB; don't hit Discord every page load
        fetchProfileAndRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithDiscord = () => {
    const redirectUri = encodeURIComponent(window.location.origin);
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    window.location.href = `https://${projectId}.supabase.co/functions/v1/discord-auth?action=login&redirect_uri=${redirectUri}`;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const poles = roles
    .filter(r => ROLE_TO_POLE[r])
    .map(r => ROLE_TO_POLE[r]);

  const isAdmin = roles.includes('admin');

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      roles,
      poles: isAdmin ? (Object.keys(ROLE_TO_POLE).map((role) => ROLE_TO_POLE[role]) as Pole[]) : poles,
      isAdmin,
      loading,
      signInWithDiscord,
      syncDiscordRoles,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
