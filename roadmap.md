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
| 8 | Cashflow Statement Accuracy | ☐ | Build selector + tests to replace dashboard cashflow math. |
| 9 | Settings Modal & Currency Management | ☐ | Persist currency visibility toggles and general preferences. |
| 10 | Reports API (Cashflow & Net Worth) | ☐ | Aggregate selectors into reusable reporting services. |
| 11 | Local HTTP Surface | ☐ | Optional Express/Fastify bridge with Supertest coverage. |
| 12 | Frontend Smoke Harness | ☐ | Optional UI harness exercising the HTTP endpoints. |

**Latest test run:** `npm run test` (Vitest) ✔︎ on 2025‑02‑14 00:54 UTC. |
