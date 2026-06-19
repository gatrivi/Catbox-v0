import { fetchSecureManifest } from "../manifestEngine";
import type { AdProvider } from "../../types";
import type { AdContext, ProviderAdapter, TaggedCreative } from "./types";
import { carbonCliAdapter } from "./carbon";
import { buySellAdsAdapter } from "./buysellads";
import { pavedAdapter } from "./paved";
import { sovrnAdapter } from "./sovrn";
import { infolinksAdapter } from "./infolinks";
import { directSponsorAdapter } from "./directSponsor";

const ADAPTERS: ProviderAdapter[] = [
  carbonCliAdapter,
  buySellAdsAdapter,
  pavedAdapter,
  directSponsorAdapter,
  sovrnAdapter,
  infolinksAdapter,
];

const customAdapter: ProviderAdapter = {
  type: "custom",
  async fetchCreatives(provider, _ctx?: AdContext) {
    const manifestPath = provider.manifestPath || "/manifest.json";
    const url = provider.baseUrl.replace(/\/$/, "") + manifestPath;
    return fetchSecureManifest(url);
  },
};

function resolveAdapter(provider: AdProvider): ProviderAdapter {
  const type = provider.providerType || "custom";
  return ADAPTERS.find((a) => a.type === type) || customAdapter;
}

export async function fetchProviderCreatives(
  provider: AdProvider,
  ctx?: AdContext
): Promise<TaggedCreative[]> {
  if (provider.status !== "active") return [];

  const adapter = resolveAdapter(provider);
  const items = await adapter.fetchCreatives(provider, ctx);

  return items.map((item) => ({
    ...item,
    providerId: provider.id,
    providerName: provider.name,
    cpmRate: provider.cpmRate,
    providerType: provider.providerType,
  }));
}

export async function fetchAllProviderCreatives(
  providers: AdProvider[],
  ctx?: AdContext
): Promise<TaggedCreative[]> {
  const active = providers.filter((p) => p.status === "active");
  const batches = await Promise.all(active.map((p) => fetchProviderCreatives(p, ctx)));
  return batches.flat();
}

export function selectWeightedCreative(pool: TaggedCreative[]): TaggedCreative | null {
  if (pool.length === 0) return null;

  const totalWeight = pool.reduce((sum, item) => sum + Math.max(item.cpmRate, 0.01), 0);
  let roll = Math.random() * totalWeight;

  for (const item of pool) {
    roll -= Math.max(item.cpmRate, 0.01);
    if (roll <= 0) return item;
  }

  return pool[pool.length - 1];
}

export { ADAPTERS };
