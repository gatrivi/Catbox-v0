## Catbox Architecture (current repo state)

## Versions
- Web UI: `package.json` version `0.0.0`
- Atomic engine: `CatboxAtomicEngine` reports `version: "1.2.0-atomic"` in `/` on the atomic port
- VS Code extension: `vscode-extension/package.json` version `1.3.0`
- VS Code extension (alternate): `src/extension/package.json` version `1.2.0`

## High-level components
- Web UI (React): single-page hash router (`#/dashboard`, `#/cli`, `#/ledger`, `#/privacy`)
  - Entry: `src/main.tsx` -> `src/App.tsx`
- Primary backend (Express):
  - Entry: `server.ts`
  - Stores ledger/providers/profiles under `./data/*` (JSON files) with optional DB fallbacks
- Telemetry storage layer:
  - `src/server/telemetryDb.ts`
  - Optional PostgreSQL (`DATABASE_URL`) and Redis (`REDIS_URL`), otherwise JSON/in-memory fallbacks
- Ad creative security validation:
  - `src/server/manifestEngine.ts` (`fetchSecureManifest`, `isValidAdItem`)
- Atomic engine (separate HTTP service for IDE integration):
  - Entry: `src/utils/atomicEngine.ts` -> `startIsolatedServer(5176)`
  - Provides ad stream to the VS Code extension
- VS Code extensions:
  - Minimal status bar ad streamer: `src/extension/index.ts`
  - Shimmer/toggle/revert + Claude settings injection: `vscode-extension/extension.ts`

## Data flows

```mermaid
flowchart LR
  BrowserUI[React UI (App.tsx)] -->|"fetch() to Express endpoints"| ExpressAPI[Express server.ts]
  BrowserUI -->|"hash routes: /dashboard /cli /ledger /privacy"| BrowserUI

  ExpressAPI --> LedgerStore[Ledger/Providers/Profiles store (./data/*.json)]
  ExpressAPI --> TelemetryStore[Telemetry store (telemetryDb.ts)]
  ExpressAPI --> Gemini[Gemini CLI endpoint]

  VSCodeExt[VS Code Extension] -->|"GET /api/atomic/stream?token=... "| AtomicEngine[CatboxAtomicEngine]
  VSCodeExt -->|"POST /api/atomic/report-click"| AtomicEngine
  AtomicEngine --> AdSelection[Select creatives (hardcoded fallbacks + prioritization)]
```

## Web UI routing and what it calls
`src/App.tsx` implements a hash-driven client route:
- `#/dashboard` -> “Provider Dashboard”
- `#/cli` -> “Interactive CLI” (Gemini-backed)
- `#/ledger` -> ledger + escrow payout UX
- `#/privacy` -> privacy/compliance copy and endpoint

Representative API calls from `src/App.tsx`:
- Telemetry stats/touch:
  - `POST /api/telemetry`
  - `GET /api/telemetry/stats`
  - `POST /api/telemetry/touch`
- Ledger:
  - `GET /api/ledger`
  - `POST /api/ledger/payout`
  - `POST /api/ledger/reset`
- Providers/admin:
  - `GET /api/providers`
  - `POST /api/providers/register`
  - `POST /api/developer/preferred-split`
  - `POST /api/developer/affiliate-links`
  - `POST /api/developer/omit-tips`
  - `POST /api/developer/boost`
  - `POST /api/developer/simulate-decay`
- Gemini CLI:
  - `POST /api/gemini/cli`
- Escrow credentials crypto helpers:
  - `POST /api/credentials/encrypt`
  - `POST /api/credentials/decrypt`

Atomic/IDE integration UX:
- UI exposes “copy endpoint” style instructions for the IDE-side integration (the atomic port is `5176`).

## Express backend (server.ts)

Core responsibilities:
- Initialize local stores under `./data/` (ledger/providers/profiles)
- Provide REST endpoints listed below (exact paths as registered in `server.ts`):
  - `GET /api/ledger`
  - `POST /api/ledger/reset`
  - `POST /api/providers/register`
  - `GET /api/providers`
  - `POST /api/developer/preferred-split`
  - `POST /api/ad/fetch`
  - `POST /api/gemini/cli`
  - `POST /api/credentials/encrypt`
  - `POST /api/credentials/decrypt`
  - `POST /api/ledger/payout`
  - `GET /api/developer/:id`
  - `POST /api/developer/affiliate-links`
  - `POST /api/developer/omit-tips`
  - `POST /api/developer/boost`
  - `POST /api/developer/simulate-decay`
  - `GET /api/self-serve/promos`
  - `POST /api/self-serve/promo`
  - `POST /api/self-serve/promo/delete`
  - `POST /api/developer/simulate-installs`
  - `GET /api/privacy`
  - `POST /api/atomic/report-click`
  - `GET /api/atomic/stream`
  - `GET /api/termux/install`
  - `POST /api/telemetry`
  - `GET /api/telemetry/stats`
  - `POST /api/telemetry/touch`

Ledger + escrow payout:
- `POST /api/ledger/payout` reads `profile.balance`, blocks if `<= 1.0`, appends a block of type `ESCROW_PAYOUT`, and sets balance to `0.0`.
- Evidence: see `server.ts` route handler for `/api/ledger/payout`.

## Telemetry pipeline (telemetryClient + telemetryDb)
- Client queue:
  - `src/utils/telemetryClient.ts` implements an in-browser queue with:
    - localStorage persistence (`catbox_telemetry_queue`)
    - periodic flush (default `flushIntervalMs = 30000`)
    - unload/visibility flush (`flushSyncOnUnload`)
- Backend ingestion:
  - `POST /api/telemetry` (registered in `server.ts`) accepts batched events.
  - Deduplication:
    - `checkAndMarkDuplicate(event_id)` in `src/server/telemetryDb.ts` uses:
      - Redis SETNX-like behavior when configured, else
      - in-memory TTL Map fallback
  - Persistence:
    - writes into PostgreSQL when configured, else appends to `data/telemetry_fallback.json`.

## Ad creative security validation (manifestEngine)
- Remote manifest fetch uses `fetchSecureManifest(remoteUrl)`:
  - strict JSON shape verification (`id`, `text`, `link`, `hash`)
  - rejects strings containing patterns like `<script`, `eval(`, `process.`, `require(`, `spawn(`, `bash `, etc.
  - falls back to hardcoded safe creatives (`FALLBACK_MANIFEST`) on any error.
- Evidence: `src/server/manifestEngine.ts`.

## Atomic engine (CatboxAtomicEngine)
- Runs a separate isolated HTTP server on port `5176`:
  - `server.ts` creates it at startup:
    - `const atomicEngine = new CatboxAtomicEngine(() => store.cachedProfiles["my_account"]);`
    - `atomicEngine.startIsolatedServer(5176)`
- Endpoints implemented by this atomic engine:
  - `GET /api/atomic/stream`:
    - verifies a signed daily token using HMAC SHA-256 secret `catbox_daily_gold_secret`
    - selects a creative from hardcoded seed ads + optional tip suppression + optional profile link prioritization
    - returns `adMessage`, `creativeText`, and `targetUrl/link`
  - `POST /api/atomic/report-click`: acknowledges the click payload
  - `GET /api/atomic/metrics`: returns synthetic metrics

Token verification details:
- Atomic engine uses HMAC over date strings (`today`, `yesterday`, `tomorrow`) to allow brief clock skew.
- Evidence: see `/api/atomic/stream` handler in `src/utils/atomicEngine.ts`.

VS Code extension integration:
- `src/extension/index.ts` polls `http://127.0.0.1:5176/api/atomic/stream?token=...`
- It reports clicks back to `http://127.0.0.1:5176/api/atomic/report-click`.

