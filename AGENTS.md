# Agent Briefing

## Current App Snapshot
- React 19 + TypeScript + Vite single-page personal finance dashboard with tabs for dashboard, income, expenses, assets, liabilities, and net worth.
- Zustand stores orchestrate a double-entry ledger (`src/stores/ledgerStore.ts`) that feeds every view; form submissions ultimately create ledger transactions.
- Tailwind CSS drives layout and spacing, supplemented by custom utility layers in `src/index.css` and shared style tokens under `src/styles`.
- Client persistence is local-only via `zustand/persist` and manual `localStorage` adapters; no production authentication or remote database is wired yet.

## Implemented Features
- **Authentication:** `useAuthStore` provides a mock email/password flow backed by `localStorage`; any syntactically valid email works.
- **Dashboard:** `src/components/Dashboard/Dashboard.tsx` renders KPIs, transaction views, savings insights, pagination, and allows switching reporting windows (month/year/custom).
- **Income & Expenses:** `IncomeForm` and `ExpenseForm` use React Hook Form + Zod validation. Data is derived from ledger postings so deletes cascade to the ledger.
- **Accounts & Net Worth:** Asset/liability management via `useAccountStore`, with summaries in `AccountsPage`, `AssetsPage`, and `LiabilitiesPage`. Net worth snapshots persist through `useSnapshotStore`.
- **Currency & FX:** `useCurrencyStore` manages the base currency, formats via `Money`, fetches exchange rates from the public Fawazahmed0 API, and falls back to hard-coded rates when offline.
- **Recurring Entries:** `checkAndGenerateRecurring` seeds monthly recurring income/expense instances and investment yields are handled by `generateInvestmentYields`.
- **Error Handling:** Key screens are wrapped in `ErrorBoundary` to guard against selector/store failures.

## Data, Domain & State Layers
- Domain logic under `src/domain` implements money arithmetic, ledger posting helpers, FX tables, and custom errors.
- Selectors in `src/selectors/finance` project ledger data into derived metrics (P&L, expense breakdowns, savings potential, MoM change).
- Stores in `src/stores` are colocated by concern (auth, accounts, ledger, currency, income, expense, theme, snapshots) and share a `Money`-first API for precision.
- Helpers in `src/utils` cover sanitisation, recurring logic, and formatting.

## Integrations & Back-End Surface
- `server/index.ts` exposes an Express stub with `/api/health` and `/api/categorize`, relying on Supabase keys plus a keyword-based classifier; Supabase writes require `SUPABASE_SERVICE_KEY`.
- Supabase migrations currently define a single `expenses` table with RLS policies (`supabase/migrations/001_initial_schema.sql`); other entities are not modelled yet.
- Netlify function `netlify/functions/categorize.ts` calls OpenAI's Chat Completions API to label expenses and omits Supabase writes by design.
- No outbound email, notifications, or file storage are implemented. Any API usage requires the relevant environment variables to be set locally.

## Tooling & Quality
- npm scripts: `npm run dev` (client), `npm run dev:server` (Express), `npm run dev:all`, `npm run build`, `npm run build:prod`, `npm run preview`, `npm run lint`, `npm run format`, and `npm run test` / `npm run test:watch` (Vitest).
- Vitest suites live under `src/tests` for ledger, FX, and reconciliation behaviours; UI has no automated coverage.
- ESLint + Prettier enforce the two-space, single-quote, 100-character Prettier profile and React/TypeScript best practices.

## Known Gaps & Follow-Ups
- Auth and data persistence are mock/local only; wiring Supabase for auth and ledger storage is an open task.
- Currency fetching depends on a public CDN and will fail without network access; the fallback rates are approximate.
- Recurring transaction generation mutates `localStorage` directly and assumes monthly cadence; there is no UI to manage templates.
- Snapshot and ledger data are not synced to Supabase, so dashboards reset per browser.
- Netlify/OpenAI integration is unauthenticated in local dev—ensure `.env` values (`OPENAI_API_KEY`, Supabase keys) are provided before exercising categorisation flows.
