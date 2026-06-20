# Test Catbox + Claude Code (Extension Development Host)

Extensions in your main Cursor window **do not** load in the dev host. Use the **second window** opened by F5.

**Claude Code ID:** `anthropic.claude-code` (host 1.98+)

## Setup

```bash
npm run dev
npm run compile:extension
```

## Manual checklist

| Step | Action | Pass |
|------|--------|------|
| 1 | `npm run dev` | Server on `:3000` |
| 2 | `npm run compile:extension` | `vscode-extension/extension.js` updated |
| 3 | F5 → **Run Catbox + Claude Code** | Second window opens |
| 4 | Dev host: Claude icon/panel | Claude Code UI visible |
| 5 | Dev host: status bar bottom-right | Globe + Aurum sponsor line |
| 6 | Click status bar ad | Browser opens; click logged |
| 7 | Optional: **Catbox: Enable Visual Sponsor Panel** | 260×200 sidebar card |
| 8 | Screenshot | Status bar + Claude panel (future Carbon Classic) |

## Fail cues

| Symptom | Fix |
|---------|-----|
| `Catbox: Connecting...` forever | Start `npm run dev` |
| No Claude panel | Re-run **Run Catbox + Claude Code** (installs extension on first launch) |
| No status bar ad | `npm run compile:extension`, reload dev host |

## Automated smoke (no UI)

```bash
npm run dev
npm run test:extension-cpm
npx tsx test-inject.ts
```

Hits `:3000/api/atomic/stream` — same path as the real extension.

## Claude sidebar spinner (main Cursor window, not F5)

F5 dev host is for status bar mock ads only. For **Claude Code sidebar spinner** on a real machine, use [claude-spinner-remote.md](claude-spinner-remote.md).

Quick pass (zero tokens): after install + reload, User settings JSON must contain auto-written `claudeCode.spinnerVerbs`.
