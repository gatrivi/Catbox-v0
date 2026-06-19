import { fetchSecureManifest } from "../manifestEngine";
import type { AdProvider } from "../../types";
import type { AdContext, ProviderAdapter } from "./types";
import { loadLocalFixture } from "./loadFixture";

/** Direct sponsor deals — fixed monthly terminal placements. */
export const directSponsorAdapter: ProviderAdapter = {
  type: "direct_sponsor",
  async fetchCreatives(provider, _ctx?: AdContext) {
    if (provider.baseUrl) {
      const manifestPath = provider.manifestPath || "/manifest.json";
      const url = provider.baseUrl.replace(/\/$/, "") + manifestPath;
      const items = await fetchSecureManifest(url);
      if (items.length > 0) return items;
    }

    const slug = provider.id.replace(/^prov_/, "");
    return loadLocalFixture(`direct-${slug}`);
  },
};
