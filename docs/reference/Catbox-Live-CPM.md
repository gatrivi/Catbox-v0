# Catbox Live CPM — single entry point

**Goal:** Carbon Ads CLI approval + outbound impression/click reporting. Stripe deferred.

## Done checklist

- [ ] Carbon application submitted → [carbon-safe-submission.md](../outreach/carbon-safe-submission.md)
- [ ] Post-approval wiring → [carbon-post-approval.md](../outreach/carbon-post-approval.md)
- [ ] `CATBOX_LIVE_CPM=1` set in production (blocks fixture ads)
- [ ] `CARBON_CLI_ZONE_ID` or `CARBON_CLI_MANIFEST_URL` from Carbon
- [ ] `data/provider-reports.jsonl` grows on each billed impression/click
- [ ] `npm run test:pre-ship` green

## Env vars

| Variable | Purpose |
|----------|---------|
| `CATBOX_LIVE_CPM=1` | No fixture fallbacks for Carbon; live fill only |
| `CARBON_CLI_ZONE_ID` | Carbon publisher zone (post-approval) |
| `CARBON_CLI_MANIFEST_URL` | Override manifest URL |
| `CARBON_IMPRESSION_URL` | Outbound impression pixel/API template (`{zone}`, `{creativeId}`, `{campaignId}`) |
| `CARBON_CLICK_URL` | Outbound click reporting URL |
| `CATBOX_REPORT_DRY_RUN=1` | Audit log only; no HTTP to providers |
| `BSA_IMPRESSION_PIXEL` | BuySellAds pixel (future) |
| `PAVED_API_KEY` | Paved callback auth (future) |

## Key files

| File | Role |
|------|------|
| [src/server/providers/reporting.ts](../src/server/providers/reporting.ts) | Audit log + dispatch |
| [src/server/providers/reporting/carbon.ts](../src/server/providers/reporting/carbon.ts) | Carbon outbound |
| [src/server/providers/carbon.ts](../src/server/providers/carbon.ts) | Inbound creatives |
| [server.ts](../server.ts) | `GET /api/atomic/stream`, `POST /api/atomic/report-click` |
| [src/extension/index.ts](../src/extension/index.ts) | Status bar + opt-in visual panel (`catbox.visualAd.enabled`) |
| [docs/outreach/carbon-classic-pitch.md](../outreach/carbon-classic-pitch.md) | Visual 260×200 resubmission copy |
| [docs/reference/pre-ship-certainty.md](pre-ship-certainty.md) | Payout tests |
| [docs/outreach/](../outreach/) | Application copy |

## Test

```bash
npm run dev
npm run test:pre-ship           # internal QA
npm run test:pre-ship:carbon    # publisher-safe summary for Carbon screenshots
```

## Reporting flow

Impression/click on `:3000` → `reportProviderEvent()` → `data/provider-reports.jsonl` → optional HTTP to Carbon.

Skip reporting: idle, invalid token, fallback/house ads, duplicate `eventId`.
