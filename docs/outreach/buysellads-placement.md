# BuySellAds — AI Terminal Sponsorship Placement

**Publisher signup:** https://www.buysellads.com/  
**Catbox placement ID:** `catbox-terminal` (proposed)

## Custom placement spec

| Field | Value |
|-------|-------|
| Name | AI Terminal Sponsorship |
| Format | Text-native, 80 characters + URL |
| Surfaces | VS Code status bar, CLI breakpoints, IDE panels |
| Audience | Senior engineers, AI-native developers |
| Geo | US, UK, CA, EU |
| Pricing model | CPM ($5–$15 target) |

## Listing description (marketplace)

> Catbox aggregates text sponsorship inventory across developer workflows—VS Code extensions, AI coding assistants, and terminal UIs. Reach engineers where they ship code, not on content farms. Non-intrusive single-line format; adblock-resistant; privacy-first (no tracking pixels).

## Catbox integration

- Provider: `prov_buysellads` in `data/providers.json`
- Manifest probe: `GET /api/providers/prov_buysellads/manifest`
- Adapter: `src/server/providers/buysellads.ts`

## Env vars (post-approval)

```env
BSA_ZONE_KEY=your_zone_key
# or
BSA_MANIFEST_URL=https://cdn.buysellads.com/YOUR_ZONE/manifest.json
```

## Next steps

1. Create BuySellAds publisher account (no traffic minimum)
2. Add custom placement “AI Terminal Sponsorship”
3. Point manifest URL to Catbox proxy or BSA CDN
4. Set `BSA_ZONE_KEY` in `.env`
