# Carbon Classic — Resubmission / Expansion Pitch

Use **after** the visual sponsor panel ships (`catbox.visualAd.enabled`). Separate from Carbon CLI (text status bar) attempt #1.

**Apply:** https://www.carbonads.net/ (Classic / display inventory — confirm current publisher path with Carbon)

## When to use

- Carbon CLI approved and you want a second 260×200 unit
- Carbon CLI rejected — resubmit with stronger visual proof
- Carbon asks for screenshot of display placement

## Creative spec (Carbon Classic)

| Field | Value |
|-------|--------|
| Image | 260 × 200 px PNG or JPG |
| Copy | Up to 80 characters |
| Link | HTTPS landing page |
| Placement | VS Code sidebar webview (`catbox.visualAd`), opt-in, dismissible |

## Screenshot for pitch

1. `npm run dev` + `npm run compile:extension`
2. F5 → Extension Development Host
3. Command palette → **Catbox: Enable Visual Sponsor Panel**
4. Screenshot Catbox sidebar — 260×200 card + sponsor line
5. **Also** attach status bar screenshot from [carbon-safe-submission.md](carbon-safe-submission.md)

## Form copy (visual inventory add-on)

```
Additional inventory: Optional pets-sized visual sponsor panel (260×200) in VS Code sidebar.

Default: disabled. Users opt in during onboarding or via settings. One-click hide.

Same privacy model as status bar: no cookies, SHA-256 validated creatives, deduplicated impression/click callbacks.

Telemetry surface: visual_panel (separate from statusbar).

Request: Carbon Classic fill for image + 80-char copy in this unit.
```

## Technical wiring (post-approval)

- Extend Carbon manifest mapping to pass `imageUrl` into [`src/server/adSelection.ts`](../../src/server/adSelection.ts) stream payload
- Set `CARBON_CLI_ZONE_ID` / Classic zone per Carbon email
- Verify `data/provider-reports.jsonl` with `surface: vscode_visual_panel` or extension `visual_panel` telemetry

## Do not mix into CLI attempt #1

Keep first Carbon CLI application text-only. Pitch Classic only when visual panel is demo-ready.
