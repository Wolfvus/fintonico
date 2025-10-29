# Fintonico Roadmap (Local v0)

| Step | Description | Status | Notes |
| --- | --- | --- | --- |
| 1 | Domain Types & In-Memory Store | ✅ | Validated via `src/tests/types.test.ts` (Vitest run 2025‑02‑14). |
| 2 | Balancing & Currency Integrity | ✅ | `src/tests/balance.test.ts` passing ensures zero-sum and direction rules. |
| 3 | FX Snapshot Module | ✅ | `src/tests/fx.test.ts` confirms deterministic lookups and errors. |
| 4 | Entry Creation Service | ✅ | `src/tests/entries.create.test.ts` covers expense, transfer, and idempotency. |
| 5 | CSV Import Pipeline | ✅ | `src/tests/imports.test.ts` verifies insert/duplicate behaviour. |
| 6 | Rules Engine & Agent Stub | ✅ | `src/tests/rules.test.ts` confirms rule precedence and low-confidence handling. |
| 7 | Reconciliation Engine | ✅ | `src/tests/reconcile.test.ts` exercises auto/manual linking. |
| 8 | Cashflow Statement Accuracy | ✅ | Selector + dashboard wired; see `src/tests/cashflow.test.ts` (Vitest 2025‑02‑14 01:07 UTC). |
| 9 | Settings Modal & Currency Management | ✅ | Settings modal + store toggles (`src/tests/settings-modal.test.tsx`, `src/tests/currency-visibility.test.ts`). |
| 10 | Funding Mapping for Income/Expense | ✅ | Forms now source funding targets from `useAccountStore`; see `src/tests/funding-mapping.test.ts`. |
| 11 | Account Taxonomy & Month-End Close | ✅ | Month-end summary + metadata (`src/selectors/monthEnd.ts`, `src/tests/month-end.test.ts`, `src/tests/networth.test.ts`). |
| 12 | Reports API (Cashflow & Net Worth) | ☐ | Aggregate selectors into reusable reporting services. |
| 13 | Local HTTP Surface | ☐ | Optional Express/Fastify bridge with Supertest coverage. |
| 14 | Frontend Smoke Harness | ☐ | Optional UI harness exercising the HTTP endpoints. |
| 15 | Definition of Done Validation | ☐ | Confirm checklist items once Steps 10‑13 ship and tests + manual smoke pass. |
| 16 | Commands & Tooling Audit | ☐ | Ensure scripts/tooling documented in guide are present in `package.json`. |
| 17 | Gherkin Acceptance Reference | ☐ | Keep scenarios up to date with evolving behaviour/tests. |
| 18 | Next Phase Hooks (DB Ready) | ☐ | Prepare migration path from in-memory stores to Postgres/Supabase. |

**Latest test run:** `npm run test` (Vitest) ✔︎ on 2025‑10‑29 00:40 UTC. |
