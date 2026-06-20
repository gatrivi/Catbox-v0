import type { Response } from "express";

export const GITHUB_URL = "https://github.com/gatrivi/Catbox-v0";

const SHARED_CSS = `
  :root {
    color-scheme: dark;
    --bg: #0f1419;
    --surface: #1a2332;
    --text: #e8edf4;
    --muted: #9aa8bc;
    --accent: #c9a227;
    --accent-hover: #dbb84a;
    --border: #2a3548;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    min-height: 100vh;
  }
  .wrap { max-width: 720px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
  header { margin-bottom: 2rem; }
  .logo { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; }
  .tagline { color: var(--muted); margin-top: 0.35rem; font-size: 1.05rem; }
  h2 { font-size: 1.15rem; margin: 1.75rem 0 0.75rem; color: var(--accent); }
  p { margin-bottom: 1rem; color: var(--muted); }
  ul { margin: 0 0 1.25rem 1.25rem; color: var(--muted); }
  li { margin-bottom: 0.5rem; }
  li strong { color: var(--text); }
  .cta-row { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 2rem; }
  .btn {
    display: inline-block;
    padding: 0.65rem 1.25rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.95rem;
    text-decoration: none;
    transition: background 0.15s;
  }
  .btn-primary { background: var(--accent); color: #0f1419; }
  .btn-primary:hover { background: var(--accent-hover); }
  .btn-secondary {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border);
  }
  .btn-secondary:hover { border-color: var(--muted); }
  nav { margin-bottom: 2rem; font-size: 0.9rem; }
  nav a { color: var(--muted); text-decoration: none; margin-right: 1rem; }
  nav a:hover { color: var(--text); }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0 1.5rem;
    font-size: 0.9rem;
  }
  th, td {
    text-align: left;
    padding: 0.6rem 0.75rem;
    border-bottom: 1px solid var(--border);
    color: var(--muted);
  }
  th { color: var(--text); font-weight: 600; }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1.25rem 1.5rem;
    margin: 1.5rem 0;
  }
  footer {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
    font-size: 0.85rem;
    color: var(--muted);
  }
`;

function pageShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Catbox</title>
  <style>${SHARED_CSS}</style>
</head>
<body>
  <div class="wrap">
    ${body}
  </div>
</body>
</html>`;
}

function siteNav(active?: "home" | "sponsors" | "dashboard"): string {
  const link = (href: string, label: string, key: typeof active) =>
    active === key ? `<strong>${label}</strong>` : `<a href="${href}">${label}</a>`;
  return `<nav>${link("/", "Home", "home")}${link("/sponsors", "Sponsors", "sponsors")}${link("/dashboard", "Dashboard", "dashboard")}</nav>`;
}

export function renderLandingPage(): string {
  const body = `
    ${siteNav("home")}
    <header>
      <div class="logo">Catbox</div>
      <p class="tagline">Open-source sponsor text for AI coding wait states.</p>
    </header>
    <p>Catbox places a single line of sponsor copy where developers already look — during idle moments in AI-assisted coding workflows.</p>
    <ul>
      <li><strong>VS Code / Cursor extension</strong> and <strong>Claude Code prompt wheel</strong> integration</li>
      <li><strong>Opt-in only</strong> — developers choose to enable placements</li>
      <li><strong>No prompt tracking</strong></li>
      <li><strong>No source-code tracking</strong></li>
      <li>Developers keep <strong>85%+ target payout</strong></li>
    </ul>
    <div class="cta-row">
      <a class="btn btn-primary" href="/sponsors">Become a founding sponsor</a>
      <a class="btn btn-secondary" href="${GITHUB_URL}" rel="noopener noreferrer">View GitHub</a>
    </div>
    <footer>Open source · Privacy-first · Built for AI-native developers</footer>
  `;
  return pageShell("Landing", body);
}

export function renderSponsorsPage(): string {
  const body = `
    ${siteNav("sponsors")}
    <header>
      <div class="logo">Founding sponsors</div>
      <p class="tagline">Terminal sponsorship inventory for AI developers in VS Code &amp; CLI.</p>
    </header>
    <p>Catbox serves <strong>fixed monthly terminal placements</strong> — single-line sponsor text in status bars, AI coding assistants, and terminal wait states where senior engineers spend hours daily.</p>
    <h2>Placement format</h2>
    <ul>
      <li>80-character text + link — no banners, no pop-ups</li>
      <li>Surfaces: VS Code / Cursor extension + atomic stream API</li>
      <li>Audience: AI-native developers (US/EU-heavy)</li>
      <li>Reporting: impression/click telemetry with hashed creatives</li>
    </ul>
    <h2>Early pricing (50k impressions / month)</h2>
    <table>
      <thead>
        <tr><th>Brand tier</th><th>CPM</th><th>Monthly</th></tr>
      </thead>
      <tbody>
        <tr><td>Cursor-class (AI editor)</td><td>$12</td><td>$600</td></tr>
        <tr><td>Dev platform (Vercel-class)</td><td>$10</td><td>$500</td></tr>
        <tr><td>Observability (Datadog-class)</td><td>$9</td><td>$450</td></tr>
      </tbody>
    </table>
    <div class="card">
      <p style="margin:0;color:var(--text);">Founding sponsors get priority inventory, direct creative control, and transparent reporting. No cookies. No prompt or source-code tracking.</p>
    </div>
    <div class="cta-row">
      <a class="btn btn-primary" href="mailto:hello@catbox.dev?subject=Catbox%20founding%20sponsor">Become a founding sponsor</a>
      <a class="btn btn-secondary" href="/">Back to home</a>
      <a class="btn btn-secondary" href="${GITHUB_URL}" rel="noopener noreferrer">View GitHub</a>
    </div>
    <footer>Happy to jump on a 15-minute call. Screenshot-ready live placement available on request.</footer>
  `;
  return pageShell("Sponsors", body);
}

export function renderDashboardPage(): string {
  const body = `
    ${siteNav("dashboard")}
    <header>
      <div class="logo">Dashboard</div>
      <p class="tagline">User dashboard — coming soon.</p>
    </header>
    <div class="card">
      <p style="margin:0;">Developer earnings, impression stats, and provider controls will live here. For now, check engine health or explore the open-source repo.</p>
    </div>
    <div class="cta-row">
      <a class="btn btn-primary" href="/api/health">Engine health (JSON)</a>
      <a class="btn btn-secondary" href="${GITHUB_URL}" rel="noopener noreferrer">View GitHub</a>
      <a class="btn btn-secondary" href="/">Back to home</a>
    </div>
    <footer>Catbox dashboard placeholder</footer>
  `;
  return pageShell("Dashboard", body);
}

export function sendHtml(res: Response, html: string): void {
  res.type("text/html; charset=utf-8").send(html);
}
