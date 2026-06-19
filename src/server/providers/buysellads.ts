import { fetchSecureManifest } from "../manifestEngine";
import type { AdProvider } from "../../types";
import type { AdContext, ProviderAdapter } from "./types";
import { loadLocalFixture } from "./loadFixture";
import { normalizeManifestPayload } from "./normalize";

/**
 * BuySellAds marketplace — direct tech/design placements.
 */
export const buySellAdsAdapter: ProviderAdapter = {
  type: "buysellads",
  async fetchCreatives(provider, _ctx?: AdContext) {
    const zoneKey = provider.zoneId || process.env.BSA_ZONE_KEY;
    const remoteUrl =
      process.env.BSA_MANIFEST_URL ||
      (zoneKey ? `https://cdn.buysellads.com/${zoneKey}/manifest.json` : null);

    if (remoteUrl) {
      return fetchSecureManifest(remoteUrl);
    }

    if (provider.baseUrl) {
      const manifestPath = provider.manifestPath || "/manifest.json";
      const url = provider.baseUrl.replace(/\/$/, "") + manifestPath;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "application/json", "User-Agent": "Catbox-Provider/1.0" },
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const normalized = normalizeManifestPayload(await response.json());
          if (normalized.length > 0) return normalized;
        }
      } catch {
        /* fall through to fixture */
      }
    }

    return loadLocalFixture("buysellads");
  },
};
