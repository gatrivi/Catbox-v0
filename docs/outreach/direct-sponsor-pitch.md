# Direct Sponsor Outreach — AI Dev Tools

Templates for fixed monthly terminal sponsorship (CPM-equivalent). Providers seeded as `pending_verification` until deals close.

## Targets

| Brand | Provider ID | Suggested CPM | Contact angle |
|-------|-------------|---------------|---------------|
| Cursor | `prov_direct_cursor` | $12 | AI editor users = perfect ICP overlap |
| Vercel | `prov_direct_vercel` | $10 | Deploy/ship messaging at build breakpoints |
| Datadog | `prov_direct_datadog` | $9 | LLM observability for agent builders |

## Email template

**Subject:** Terminal sponsorship inventory — AI developers in VS Code & CLI

Hi [Name],

I'm building **Catbox**, a platform that serves single-line sponsorships inside VS Code status bars, AI coding assistants, and terminal workflows—surfaces where senior engineers spend hours daily.

We'd like to offer [Company] a **fixed monthly terminal placement**:
- Format: 80-char text + link (no banners, no pop-ups)
- Surfaces: VS Code extension + atomic stream API
- Audience: AI-native developers (US/EU-heavy)
- Reporting: impression/click telemetry with hashed creatives

Early pricing: **$[X]/month** for [Y]k guaranteed impressions, or CPM at $[Z].

I've attached a screenshot of the live placement in VS Code (status bar, opt-in, no cookies or prompt tracking).

Happy to jump on a 15-min call.

[Your name]

## Ready-to-send copies

- Cursor: [email-cursor-ready.md](email-cursor-ready.md)
- Screenshot + video guide: [sponsor-clip-capture.md](sponsor-clip-capture.md)

## Activate after deal

1. Set `status: "active"` on provider in `data/providers.json`
2. Replace fixture in `data/provider-manifests/direct-direct_[brand].json` with signed creative
3. Or host manifest at sponsor CDN and set `baseUrl` + `manifestPath`

## Fixture locations

- `data/provider-manifests/direct-direct_cursor.json`
- `data/provider-manifests/direct-direct_vercel.json`
- `data/provider-manifests/direct-direct_datadog.json`
