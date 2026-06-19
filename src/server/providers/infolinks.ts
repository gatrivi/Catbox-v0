import type { AdProvider } from "../../types";
import type { AdContext, ProviderAdapter } from "./types";
import { loadLocalFixture } from "./loadFixture";
import { normalizeManifestPayload } from "./normalize";

/** Infolinks — in-text native backfill. */
export const infolinksAdapter: ProviderAdapter = {
  type: "infolinks",
  async fetchCreatives(provider, _ctx?: AdContext) {
    const pid = provider.siteId || process.env.INFOLINKS_PID;
    if (pid && process.env.INFOLINKS_API_KEY) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const response = await fetch(
          `https://api.infolinks.com/publishers/${pid}/creatives`,
          {
            signal: controller.signal,
            headers: {
              "X-Api-Key": process.env.INFOLINKS_API_KEY,
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

    return loadLocalFixture("infolinks");
  },
};
