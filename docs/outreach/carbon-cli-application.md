# Carbon Ads CLI — Publisher Application (Catbox)



**Apply:** https://www.carbonads.net/cli  

**Status:** Ready to submit  

**Catbox version:** 0.0.0 / atomic engine 1.2.0-atomic



## Safe submission (use this)



**Full guide:** [carbon-safe-submission.md](carbon-safe-submission.md)



1. Open https://www.carbonads.net/cli → **Start Earning** (publisher)

2. Attach **status bar screenshot** (Extension Development Host — Aurum mock in dev is fine)

3. Paste **Application form copy** below (not demo bash commands or env vars)

4. **Do not** attach terminal PASS output — Carbon cannot verify console logs ([carbon-safe-submission.md](carbon-safe-submission.md))

5. Visual panel is Phase 2 — do not mention in CLI form ([carbon-classic-pitch.md](carbon-classic-pitch.md))

6. On approval → [carbon-post-approval.md](carbon-post-approval.md)

7. Update **Status** above to `Submitted YYYY-MM-DD` after you press Send



## One-line pitch



Catbox delivers text-native sponsorships in VS Code status bars and terminal workflows for AI developers—non-intrusive, privacy-first, ready for Carbon CLI integration.



## Application form copy



**Tool name:** Catbox  

**Audience:** AI developers using VS Code, Claude Code, and terminal CLIs. US/EU-heavy, senior engineers and AI-native developers.  

**Monthly impressions (est.):** 1,000–10,000 (early growth)  

**Ad format:** Single-line text sponsorship (max ~80 characters) + HTTPS link in VS Code status bar. Rotates at natural breakpoints. No banners, pop-ups, or tracking pixels.  

**Privacy:** No cookies or fingerprinting. SHA-256 validated creatives. Ads suppressed in CI/piped output.  

**Reporting:** Impression and click callbacks with deduplicated event IDs; ready to wire to Carbon's official endpoints on approval.  

**Exclusivity:** Willing to discuss; Carbon as primary dev-tool demand source.



**Questions for Carbon:** CLI publisher zone ID, manifest URL, official impression/click reporting endpoints.



## Internal only (do not paste into Carbon form)



| Surface | Integration |

|---------|-------------|

| VS Code status bar | `GET :3000/api/atomic/stream` |

| Provider manifest | `GET /api/providers/prov_carbon_cli/manifest` |

| Reporting audit | `data/provider-reports.jsonl` |



```bash

npm run dev

npm run test:pre-ship          # full internal QA

npm run test:pre-ship:carbon   # publisher-safe screenshot output

```



## Env vars (post-approval)



See [carbon-post-approval.md](carbon-post-approval.md) and [Catbox-Live-CPM.md](../Catbox-Live-CPM.md).



```env

CATBOX_LIVE_CPM=1

CARBON_CLI_ZONE_ID=your_zone

CARBON_IMPRESSION_URL=https://srv.carbonads.net/ads/{zone}/impression?creative={creativeId}

CARBON_CLICK_URL=https://srv.carbonads.net/ads/{zone}/click?creative={creativeId}

```



## Technical fit



```json

{ "id": "...", "text": "...", "link": "https://...", "hash": "sha256..." }

```



Adapter: `src/server/providers/carbon.ts` · Reporting: `src/server/providers/reporting/carbon.ts`

