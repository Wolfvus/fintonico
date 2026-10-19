# Fintonico

Personal finance web app for tracking income, expenses, accounts, and net worth with multi-currency support.

## Tech Stack

- React + TypeScript + Vite
- Express (TypeScript)
- Supabase
- Zustand

## What It Does

- Tracks income and expenses by period and category
- Manages assets and liabilities for net worth tracking
- Supports multiple currencies and conversion workflows
- Includes admin tooling and reporting features

## Local Setup

```bash
pnpm install --frozen-lockfile
pnpm run dev:all
```

Frontend: `http://localhost:5173`

## Scripts

- `pnpm run dev`: frontend
- `pnpm run dev:server`: backend
- `pnpm run dev:all`: frontend + backend
- `pnpm run build`: production build
- `pnpm run test`: test suite

## Project Notes

Historical planning and audit notes were moved to [`docs/project-history`](docs/project-history).

## Status

Active project, originally started as a rapid prototyping build and now being cleaned up for maintainability.

Dependency maintenance uses Node 24 and pnpm 12.9.1. SheetJS CE 0.20.3 is pinned to the [official vendor artifact](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/) because the registry release is outdated.
