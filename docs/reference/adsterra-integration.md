# Adsterra × Catbox — clarificación de APIs y arquitectura daemon

**Fecha**: 2026-06-19  
**Tipo**: Nota de arquitectura e integración

## Resumen

La ruta más limpia para Catbox **no** es el **Advertiser Ads API** (`/advertiser/*`). Catbox es **publisher** (muestra ads, cobra). El Advertiser API sirve para comprar y gestionar campañas propias.

Para terminal/daemon sin browser:

| Capa | Mecanismo |
|------|-----------|
| **Delivery** | Smartlink / Direct Link URL (dashboard) |
| **Operaciones** | Publisher API (`GET` + `X-API-Key`) — stats, domains, placements |
| **Daemon** | Catbox construye `AdManifestItem` y sirve vía `/api/atomic/stream` |

## APIs Adsterra

### Publisher API (la que Catbox necesita)

- Token: Publisher account → Settings → API → GENERATE NEW TOKEN
- Base: `https://api3.adsterratools.com/publisher`
- Header: `X-API-Key: {token}`
- Métodos: **GET solo**
- Endpoints útiles: `domains`, `stats.json`, placements listing
- **No** devuelve creativos para render en terminal

### Advertiser API (no usar para Catbox monetization)

- Base: `https://api3.adsterratools.com/advertiser`
- Gestión de campañas, banners, bids — rol de media buyer
- Documentación: [docs.adsterratools.com/public/v3/partners-api](https://docs.adsterratools.com/public/v3/partners-api)

## Smartlink para terminal

1. Publisher dashboard → **Smartlinks** → Add Smartlink (no “Add website”)
2. Copiar URL única
3. Catbox daemon usa URL como `link` en payload terminal
4. Añadir `placement_sub_id` por impresión/dev para stats API

Formatos **no** aptos para terminal: Popunder, Banner, Social Bar (browser-only).

## Variables de entorno previstas

```
ADSTERRA_API_KEY=           # Publisher token
ADSTERRA_SMARTLINK_URL=     # URL del Smartlink
ADSTERRA_PLACEMENT_ID=      # opcional, stats
ADSTERRA_DOMAIN_ID=         # opcional, stats
ADSTERRA_DISPLAY_TEXT=      # opcional, copy terminal
```

## Onboarding recomendado

1. Obtener Smartlink (y token Publisher API)
2. Contactar soporte Adsterra — confirmar placement IDE/CLI opt-in
3. Configurar env en Catbox
4. Tráfico real solo tras confirmación

## Implementación (2026-06-19)

Código en:

- `src/server/providers/adsterra.ts` — adaptador + `fetchAdsterraStats()`
- `src/server/providers/reporting/adsterra.ts` — audit en impresión; stats opcional en click
- Seed: `prov_adsterra_smartlink` en `seedNetworks.ts` (`pending_verification` hasta activar)

### Activar en dev

```bash
# .env.local
ADSTERRA_SMARTLINK_URL=https://your-smartlink-from-dashboard
ADSTERRA_API_KEY=your_publisher_token

npm run seed:ad-networks
# Editar data/providers.json → prov_adsterra_smartlink status: "active"
npm run dev
```

Sin `ADSTERRA_SMARTLINK_URL`, el adaptador sirve el fixture local (`data/provider-manifests/adsterra.json`).

Prompt maestro (ejecutado): [`../prompts/integracion-adsterra-smartlink-daemon_2026-06-19.md`](../prompts/integracion-adsterra-smartlink-daemon_2026-06-19.md)

Changelog: [`../changelogs/integracion-adsterra-smartlink_2026-06-19.md`](../changelogs/integracion-adsterra-smartlink_2026-06-19.md)
