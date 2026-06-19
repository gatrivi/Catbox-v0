import type { AdProvider } from "../../types";
import type { AdContext, ProviderAdapter } from "./types";
import { loadLocalFixture } from "./loadFixture";
import { normalizeManifestPayload } from "./normalize";

/** Sovrn — low-priority programmatic backfill. */
export const sovrnAdapter: ProviderAdapter = {
  type: "sovrn",
  async fetchCreatives(provider, ctx?: AdContext) {
    const siteId = provider.siteId || process.env.SOVRN_SITE_ID;
    if (siteId && process.env.SOVRN_API_KEY) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const response = await fetch(
          `https://api.sovrn.com/commerce/ads/${siteId}?surface=${ctx?.surface || "terminal"}`,
          {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${process.env.SOVRN_API_KEY}`,
              Accept: "application/json",
            },
          }
        );
        clearTimeout(timeoutId);
        if (response.ok) {
          const normalized = normalizeManifestPayload(await response.json());
          if (normalized.length > 0) return normalized;
        }
      } catch {
        /* fall through */
      }
    }

    if (provider.baseUrl) {
      const manifestPath = provider.manifestPath || "/manifest.json";
      const url = provider.baseUrl.replace(/\/$/, "") + manifestPath;
      try {
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        if (response.ok) {
          const normalized = normalizeManifestPayload(await response.json());
          if (normalized.length > 0) return normalized;
        }
      } catch {
        /* fall through */
      }
    }

    return loadLocalFixture("sovrn");
  },
};
