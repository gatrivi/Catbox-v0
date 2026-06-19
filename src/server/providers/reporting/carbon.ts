import type { ProviderReportEvent, ProviderReportResult } from "../reporting";

function expandTemplate(template: string, event: ProviderReportEvent): string {
  const zone = process.env.CARBON_CLI_ZONE_ID || "";
  return template
    .replace(/\{zone\}/g, zone)
    .replace(/\{creativeId\}/g, event.creativeId)
    .replace(/\{campaignId\}/g, event.campaignId || "")
    .replace(/\{eventId\}/g, event.eventId);
}

export function carbonReporterConfigured(): boolean {
  return Boolean(
    process.env.CARBON_IMPRESSION_URL ||
      process.env.CARBON_CLICK_URL ||
      process.env.CARBON_CLI_ZONE_ID
  );
}

export async function reportCarbonEvent(event: ProviderReportEvent): Promise<ProviderReportResult> {
  if (event.reportUrl) {
    return fireCarbonUrl(event.reportUrl);
  }

  const template =
    event.type === "click" ? process.env.CARBON_CLICK_URL : process.env.CARBON_IMPRESSION_URL;

  if (template) {
    return fireCarbonUrl(expandTemplate(template, event));
  }

  const zone = process.env.CARBON_CLI_ZONE_ID;
  if (!zone) {
    return { ok: true, skipped: true, reason: "no_carbon_config" };
  }

  const path = event.type === "click" ? "click" : "impression";
  const url = `https://srv.carbonads.net/ads/${zone}/${path}?creative=${encodeURIComponent(event.creativeId)}&campaign=${encodeURIComponent(event.campaignId || "")}`;
  return fireCarbonUrl(url);
}

async function fireCarbonUrl(url: string): Promise<ProviderReportResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      signal: controller.signal,
      method: "GET",
      headers: { "User-Agent": "Catbox-ProviderReporter/1.0" },
    });
    clearTimeout(timeoutId);
    return { ok: response.ok, reason: response.ok ? undefined : `http_${response.status}` };
  } catch (err: any) {
    return { ok: false, reason: err.message };
  }
}
