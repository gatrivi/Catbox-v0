import { fetchSecureManifest } from "../manifestEngine";
import type { AdProvider } from "../../types";
import type { AdContext, ProviderAdapter } from "./types";
import { loadLocalFixture } from "./loadFixture";
import { isLiveCpmMode } from "./liveMode";

/**
 * Carbon Ads CLI — text-native sponsorships for CLI/IDE/AI assistants.
 * @see https://www.carbonads.net/cli
 */
export const carbonCliAdapter: ProviderAdapter = {
  type: "carbon_cli",
  async fetchCreatives(provider, _ctx?: AdContext) {
    const zoneId = provider.zoneId || process.env.CARBON_CLI_ZONE_ID;
    const remoteUrl =
      process.env.CARBON_CLI_MANIFEST_URL ||
      (zoneId ? `https://srv.carbonads.net/ads/${zoneId}.json` : null);

    if (remoteUrl) {
      const items = await fetchSecureManifest(remoteUrl);
      if (items.length > 0) return items;
    }

    const manifestPath = provider.manifestPath || "/manifest.json";
    if (provider.baseUrl && !provider.baseUrl.includes("carbondeco.srv")) {
      const url = provider.baseUrl.replace(/\/$/, "") + manifestPath;
      const items = await fetchSecureManifest(url);
      if (items.length > 0) return items;
    }

    if (isLiveCpmMode()) {
      return [];
    }

    return loadLocalFixture("carbon-cli");
  },
};
