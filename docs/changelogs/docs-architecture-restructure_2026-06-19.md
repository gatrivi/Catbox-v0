# Changelog: Reestructuración de documentación y gobernanza IA

**Fecha**: 2026-06-19  
**Tipo**: Infraestructura / workflow (sin cambios de lógica de negocio)

## Resumen ejecutivo

Se reorganizó `docs/` en carpetas operativas (`audits`, `changelogs`, `prompts`) y de referencia (`reference`, `integrations`), se creó el índice maestro `docs/README.md` y se añadió `.cursorrules` en la raíz para gobernar auditorías, changelogs, prompts maestros y la puerta **Procede**.

## Motivación

- Persistir memoria del proyecto cuando el contexto de la IA se comprime
- Separar documentación estable de registros generados por la IA
- Establecer flujo con margen de error ~0: investigar → prompt maestro → esperar **Procede** → ejecutar
- Centralizar reglas del proyecto en un solo archivo

## Archivos creados

| Archivo | Rol |
|---------|-----|
| `.cursorrules` | Reglas definitivas del proyecto para agentes IA |
| `docs/README.md` | Índice maestro de documentación |
| `docs/audits/README.md` | Guía de auditorías |
| `docs/changelogs/README.md` | Guía de changelogs |
| `docs/prompts/README.md` | Guía de prompts maestros |
| `docs/prompts/PROMPT-TEMPLATE.md` | Plantilla estándar |
| `docs/audits/codebase-full-analysis_2026-06-19.md` | Auditoría inicial del codebase |
| `docs/changelogs/docs-architecture-restructure_2026-06-19.md` | Este archivo |

## Archivos movidos

| Origen | Destino |
|--------|---------|
| `docs/Catbox-Architecture.md` | `docs/reference/` |
| `docs/Catbox-Live-CPM.md` | `docs/reference/` |
| `docs/Catbox-Gap-Report.md` | `docs/reference/` |
| `docs/Catbox-Gap-Report.json` | `docs/reference/` |
| `docs/pre-ship-certainty.md` | `docs/reference/` |
| `docs/claude.md` | `docs/integrations/` |
| `docs/kimi.md` | `docs/integrations/` |
| `docs/test-claude-code-host.md` | `docs/integrations/` |

## Sin cambios

- `docs/outreach/*` — permanece en su ubicación
- Código fuente (`src/`, `server.ts`, etc.) — **no modificado**

## Enlaces actualizados

- `docs/reference/Catbox-Live-CPM.md` — rutas relativas a `outreach/` y `pre-ship-certainty.md`

## Breaking changes

- Rutas antiguas `docs/Catbox-Architecture.md` etc. **ya no existen** en raíz de `docs/`; usar `docs/reference/`
- Bookmarks o referencias externas deben actualizarse

## Variables de entorno

Ninguna.

## Cómo verificar

```bash
# Estructura esperada
ls docs/audits docs/changelogs docs/prompts docs/reference docs/integrations docs/outreach

# Reglas del proyecto
cat .cursorrules
```

## Deuda técnica

- Referencias en otros repos o chats a rutas viejas de `docs/` — actualizar manualmente si existen
- Considerar symlink o redirect en README raíz apuntando a `docs/README.md` (opcional, no hecho)
