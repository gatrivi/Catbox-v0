# Paved Ad Network — Publisher Setup

**Signup:** https://www.paved.com/  
**Product:** Paved Ad Network (programmatic native ads)

## Positioning

Map Catbox terminal slots to **micro-newsletter impressions**: one native text line per rotation, B2B/SaaS demand from Paved's advertiser pool.

## Catbox integration

- Provider: `prov_paved`
- Test manifest: `GET /api/providers/prov_paved/manifest`
- Adapter: `src/server/providers/paved.ts`
- Fixture: `data/provider-manifests/paved.json`

## Env vars (post-approval)

```env
PAVED_API_KEY=your_api_key
PAVED_PUBLICATION_ID=catbox-terminal
```

## Verification

```bash
curl http://localhost:3000/api/providers/prov_paved/manifest
```

Expect `creatives[]` with `id`, `text`, `link`, `hash` per `AdManifestItem`.

## Notes

- No strict subscriber minimum for programmatic network (per Paved Ad Network launch)
- Commission: ~30% on marketplace deals; programmatic fill may differ
- Best for B2B dev-tool advertisers already on Paved
