# Repository Guidelines

## Project Structure & Module Organization
`src/` houses the React + TypeScript client, organised by concern: shared UI in `components/`, domain logic in `domain/`, hooks in `hooks/`, state in `stores/`, and pure helpers in `utils/`. Static assets live in `public/`. The Express bridge for supabase and other integrations sits in `server/index.ts`. Database migrations are tracked under `supabase/migrations/`, and Netlify function stubs belong in `netlify/functions/`.

## Build, Test, and Development Commands
Run `npm run dev` for the Vite client, `npm run dev:server` for the API, or `npm run dev:all` to launch both. `npm run build` performs a TypeScript project build followed by a production Vite compile; use `npm run build:prod` when you only need the Vite assets. `npm run preview` serves the compiled bundle locally, mirroring Netlify. `npm run lint` executes ESLint across the repo, and `npm run format` applies Prettier to the client source.

## Coding Style & Naming Conventions
Follow the Prettier profile in `.prettierrc` (2-space indentation, single quotes, trailing commas, 100-character width). Component files should use PascalCase (`PortfolioGrid.tsx`), hooks camelCase with a `use` prefix, and utility modules lowercase-hyphenated. Prefer function components with hooks, colocate Tailwind styles in component files, and keep server code TypeScript-first—convert any leftover CommonJS modules before merge.

## Testing Guidelines
An automated test runner is not yet wired. When introducing tests, add the chosen runner to `devDependencies`, place specs alongside the unit under test using a `*.test.ts(x)` suffix, and extend the npm scripts with `npm run test`. Until then, provide manual verification notes in your PR description and expose deterministic selectors for future integration tests.

## Commit & Pull Request Guidelines
Existing history favours short, Title-Case summaries (`Dashboard Logic Fixes`). Keep messages imperative and scoped to a single change. For PRs, include the problem statement, the solution outline, test evidence, UI screenshots when relevant, and references to Supabase migration IDs or Netlify configuration changes. Request review from a second agent for any change touching `server/` or `supabase/`.

## Environment & Deployment Notes
Copy `.env.example` to `.env` and fill in Supabase keys before running the server. Netlify uses `netlify.toml`; keep function entry points lean by avoiding heavy imports at the top level. Secrets live in Netlify environment variables—never commit them to the repo.
