# Pre-Ship Certainty

Run: `npm run dev` then `npm run test:pre-ship`

## What we can prove (automated)

| Check | Meaning |
|-------|---------|
| Balance credits on impression | Valid token + not idle → `profile.balance` increases |
| Ledger block written | `AD_IMPRESSION` row with `amount > 0` |
| Invalid token blocked | No credit without daily HMAC |
| Click credits | `POST /api/atomic/report-click` increases balance |
| Payout zeros balance | Simulated escrow when balance > $1 |
| Provider creatives safe | All fixtures pass `isValidAdItem` |
| Telemetry dedup | Same `event_id` dropped (anti-inflation) |

## What we cannot prove yet

| Gap | Risk | Before live money |
|-----|------|-------------------|
| Stripe payout is simulated | Users see $0 in bank | Wire real Stripe Connect |
| Extension was on `:5176` (fixed → `:3000`) | Users saw ads, no pay | Ship fixed extension |
| Idle (90s AFK) skips credit | Fair but confusing | Document in UI |
| No outbound HTTP without env | Audit-only mode | Set `CARBON_IMPRESSION_URL` after Carbon approval |
| Fixture ads when no API key | Serving non-contract creatives | Set `CATBOX_LIVE_CPM=1` + Carbon zone |

## Ship verdict

**MVP/demo:** PASS after `test:pre-ship` green + extension recompile.  
**Real payouts:** NOT READY until Stripe Connect + provider contracts.
