# 4QA - BDD Test Management Platform

## Overview
4QA is a Behavior-Driven Development (BDD) test management platform that lets QA teams create, organize, and track test scenarios in Gherkin format. It supports companies, sprints, test suites, team members, and Cypress CI integration.

## Architecture
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **Auth**: Supabase Auth (email/password with admin approval flow)
- **State/Storage**: React Query + Supabase (all data), localStorage (session persistence)
- **Data**: All data (companies, sprints, scenarios, suites, profiles, roles) persisted in Supabase

## Key Files
- `src/App.tsx` — Root with React Query, router, and providers
- `src/pages/Index.tsx` — Main app shell with sidebar navigation
- `src/pages/Auth.tsx` — Login/signup/forgot password (Supabase auth)
- `src/components/auth/ProtectedRoute.tsx` — Auth guard with admin approval check
- `src/hooks/useBddStore.ts` — All app data state via Supabase (React Query)
- `src/hooks/useUserRole.ts` — Checks if current user is admin via Supabase user_roles table
- `src/integrations/supabase/client.ts` — Supabase client (uses VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY)
- `src/views/` — Feature views: Dashboard, Companies, Scenarios, Sprints, Settings, Admin
- `src/types/bdd.ts` — TypeScript types for all domain objects
- `supabase/migrations/` — Database migration SQL files for Supabase
- `supabase/functions/` — Edge functions for Cypress CI sync and results reporting

## Environment Variables (Replit Secrets)
All managed via Replit's environment variable system (no .env file needed):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
- `VITE_SUPABASE_PROJECT_ID` — Supabase project ID (used for settings endpoint URLs)

## Development
```
npm run dev     # Start dev server on port 5000
npm run build   # Production build
```

## Supabase Setup
The app uses a Supabase project (ID: ivmdgybacqbkpyamtjrd) for:
- User authentication (email/password)
- User profiles with admin approval flow
- Role-based access control (admin vs user)
- All app data (companies, sprints, scenarios, suites, team members, test runs)
- Cypress CI integration via Edge Functions (cypress-sync, cypress-results)

Admin email: douglascarbonell@outlook.com (auto-approved and assigned admin role on signup)

## Cypress CI Integration
- **Sync endpoint**: `https://{project_id}.supabase.co/functions/v1/cypress-sync?api_key={key}`
- **Results endpoint**: `https://{project_id}.supabase.co/functions/v1/cypress-results?api_key={key}`
- Company API keys are auto-generated (UUID) and displayed in Settings view
