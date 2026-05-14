import { useAuth } from '@/hooks/useAuth';
import { Navigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

export default function Login() {
  const { session, loading, signInWithDiscord } = useAuth();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card p-8 w-full max-w-sm mx-4 text-center"
      >
        <img src={logo} alt="Pôle Légal" className="w-16 h-16 mx-auto mb-4 rounded-xl" />
        <h1 className="text-lg font-semibold text-foreground mb-1">Pôle Légal</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Connectez-vous avec Discord pour accéder au dashboard
        </p>

        {error === 'not_in_guild' && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            Vous devez être membre du serveur Discord pour accéder à l'application.
          </div>
        )}
        {error === 'no_role' && (
          <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm text-warning">
            Aucun rôle Staff n'est associé à votre compte Discord.
          </div>
        )}

        <button
          onClick={signInWithDiscord}
          className="w-full px-4 py-3 text-sm font-medium text-white bg-[#5865F2] rounded-lg transition-colors hover:bg-[#4752C4] btn-press flex items-center justify-center gap-3"
        >
          <svg width="20" height="15" viewBox="0 0 71 55" fill="currentColor">
            <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.4 37.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.8 58.8 0 0017.7 9 .2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.6.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4c-1.8 1-3.6 1.9-5.5 2.6a.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1 58.6 58.6 0 0017.7-9v-.1c1.4-15-2.3-28.4-9.8-40.1a.2.2 0 00-.1-.1zM23.7 37.3c-3.5 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7zm23.3 0c-3.5 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7z" />
          </svg>
          Se connecter avec Discord
        </button>
      </motion.div>
    </div>
  );
}
