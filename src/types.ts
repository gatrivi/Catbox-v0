export interface Block {
  index: number;
  timestamp: string;
  prevHash: string;
  hash: string;
  type: string; // e.g., "SYSTEM_GENESIS", "AD_IMPRESSION", "AD_CLICK", "REFERRAL_BONUS", "ESCROW_PAYOUT", "PROVIDER_SHARE_CATTBACK"
  developerId: string;
  amount: number;
  platformCut: number;
  platformPercent: number;
  description: string;
  provider: string;
}

export type ProviderType =
  | "carbon_cli"
  | "buysellads"
  | "paved"
  | "sovrn"
  | "infolinks"
  | "direct_sponsor"
  | "custom";

export interface AdProvider {
  id: string;
  name: string;
  baseUrl: string;
  sharedWithCommunity: boolean; // if true, others can serve it and owner gets a cattback kickback reward
  creatorId: string;
  cpmRate: number; // e.g. $0.35 CPM
  status: "pending_verification" | "active";
  providerType?: ProviderType;
  manifestPath?: string; // default "/manifest.json"
  siteId?: string;
  zoneId?: string;
  priority?: number; // higher = preferred in weighted selection
}

export interface DevProfile {
  id: string;
  balance: number;
  impressionCount: number;
  clickCount: number;
  platformFeePercent: number; // e.g. chosen preferred split: 25, 15, or down to 3
  refBoostEnabled: boolean;
  adProviderCount: number;
  cattbackBalance: number; // accumulated cattbacks from sharing custom providers
  affiliateLinks?: Record<string, string>;
  referredUserCount?: number;
  earlyBirdTier?: string;
  daysSinceBoost?: number;
  omitHouseTips?: boolean;
  selfServePromos?: string[];
  installsCount?: number;
}

