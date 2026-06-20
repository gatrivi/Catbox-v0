# Changelogs

Registro de **cambios grandes** en el codebase. Sirve como memoria persistente cuando el contexto de la IA se comprime.

## Cuándo crear un archivo

Tras completar un cambio que cumpla **al menos uno** de estos criterios:

| Criterio | Umbral |
|----------|--------|
| Archivos de código tocados | ≥ 5 (excl. solo docs) |
| Líneas netas en lógica | ≥ 150 añadidas/eliminadas |
| API pública | Nuevo endpoint, cambio de contrato JSON, ruta eliminada |
| Persistencia | Cambio en `./data/*`, esquema PG, lógica de ledger |
| Seguridad | `manifestEngine`, cifrado, tokens atomic |
| UI estructural | Nueva ruta hash, paneles principales |
| Extensión VS Code | Stream, reporting, empaquetado |
| Dependencias | Nueva dep runtime o upgrade mayor |

**No requiere changelog:** typos, copy menor, docs sin lógica, fixes < 30 líneas sin impacto en API.

## Convención de nombre

```
{slug-descriptivo}_{YYYY-MM-DD}.md
```

Ejemplos:

- `docs-architecture-restructure_2026-06-19.md`
- `refactor-telemetry-pipeline_2026-06-20.md`

## Contenido mínimo

1. Resumen ejecutivo (1–3 oraciones)
2. Motivación
3. Archivos tocados
4. Endpoints / rutas UI afectados
5. Breaking changes o cambios de comportamiento
6. Variables de entorno nuevas o modificadas
7. Cómo probar (`npm test`, `test:pre-ship`, etc.)
8. Deuda técnica introducida o resuelta

## Uso por la IA

Al iniciar sesión o retomar trabajo en un área:

1. Listar archivos por fecha descendente
2. Leer los **3 más recientes** relevantes al área
3. Cruzar con `git log` si hace falta detalle fino

Ver [`.cursorrules`](../../.cursorrules).
