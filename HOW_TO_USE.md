# Catbox Integration & Operations Manual

This document contains full operational logs and instruction manuals for the Catbox system. It is divided into two distinct sections: the **Developer & Operator Manual** (for system administrators) and the **User Integration Manual** (for developers installing extensions and running ad partnerships).

---

## Part 1: Developer & Operator Manual (For Me)

### 1. How to Approach CPM Providers and Sponsors
Sponsors and CPM providers are the financial engine of Catbox. Because our platform prides itself on full decentralized auditability, your pitch to sponsors should center on **transparency, target fidelity, and anti-fraud mechanics**.

#### Standard Pitch Parameters & Positioning:
*   **Direct Developer Targeting**: Highlight that the ad delivery surface is directly inside developers' daily work environments (e.g., high-impact CLI prompts, VS Code status bars, and Claude Code wheels).
*   **Decentralized Auditing Ledger**: Emphasize that every single impressions-rendered, view-tick, and click lifecycle event is recorded in a transparent public ledger. Sponsors don't need to "trust" fake visual graphs—they can audit raw cryptographic verification hashes.
*   **High Engagement / Frictionless Action**: Unlike static web banners, developers can interact or copy sponsor command-line promos directly in one keystroke, leading to extremely high conversion rates.

#### Negotiation Flow:
1.  **Define CPM tiers**: Propose fixed $10–$25 CPM slots based on the primary development tag (e.g., `postgresql`, `rust`, `auth`, `deployment`).
2.  **Define the Royalty Split**: Confirm that Catbox operates on a generous **85.0% Developer payout / 15.0% Platform Fee** split. Of every ad dollar, 85 cents goes directly to the developer, bypassing greedy programmatic auction houses.
3.  **Handoff parameters**: Ask sponsors to supply three items:
    *   A static, clear **Slogan** (< 75 characters) to represent their tool.
    *   A secure click **Redirect Link** containing distinct tracking parameters.
    *   A standard cryptographic SHA256 integrity **Hash** for verified delivery verification.

---

### 2. How to Add Providers to the Database

Catbox supports two highly resilient storage options: high-fidelity local JSON-based file storage and secure relational PostgreSQL database structures. 

#### Option A: Programmatic REST API Injection
To register a new ad sponsor or provider dynamically, issue a `POST` request to `/api/providers/register` using curl:

```bash
curl -X POST http://localhost:3000/api/providers/register \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "provider_aurum",
    "name": "Aurum Security Solutions",
    "payoutAddress": "cat_0x99fE33ab3c51ea99A",
    "sponsors": [
      {
        "id": "aurum_auth_pro",
        "text": "Secure your routes elegantly with Aurum Auth. Get 20% off with promo code CATTBACKS",
        "link": "https://aurum-auth.io/discount=CATTBACKS",
        "contextTag": "auth"
      }
    ]
  }'
```

#### Option B: Managing via PostgreSQL Schema
If connected to a Cloud SQL or Postgres instance, register providers directly inside the custom providers tables:

1.  **Sponsor Registry**: Add the sponsor to your active manifest array:
    ```sql
    INSERT INTO catbox_providers (id, name, payout_address, active, created_at)
    VALUES ('provider_aurum', 'Aurum Security Solutions', 'cat_0x99fE33ab3c51ea99A', true, NOW());
    ```
2.  **Verify local telemetry**: Check overall view-ticks in real time to calculate total payouts:
    ```sql
    SELECT campaign_id, COUNT(*) as total_impressions, SUM(visible_duration_ms) as total_duration
    FROM catbox_ledger
    GROUP BY campaign_id;
    ```

---

## Part 2: User Integration Manual (For Users)

### 1. How to Install the Extension of Choice
Integrating the Catbox delivery network into your workspace is simple. Currently, we offer high-fidelity integrations with **VS Code Status Bar Indicators**, **Termux terminals**, and standard **Claude Code prompts**.

#### VS Code Status Bar Integration:
1.  Open VS Code and navigate to extensions (`Ctrl+Shift+X` or `Cmd+Shift+X`).
2.  Search for **Securite** or paste the Catbox extension package into `~/.vscode/extensions/`.
3.  Add the Catbox telemetry configurations to your global `settings.json`:
    ```json
    {
      "catbox.tracker.enabled": true,
      "catbox.telemetry.payoutWallet": "cat_YOUR_WALLET_ADDRESS",
      "catbox.telemetry.bypassHmr": true
    }
    ```
4.  A subtle interactive slogan will appear in your status bar. Hover over it to track active revenue generation.

#### Termux & CLI Integration:
1.  Run the dynamic install script inside your mobile terminal:
    ```bash
    curl -sSf http://localhost:3000/api/termux/install | bash
    ```
2.  This configures your active terminal prompt to fetch secure CPM slogans on every commands execution.

---

### 2. How to Refer Users & Associated Gains
Catbox features a high-incentive decentralized referral network. By promoting Catbox, you can easily amplify your daily earnings.

#### How to invite:
1.  Go to the **Ledger Auditing Panel** in your Web UI.
2.  Input your custom **Wallet Address**.
3.  Copy your unique referral link: `http://localhost:3000/?ref=YOUR_WALLET_ADDRESS`.

#### Referral Gains:
*   **Referrer Boost**: When peers sign up using your link, your active developer royalty payout split is dynamically boosted from **85% up to a maximum 92.5%** on your own impressions.
*   **Passive Spillover**: You earn a **5.0% passive royalty share** on all ad impressions verified by your referred sub-accounts, distributed directly to your ledger balance.

---

### 3. How to Add Ad Providers & Associated Gains
Catbox supports **BYOP (Bring Your Own Provider)**, meaning you aren't forced to use the network's default sponsors.

#### How to integrate:
1.  Navigate to the **Provider Dashboard** in the Web UI.
2.  Toggle your customized **Revenue Split Selection** or connect your own private sponsor.
3.  Configure your personal affiliate link parameters (e.g., custom redirect links for Neon, Supabase, or Sentry).

#### BYOP Gains:
*   **No Intermediaries**: By bypass-routing directly to your own affiliate keys, you earn the entire performance payout without any transaction cuts.
*   **Instant Verification**: Your custom sponsor creative is safely checked through our local AST static parser and automatically added to your active VS Code status-line loop.
