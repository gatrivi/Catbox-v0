## Catbox Gap Report (current repo)

## “How far ahead in development is this?”

This repo has a working baseline for:
- UI shell + hash routing (`#/dashboard`, `#/cli`, `#/ledger`, `#/privacy`)
- Core backend primitives (ledger/providers/profiles stored under `./data/`, plus REST endpoints)
- Telemetry queueing + backend ingestion/dedup persistence (`src/utils/telemetryClient.ts`, `src/server/telemetryDb.ts`)
- Atomic engine service for IDE integration (separate HTTP service on port `5176`)
- Ad creative manifest security validation (`src/server/manifestEngine.ts`)

But the onboarding “Getting Started” checklist appears incomplete in the UI code:
- `src/App.tsx` defines `completedSteps` with 5 steps:
  - `step-concepts`: `true`
  - `step-sim`: `false`
  - `step-promo`: `false`
  - `step-escrow`: `false`
  - `step-vscode`: `false`
- `src/App.tsx` never references `completedSteps` anywhere else (so the checklist state is currently not rendered/used).

### Quantified progress (from `completedSteps`)
- Total onboarding steps defined: `5`
- Marked complete: `1` (`step-concepts`)
- Missing/unchecked: `4` (`step-sim`, `step-promo`, `step-escrow`, `step-vscode`)

## Missing steps (what’s likely not wired yet)

1. `step-sim` (simulation)
   - Evidence: defined in `src/App.tsx` but never used elsewhere.
2. `step-promo` (promotions / self-serve sponsor workflows)
   - Evidence: defined in `src/App.tsx` but never used elsewhere.
3. `step-escrow` (escrow withdrawal UX/checklist)
   - Evidence: defined in `src/App.tsx` but never used elsewhere.
4. `step-vscode` (IDE integration checklist)
   - Evidence: defined in `src/App.tsx` but never used elsewhere.

## Implementation gaps (code vs declared references)

### Missing atomic config endpoint
- `src/utils/atomicEngine.ts` advertises an endpoint in its `/` response:
  - `endpoints.configuration = "/api/atomic/config"`
- `Catbox-v0/server.ts` does not register any handler for `/api/atomic/config`
  - Verified by repo search: no `/api/atomic/config` matches in `server.ts`
- `src/utils/atomicEngine.ts` itself does not implement a `/api/atomic/config` route

Impact:
- Any UI/extension logic expecting `/api/atomic/config` will fail (or must be updated to use real existing endpoints like `/api/atomic/stream` and `/api/atomic/report-click`).

## MVP feature coverage evidence (tests)

`src/features.test.ts` includes test coverage for:
- UUID generation structure + uniqueness
- Ad manifest validation (`isValidAdItem`)
- Telemetry dedup (`checkAndMarkDuplicate`)
- Idle-state eligibility logic (as a pure boolean check)
- Earnings split computations (pure math)
- A small unit-level check for telemetry queue behavior

However, the tests do not assert:
- REST endpoint behavior for `/api/ledger`, `/api/telemetry`, `/api/ledger/payout`
- Atomic engine endpoint completeness (e.g. verifying absence/presence of `/api/atomic/config`)

