# Auditorías

Registro persistente de **todas las auditorías** realizadas por la IA o el equipo.

## Cuándo crear un archivo

Al **finalizar** cualquier auditoría, sin excepción:

- Seguridad, arquitectura, gap analysis, CPM, telemetría, extensión VS Code, pre-ship, deuda técnica, etc.

## Convención de nombre

```
{nombre-auditoria}_{YYYY-MM-DD}.md
```

Ejemplos:

- `codebase-full-analysis_2026-06-19.md`
- `seguridad-api-sin-auth_2026-06-19.md`
- `pre-ship-extension-cpm_2026-06-19.md`

## Contenido mínimo

1. **Fecha y alcance** — qué se auditó y por qué
2. **Metodología** — archivos, herramientas, sub-agentes usados
3. **Hallazgos** — clasificados: crítico / alto / medio / bajo
4. **Evidencia** — rutas de archivo, endpoints, fragmentos relevantes
5. **Recomendaciones** — accionables y priorizadas
6. **Estado** — `pendiente` | `en progreso` | `resuelto`

## Relación con otras carpetas

| Si la auditoría implica trabajo… | Siguiente paso |
|----------------------------------|----------------|
| Cambio de código solicitado por el usuario | Crear prompt maestro en `../prompts/` y esperar **Procede** |
| Cambio grande ya ejecutado | Registrar en `../changelogs/` |

Ver reglas completas en [`.cursorrules`](../../.cursorrules).
