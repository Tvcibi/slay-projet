Staff Légal GTA RP management app - dark obsidian theme, Inter font, violet primary

## Design System
- Background: hsl(240 10% 3.9%), Surface: hsl(240 10% 6%)
- Primary (violet): hsl(263.4 70% 50.4%)
- Success: hsl(142.1 70.6% 45.3%), Warning: hsl(38 92% 50%)
- Border: hsl(240 5.9% 15%), Muted: hsl(240 5% 64.9%)
- Font: Inter, tabular-nums for financial data
- Cards: surface-card utility class with top border highlight
- Inputs: input-field utility class with white/5 bg
- Buttons: btn-press for active:scale-0.98

## Architecture
- 7 Poles: Restauration, Production, Utilitaire, Justice, Évènementiel, EMS, Police
- Weekly reports (Mon-Mon) with financial diff feature
- Backend: Lovable Cloud - tables: businesses, reports, profiles, user_roles
- Storage: business-logos bucket for company logos

## Auth (Discord OAuth2 custom flow)
- Edge function: discord-auth (login redirect + callback)
- Creates Supabase user with email pattern: {discord_id}@discord.user
- Bot token checks guild membership + roles
- Role mapping (Discord role ID → app_role):
  - Admin: 1144275966286364716, 1392560064765755462
  - Restauration: 1054383850819682344
  - Production: 1054383850853257218
  - Utilitaire: 1054383850819682343
  - Evenementiel: 1054383850853257216
  - Justice: 1054383850853257217
  - EMS: 1054383850853257220
  - Police: 1054383850853257219
- Admins see all poles + dashboard + can add/delete businesses
- Non-admins only see their assigned poles
- RLS: has_role() security definer function, pole-based report access
