import * as crypto from "crypto";
import type { AdManifestItem } from "./manifestEngine";

const MOCK_CORE = {
  id: "mock_aurum_auth",
  text: "Secure your routes with Aurum Auth. Promo CATTBACKS",
  link: "https://aurum-auth.io/discount=CATTBACKS",
};

export const MOCK_CPM_AD: AdManifestItem = {
  ...MOCK_CORE,
  hash: crypto.createHash("sha256").update(JSON.stringify(MOCK_CORE)).digest("hex"),
};

export const MOCK_CAMPAIGN_ID = "campaign_aurum";

export function isMockModeEnabled(queryMock?: string): boolean {
  return process.env.CATBOX_MOCK_AD === "1" || queryMock === "1";
}

export function getDailyTelemetryToken(): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  return crypto.createHmac("sha256", "catbox_daily_gold_secret").update(dateStr).digest("hex");
}

export function buildMockStreamPayload(signedTelemetryVerified: boolean) {
  const origin = process.env.CATBOX_PUBLIC_ORIGIN || "http://127.0.0.1:3000";
  return {
    success: true,
    adMessage: MOCK_CPM_AD.text,
    creativeText: MOCK_CPM_AD.text,
    targetUrl: MOCK_CPM_AD.link,
    link: MOCK_CPM_AD.link,
    id: MOCK_CPM_AD.id,
    hash: MOCK_CPM_AD.hash,
    imageUrl: `${origin}/api/catbox/visual-placeholder.svg`,
    campaign_id: MOCK_CAMPAIGN_ID,
    cpmEst: 10.0,
    hashType: "SHA-256",
    timestamp: new Date().toISOString(),
    signedTelemetryVerified,
  };
}
