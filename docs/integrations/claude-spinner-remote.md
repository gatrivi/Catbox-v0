# Claude Code spinner — remote machine test

Catbox injects sponsor text into the **Claude Code sidebar spinner** when an ad loads. Use this checklist on any machine (including a second PC).

## Why this is separate from the status bar

| Surface | Config location | Who writes it |
|---------|-----------------|---------------|
| Status bar | Daemon stream `:3000` | Catbox extension polls daemon |
| Claude sidebar spinner | `claudeCode.spinnerVerbs` in **Cursor User settings** | Catbox extension (since v1.4.1) |

`~/.claude/settings.json` is **ignored** by Claude Code inside Cursor for spinner text. Manual proof: adding `claudeCode.spinnerVerbs` to User settings JSON changed the spinner.

## Prereqs

```bash
cd Catbox-v0
npm run dev
npm run compile:extension   # on dev machine before copying vscode-extension/
```

On target machine:

1. Copy/sync `Catbox-v0/vscode-extension/` (must include updated `extension.js`)
2. `Ctrl+Shift+P` → **Developer: Install Extension from Location...** → `vscode-extension/`
3. Reload window
4. Remove any **manual** `claudeCode.spinnerVerbs` you added for testing (optional — Catbox overwrites on ad load)

## Zero-token verification (do this first)

After reload, open **Preferences: Open User Settings (JSON)**.

**Pass:** `claudeCode.spinnerVerbs` exists and looks like:

```json
"claudeCode.spinnerVerbs": {
  "mode": "replace",
  "verbs": ["✶ Cursor: The AI code editor. Built for pair-programming with agents at scale."]
}
```

Also check status bar bottom-right: globe + sponsor line (confirms daemon + extension).

Cost: **$0**

## Minimal-token UI confirm (optional)

Send one tiny prompt in Claude sidebar, e.g. `say ok`.

**Pass:** Spinner shows sponsor text with `✶` prefix, not default whimsical verbs.

Cost: ~$0.01–0.05 for a single short turn.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| No `claudeCode.spinnerVerbs` in User settings | Reinstall from location; confirm `extension.js` contains `injectCursorSpinnerVerbs` |
| Key exists but spinner still default | Reload window once; retry one short prompt |
| `Catbox: Connecting...` | Start `npm run dev` on that machine |
| Status bar OK, spinner not | Extension build is old — re-sync `vscode-extension/` |
| Want custom icon | Not supported by Claude API yet; `✶` prefix is the placeholder |

## Code paths (for devs)

- [`src/extension/index.ts`](../../src/extension/index.ts) — `injectSpinnerFromAd()` after each ad fetch
- [`src/extension/cursorSpinner.ts`](../../src/extension/cursorSpinner.ts) — writes `claudeCode.spinnerVerbs`
- [`src/utils/claudeInterceptor.ts`](../../src/utils/claudeInterceptor.ts) — `~/.claude/settings.json` for CLI users

Automated smoke (no Claude tokens):

```bash
npx tsx test-inject.ts
npm run test:extension-cpm
```
