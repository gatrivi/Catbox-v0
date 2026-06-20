# Changelog: Integración Adsterra Smartlink + Publisher API

**Fecha**: 2026-06-19  
**Prompt**: `docs/prompts/integracion-adsterra-smartlink-daemon_2026-06-19.md`

## Resumen ejecutivo

Se añadió el proveedor `adsterra_smartlink` a Catbox: delivery vía Smartlink URL en el daemon terminal, fixture local para dev, y cliente Publisher API para reconciliación de stats en clicks. Sin HTTP-follow del Smartlink en impresiones.

## Motivación

Monetización click-fallback en terminal/VS Code sin browser, usando la vía documentada de Adsterra (Smartlink + Publisher API) en lugar del Advertiser API.

## Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `src/types.ts` | `ProviderType` + `adsterra_smartlink` |
| `src/server/providers/adsterra.ts` | **Nuevo** — adaptador + `fetchAdsterraStats` |
| `src/server/providers/reporting/adsterra.ts` | **Nuevo** — reporting audit-only / stats on click |
| `src/server/providers/index.ts` | Registro adaptador |
| `src/server/providers/reporting.ts` | Dispatch Adsterra |
| `src/server/providers/seedNetworks.ts` | Seed `prov_adsterra_smartlink` (pending_verification) |
| `src/server/providers/adapters.test.ts` | +5 tests |
| `data/provider-manifests/adsterra.json` | Fixture dev |
| `.env.example` | Vars Adsterra |
| `docs/reference/adsterra-integration.md` | Guía arquitectura |

## Variables de entorno nuevas

- `ADSTERRA_API_KEY` — Publisher token (`X-API-Key`)
- `ADSTERRA_SMARTLINK_URL` — URL Smartlink del dashboard
- `ADSTERRA_PLACEMENT_ID`, `ADSTERRA_DOMAIN_ID` — opcional, stats
- `ADSTERRA_DISPLAY_TEXT` — copy terminal

## Comportamiento

1. Con `ADSTERRA_SMARTLINK_URL` → creativo live con `placement_sub_id` único por fetch
2. Sin URL + `CATBOX_LIVE_CPM=1` → pool vacío (no fixture en prod)
3. Sin URL + dev → fixture `data/provider-manifests/adsterra.json`
4. Reporting: impresión = audit only; click = audit + optional stats pull si API key configurada

## Activación

```bash
# En .env.local
ADSTERRA_SMARTLINK_URL=https://...
ADSTERRA_API_KEY=...

# Activar provider (o POST seed + editar providers.json status → active)
npm run seed:ad-networks
```

## Pruebas

```bash
npm test        # 28 passed
npm run lint    # OK
```

## Deuda / siguientes pasos

- Confirmar con soporte Adsterra placement IDE/CLI antes de tráfico real
- Cambiar `prov_adsterra_smartlink` a `active` en `data/providers.json` tras configurar env
- Landing page deploy si onboarding lo exige (tarea separada)
