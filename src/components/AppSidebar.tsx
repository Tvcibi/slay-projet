import { LayoutDashboard, Utensils, Factory, Wrench, Scale, PartyPopper, History, LogOut, ScrollText, Trophy, Map, HeartPulse, Shield, BarChart3, Menu, X, Sun, Moon, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Pole } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import logo from '@/assets/logo.png';
import { UserStatsModal } from './UserStatsModal';

interface AppSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
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

export function AppSidebar({ currentView, onNavigate }: AppSidebarProps) {
  const { profile, poles, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // Close sidebar on navigation (mobile)
  const handleNav = (view: string) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logo} alt="FlashWorld Légal" className="h-9 w-9 rounded-full object-cover" />
          <div>
            <h1 className="text-sm font-semibold text-foreground">FlashWorld</h1>
            <p className="text-xs text-muted-foreground">Légal</p>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {isAdmin && (
          <button
            onClick={() => handleNav('dashboard')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors btn-press',
              currentView === 'dashboard'
                ? 'bg-sidebar-accent text-foreground'
                : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50'
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
        )}

        <div className="pt-3 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3">Pôles</p>
        </div>

        {poles.map((pole) => {
          const Icon = poleIcons[pole];
          const viewId = `pole-${pole}`;
          const isActive = currentView === viewId;

          return (
            <button
              key={pole}
              onClick={() => handleNav(viewId)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors btn-press',
                isActive
                  ? 'bg-sidebar-accent text-foreground'
                  : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <Icon className="w-4 h-4" />
              {pole}
            </button>
          );
        })}

        {isAdmin && (
          <div className="pt-3 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3">Référent Légal</p>
          </div>
        )}

        {isAdmin && (
          <button
            onClick={() => handleNav('events')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors btn-press',
              currentView === 'events'
                ? 'bg-sidebar-accent text-foreground'
                : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50'
            )}
          >
            <Trophy className="w-4 h-4" />
            Suivis Course
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => handleNav('map-editor')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors btn-press',
              currentView === 'map-editor'
                ? 'bg-sidebar-accent text-foreground'
                : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50'
            )}
          >
            <Map className="w-4 h-4" />
            Planning
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => handleNav('stats')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors btn-press',
              currentView === 'stats'
                ? 'bg-sidebar-accent text-foreground'
                : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50'
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Stats
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => handleNav('logs')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors btn-press',
              currentView === 'logs'
                ? 'bg-sidebar-accent text-foreground'
                : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50'
            )}
          >
            <ScrollText className="w-4 h-4" />
            Logs
          </button>
        )}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setStatsOpen(true); setMobileOpen(false); }}
            className="flex items-center gap-3 flex-1 min-w-0 rounded-lg p-1.5 -m-1.5 hover:bg-sidebar-accent/50 transition-colors cursor-pointer"
          >
            {profile?.discordAvatar ? (
              <img src={profile.discordAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                {profile?.discordUsername?.slice(0, 2).toUpperCase() ?? '??'}
              </div>
            )}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-foreground truncate">{profile?.discordUsername ?? 'Chargement...'}</p>
              <p className="text-xs text-muted-foreground">{isAdmin ? 'Admin' : poles.join(', ')}</p>
            </div>
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={signOut}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <UserStatsModal open={statsOpen} onClose={() => setStatsOpen(false)} />
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4 z-40 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <img src={logo} alt="FlashWorld Légal" className="h-7 w-7 rounded-full object-cover" />
          <span className="text-sm font-semibold text-foreground">FlashWorld</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - desktop: fixed left, mobile: slide-out drawer */}
      <aside
        className={cn(
          'fixed top-0 h-screen w-60 bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-transform duration-300',
          // Desktop: always visible
          'lg:left-0 lg:translate-x-0',
          // Mobile: slide from left
          mobileOpen ? 'left-0 translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
