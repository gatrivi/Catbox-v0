# Documentación Catbox-v0

Índice maestro de la carpeta `docs/`. Esta estructura gobierna el flujo de trabajo con IA y el conocimiento persistente del proyecto.

## Árbol de carpetas

```
docs/
├── README.md                 ← estás aquí
├── audits/                   ← informes de auditoría (IA)
├── changelogs/               ← registro de cambios grandes (IA)
├── prompts/                  ← prompts maestros pre-ejecución (IA)
├── reference/                ← documentación estable del producto
├── integrations/             ← guías de herramientas (Claude, Kimi, VS Code)
└── outreach/                 ← materiales de pitch a redes CPM
```

## Carpetas operativas (IA)

| Carpeta | Cuándo escribir | Convención de nombre |
|---------|-----------------|----------------------|
| [`audits/`](audits/) | Al completar cualquier auditoría | `{nombre-auditoria}_{YYYY-MM-DD}.md` |
| [`changelogs/`](changelogs/) | Tras un cambio grande en el codebase | `{slug-descriptivo}_{YYYY-MM-DD}.md` |
| [`prompts/`](prompts/) | Tras investigar y antes de ejecutar un cambio solicitado | `{feature-o-tarea}_{YYYY-MM-DD}.md` |

### Puerta **Procede**

Los prompts maestros en `prompts/` son **planes de ejecución**. La IA **no debe modificar código** hasta que el usuario diga exactamente: **Procede**.

Flujo: solicitud → investigación → prompt maestro guardado → esperar **Procede** → ejecutar → changelog si aplica.

Reglas completas: [`.cursorrules`](../.cursorrules) en la raíz del repo.

## Referencia del producto

| Documento | Descripción |
|-----------|-------------|
| [Catbox-Architecture.md](reference/Catbox-Architecture.md) | Arquitectura actual, endpoints, flujos |
| [Catbox-Gap-Report.md](reference/Catbox-Gap-Report.md) | Brechas conocidas vs. producto deseado |
| [Catbox-Live-CPM.md](reference/Catbox-Live-CPM.md) | Checklist Carbon / CPM en vivo |
| [pre-ship-certainty.md](reference/pre-ship-certainty.md) | Qué valida `test:pre-ship` |
| [Catbox-Gap-Report.json](reference/Catbox-Gap-Report.json) | Gap report en formato estructurado |

Manual operativo (raíz): [`HOW_TO_USE.md`](../HOW_TO_USE.md)

## Integraciones

| Documento | Descripción |
|-----------|-------------|
| [claude.md](integrations/claude.md) | Integración Claude Code |
| [kimi.md](integrations/kimi.md) | Notas Kimi / alternativas |
| [test-claude-code-host.md](integrations/test-claude-code-host.md) | Depurar extensión en Extension Host |

## Outreach (redes CPM)

Materiales de aplicación y pitch en [`outreach/`](outreach/): Carbon, BuySellAds, Paved, sponsors directos.

## Refrescar contexto (IA)

Si el contexto de sesión se comprime o inicia una tarea nueva:

1. Leer los **3 changelogs** más recientes en `changelogs/`
2. Leer `reference/Catbox-Architecture.md`
3. Revisar auditorías abiertas con hallazgos críticos en `audits/`
4. Si hay un cambio pendiente, leer el prompt maestro en `prompts/` antes de **Procede**
