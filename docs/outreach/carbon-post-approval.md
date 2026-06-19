# Carbon — Post-Approval Wiring

Run **only after** Carbon emails zone ID + reporting endpoints.

## 1. Set environment

Create or update `.env` (do not commit secrets):

```env
CATBOX_LIVE_CPM=1
CARBON_CLI_ZONE_ID=<from Carbon>
CARBON_CLI_MANIFEST_URL=<from Carbon, if provided>
CARBON_IMPRESSION_URL=<from Carbon — use {zone} {creativeId} {campaignId} placeholders if templated>
CARBON_CLICK_URL=<from Carbon>
```

Remove `CATBOX_REPORT_DRY_RUN` if set — outbound HTTP should fire.

## 2. Restart stack

```bash
npm run compile:extension
npm run dev
```

Extension Development Host: remove `mock=1` behavior in production builds (`ExtensionMode.Development` only uses mock).

## 3. Verify live fill

```bash
npm run test:pre-ship
npm run test:pre-ship:carbon
```

- No `[Catbox Security Manifest] ... 404` for Carbon when zone is valid
- Status bar shows Carbon creative (not Aurum mock, not ExampleDevTool fixture)
- `data/provider-reports.jsonl` shows `dryRun: false` when URLs configured

## 4. Checklist

- [ ] `CATBOX_LIVE_CPM=1` — fixtures blocked for Carbon adapter
- [ ] `CARBON_CLI_ZONE_ID` set
- [ ] Impression URL tested (one manual stream + check audit log)
- [ ] Click URL tested (click status bar ad + check audit log)
- [ ] No Sentry/Linear/example brands served without Carbon fill

## 5. Rollback

If fill breaks, unset `CATBOX_LIVE_CPM` and restart — demo/fixture mode returns (dev only).
