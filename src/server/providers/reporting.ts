import fs from "fs/promises";
import path from "path";
import { checkAndMarkDuplicate } from "../telemetryDb";
import { reportCarbonEvent, carbonReporterConfigured } from "./reporting/carbon";
import { reportBsaEvent, bsaReporterConfigured } from "./reporting/buysellads";
import { reportPavedEvent, pavedReporterConfigured } from "./reporting/paved";
import { reportAdsterraEvent, adsterraReporterConfigured } from "./reporting/adsterra";
import type { StreamAdPayload } from "../adSelection";
import { HOUSE_AD } from "../adSelection";

export interface ProviderReportEvent {
  eventId: string;
  type: "impression" | "click";
  providerId: string;
  providerType: string;
  creativeId: string;
  campaignId?: string;
  surface: string;
  timestamp: string;
  reportUrl?: string;
}

export interface ProviderReportResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  dryRun?: boolean;
}

const AUDIT_PATH = path.join(process.cwd(), "data", "provider-reports.jsonl");

function providerHasOutboundConfig(providerType: string): boolean {
  switch (providerType) {
    case "carbon_cli":
      return carbonReporterConfigured();
    case "buysellads":
      return bsaReporterConfigured();
    case "paved":
      return pavedReporterConfigured();
    case "adsterra_smartlink":
      return adsterraReporterConfigured();
    default:
      return false;
  }
}

async function dispatchToProvider(event: ProviderReportEvent): Promise<ProviderReportResult> {
  switch (event.providerType) {
    case "carbon_cli":
      return reportCarbonEvent(event);
    case "buysellads":
      return reportBsaEvent(event);
    case "paved":
      return reportPavedEvent(event);
    case "adsterra_smartlink":
      return reportAdsterraEvent(event);
    default:
      return { ok: true, skipped: true, reason: "unsupported_provider" };
  }
}

async function appendAuditLog(
  event: ProviderReportEvent,
  result: ProviderReportResult
): Promise<void> {
  await fs.mkdir(path.dirname(AUDIT_PATH), { recursive: true });
  const line = JSON.stringify({
    ...event,
    result,
    loggedAt: new Date().toISOString(),
  });
  await fs.appendFile(AUDIT_PATH, line + "\n");
}

export function shouldReportToProvider(
  selected: StreamAdPayload & { isSelfServe?: boolean }
): boolean {
  if (!selected.providerId) return false;
  if (selected.campaign_id === "campaign_fallback") return false;
  if (selected.isSelfServe) return false;
  if (selected.creativeText === HOUSE_AD.text) return false;
  return true;
}

export async function reportProviderEvent(
  event: ProviderReportEvent
): Promise<ProviderReportResult> {
  const dedupeKey = `provider_report:${event.eventId}`;
  const isDuplicate = await checkAndMarkDuplicate(dedupeKey);
  if (isDuplicate) {
    return { ok: true, skipped: true, reason: "duplicate" };
  }

  const forceDryRun = process.env.CATBOX_REPORT_DRY_RUN === "1";
  const noOutbound = !providerHasOutboundConfig(event.providerType);

  let result: ProviderReportResult;
  if (forceDryRun || noOutbound) {
    result = { ok: true, dryRun: true, reason: forceDryRun ? "dry_run" : "audit_only" };
  } else {
    result = await dispatchToProvider(event);
  }

  await appendAuditLog(event, result);
  return result;
}

export async function readProviderReportCount(): Promise<number> {
  try {
    const raw = await fs.readFile(AUDIT_PATH, "utf8");
    return raw.trim() ? raw.trim().split("\n").length : 0;
  } catch {
    return 0;
  }
}

export { AUDIT_PATH };
