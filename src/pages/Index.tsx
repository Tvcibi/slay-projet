import { useState, useCallback, useEffect, useRef } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { supabase } from '@/integrations/supabase/client';
import { WeekSelector } from '@/components/WeekSelector';
import { PoleOverview } from '@/components/PoleOverview';
import { BusinessList } from '@/components/BusinessList';
import { ReportForm } from '@/components/ReportForm';
import { HistoryView } from '@/components/HistoryView';
import { LogsView } from '@/components/LogsView';
import { EventsView } from '@/components/EventsView';
import { MapEditor } from '@/components/MapEditor';
import { StatsView } from '@/components/StatsView';
import { SoireeTracker } from '@/components/SoireeTracker';
import { AddBusinessDialog } from '@/components/AddBusinessDialog';
import { type Pole, type Business, type Report, getWeekStart, getWeekId, formatWeekRange } from '@/lib/types';
import { fetchReports, fetchBusinesses, addBusiness, removeBusiness, renameBusiness, reorderBusinesses, updateBusinessImage } from '@/lib/store';
import { uploadBusinessLogo } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { isAdmin, poles: userPoles } = useAuth();
  const [view, setView] = useState('');
  const initialViewSet = useRef(false);

  // Set the correct initial view once roles are loaded
  useEffect(() => {
    if (initialViewSet.current) return;
    if (isAdmin) {
      setView('dashboard');
      initialViewSet.current = true;
    } else if (userPoles.length > 0) {
      setView(`pole-${userPoles[0]}`);
      initialViewSet.current = true;
    }
  }, [isAdmin, userPoles]);
  const [currentWeek, setCurrentWeek] = useState(() => {
    const prev = getWeekStart();
    prev.setDate(prev.getDate() - 7);
    return prev;
  });
  const [selectedBusiness, setSelectedBusiness] = useState<Business | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [dashboardPole, setDashboardPole] = useState<Pole | undefined>();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const weekId = getWeekId(currentWeek);

  const activePole: Pole | undefined = view.startsWith('pole-')
    ? (view.replace('pole-', '') as Pole)
    : undefined;

  const poleBusinesses = activePole
    ? businesses.filter(b => b.pole === activePole)
    : [];

  // Load data
  useEffect(() => {
    fetchBusinesses().then(setBusinesses).catch(console.error);
  }, [refreshKey]);

  useEffect(() => {
    fetchReports(weekId).then(setReports).catch(console.error);
  }, [weekId, refreshKey]);

  // Realtime: auto-refresh when other users insert/update reports
  useEffect(() => {
    const channel = supabase
      .channel('reports-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          const row = payload.new as any;
          // Only refresh if the change is for the current week
          if (row?.week_start === weekId) {
            fetchReports(weekId).then(setReports).catch(console.error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [weekId]);

  const handleSaved = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const handleNavigate = (v: string) => {
    setView(v);
    setSelectedBusiness(undefined);
    setDashboardPole(undefined);
  };

  const handleAddBusiness = async (name: string, pole: Pole, image?: string) => {
    await addBusiness(name, pole, image);
    setRefreshKey(k => k + 1);
  };

  const handleDeleteBusiness = async (biz: Business) => {
    await removeBusiness(biz.id);
    setRefreshKey(k => k + 1);
  };

  const handleEditBusiness = async (biz: Business, newName: string, newImageFile?: File) => {
    if (newName !== biz.name) {
      await renameBusiness(biz.id, newName);
    }
    if (newImageFile) {
      const url = await uploadBusinessLogo(newImageFile);
      await updateBusinessImage(biz.id, url);
    }
    setRefreshKey(k => k + 1);
  };

  const handleReorderBusinesses = async (reordered: Business[]) => {
    const updates = reordered.map((b, i) => ({ id: b.id, sortOrder: i }));
    setBusinesses(prev => {
      const otherPole = prev.filter(b => b.pole !== reordered[0]?.pole);
      return [...otherPole, ...reordered.map((b, i) => ({ ...b, sortOrder: i }))];
    });
    await reorderBusinesses(updates);
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar currentView={view} onNavigate={handleNavigate} />

      <main className="flex-1 lg:ml-60 pt-[4.5rem] lg:pt-8 pb-4 px-4 sm:pb-6 sm:px-6 lg:pb-8 lg:px-8">
        {view === 'map-editor' ? (
          <MapEditor />

        ) : view === 'stats' ? (
          <StatsView />

        ) : view === 'events' ? (
          <EventsView />

        ) : view === 'logs' ? (
          <LogsView />

        ) : view === 'history' ? (
          <HistoryView key={refreshKey} />

        ) : selectedBusiness ? (
          <ReportForm
            business={selectedBusiness}
            weekStart={currentWeek}
            onBack={() => setSelectedBusiness(undefined)}
            onSaved={handleSaved}
            readOnly={!activePole}
          />

        ) : activePole ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Pôle {activePole}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatWeekRange(currentWeek)}
                </p>
              </div>
              <WeekSelector currentWeek={currentWeek} onChange={setCurrentWeek} />
            </div>

            <BusinessList
              businesses={poleBusinesses}
              reports={reports}
              onSelect={setSelectedBusiness}
              onDelete={isAdmin ? handleDeleteBusiness : undefined}
              onEdit={isAdmin ? handleEditBusiness : undefined}
              onReorder={isAdmin ? handleReorderBusinesses : undefined}
            />

            {activePole === 'Évènementiel' && (
              <div>
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                  Suivis soirée
                </h2>
                <SoireeTracker businesses={poleBusinesses} weekStart={currentWeek} />
              </div>
            )}
          </div>

        ) : (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Dashboard - Vue d'ensemble
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatWeekRange(currentWeek)}
                </p>
              </div>
              <WeekSelector currentWeek={currentWeek} onChange={setCurrentWeek} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Statut des pôles</h2>
                {isAdmin && <AddBusinessDialog onAdd={handleAddBusiness} />}
              </div>
              <PoleOverview
                key={refreshKey}
                reports={reports}
                businesses={businesses}
                onSelectPole={(pole) => setDashboardPole(pole === dashboardPole ? undefined : pole)}
                selectedPole={dashboardPole}
              />
            </div>

            {dashboardPole && (
              <div>
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                  {dashboardPole} - Entreprises
                </h2>
                <BusinessList
                  businesses={businesses.filter(b => b.pole === dashboardPole)}
                  reports={reports}
                  onSelect={setSelectedBusiness}
                  onDelete={isAdmin ? handleDeleteBusiness : undefined}
                  onEdit={isAdmin ? handleEditBusiness : undefined}
                  onReorder={isAdmin ? handleReorderBusinesses : undefined}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
