export type Pole = 'Restauration' | 'Production' | 'Utilitaire' | 'Justice' | 'Évènementiel' | 'EMS' | 'Police';

export const POLES: Pole[] = ['Restauration', 'Production', 'Utilitaire', 'Justice', 'Évènementiel', 'EMS', 'Police'];

export interface Business {
  id: string;
  name: string;
  pole: Pole;
  image?: string;
  sortOrder: number;
}

export interface Report {
  id: string;
  businessId: string;
  businessName: string;
  weekStart: string; // ISO date (Monday)
  hoursPatron: number;
  hoursCoPatron: number;
  hoursEm: number[]; // EM hours for Police businesses
  staffCount: number;
  balanceBefore: number;
  balanceAfter: number;
  notes: string;
  status: 'draft' | 'completed';
  createdBy: string;
  createdAt: string;
}

export interface PoleStatus {
  pole: Pole;
  total: number;
  completed: number;
}

// Initial demo data
export const INITIAL_BUSINESSES: Business[] = [
  { id: '1', name: 'Burgershot', pole: 'Restauration', sortOrder: 0 },
  { id: '2', name: 'UwU Cafe', pole: 'Restauration', sortOrder: 1 },
  { id: '3', name: 'Pizza Stack', pole: 'Restauration', sortOrder: 2 },
  { id: '4', name: 'Taco Bomb', pole: 'Restauration', sortOrder: 3 },
  { id: '5', name: 'Bean Machine', pole: 'Restauration', sortOrder: 4 },
  { id: '6', name: 'Los Santos Customs', pole: 'Production', sortOrder: 0 },
  { id: '7', name: 'Dynasty 8', pole: 'Production', sortOrder: 1 },
  { id: '8', name: 'Maze Bank', pole: 'Production', sortOrder: 2 },
  { id: '9', name: 'Weazel News', pole: 'Utilitaire', sortOrder: 0 },
  { id: '10', name: 'LS Medical', pole: 'Utilitaire', sortOrder: 1 },
  { id: '11', name: 'Tribunal de LS', pole: 'Justice', sortOrder: 0 },
  { id: '12', name: 'Cabinet Goldberg', pole: 'Justice', sortOrder: 1 },
  { id: '13', name: 'Galaxy Events', pole: 'Évènementiel', sortOrder: 0 },
  { id: '14', name: 'Vinewood Productions', pole: 'Évènementiel', sortOrder: 1 },
];

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  return `Semaine du ${weekStart.toLocaleDateString('fr-FR', opts)} au ${weekEnd.toLocaleDateString('fr-FR', opts)}`;
}

export function getWeekId(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
