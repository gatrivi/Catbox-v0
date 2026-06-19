import type { ProviderReportEvent, ProviderReportResult } from "../reporting";

export function pavedReporterConfigured(): boolean {
  return Boolean(process.env.PAVED_API_KEY && process.env.PAVED_REPORT_URL);
}

export async function reportPavedEvent(event: ProviderReportEvent): Promise<ProviderReportResult> {
  const apiKey = process.env.PAVED_API_KEY;
  const reportUrl = process.env.PAVED_REPORT_URL;
  if (!apiKey || !reportUrl) {
    return { ok: true, skipped: true, reason: "no_paved_config" };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(reportUrl, {
      signal: controller.signal,
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: event.type,
        creative_id: event.creativeId,
        campaign_id: event.campaignId,
        surface: event.surface,
        timestamp: event.timestamp,
        event_id: event.eventId,
      }),
    });
    clearTimeout(timeoutId);
    return { ok: response.ok };
  } catch (err: any) {
    return { ok: false, reason: err.message };
  }
}
