# Sponsor clip capture — screenshot + video

**Estado del sistema (verificado):** daemon en `:3000`, `prov_direct_cursor` activo, stream sin mock devuelve creative Cursor.

## Prerrequisitos (ya hechos)

```bash
cd Catbox-v0
npm run dev                    # debe estar corriendo
npm run compile:extension      # extension.js actualizado
```

Stream esperado (sin `mock=1`):

```text
Cursor: The AI code editor. Built for pair-programming with agents at scale.
```

---

## Screenshot para email (5 min)

**No usar F5 / Extension Development Host** — fuerza mock Aurum con "Promo CATTBACKS".

### Instalar extensión en Cursor principal

1. Abrir Cursor (ventana principal, no dev host).
2. `Ctrl+Shift+P` → **Extensions: Install from VSIX...**  
   Si no hay VSIX: **Developer: Install Extension from Location...** → carpeta `Catbox-v0/vscode-extension/`
3. Reload window si lo pide.
4. Confirmar que `npm run dev` sigue en `:3000`.

### Capturar

| Shot | Qué incluir | Qué evitar |
|------|-------------|------------|
| **SS principal** | Status bar abajo-derecha: icono globe + línea Cursor | Dashboard, terminal stderr, "CATTBACKS" |
| **SS opcional** | Panel visual 260×200 (`Catbox: Enable Visual Sponsor Panel`) | localhost, logs, repo interno |

### Verificar click

- Click en status bar → abre `https://cursor.com`
- Daemon loguea click en `/api/atomic/report-click`

### Archivo sugerido

`docs/outreach/assets/catbox-statusbar-cursor.png`

---

## Screen recording para landing (~30–45s)

1. Cursor con extensión activa + daemon corriendo.
2. Mostrar status bar con sponsor line (3s).
3. Click en ad → browser abre URL (3s).
4. (Opcional) Command Palette → `Catbox: Enable Visual Sponsor Panel` → card 260×200 (5s).
5. (Opcional) Botón "Hide sponsor panel" — muestra opt-in.

**No incluir:** dashboard Catbox, ledger, env vars, Railway URLs.

### Archivo sugerido

`docs/outreach/assets/catbox-demo-30s.mp4` → subir a landing cuando esté deployada.

---

## Troubleshooting

| Síntoma | Fix |
|---------|-----|
| `Catbox: Connecting...` | `npm run dev` no está corriendo |
| Aurum / CATTBACKS | Estás en F5 dev host — usar Cursor principal |
| Creative incorrecto | Reload window; Cursor tiene CPM 50 (gana weighted selection) |
| No aparece ad | `npm run compile:extension` + reload |
