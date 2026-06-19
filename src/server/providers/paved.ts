import { fetchSecureManifest } from "../manifestEngine";
import type { AdProvider } from "../../types";
import type { AdContext, ProviderAdapter } from "./types";
import { loadLocalFixture } from "./loadFixture";
import { normalizeManifestPayload } from "./normalize";

/**
 * Paved Ad Network — programmatic native text for B2B inventory.
 */
export const pavedAdapter: ProviderAdapter = {
  type: "paved",
  async fetchCreatives(provider, _ctx?: AdContext) {
    const apiKey = process.env.PAVED_API_KEY;
    const publicationId = provider.siteId || process.env.PAVED_PUBLICATION_ID;

    if (apiKey && publicationId) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const response = await fetch(
          `https://api.paved.com/v1/publications/${publicationId}/ads`,
          {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${apiKey}`,
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
      const items = await fetchSecureManifest(url);
      if (items.length > 0) return items;
    }

    return loadLocalFixture("paved");
  },
};
