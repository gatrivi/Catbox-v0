import type { ProviderReportEvent, ProviderReportResult } from "../reporting";

export function bsaReporterConfigured(): boolean {
  return Boolean(process.env.BSA_IMPRESSION_PIXEL || process.env.BSA_CLICK_PIXEL);
}

export async function reportBsaEvent(event: ProviderReportEvent): Promise<ProviderReportResult> {
  const template =
    event.type === "click" ? process.env.BSA_CLICK_PIXEL : process.env.BSA_IMPRESSION_PIXEL;
  if (!template) {
    return { ok: true, skipped: true, reason: "no_bsa_config" };
  }

  const url = template
    .replace(/\{creativeId\}/g, event.creativeId)
    .replace(/\{campaignId\}/g, event.campaignId || "");

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { signal: controller.signal, method: "GET" });
    clearTimeout(timeoutId);
    return { ok: response.ok };
  } catch (err: any) {
    return { ok: false, reason: err.message };
  }
}
