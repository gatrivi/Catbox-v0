import * as crypto from "crypto";
import type { AdProvider } from "../../types";
import type { AdManifestItem } from "../manifestEngine";
import type { AdContext, ProviderAdapter } from "./types";
import { hashAdCore } from "./hash";
import { loadLocalFixture } from "./loadFixture";
import { isLiveCpmMode } from "./liveMode";

export const ADSTERRA_PUBLISHER_API_BASE = "https://api3.adsterratools.com/publisher";

const DEFAULT_DISPLAY_TEXT = "Sponsored — tap to explore";

export function resolveSmartlinkUrl(provider?: AdProvider): string | null {
  const fromEnv = process.env.ADSTERRA_SMARTLINK_URL?.trim();
  if (fromEnv && !fromEnv.includes("example.com") && fromEnv.startsWith("http")) {
    return fromEnv;
  }
  const fromProvider = provider?.baseUrl?.trim();
  if (fromProvider?.startsWith("http")) {
    return fromProvider;
  }
  return null;
}

export function buildPlacementSubId(ctx?: AdContext): string {
  const surface = ctx?.surface || "terminal";
  const suffix = crypto.randomBytes(4).toString("hex");
  return `catbox_${surface}_${Date.now().toString(36)}_${suffix}`;
}

export function appendPlacementSubId(smartlinkUrl: string, subId: string): string {
  const url = new URL(smartlinkUrl);
  url.searchParams.set("placement_sub_id", subId);
  return url.toString();
}

export function buildSmartlinkManifestItem(
  smartlinkUrl: string,
  ctx?: AdContext,
  displayText?: string
): AdManifestItem {
  const subId = buildPlacementSubId(ctx);
  const placementId = process.env.ADSTERRA_PLACEMENT_ID || "smartlink";
  const text = (displayText || process.env.ADSTERRA_DISPLAY_TEXT || DEFAULT_DISPLAY_TEXT).slice(
    0,
    120
  );
  const link = appendPlacementSubId(smartlinkUrl, subId);
  const id = `adsterra_${placementId}_${subId}`;
  const core = { id, text, link };
  return { ...core, hash: hashAdCore(core) };
}

export interface AdsterraStatsParams {
  domainId?: string;
  placementId?: string;
  startDate: string;
  finishDate: string;
  groupBy?: string[];
}

export async function fetchAdsterraStats(
  params: AdsterraStatsParams
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const apiKey = process.env.ADSTERRA_API_KEY?.trim();
  if (!apiKey || apiKey === "your_api_token") {
    return { ok: false, error: "no_api_key" };
  }

  const qs = new URLSearchParams();
  const domainId = params.domainId || process.env.ADSTERRA_DOMAIN_ID;
  const placementId = params.placementId || process.env.ADSTERRA_PLACEMENT_ID;
  if (domainId) qs.set("domain", domainId);
  if (placementId) qs.set("placement", placementId);
  qs.set("start_date", params.startDate);
  qs.set("finish_date", params.finishDate);
  for (const group of params.groupBy || ["placement_sub_id"]) {
    qs.append("group_by[]", group);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(`${ADSTERRA_PUBLISHER_API_BASE}/stats.json?${qs}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "X-API-Key": apiKey,
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { ok: false, error: `http_${response.status}` };
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

/**
 * Adsterra Smartlink / Direct Link — URL-based delivery for terminal/CLI surfaces.
 * Publisher API is used for stats reconciliation only (not creative fetch).
 */
export const adsterraSmartlinkAdapter: ProviderAdapter = {
  type: "adsterra_smartlink",
  async fetchCreatives(provider, ctx?: AdContext) {
    const smartlinkUrl = resolveSmartlinkUrl(provider);

    if (smartlinkUrl) {
      return [buildSmartlinkManifestItem(smartlinkUrl, ctx)];
    }

    if (isLiveCpmMode()) {
      return [];
    }

    return loadLocalFixture("adsterra");
  },
};
