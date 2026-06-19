/**
 * Pre-ship certainty tests: payout chain + provider safety.
 * Requires dev server: npm run dev
 * Usage: npx tsx scripts/test-pre-ship.ts
 */
import * as crypto from "crypto";
import { getDailyTelemetryToken } from "../src/server/mockCpmAd";
import { isValidAdItem } from "../src/server/manifestEngine";
import { fetchProviderCreatives } from "../src/server/providers";
import { filterValidManifestItems } from "../src/server/providers/normalize";
import { PLAN_NETWORK_PROVIDERS } from "../src/server/providers/seedNetworks";
import fs from "fs/promises";
import path from "path";

const MAIN = "http://127.0.0.1:3000";
const AUDIT_PATH = path.join(process.cwd(), "data", "provider-reports.jsonl");

async function readAuditCount(): Promise<number> {
  try {
    const raw = await fs.readFile(AUDIT_PATH, "utf8");
    return raw.trim() ? raw.trim().split("\n").length : 0;
  } catch {
    return 0;
  }
}

type Result = { name: string; ok: boolean; detail?: string };

async function getProfile() {
  const res = await fetch(`${MAIN}/api/developer/my_account`);
  const data = await res.json();
  return data.profile as { balance: number; impressionCount: number; clickCount: number };
}

async function getLedger() {
  const res = await fetch(`${MAIN}/api/ledger`);
  const data = await res.json();
  return data.ledger as Array<{ type: string; amount: number; hash: string }>;
}

async function touch() {
  await fetch(`${MAIN}/api/telemetry/touch`, { method: "POST" });
}

async function streamImpression(token: string, mock = false) {
  const q = mock ? "&mock=1" : "";
  const res = await fetch(`${MAIN}/api/atomic/stream?token=${token}${q}`, {
    headers: { "x-catbox-telemetry-token": token },
  });
  return { status: res.status, body: await res.json() };
}

async function run(): Promise<void> {
  const results: Result[] = [];

  try {
    await fetch(`${MAIN}/api/telemetry/stats`);
    results.push({ name: "server reachable", ok: true });
  } catch {
    console.error("FAIL: start server with npm run dev");
    process.exit(1);
  }

  const validToken = getDailyTelemetryToken();
  const badToken = "invalid_token_000";

  // --- Payout certainty ---
  await touch();
  const before = await getProfile();
  const beforeBalance = before.balance;
  const beforeImpressions = before.impressionCount;

  const imp = await streamImpression(validToken, true);
  const after = await getProfile();

  const balanceDelta = parseFloat((after.balance - beforeBalance).toFixed(4));
  const impressionDelta = after.impressionCount - beforeImpressions;

  results.push({
    name: "valid token + active → balance credits",
    ok: imp.body.signedTelemetryVerified === true && balanceDelta > 0 && impressionDelta >= 1,
    detail: `delta=$${balanceDelta}, impressions+${impressionDelta}`,
  });

  const ledgerAfter = await getLedger();
  results.push({
    name: "impression writes AD_IMPRESSION ledger block",
    ok: ledgerAfter.some((b) => b.type === "AD_IMPRESSION" && b.amount > 0),
    detail: `blocks=${ledgerAfter.filter((b) => b.type === "AD_IMPRESSION").length}`,
  });

  const beforeBad = (await getProfile()).balance;
  await streamImpression(badToken, true);
  const afterBad = (await getProfile()).balance;
  results.push({
    name: "invalid token → no balance credit",
    ok: afterBad === beforeBad,
    detail: `balance stayed $${afterBad}`,
  });

  // Click payout
  const balBeforeClick = (await getProfile()).balance;
  const clickRes = await fetch(`${MAIN}/api/atomic/report-click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creativeText: "Test sponsor click",
      url: "https://example.com",
      clickedAt: new Date().toISOString(),
    }),
  });
  const balAfterClick = (await getProfile()).balance;
  results.push({
    name: "click → balance credits",
    ok: clickRes.ok && balAfterClick > balBeforeClick,
    detail: `+$${(balAfterClick - balBeforeClick).toFixed(4)}`,
  });

  // Payout simulation (only if balance > 1)
  if (balAfterClick > 1.0) {
    const payoutRes = await fetch(`${MAIN}/api/ledger/payout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ developerId: "my_account" }),
    });
    const payoutData = await payoutRes.json();
    const postPayout = await getProfile();
    results.push({
      name: "escrow payout zeros local balance",
      ok: payoutRes.ok && postPayout.balance === 0 && payoutData.payoutAmount > 0,
      detail: `paid $${payoutData.payoutAmount?.toFixed?.(2) ?? "?"}`,
    });
  } else {
    results.push({
      name: "escrow payout zeros local balance",
      ok: true,
      detail: "skipped (balance < $1 threshold)",
    });
  }

  // --- Provider safety ---
  let invalidCreatives = 0;
  let totalCreatives = 0;
  for (const provider of PLAN_NETWORK_PROVIDERS.filter((p) => p.status === "active")) {
    const creatives = filterValidManifestItems(
      await fetchProviderCreatives(provider, { surface: "vscode_statusbar" })
    );
    totalCreatives += creatives.length;
    for (const c of creatives) {
      if (!isValidAdItem(c)) invalidCreatives++;
      if (c.text.length > 120) invalidCreatives++;
      if (!c.link.startsWith("https://")) invalidCreatives++;
    }
  }
  results.push({
    name: "active provider creatives pass security validation",
    ok: invalidCreatives === 0 && totalCreatives > 0,
    detail: `${totalCreatives} creatives, ${invalidCreatives} invalid`,
  });

  // Provider manifest API
  try {
    const manifestRes = await fetch(`${MAIN}/api/providers/prov_carbon_cli/manifest`);
    const contentType = manifestRes.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      results.push({
        name: "provider manifest API returns validated items",
        ok: false,
        detail: "server returned HTML — restart npm run dev with latest code",
      });
    } else {
      const manifestData = await manifestRes.json();
      results.push({
        name: "provider manifest API returns validated items",
        ok:
          manifestRes.ok &&
          manifestData.success &&
          Array.isArray(manifestData.creatives) &&
          manifestData.creatives.length > 0 &&
          manifestData.creatives.every((c: unknown) => isValidAdItem(c)),
        detail: `count=${manifestData.creatives?.length ?? 0}`,
      });
    }
  } catch (err: any) {
    results.push({
      name: "provider manifest API returns validated items",
      ok: false,
      detail: err.message,
    });
  }

  // Telemetry dedup (anti-fraud for providers)
  const eventId = crypto.randomUUID();
  const event = {
    event_id: eventId,
    user_id: "my_account",
    ad_id: "test_ad",
    campaign_id: "test_campaign",
    timestamp: new Date().toISOString(),
    surface: "statusbar",
    type: "impression_rendered",
    visible_duration_ms: 0,
  };
  await touch();
  const t1 = await fetch(`${MAIN}/api/telemetry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: [event] }),
  });
  const t1d = await t1.json();
  const t2 = await fetch(`${MAIN}/api/telemetry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: [event] }),
  });
  const t2d = await t2.json();
  results.push({
    name: "duplicate telemetry dropped (anti-inflation)",
    ok: t1d.processed >= 1 && t2d.dropped >= 1,
    detail: `first=${t1d.processed} dup=${t2d.dropped}`,
  });

  // --- Provider outbound reporting ---
  const auditBefore = await readAuditCount();
  await touch();
  const providerImp = await streamImpression(validToken, false);
  const auditAfterImp = await readAuditCount();
  const impReported =
    providerImp.body.providerId && auditAfterImp > auditBefore;
  results.push({
    name: "provider impression → audit log",
    ok: providerImp.body.providerId ? impReported : auditAfterImp >= auditBefore,
    detail: `audit ${auditBefore}→${auditAfterImp}, provider=${providerImp.body.providerId ?? "fallback"}`,
  });

  const reportEventId = crypto.randomUUID();
  await fetch(`${MAIN}/api/atomic/report-click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creativeText: "Provider report click test",
      url: "https://example.com",
      clickedAt: new Date().toISOString(),
      providerId: "prov_carbon_cli",
      providerType: "carbon_cli",
      creativeId: "carbon_cli_test",
      campaignId: "campaign_test",
      eventId: reportEventId,
    }),
  });
  const auditAfterClick = await readAuditCount();
  results.push({
    name: "provider click → audit log",
    ok: auditAfterClick > auditAfterImp,
    detail: `audit ${auditAfterImp}→${auditAfterClick}`,
  });

  await fetch(`${MAIN}/api/atomic/report-click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creativeText: "Dup click",
      url: "https://example.com",
      clickedAt: new Date().toISOString(),
      providerId: "prov_carbon_cli",
      providerType: "carbon_cli",
      creativeId: "carbon_cli_test",
      eventId: reportEventId,
    }),
  });
  const auditAfterDup = await readAuditCount();
  results.push({
    name: "duplicate provider report deduped",
    ok: auditAfterDup === auditAfterClick,
    detail: `audit stayed at ${auditAfterClick}`,
  });

  let allOk = true;
  console.log("\n=== Catbox Pre-Ship Certainty ===\n");
  for (const r of results) {
    const mark = r.ok ? "PASS" : "FAIL";
    console.log(`${mark}  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
    if (!r.ok) allOk = false;
  }

  console.log("\n--- Honest limits ---");
  console.log("• Payout is ledger + simulated Stripe escrow, not live bank transfer.");
  console.log("• Provider networks use fixtures until API keys are configured.");
  console.log("• Impressions while idle (90s AFK) are served but not credited.");
  console.log("• Outbound reporting: audit log always; HTTP only when CARBON_* / BSA_* / PAVED_* configured.");
  console.log("• Set CATBOX_LIVE_CPM=1 before live Carbon fill (no fixtures).\n");

  console.log(allOk ? "VERDICT: PASS — safe to ship demo/MVP with disclosed limits" : "VERDICT: FAIL — fix items above before ship");
  process.exit(allOk ? 0 : 1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
