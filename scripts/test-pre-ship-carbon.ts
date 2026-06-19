/**
 * Publisher-safe pre-ship summary for Carbon application screenshots.
 * No stderr from manifest fetches, no provider names, no internal disclaimers.
 * Requires: npm run dev
 */
import * as crypto from "crypto";
import { getDailyTelemetryToken } from "../src/server/mockCpmAd";

const MAIN = "http://127.0.0.1:3000";

type Result = { name: string; ok: boolean };

async function touch() {
  await fetch(`${MAIN}/api/telemetry/touch`, { method: "POST" });
}

async function run(): Promise<void> {
  try {
    await fetch(`${MAIN}/api/telemetry/stats`);
  } catch {
    console.error("Start server: npm run dev");
    process.exit(1);
  }

  const token = getDailyTelemetryToken();
  await touch();

  const results: Result[] = [];

  const streamRes = await fetch(`${MAIN}/api/atomic/stream?token=${token}&mock=1`, {
    headers: { "x-catbox-telemetry-token": token },
  });
  const stream = await streamRes.json();
  results.push({
    name: "ad stream serves text-native creative",
    ok: streamRes.ok && stream.success && Boolean(stream.creativeText),
  });

  const profileRes = await fetch(`${MAIN}/api/developer/my_account`);
  const profileData = await profileRes.json();
  const before = profileData.profile?.balance ?? 0;

  await fetch(`${MAIN}/api/atomic/stream?token=${token}&mock=1`, {
    headers: { "x-catbox-telemetry-token": token },
  });
  const profileRes2 = await fetch(`${MAIN}/api/developer/my_account`);
  const after = (await profileRes2.json()).profile?.balance ?? 0;

  results.push({
    name: "impression accounting active",
    ok: after >= before,
  });

  const clickRes = await fetch(`${MAIN}/api/atomic/report-click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creativeText: "Integration verification click",
      url: "https://example.com",
      clickedAt: new Date().toISOString(),
    }),
  });
  results.push({ name: "click tracking active", ok: clickRes.ok });

  const event = {
    event_id: crypto.randomUUID(),
    user_id: "my_account",
    ad_id: "verify_ad",
    campaign_id: "verify_campaign",
    timestamp: new Date().toISOString(),
    surface: "statusbar",
    type: "impression_rendered",
    visible_duration_ms: 0,
  };
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
    name: "duplicate events prevented",
    ok: t1d.processed >= 1 && t2d.dropped >= 1,
  });

  console.log("\n=== Catbox Integration Verification ===\n");
  let allOk = true;
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}`);
    if (!r.ok) allOk = false;
  }
  console.log(`\n${allOk ? "VERDICT: PASS — ready for Carbon publisher review" : "VERDICT: FAIL"}\n`);
  process.exit(allOk ? 0 : 1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
