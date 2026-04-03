# 4QA - BDD Test Management Platform

## Overview
4QA is a Behavior-Driven Development (BDD) test management platform that lets QA teams create, organize, and track test scenarios in Gherkin format. It supports a multi-product hierarchy: Company → Product → Sprint/Suite/Scenario.

## Architecture
- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **Auth**: Supabase Auth (email/password with admin approval flow)
- **State/Storage**: React Query + Supabase (all data), localStorage (session persistence)
- **Data**: All data persisted in Supabase

## Data Model (Company → Product → Sprint/Suite/Scenario)
```
Company
  └── Product (has api_key, used for CI integration)
        ├── Sprint
        ├── TestSuite
        └── Scenario
```
API keys live on **Products**, not Companies. One company can have many products (e.g., one per application under test).

## Key Files
- `src/App.tsx` — Root with React Query, router, and providers
- `src/pages/Index.tsx` — Main app shell with sidebar navigation
- `src/pages/Auth.tsx` — Login/signup/forgot password (Supabase auth)
- `src/components/auth/ProtectedRoute.tsx` — Auth guard with admin approval check
- `src/hooks/useBddStore.ts` — All app data state via Supabase (React Query); includes products CRUD
- `src/hooks/useUserRole.ts` — Checks if current user is admin via Supabase user_roles table
- `src/integrations/supabase/client.ts` — Supabase client (uses VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY)
- `src/types/bdd.ts` — TypeScript types: Company, Product, Sprint, TestSuite, Scenario, etc.
- `src/views/` — Feature views: Dashboard, Companies (with product management), Scenarios, Sprints, Settings, Admin
- `src/integrations/supabase/types.ts` — Auto-generated Supabase DB types (includes products table)
- `supabase/migrations/` — Database migration SQL files for Supabase
- `supabase/functions/cypress-sync/` — Edge function for CI sync (looks up product by api_key)
- `supabase/functions/cypress-results/` — Edge function for CI results (looks up product by api_key)
- `scripts/qa4-sync.js` — Node.js CI sync script (reads QA4_COMPANIES JSON secret)
- `scripts/qa4-reporter.js` — Legacy reporter (deprecated; after:spec in cypress.config.js handles reporting now)

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
- All app data (companies, products, sprints, scenarios, suites, team members, test runs)
- Cypress CI integration via Edge Functions (cypress-sync, cypress-results)

Admin email: douglascarbonell@outlook.com (auto-approved and assigned admin role on signup)

Migrations to apply in Supabase dashboard:
- `supabase/migrations/20260403032914_add_products.sql`
- `supabase/migrations/20260403070000_add_evidence.sql` — adds `evidence_urls text[]` to `test_runs` + creates `evidence` storage bucket

## Cypress CI Integration
- **Sync endpoint**: `https://{project_id}.supabase.co/functions/v1/cypress-sync?api_key={product_api_key}`
- **Results endpoint**: `https://{project_id}.supabase.co/functions/v1/cypress-results?api_key={product_api_key}`
- API keys are on **Products** (auto-generated UUID), not Companies
- CI uses a single `QA4_COMPANIES` JSON secret: `{ "product-folder-name": "product-api-key" }`
- Script `scripts/qa4-sync.js` detects product by Cypress spec folder path automatically
- Settings view shows the `QA4_COMPANIES` JSON ready to copy
- **Evidence**: `cypress.config.js` `after:spec` hook uploads screenshots to Supabase Storage (`evidence` bucket) and sends URLs with results. Requires `SUPABASE_ANON_KEY` as a GitHub secret. No separate reporter file needed.
- ScenarioCard shows evidence thumbnails in run history with a lightbox on click
