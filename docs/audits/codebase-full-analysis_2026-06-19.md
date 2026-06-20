# Auditoría: Análisis integral del codebase

**Fecha**: 2026-06-19  
**Alcance**: Catbox-v0 completo (~70 archivos de código, docs, extensión VS Code, scripts)  
**Metodología**: 4 sub-agentes Composer 2.5 (infra, frontend, backend, datos) + verificación manual  
**Estado**: pendiente (hallazgos documentados; remediación no iniciada)

---

## Resumen ejecutivo

Catbox-v0 es un **MVP full-stack monolítico** (Express + React SPA) para monetización publicitaria en superficies de desarrollo. La arquitectura es funcional para demo/local-first pero presenta **deuda crítica en seguridad y mantenibilidad** antes de producción real.

---

## Hallazgos

### Crítico

| ID | Hallazgo | Evidencia |
|----|----------|-----------|
| C1 | **Sin autenticación** — todos los endpoints REST son públicos; CORS `*` | `server.ts` — sin middleware de auth |
| C2 | **Secretos hardcodeados** — `TELEMETRY_SECRET`, `ENCRYPTION_KEY` con defaults en código | `server.ts`, `mockCpmAd.ts`, `atomicEngine.ts`, extensiones |
| C3 | **Reset/payout sin protección** — cualquier cliente puede resetear ledger o simular payout | `POST /api/ledger/reset`, `POST /api/ledger/payout` |

### Alto

| ID | Hallazgo | Evidencia |
|----|----------|-----------|
| A1 | **God Component** — UI entera en `App.tsx` (~3.317 líneas) | `src/App.tsx` |
| A2 | **Tipos duplicados** — `Block`/`DevProfile` redefinidos en `server.ts` vs `src/types.ts` | Líneas 59–89 `server.ts` |
| A3 | **Doble servidor atomic** — `:3000` y `:5176` con comportamientos distintos | `server.ts` + `src/utils/atomicEngine.ts` |
| A4 | **Vercel + JSON local incompatible** — `data/*.json` efímero en serverless | `vercel.json` + `DataStore` |
| A5 | **Documentación desalineada** — `HOW_TO_USE.md` describe SQL/schemas que no existen | vs implementación real JSON |

### Medio

| ID | Hallazgo | Evidencia |
|----|----------|-----------|
| M1 | Campo `type` de telemetría no persistido en PG/JSON | `telemetryClient.ts` vs `telemetryDb.ts` |
| M2 | `hash` de creativos no verificado contra contenido en runtime | `manifestEngine.ts` |
| M3 | Earnings duales — rotador CPM en `localStorage` vs ledger en servidor | `App.tsx` |
| M4 | `dotenv` en deps pero no importado en código | `package.json` |
| M5 | Sin CI/CD (`.github/` ausente) | repo root |
| M6 | Pirámide de tests invertida — `server.ts` sin cobertura unitaria | `src/features.test.ts`, adaptadores |

### Bajo

| ID | Hallazgo | Evidencia |
|----|----------|-----------|
| B1 | Estado muerto en UI (`showLeftPane`, `completedSteps`, dep `motion`) | `App.tsx` |
| B2 | Asset faltante `stained_glass_carrier_*.jpg` | import en `App.tsx` |
| B3 | `?ref=WALLET` documentado pero no implementado | `HOW_TO_USE.md` vs `App.tsx` |
| B4 | Nombre paquete legacy `react-example` | `package.json` |

---

## Arquitectura (referencia rápida)

| Capa | Ubicación |
|------|-----------|
| Backend | `server.ts` (~1485 líneas) |
| Frontend | `src/App.tsx`, `src/main.tsx` |
| Telemetría | `src/server/telemetryDb.ts`, `src/utils/telemetryClient.ts` |
| CPM adaptadores | `src/server/providers/*` |
| Extensión VS Code | `src/extension/index.ts` → `vscode-extension/extension.js` |
| Persistencia | `data/*.json` + PG/Redis opcional (solo telemetría) |

**Stack**: React 19, Vite 6, Tailwind 4, Express 4, TypeScript 5.8. **No Firebase.**

---

## Fortalezas identificadas

- Adaptadores CPM con strategy pattern y fixtures locales
- Escrituras JSON atómicas (`*.tmp` + rename, `executeUnderLock`)
- Cadena fallback PG → Redis → memoria → disco
- Validación de manifests con lista negra de vectores de ejecución
- `TelemetryClient` robusto (cola, retry, sendBeacon)
- Idempotencia en telemetría y reportes outbound

---

## Recomendaciones priorizadas

1. **Auth mínima** para endpoints mutantes (API key o JWT) antes de cualquier deploy público
2. **Secretos obligatorios por env** — fallar boot si faltan en producción
3. **Unificar tipos** — importar desde `src/types.ts` en `server.ts`
4. **Extraer rutas/páginas** desde `App.tsx` (refactor incremental)
5. **Alinear docs** con implementación real (`HOW_TO_USE.md`, SQL inexistente)
6. **CI mínimo** — `npm run lint && npm test` en GitHub Actions
7. **Consolidar atomic** — un solo servidor/puerto para stream de extensión

---

## Archivos clave revisados

`server.ts`, `src/App.tsx`, `src/types.ts`, `src/server/*`, `src/utils/*`, `src/extension/index.ts`, `vscode-extension/*`, `data/*`, `package.json`, `vercel.json`, `HOW_TO_USE.md`, `docs/reference/*`

---

## Siguiente paso sugerido

Para cada remediación: crear prompt maestro en `docs/prompts/` y ejecutar solo tras **Procede** del usuario.
