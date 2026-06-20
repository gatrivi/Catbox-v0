import { fetchAdsterraStats } from "../adsterra";
import type { ProviderReportEvent, ProviderReportResult } from "../reporting";

export function adsterraReporterConfigured(): boolean {
  const key = process.env.ADSTERRA_API_KEY?.trim();
  return Boolean(key && key !== "your_api_token");
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Adsterra Smartlink: never HTTP-follow the smartlink on impression (click fraud).
 * Impressions → audit-only ack. Clicks → audit + optional Publisher API stats pull.
 */
export async function reportAdsterraEvent(
  event: ProviderReportEvent
): Promise<ProviderReportResult> {
  if (event.type === "impression") {
    return { ok: true, reason: "smartlink_impression_audit_only" };
  }

  if (!adsterraReporterConfigured()) {
    return { ok: true, skipped: true, reason: "no_adsterra_api_key" };
  }

  const stats = await fetchAdsterraStats({
    startDate: todayUtc(),
    finishDate: todayUtc(),
    groupBy: ["placement_sub_id"],
  });

  if (!stats.ok) {
    return { ok: true, reason: `click_logged_stats_unavailable:${stats.error}` };
  }

  return { ok: true, reason: "click_logged_with_stats_snapshot" };
}
