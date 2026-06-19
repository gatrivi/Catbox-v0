import type { AdProvider, DevProfile } from "../types";
import type { TaggedCreative } from "./providers/types";
import { fetchAllProviderCreatives, selectWeightedCreative } from "./providers";
import { toManifestItem } from "./providers/hash";

export interface StreamAdPayload {
  success: boolean;
  adMessage: string;
  creativeText: string;
  targetUrl: string;
  link: string;
  id?: string;
  hash?: string;
  imageUrl?: string;
  campaign_id?: string;
  cpmEst: number;
  hashType: string;
  timestamp: string;
  signedTelemetryVerified: boolean;
  providerId?: string;
  providerName?: string;
  providerType?: string;
}

const HOUSE_AD = {
  text: "✶ Catbox Tip: Adding 'laconic' to your AI prompts dramatically reduces output wordiness, saving thousands of tokens, runtime, and brainpower per month ↗",
  link: "https://ai.google.dev",
};

const SEED_ADS: Array<{ text: string; link: string; isSelfServe?: boolean }> = [
  { text: "NeoDeco-DB: Elegant geometric SQL schemas. Speed up Postgres by 10x.", link: "https://neodeco-db.io" },
  { text: "Saffron-Host: Built by architects, loved by elite coders.", link: "https://saffron-host.net" },
  { text: "Drizzle ORM: Strictly typed queries for high-performance apps.", link: "https://orm.drizzle.team" },
  { text: "Sentry: Find exceptions before your customers do.", link: "https://sentry.io" },
  { text: "Stripe-Escrow: Symmetric cryptographic payouts on click events.", link: "https://stripe.com" },
];

function taggedToPayload(
  creative: TaggedCreative,
  signedTelemetryVerified: boolean
): StreamAdPayload {
  return {
    success: true,
    adMessage: creative.text,
    creativeText: creative.text,
    targetUrl: creative.link,
    link: creative.link,
    id: creative.id,
    hash: creative.hash,
    imageUrl: creative.imageUrl,
    campaign_id: `campaign_${creative.providerId}`,
    cpmEst: creative.cpmRate,
    hashType: "SHA-256",
    timestamp: new Date().toISOString(),
    signedTelemetryVerified,
    providerId: creative.providerId,
    providerName: creative.providerName,
    providerType: creative.providerType,
  };
}

function buildFallbackPool(profile: DevProfile | null): Array<{ text: string; link: string; isSelfServe?: boolean }> {
  let pool = [...SEED_ADS];

  if (!profile?.omitHouseTips) {
    pool.push(HOUSE_AD);
  }

  for (const text of profile?.selfServePromos || []) {
    pool.push({ text, link: "https://catbox-db.io", isSelfServe: true });
  }

  const userLinks = profile?.affiliateLinks || {};
  const prioritized: typeof pool = [];

  if (userLinks.neon) {
    const matched = pool.find((a) => a.link.includes("neodeco-db.io"));
    if (matched) prioritized.push({ ...matched, link: userLinks.neon });
  }
  if (userLinks.supabase) {
    const matched = pool.find((a) => a.link.includes("saffron-host.net"));
    if (matched) prioritized.push({ ...matched, link: userLinks.supabase });
  }

  if (prioritized.length > 0) return prioritized;
  return pool;
}

export async function selectStreamAd(options: {
  providers: AdProvider[];
  profile: DevProfile | null;
  signedTelemetryVerified: boolean;
  useProviderNetworks?: boolean;
}): Promise<StreamAdPayload & { isSelfServe?: boolean }> {
  const { providers, profile, signedTelemetryVerified, useProviderNetworks = true } = options;

  if (useProviderNetworks && providers.length > 0) {
    const networkPool = await fetchAllProviderCreatives(providers, {
      surface: "vscode_statusbar",
    });

    if (networkPool.length > 0) {
      const selected = selectWeightedCreative(networkPool);
      if (selected) return taggedToPayload(selected, signedTelemetryVerified);
    }
  }

  const fallbackPool = buildFallbackPool(profile);
  const pick = fallbackPool[Math.floor(Math.random() * fallbackPool.length)] || {
    text: "Catbox: Open kickbacks platform",
    link: "https://catbox-db.io",
  };

  const item = toManifestItem({ text: pick.text, link: pick.link });

  return {
    success: true,
    adMessage: item.text,
    creativeText: item.text,
    targetUrl: item.link,
    link: item.link,
    id: item.id,
    hash: item.hash,
    campaign_id: "campaign_fallback",
    cpmEst: 0.28,
    hashType: "SHA-256",
    timestamp: new Date().toISOString(),
    signedTelemetryVerified,
    isSelfServe: pick.isSelfServe === true,
  };
}

export { HOUSE_AD };
