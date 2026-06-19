import * as crypto from "crypto";
import {
  MOCK_CPM_AD,
  MOCK_CAMPAIGN_ID,
  getDailyTelemetryToken,
} from "../src/server/mockCpmAd";

const MAIN_URL = "http://127.0.0.1:3000";

async function assertServerReachable(): Promise<void> {
  try {
    const res = await fetch(`${MAIN_URL}/api/telemetry/stats`);
    if (!res.ok) {
      throw new Error(`stats HTTP ${res.status}`);
    }
  } catch {
    throw new Error(
      "Dev server not running. Start with: npm run dev (or set CATBOX_MOCK_AD=1 npm run dev)"
    );
  }
}

async function run(): Promise<void> {
  const results: { name: string; ok: boolean; detail?: string }[] = [];

  try {
    await assertServerReachable();
    results.push({ name: "dev server reachable", ok: true });
  } catch (e: any) {
    console.error("FAIL:", e.message);
    process.exit(1);
  }

  const token = getDailyTelemetryToken();

  // 1. Mock ad stream (same endpoint as VS Code extension)
  const streamRes = await fetch(
    `${MAIN_URL}/api/atomic/stream?token=${token}&mock=1`,
    { headers: { "x-catbox-telemetry-token": token } }
  );
  const streamData = await streamRes.json();
  const streamOk =
    streamRes.ok &&
    streamData.success === true &&
    streamData.id === MOCK_CPM_AD.id &&
    streamData.hash === MOCK_CPM_AD.hash &&
    streamData.creativeText === MOCK_CPM_AD.text &&
    streamData.signedTelemetryVerified === true;
  results.push({
    name: "atomic stream mock ad (:3000)",
    ok: streamOk,
    detail: streamOk ? undefined : JSON.stringify(streamData),
  });

  // 2. Touch activity (avoid idle drop)
  const touchRes = await fetch(`${MAIN_URL}/api/telemetry/touch`, { method: "POST" });
  results.push({ name: "telemetry touch", ok: touchRes.ok });

  // 3. Post impression_rendered event
  const eventId = crypto.randomUUID();
  const event = {
    event_id: eventId,
    user_id: "my_account",
    ad_id: MOCK_CPM_AD.id,
    campaign_id: MOCK_CAMPAIGN_ID,
    timestamp: new Date().toISOString(),
    surface: "statusbar",
    type: "impression_rendered",
    visible_duration_ms: 0,
  };

  const telemetryRes = await fetch(`${MAIN_URL}/api/telemetry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: [event] }),
  });
  const telemetryData = await telemetryRes.json();
  results.push({
    name: "telemetry impression_rendered",
    ok: telemetryRes.ok && telemetryData.success && telemetryData.processed >= 1,
    detail: JSON.stringify(telemetryData),
  });

  // 4. Stats show events
  const statsRes = await fetch(`${MAIN_URL}/api/telemetry/stats`);
  const statsData = await statsRes.json();
  const eventCount = Array.isArray(statsData.latest) ? statsData.latest.length : 0;
  results.push({
    name: "telemetry stats",
    ok: statsRes.ok && statsData.success && eventCount >= 1,
    detail: `latest=${eventCount}`,
  });

  // 5. Dedup same event_id
  const dupRes = await fetch(`${MAIN_URL}/api/telemetry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: [event] }),
  });
  const dupData = await dupRes.json();
  results.push({
    name: "telemetry dedup",
    ok: dupRes.ok && dupData.success && dupData.dropped >= 1,
    detail: JSON.stringify(dupData),
  });

  let allOk = true;
  for (const r of results) {
    const mark = r.ok ? "PASS" : "FAIL";
    console.log(`${mark}  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
    if (!r.ok) {
      allOk = false;
    }
  }

  console.log(allOk ? "\nPASS — CPM extension smoke test complete" : "\nFAIL — see details above");
  process.exit(allOk ? 0 : 1);
}

run().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
