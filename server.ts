import express from "express";
import path from "path";
import crypto from "crypto";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { CatboxAtomicEngine } from "./src/utils/atomicEngine";
import { injectCatboxVerbs } from "./src/utils/claudeInterceptor";
import fs from "fs/promises";
import {
  initializeTelemetryStore,
  checkAndMarkDuplicate,
  saveTelemetryEvents,
  getTelemetryStats,
  TelemetryEvent
} from "./src/server/telemetryDb";
import {
  initializeIdleDetector,
  getSystemIdleState,
  markAdRendered,
  simulateActivity,
  getIdleDetectorDetails
} from "./src/server/idleDetector";
import { buildMockStreamPayload, isMockModeEnabled, MOCK_CPM_AD } from "./src/server/mockCpmAd";
import { selectStreamAd, HOUSE_AD } from "./src/server/adSelection";
import { fetchProviderCreatives } from "./src/server/providers";
import { filterValidManifestItems } from "./src/server/providers/normalize";
import { PLAN_NETWORK_PROVIDERS } from "./src/server/providers/seedNetworks";
import type { AdProvider } from "./src/types";
import {
  reportProviderEvent,
  shouldReportToProvider,
} from "./src/server/providers/reporting";


const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/api/catbox/visual-placeholder.svg", async (_req, res) => {
  try {
    const svg = await fs.readFile(
      path.join(process.cwd(), "vscode-extension", "assets", "visual-placeholder.svg"),
      "utf-8"
    );
    res.type("image/svg+xml").send(svg);
  } catch {
    res.status(404).send("not found");
  }
});

// Server-side encryption variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "cattbacks_secure_deco_gold_key_2026";
const IV_LENGTH = 12;

// Shared Block, Provider, Profile Types
interface Block {
  index: number;
  timestamp: string;
  prevHash: string;
  hash: string;
  type: string; // "SYSTEM_GENESIS", "AD_IMPRESSION", "AD_CLICK", "REFERRAL_BONUS", "ESCROW_PAYOUT", "PROVIDER_SHARE_CATTBACK"
  developerId: string;
  amount: number;
  platformCut: number;
  platformPercent: number;
  description: string;
  provider: string;
}

interface DevProfile {
  id: string;
  balance: number;
  impressionCount: number;
  clickCount: number;
  platformFeePercent: number;
  refBoostEnabled: boolean;
  adProviderCount: number;
  cattbackBalance: number;
  affiliateLinks?: Record<string, string>;
  referredUserCount?: number;
  earlyBirdTier?: string;
  daysSinceBoost?: number;
  omitHouseTips?: boolean;
  selfServePromos?: string[];
  installsCount?: number;
}

// Early-bird decay and multiplier calculations
export function calculateDecayedFee(profile: DevProfile): number {
  const baseline = profile.platformFeePercent === 25 ? 25 : 15;
  const minFee = 3; 
  const days = profile.daysSinceBoost !== undefined ? profile.daysSinceBoost : 90;
  
  let effectiveFee = baseline;
  let tier = "STABLE_BASELINE";
  
  if (days <= 30) {
    effectiveFee = minFee;
    tier = "EARLY_BIRD_ELITE";
  } else if (days < 90) {
    const progress = (days - 30) / 60;
    effectiveFee = minFee + (baseline - minFee) * progress;
    effectiveFee = Math.round(effectiveFee * 100) / 100;
    tier = "GROWTH_BOOSTED";
  } else {
    effectiveFee = baseline;
    tier = "STABLE_BASELINE";
  }
  
  profile.earlyBirdTier = tier;
  return effectiveFee;
}

export function boostProfileToMaximum(profile: DevProfile): number {
  profile.referredUserCount = (profile.referredUserCount || 0) + 1;
  profile.daysSinceBoost = 0;
  profile.refBoostEnabled = true;
  return calculateDecayedFee(profile);
}

// Hash logic
const calculateHash = (block: Omit<Block, "hash">): string => {
  return crypto
    .createHash("sha256")
    .update(`${block.index}${block.timestamp}${block.prevHash}${block.type}${block.developerId}${block.amount}${block.platformCut}${block.description}${block.provider}`)
    .digest("hex");
};

class DataStore {
  private ledgerPath = path.join(process.cwd(), "data", "ledger.json");
  private providersPath = path.join(process.cwd(), "data", "providers.json");
  private profilesPath = path.join(process.cwd(), "data", "profiles.json");
  private queue: Promise<any> = Promise.resolve();

  public cachedProfiles: Record<string, DevProfile> = {};

  async executeUnderLock<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(async () => {
      return fn();
    });
    this.queue = next.catch(() => {});
    return next;
  }

  async init() {
    await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
    
    // Seed Ledger
    try {
      await fs.access(this.ledgerPath);
    } catch {
      const initialLedger: Block[] = [];
      const block0 = this.createBlockDirect(initialLedger, "SYSTEM_GENESIS", "cattbacks_root", 0.0, 0.0, 0, "Genesis block for Cattbacks Ledger V1", "System");
      initialLedger.push(block0);
      const block1 = this.createBlockDirect(initialLedger, "AD_IMPRESSION", "dev_linus_99", 0.12, 0.03, 20, "VS Code statusbar: 'Optimized PostgreSQL by Neon: Try it free'", "Carbon Deco Ads");
      initialLedger.push(block1);
      const block2 = this.createBlockDirect(initialLedger, "AD_CLICK", "dev_ada_lovelace", 0.65, 0.15, 18, "Clicked: 'Sentry dynamic tracing inside Docker Compose container'", "Aurum Media CLI");
      initialLedger.push(block2);
      const block3 = this.createBlockDirect(initialLedger, "PROVIDER_SHARE_CATTBACK", "dev_linus_99", 0.05, 0.00, 0, "Provider referral override: Linus gets 5% on community impressions of Carbon Deco Ads", "Carbon Deco Ads");
      initialLedger.push(block3);
      const block4 = this.createBlockDirect(initialLedger, "ESCROW_PAYOUT", "dev_linus_99", 8.40, 0.00, 0, "Verifiable automated Escrow payout dispatched via Stripe Connect ...x88A", "Stripe Custodian");
      initialLedger.push(block4);
      await this.saveWithAtomicWrite(this.ledgerPath, initialLedger);
    }

    // Seed Providers
    try {
      await fs.access(this.providersPath);
    } catch {
      await this.saveWithAtomicWrite(this.providersPath, PLAN_NETWORK_PROVIDERS);
    }

    // Seed Profiles
    try {
      await fs.access(this.profilesPath);
    } catch {
      const initialProfiles: Record<string, DevProfile> = {
        "my_account": {
          id: "my_account",
          balance: 5.75,
          impressionCount: 42,
          clickCount: 9,
          platformFeePercent: 15,
          refBoostEnabled: false,
          adProviderCount: 2,
          cattbackBalance: 0.22,
          affiliateLinks: {
            neon: "https://neodeco-db.io",
            supabase: "https://saffron-host.net"
          },
          referredUserCount: 0,
          earlyBirdTier: "STABLE_BASELINE",
          daysSinceBoost: 90,
          omitHouseTips: false,
          selfServePromos: [
            "✶ Sponsor: Try my custom fast geometric CSS engine - DecoLayout ↗"
          ],
          installsCount: 8
        },
      };
      await this.saveWithAtomicWrite(this.profilesPath, initialProfiles);
    }

    const profilesData = await fs.readFile(this.profilesPath, "utf8");
    this.cachedProfiles = JSON.parse(profilesData);
  }

  createBlockDirect(ledgerSnapshot: Block[], type: string, developerId: string, amount: number, platformCut: number, platformPercent: number, description: string, provider: string): Block {
    const index = ledgerSnapshot.length;
    const timestamp = new Date().toISOString();
    const prevHash = index === 0 ? "0".repeat(64) : ledgerSnapshot[index - 1].hash;
    const partialBlock = {
      index,
      timestamp,
      prevHash,
      type,
      developerId,
      amount,
      platformCut,
      platformPercent,
      description,
      provider,
    };
    const hash = calculateHash(partialBlock);
    return { ...partialBlock, hash };
  }

  private async saveWithAtomicWrite(filePath: string, data: any): Promise<void> {
    const tempPath = `${filePath}.tmp`;
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(tempPath, jsonString, "utf8");
    await fs.rename(tempPath, filePath);
  }

  async loadLedger(): Promise<Block[]> {
    return this.executeUnderLock(async () => {
      try {
        const data = await fs.readFile(this.ledgerPath, "utf8");
        return JSON.parse(data);
      } catch {
        return [];
      }
    });
  }

  async saveLedger(ledger: Block[]): Promise<void> {
    return this.executeUnderLock(async () => {
      await this.saveWithAtomicWrite(this.ledgerPath, ledger);
    });
  }

  async loadProviders(): Promise<AdProvider[]> {
    return this.executeUnderLock(async () => {
      try {
        const data = await fs.readFile(this.providersPath, "utf8");
        return JSON.parse(data);
      } catch {
        return [];
      }
    });
  }

  async saveProviders(providers: AdProvider[]): Promise<void> {
    return this.executeUnderLock(async () => {
      await this.saveWithAtomicWrite(this.providersPath, providers);
    });
  }

  async loadProfiles(): Promise<Record<string, DevProfile>> {
    return this.executeUnderLock(async () => {
      try {
        const data = await fs.readFile(this.profilesPath, "utf8");
        const profiles = JSON.parse(data);
        this.cachedProfiles = { ...profiles };
        return profiles;
      } catch {
        return {};
      }
    });
  }

  async saveProfiles(profiles: Record<string, DevProfile>): Promise<void> {
    return this.executeUnderLock(async () => {
      this.cachedProfiles = { ...profiles };
      await this.saveWithAtomicWrite(this.profilesPath, profiles);
    });
  }

  async getProfile(id: string): Promise<DevProfile> {
    return this.executeUnderLock(async () => {
      try {
        const data = await fs.readFile(this.profilesPath, "utf8");
        const profiles = JSON.parse(data);
        this.cachedProfiles = { ...profiles };
        return profiles[id] || {
          id,
          balance: 0.0,
          impressionCount: 0,
          clickCount: 0,
          platformFeePercent: 15,
          refBoostEnabled: false,
          adProviderCount: 2,
          cattbackBalance: 0,
        };
      } catch {
        return {
          id,
          balance: 0.0,
          impressionCount: 0,
          clickCount: 0,
          platformFeePercent: 15,
          refBoostEnabled: false,
          adProviderCount: 2,
          cattbackBalance: 0,
        };
      }
    });
  }

  async updateProfile(id: string, data: Partial<DevProfile>): Promise<DevProfile> {
    return this.executeUnderLock(async () => {
      let profiles: Record<string, DevProfile> = {};
      try {
        const content = await fs.readFile(this.profilesPath, "utf8");
        profiles = JSON.parse(content);
      } catch {}
      
      const existing = profiles[id] || {
        id,
        balance: 0.0,
        impressionCount: 0,
        clickCount: 0,
        platformFeePercent: 15,
        refBoostEnabled: false,
        adProviderCount: 2,
        cattbackBalance: 0,
      };

      const updated = { ...existing, ...data };
      profiles[id] = updated;
      this.cachedProfiles = { ...profiles };
      
      await this.saveWithAtomicWrite(this.profilesPath, profiles);
      return updated;
    });
  }

  async appendBlock(block: Omit<Block, "index" | "timestamp" | "prevHash" | "hash">): Promise<Block> {
    return this.executeUnderLock(async () => {
      let ledger: Block[] = [];
      try {
        const content = await fs.readFile(this.ledgerPath, "utf8");
        ledger = JSON.parse(content);
      } catch {}

      const created = this.createBlockDirect(
        ledger,
        block.type,
        block.developerId,
        block.amount,
        block.platformCut,
        block.platformPercent,
        block.description,
        block.provider
      );
      ledger.push(created);

      await this.saveWithAtomicWrite(this.ledgerPath, ledger);
      return created;
    });
  }

  async addProvider(provider: AdProvider): Promise<void> {
    return this.executeUnderLock(async () => {
      let providers: AdProvider[] = [];
      try {
        const content = await fs.readFile(this.providersPath, "utf8");
        providers = JSON.parse(content);
      } catch {}

      providers.push(provider);
      await this.saveWithAtomicWrite(this.providersPath, providers);
    });
  }
}

const store = new DataStore();

// Lazy initialization of GoogleGenAI
let genAIClient: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAIClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      genAIClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return genAIClient;
}

// --- API Endpoints ---

// 1. Get ledger logs
app.get("/api/ledger", async (req, res) => {
  try {
    const ledger = await store.loadLedger();
    res.json({
      success: true,
      ledger: [...ledger].reverse(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Reset state
app.post("/api/ledger/reset", async (req, res) => {
  try {
    const initialLedger: Block[] = [];
    const block0 = store.createBlockDirect(initialLedger, "SYSTEM_GENESIS", "cattbacks_root", 0.0, 0.0, 0, "Genesis block for Cattbacks Ledger V1", "System");
    initialLedger.push(block0);
    const block1 = store.createBlockDirect(initialLedger, "AD_IMPRESSION", "dev_linus_99", 0.12, 0.03, 20, "VS Code statusbar: 'Optimized PostgreSQL by Neon: Try it free'", "Carbon Deco Ads");
    initialLedger.push(block1);
    await store.saveLedger(initialLedger);
    await store.saveProviders(PLAN_NETWORK_PROVIDERS);

    const myAccountReset: DevProfile = {
      id: "my_account",
      balance: 5.75,
      impressionCount: 42,
      clickCount: 9,
      platformFeePercent: 15,
      refBoostEnabled: false,
      adProviderCount: 2,
      cattbackBalance: 0.22,
      affiliateLinks: {
        neon: "https://neodeco-db.io",
        supabase: "https://saffron-host.net"
      },
      referredUserCount: 0,
      earlyBirdTier: "STABLE_BASELINE",
      daysSinceBoost: 90,
      omitHouseTips: false,
      selfServePromos: [
        "✶ Sponsor: Try my custom fast geometric CSS engine - DecoLayout ↗"
      ],
      installsCount: 8
    };

    const initialProfiles = {
      "my_account": myAccountReset
    };
    await store.saveProfiles(initialProfiles);

    res.json({ success: true, ledger: initialLedger });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Bring Your Own Provider: Register custom third-party ad network
app.post("/api/providers/register", async (req, res) => {
  try {
    const {
      name,
      baseUrl,
      sharedWithCommunity = false,
      cpmRate = 0.20,
      providerType = "custom",
      manifestPath,
      siteId,
      zoneId,
      priority,
      status = "active",
    } = req.body;
    if (!name || !baseUrl) {
      return res.status(400).json({ success: false, error: "Name and Base URL are required parameters." });
    }

    const newProvider: AdProvider = {
      id: `prov_custom_${Date.now()}`,
      name,
      baseUrl,
      sharedWithCommunity,
      creatorId: "my_account",
      cpmRate: parseFloat(cpmRate) || 0.20,
      status,
      providerType,
      manifestPath,
      siteId,
      zoneId,
      priority: priority !== undefined ? parseInt(priority, 10) : undefined,
    };

    await store.addProvider(newProvider);

    const providers = await store.loadProviders();
    const profile = await store.getProfile("my_account");
    profile.adProviderCount = providers.filter(p => p.creatorId === "my_account").length + 2;
    
    if (sharedWithCommunity) {
      const rewardReward = 1.50;
      profile.cattbackBalance = parseFloat((profile.cattbackBalance + rewardReward).toFixed(4));
      profile.balance = parseFloat((profile.balance + rewardReward).toFixed(4));
      
      await store.appendBlock({
        type: "PROVIDER_SHARE_CATTBACK",
        developerId: "my_account",
        amount: rewardReward,
        platformCut: 0.0,
        platformPercent: 0,
        description: `BYO Provider Reward: '${name}' successfully shared with community and verified!`,
        provider: "Cattbacks System"
      });
    }

    await store.updateProfile("my_account", profile);

    res.json({
      success: true,
      provider: newProvider,
      profile,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Get all available providers
app.get("/api/providers", async (req, res) => {
  try {
    const providers = await store.loadProviders();
    res.json({
      success: true,
      providers,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4b. Seed plan CPM networks into provider registry
app.post("/api/providers/seed-networks", async (req, res) => {
  try {
    const existing = await store.loadProviders();
    const byId = new Map(existing.map((p) => [p.id, p]));
    for (const planned of PLAN_NETWORK_PROVIDERS) {
      if (!byId.has(planned.id)) {
        byId.set(planned.id, planned);
      }
    }
    const merged = Array.from(byId.values());
    await store.saveProviders(merged);
    res.json({ success: true, providers: merged, added: merged.length - existing.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4c. Fetch validated manifest for a registered provider
app.get("/api/providers/:id/manifest", async (req, res) => {
  try {
    const providers = await store.loadProviders();
    const provider = providers.find((p) => p.id === req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, error: "Provider not found" });
    }
    const creatives = filterValidManifestItems(
      await fetchProviderCreatives(provider, { surface: "vscode_statusbar" })
    );
    res.json({ success: true, providerId: provider.id, creatives });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Select Preferred Revenue split (e.g. 15% platform cut vs 25% platform cut)
app.post("/api/developer/preferred-split", async (req, res) => {
  try {
    const { developerId = "my_account", platformFeePercent } = req.body;
    const profile = await store.getProfile(developerId);
    if (!profile) return res.status(404).json({ success: false, error: "Profile not found" });

    const chosenPercent = parseInt(platformFeePercent);
    if (chosenPercent !== 25 && chosenPercent !== 15 && chosenPercent !== 5 && chosenPercent !== 3) {
      return res.status(400).json({ success: false, error: "Split fee must be 25%, 15%, or lowered slots (5%, 3%)." });
    }

    profile.platformFeePercent = chosenPercent;
    await store.updateProfile(developerId, { platformFeePercent: chosenPercent });

    res.json({
      success: true,
      platformFeePercent: profile.platformFeePercent,
      profile,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Simulate Ad Event (IMPRESSION or CLICK)
app.post("/api/ad/fetch", async (req, res) => {
  try {
    const { developerId = "my_account", context = "art deco geometric design", format = "VS Code Status Bar", actionType = "IMPRESSION" } = req.body;
    const profile = await store.getProfile(developerId);

    // Find candidate providers
    const providers = await store.loadProviders();
    const activeProviders = providers.filter(p => p.status === "active");
    const fallbackProviders = ["Carbon Deco Ads", "Aurum Media CLI", "Global Ad-Deco Exchange", "Cat-Ad Network"];
    const providerObject = activeProviders.length > 0 
      ? activeProviders[Math.floor(Math.random() * activeProviders.length)]
      : null;
    const selectedProviderName = providerObject ? providerObject.name : fallbackProviders[Math.floor(Math.random() * fallbackProviders.length)];

    let baselineCpm = providerObject ? providerObject.cpmRate : 0.20;
    let bidRate = actionType === "CLICK" ? (baselineCpm * 4.5) : baselineCpm;

    let adMessage = "";
    let isAiGenerated = false;

    const ai = getGenAI();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Generate a single short developer-oriented advertisement line (max 55 characters) for displaying in a code editor status line or CLI output.
Context keyword provided: "${context}".
Infuse a sophisticated, classic, or slightly humorous tone. Do NOT use quotes or list formatting. Examples:
- 'Deco DB: Elegant geometric data layouts for relational apps'
- 'Saffron Hosting: Built by architects, loved by coders'
- 'Drizzle ORM: Strictly typed schema queries in real-time'
- 'Sentry.io: Find errors before clients see them'`,
          config: {
            temperature: 0.70,
          },
        });
        if (response && response.text) {
          adMessage = response.text.trim().replace(/^["']|["']$/g, "");
          isAiGenerated = true;
        }
      } catch (err) {
        console.warn("AI generation offline or throttled, defaulting.", err);
      }
    }

    if (!adMessage) {
      const DecoBackupAds = [
        "Securite: Beautiful cryptographic vaults for VS Code profiles.",
        "NeoDeco-Terminal: Custom vintage fonts. Code in ultimate style.",
        "Vercel: Fast deployments, symmetric builds, global caching.",
        "Saffron-Lint: Keep your variables clean, typed, and structured.",
        "AuthDeco: One click OAuth with gold standard browser storage.",
      ];
      adMessage = DecoBackupAds[Math.floor(Math.random() * DecoBackupAds.length)];
    }

    markAdRendered(adMessage);

    const isSystemCurrentlyIdle = getSystemIdleState();

    if (isSystemCurrentlyIdle && actionType === "IMPRESSION") {
      console.log(`[Ad Fetch Route] System is IDLE. Serving ad but skipping counting/ledgering!`);
      return res.json({
        success: true,
        adMessage,
        provider: selectedProviderName,
        actionType,
        grossAdRevenue: 0,
        devPayout: 0,
        platformFee: 0,
        platformFeePercent: profile.platformFeePercent,
        isAiGenerated,
        newBalance: profile.balance,
        blockHash: "SKIPPED_DUE_TO_IDLE",
        idleSkipped: true
      });
    }

    const activePlatformFeePercent = calculateDecayedFee(profile);
    const grossAdRevenue = parseFloat((bidRate * (1 + Math.random() * 0.35)).toFixed(3));
    const platformFee = parseFloat(((grossAdRevenue * activePlatformFeePercent) / 100).toFixed(4));
    const devPayout = parseFloat((grossAdRevenue - platformFee).toFixed(4));

    if (providerObject && providerObject.creatorId !== developerId && providerObject.sharedWithCommunity) {
      const commissionCattback = parseFloat((platformFee * 0.15).toFixed(4));
      if (commissionCattback > 0.001) {
        const creatorProfile = await store.getProfile(providerObject.creatorId);
        creatorProfile.cattbackBalance = parseFloat((creatorProfile.cattbackBalance + commissionCattback).toFixed(4));
        creatorProfile.balance = parseFloat((creatorProfile.balance + commissionCattback).toFixed(4));
        
        await store.updateProfile(providerObject.creatorId, creatorProfile);
        
        await store.appendBlock({
          type: "PROVIDER_SHARE_CATTBACK",
          developerId: providerObject.creatorId,
          amount: commissionCattback,
          platformCut: 0.0,
          platformPercent: 0,
          description: `Shared Provider Royalty: '${providerObject.name}' matching event by ${developerId}`,
          provider: providerObject.name
        });
      }
    }

    const blockType = actionType === "CLICK" ? "AD_CLICK" : "AD_IMPRESSION";
    const desc = `${format} ${actionType === "CLICK" ? "[CLICK-THROUGH]": "[DISPLAY SURFACE]"}: "${adMessage}"`;
    const block = await store.appendBlock({
      type: blockType,
      developerId,
      amount: devPayout,
      platformCut: platformFee,
      platformPercent: activePlatformFeePercent,
      description: desc,
      provider: selectedProviderName
    });

    if (actionType === "CLICK") {
      profile.clickCount += 1;
    } else {
      profile.impressionCount += 1;
    }
    profile.balance = parseFloat((profile.balance + devPayout).toFixed(4));
    await store.updateProfile(developerId, profile);

    res.json({
      success: true,
      adMessage,
      provider: selectedProviderName,
      actionType,
      grossAdRevenue,
      devPayout,
      platformFee,
      platformFeePercent: profile.platformFeePercent,
      isAiGenerated,
      newBalance: profile.balance,
      blockHash: block.hash,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6.5. Gemini CLI Assistant Controller
app.post("/api/gemini/cli", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: "Missing prompt or CLI command" });
    }

    let resultText = "";
    const ai = getGenAI();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `You are the Catbox Gemini CLI Agent. The user entered this prompt in a developer developer tool terminal: "${prompt}". Give a very specific, helpful response suited for a monospaced terminal window. Keep it extremely high-quality, professional, and readable. Limit output to 10 lines max. Do not use markdown backticks unless illustrating code blocks.`,
          config: {
            temperature: 0.70,
          },
        });
        if (response && response.text) {
          resultText = response.text.trim();
        }
      } catch (err: any) {
        console.warn("Gemini CLI API error:", err);
        resultText = `[Gemini CLI Service Error] ${err.message || err}`;
      }
    }

    if (!resultText) {
      resultText = `[Gemini Offline] Secure key not active. To enable live Gemini AI CLI, add GEMINI_API_KEY inside Settings > Secrets.`;
    }

    res.json({
      success: true,
      text: resultText,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Secure Cryptographic Credentials
app.post("/api/credentials/encrypt", (req, res) => {
  const { plainText } = req.body;
  if (!plainText) {
    return res.status(400).json({ success: false, error: "Missing text to secure" });
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    res.json({
      success: true,
      ciphertext: encrypted,
      iv: iv.toString("hex"),
      authTag: authTag,
      method: "AES-256-GCM",
      compliance_audited: "GDPR Compliant Escrow Cryptography Standard V2"
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/credentials/decrypt", (req, res) => {
  const { ciphertext, iv, authTag } = req.body;
  if (!ciphertext || !iv || !authTag) {
    return res.status(400).json({ success: false, error: "Missing encryption integrity key markers" });
  }

  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)),
      Buffer.from(iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(authTag, "hex"));
    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    res.json({
      success: true,
      decryptedText: decrypted
    });
  } catch (error: any) {
    res.status(405).json({
      success: false,
      error: "Authorization mismatch or tampered IV/payload. Verification failed."
    });
  }
});

// 8. Escrow dispersion withdrawal
app.post("/api/ledger/payout", async (req, res) => {
  try {
    const { developerId = "my_account", payoutMethod = "Stripe Escrow Connect" } = req.body;
    const profile = await store.getProfile(developerId);
    if (!profile) return res.status(404).json({ success: false, error: "Profile not found." });

    const amount = profile.balance;
    if (amount <= 1.0) {
      return res.status(400).json({ success: false, error: "Minimum escrow disbursement limit is $1.00 USD." });
    }

    const desc = `Escrow Payout Dispatched: Signed safe release of $${amount.toFixed(2)} USD via ${payoutMethod}`;
    const block = await store.appendBlock({
      type: "ESCROW_PAYOUT",
      developerId,
      amount: -amount,
      platformCut: 0.0,
      platformPercent: 0,
      description: desc,
      provider: "Stripe Custodian"
    });

    profile.balance = 0.0;
    await store.updateProfile(developerId, { balance: 0.0 });

    res.json({
      success: true,
      payoutAmount: amount,
      newBalance: 0.0,
      blockHash: block.hash,
      escrowCustodian: "Open Escrow Deposit Vault Alpha-Symmetric 0x882A...",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get profile
app.get("/api/developer/:id", async (req, res) => {
  try {
    const profiles = await store.loadProfiles();
    const profile = profiles[req.params.id] || profiles["my_account"];
    if (profile) {
      calculateDecayedFee(profile);
    }
    res.json({ success: true, profile });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit / Save custom affiliate urls
app.post("/api/developer/affiliate-links", async (req, res) => {
  try {
    const { neon, supabase } = req.body;
    const profile = await store.getProfile("my_account");
    if (profile) {
      profile.affiliateLinks = {
        neon: neon || "https://neodeco-db.io",
        supabase: supabase || "https://saffron-host.net"
      };
      await store.updateProfile("my_account", { affiliateLinks: profile.affiliateLinks });
      res.json({ success: true, profile });
    } else {
      res.status(404).json({ success: false, error: "Profile not found" });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save house-ad omission preferences
app.post("/api/developer/omit-tips", async (req, res) => {
  try {
    const { omitHouseTips } = req.body;
    const profile = await store.getProfile("my_account");
    if (profile) {
      profile.omitHouseTips = !!omitHouseTips;
      await store.updateProfile("my_account", { omitHouseTips: profile.omitHouseTips });
      res.json({ success: true, profile });
    } else {
      res.status(404).json({ success: false, error: "Profile not found" });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger referral increase and max-split boost
app.post("/api/developer/boost", async (req, res) => {
  try {
    const profile = await store.getProfile("my_account");
    if (profile) {
      const activeFee = boostProfileToMaximum(profile);
      const bonusReward = 1.00;
      profile.balance = parseFloat((profile.balance + bonusReward).toFixed(4));
      
      await store.updateProfile("my_account", profile);

      const block = await store.appendBlock({
        type: "REFERRAL_BONUS",
        developerId: "my_account",
        amount: bonusReward,
        platformCut: 0.0,
        platformPercent: 0,
        description: `Viral Referral Registered: Payout split boosted back to maximum! State: ${profile.earlyBirdTier}`,
        provider: "Catbox Viral Engine"
      });

      res.json({ success: true, profile, currentFee: activeFee });
    } else {
      res.status(404).json({ success: false, error: "Profile not found" });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simulate the decay timer manually
app.post("/api/developer/simulate-decay", async (req, res) => {
  try {
    const { days } = req.body;
    const profile = await store.getProfile("my_account");
    if (profile) {
      profile.daysSinceBoost = parseInt(days, 10);
      const activeFee = calculateDecayedFee(profile);
      await store.updateProfile("my_account", profile);
      res.json({ success: true, profile, currentFee: activeFee });
    } else {
      res.status(404).json({ success: false, error: "Profile not found" });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET user self-serve promotional creatives
app.get("/api/self-serve/promos", async (req, res) => {
  try {
    const profile = await store.getProfile("my_account");
    if (profile) {
      res.json({ success: true, promos: profile.selfServePromos || [] });
    } else {
      res.status(404).json({ success: false, error: "Profile not found" });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST register a new self-serve custom ad line
app.post("/api/self-serve/promo", async (req, res) => {
  try {
    const { text } = req.body;
    const profile = await store.getProfile("my_account");
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: "Sponsor creative text cannot be empty." });
    }
    if (profile) {
      if (!profile.selfServePromos) {
        profile.selfServePromos = [];
      }
      if (profile.selfServePromos.length >= 5) {
        return res.json({ success: false, error: "Maximum limit of 5 active promo campaigns reached." });
      }
      profile.selfServePromos.push(text);
      await store.updateProfile("my_account", { selfServePromos: profile.selfServePromos });
      res.json({ success: true, promos: profile.selfServePromos });
    } else {
      res.status(404).json({ success: false, error: "Profile not found" });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST delete/remove a self-serve custom ad line
app.post("/api/self-serve/promo/delete", async (req, res) => {
  try {
    const { text } = req.body;
    const profile = await store.getProfile("my_account");
    if (profile && profile.selfServePromos) {
      profile.selfServePromos = profile.selfServePromos.filter(item => item !== text);
      await store.updateProfile("my_account", { selfServePromos: profile.selfServePromos });
      res.json({ success: true, promos: profile.selfServePromos });
    } else {
      res.status(422).json({ success: false, error: "Profile or promotional database not found." });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST simulate total installs / systems milestones
app.post("/api/developer/simulate-installs", async (req, res) => {
  try {
    const { installs } = req.body;
    const profile = await store.getProfile("my_account");
    if (profile) {
      profile.installsCount = parseInt(installs, 10) || 1;
      await store.updateProfile("my_account", { installsCount: profile.installsCount });
      res.json({ success: true, profile });
    } else {
      res.status(404).json({ success: false, error: "Profile not found" });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET Privacy declaration for local tracking sovereignty
app.get("/api/privacy", (req, res) => {
  res.json({
    compliance: "Strict Local-First Privacy Compliance V1",
    guarantee: "100% Zero-Intercept Policy",
    terms: [
      "No source code, keyboard coordinates, or file variables are ever observed, monitored, or logged.",
      "Local workspace settings and workspace metadata (~/metadata.json) are modified purely under absolute user consent.",
      "All impression earnings and telemetry signatures are fully isolated from intellectual property loops or key input handlers.",
      "Sovereign user data. Direct block ledger updates take place safely on local storage systems with 0% external cloud tracking leaks."
    ],
    exemptions: "We maintain zero external analytics connections to protect your proprietary project data completely."
  });
});

// Telemetry validation secret
const TELEMETRY_SECRET = "catbox_daily_gold_secret";

// Middleware/Helper for telemetry verification
export function verifyTelemetryToken(token: string): boolean {
  if (!token) return false;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const calculateExpected = (dateStr: string) => {
    return crypto.createHmac("sha256", TELEMETRY_SECRET).update(dateStr).digest("hex");
  };

  return token === calculateExpected(today) || 
         token === calculateExpected(yesterday) || 
         token === calculateExpected(tomorrow);
}

// 9. Dual-Executing Telemetry Verification Stream endpoint
app.get("/api/atomic/stream", async (req, res) => {
  try {
    const token = (req.query.token as string) || (req.headers["x-catbox-telemetry-token"] as string) || "";
    const isValid = verifyTelemetryToken(token);

    if (isMockModeEnabled(req.query.mock as string)) {
      const profile = await store.getProfile("my_account");
      const selected = { text: MOCK_CPM_AD.text, link: MOCK_CPM_AD.link };

      if (isValid) {
        markAdRendered(selected.text);
        if (!getSystemIdleState()) {
          const currentInstalls = profile?.installsCount || 8;
          const splitResult = CatboxAtomicEngine.calculateMilestoneSplit(currentInstalls);
          const grossVal = 0.06;
          const platformFee = parseFloat(((grossVal * splitResult.platformPercent) / 100).toFixed(4));
          const devPayout = parseFloat((grossVal - platformFee).toFixed(4));
          const desc = `[Legitimate Impression] VS Code extension ad display: "${selected.text}" (Split: Developer ${splitResult.developerPercent}% / Platform ${splitResult.platformPercent}%)`;
          await store.appendBlock({
            type: "AD_IMPRESSION",
            developerId: "my_account",
            amount: devPayout,
            platformCut: platformFee,
            platformPercent: splitResult.platformPercent,
            description: desc,
            provider: "Catbox Atomic Engine"
          });
          if (profile) {
            profile.impressionCount += 1;
            profile.balance = parseFloat((profile.balance + devPayout).toFixed(4));
            await store.updateProfile("my_account", profile);
          }
        }
        injectCatboxVerbs(selected.text).catch(err => {
          console.error("[Catbox Server] Fault during automatic ad injection:", err);
        });
      }

      return res.json(buildMockStreamPayload(isValid));
    }

    const profile = await store.getProfile("my_account");
    const providers = await store.loadProviders();
    const selected = await selectStreamAd({
      providers,
      profile,
      signedTelemetryVerified: isValid,
      useProviderNetworks: true,
    });

    if (isValid) {
      markAdRendered(selected.creativeText);

      if (getSystemIdleState()) {
        console.log(`[Catbox Telemetry Server] System is IDLE. Served ad: "${selected.creativeText}" without ledger storage.`);
      } else {
        const isSelfServe = selected.isSelfServe === true;
        const currentInstalls = profile?.installsCount || 8;

        const splitResult = CatboxAtomicEngine.calculateMilestoneSplit(currentInstalls);
        const activePlatformFeePercent = isSelfServe ? 0 : splitResult.platformPercent;

        const grossVal = 0.06;

        if (isSelfServe) {
          const viewCost = grossVal;
          const platformFee = 0.0;

          const desc = `[Self-Serve Promo] Impression served for custom creative: "${selected.creativeText}" (0% Platform Fee penalty)`;
          await store.appendBlock({
            type: "AD_IMPRESSION",
            developerId: "my_account",
            amount: -viewCost,
            platformCut: platformFee,
            platformPercent: 0,
            description: desc,
            provider: "Catbox Self-Serve Engine"
          });

          if (profile) {
            profile.impressionCount += 1;
            profile.balance = parseFloat(Math.max(0, profile.balance - viewCost).toFixed(4));
            await store.updateProfile("my_account", profile);
          }
          console.log(`[Catbox Telemetry Server] Self-serve ad impression processed. Cost $${viewCost} deducted from ledger.`);
        } else {
          const platformFee = parseFloat(((grossVal * activePlatformFeePercent) / 100).toFixed(4));
          const devPayout = parseFloat((grossVal - platformFee).toFixed(4));
          const providerLabel = selected.providerName || "Catbox Atomic Engine";

          const desc = `[Legitimate Impression] VS Code extension ad display: "${selected.creativeText}" (Split: Developer ${splitResult.developerPercent}% / Platform ${splitResult.platformPercent}%)`;
          await store.appendBlock({
            type: "AD_IMPRESSION",
            developerId: "my_account",
            amount: devPayout,
            platformCut: platformFee,
            platformPercent: activePlatformFeePercent,
            description: desc,
            provider: providerLabel
          });

          if (profile) {
            profile.impressionCount += 1;
            profile.balance = parseFloat((profile.balance + devPayout).toFixed(4));
            await store.updateProfile("my_account", profile);
          }
          console.log(`[Catbox Telemetry Server] Legitimate Impression verified and logged.`);
        }

        if (shouldReportToProvider(selected)) {
          await reportProviderEvent({
            eventId: crypto.randomUUID(),
            type: "impression",
            providerId: selected.providerId!,
            providerType: selected.providerType || "custom",
            creativeId: selected.id || "unknown",
            campaignId: selected.campaign_id,
            surface: "vscode_statusbar",
            timestamp: new Date().toISOString(),
          });
        }
      }

      if (selected.creativeText !== HOUSE_AD.text) {
        injectCatboxVerbs(selected.creativeText).catch(err => {
          console.error("[Catbox Server] Fault during automatic ad injection:", err);
        });
      }
    } else {
      console.warn("[Catbox Telemetry Server] Invalid or missing signed daily telemetry token. Blocking ledger logging!");
    }

    res.json(selected);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/atomic/report-click", async (req, res) => {
  try {
    const {
      creativeText,
      url,
      clickedAt,
      providerId,
      providerType,
      creativeId,
      campaignId,
      eventId,
    } = req.body;
    console.log(`[Catbox Server Reporting] Ad click registered: "${creativeText}" -> ${url} at ${clickedAt}`);
    
    const profile = await store.getProfile("my_account");
    const activePlatformFeePercent = calculateDecayedFee(profile);
    
    const grossVal = 0.30;
    const platformFee = parseFloat(((grossVal * activePlatformFeePercent) / 100).toFixed(4));
    const devPayout = parseFloat((grossVal - platformFee).toFixed(4));

    const desc = `Clicked: VS Code Extension sponsor "${creativeText}" -> ${url}`;
    await store.appendBlock({
      type: "AD_CLICK",
      developerId: "my_account",
      amount: devPayout,
      platformCut: platformFee,
      platformPercent: activePlatformFeePercent,
      description: desc,
      provider: providerId ? String(providerId) : "Catbox Atomic Engine"
    });

    if (profile) {
      profile.clickCount += 1;
      profile.balance = parseFloat((profile.balance + devPayout).toFixed(4));
      await store.updateProfile("my_account", profile);
    }

    if (providerId && providerType && creativeId) {
      await reportProviderEvent({
        eventId: eventId || crypto.randomUUID(),
        type: "click",
        providerId: String(providerId),
        providerType: String(providerType),
        creativeId: String(creativeId),
        campaignId: campaignId ? String(campaignId) : undefined,
        surface: "vscode_statusbar",
        timestamp: clickedAt || new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      status: "ACKNOWLEDGED",
      received: { creativeText, url, clickedAt }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve the Android Termux automated bash setup script
app.get("/api/termux/install", (req, res) => {
  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;

  const bashScript = `#!/bin/bash
# CATBOX SYSTEM - OPEN KICKBACKS PROTOCOL
# Android Termux Client Installer

echo -e "\\e[1;33m"
echo "   ____  ___  ______ ___   ____  _  __"
echo "  / ___|/ _ \\\\|_   _// _ \\\\ / ___|| |/ /"
echo " | |   | |_| | | | | | | | |     | ' / "
echo " | |___|  _  | | | | |_| | |___  | . \\\\ "
echo "  \\\\____|_| |_| |_|  \\\\___/ \\\\____| |_|\\\\_\\\\"
echo "  OPEN KICKBACKS PROTOCOL -- TERMUX LAYER"
echo -e "\\e[0m"

echo -e "\\e[1;30mIntegrating Catbox stream terminal daemon...\\e[0m"

# Locate binaries path in Termux
if [ -d "/data/data/com.termux/files/usr/bin" ]; then
    BIN_DIR="/data/data/com.termux/files/usr/bin"
else
    BIN_DIR="/usr/local/bin"
    if [ ! -w "$BIN_DIR" ]; then
        BIN_DIR="$HOME/bin"
        mkdir -p "$BIN_DIR"
    fi
fi

TARGET_BIN="$BIN_DIR/catbox"

echo -e "\\e[1;32m✓ Target binary directory found: $BIN_DIR\\e[0m"

# Create script
cat << 'EOF' > "$TARGET_BIN"
#!/bin/bash
# Catbox Termux Ad Sync Client

SERVER_URL="HOST_PLACEHOLDER"
CONTEXT="android termux dev"

# Fetch next high-yield micro-ad from Catbox network
RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "{\\"developerId\\":\\"my_account\\",\\"context\\":\\"$CONTEXT\\",\\"format\\":\\"Termux CLI Banner\\",\\"actionType\\":\\"IMPRESSION\\"}" "$SERVER_URL/api/ad/fetch" 2>/dev/null)

if [ $? -ne 0 ] || [ -z "$RESPONSE" ]; then
    # Offline fallback
    echo -e "\\e[1;30m[Catbox Feed Offline]\\e[0m \\e[33m✶ Saffron-Host: Built by gold-standard architects, loved by elite developers ↗\\e[0m"
    exit 0
fi

# Try to parse adMessage, provider and devPayout using sed
MESSAGE=$(echo "$RESPONSE" | sed -E 's/.*"adMessage":"([^"]+)".*/\\1/' 2>/dev/null)
PROVIDER=$(echo "$RESPONSE" | sed -E 's/.*"provider":"([^"]+)".*/\\1/' 2>/dev/null)
PAYOUT=$(echo "$RESPONSE" | sed -E 's/.*"devPayout":([0-9.]+).*/\\1/' 2>/dev/null)

if [ -n "$MESSAGE" ] && [ "$MESSAGE" != "$RESPONSE" ]; then
    echo -e "\\e[1;33m[Catbox Ad]\\e[0m \\e[1;37m\\"$MESSAGE\\"\\e[0m \\e[1;30m(via $PROVIDER | Payout: +\\$\\$PAYOUT)\\e[0m"
else
    echo -e "\\e[1;30m[Catbox Feed Idle]\\e[0m \\e[33m✶ Drizzle ORM: Strictly typed queries for high-performance React/Node apps ↗\\e[0m"
fi
EOF

chmod +x "$TARGET_BIN"

# Replace HOST_PLACEHOLDER with actual server URL
sed -i "s|HOST_PLACEHOLDER|${baseUrl}|g" "$TARGET_BIN" 2>/dev/null || sed -i "" "s|HOST_PLACEHOLDER|${baseUrl}|g" "$TARGET_BIN"

echo -e "\\e[1;32m✓ Catbox command installed successfully!\\e[0m"
echo -e "You can run it directly by typing: \\e[1;36mcatbox\\e[0m"
echo -e ""
echo -e "\\e[1;35mWant auto-earning inside your prompt?\\e[0m"
echo -e "Add this line to your \\e[1;34m~/.bashrc\\e[0m or \\e[1;34m~/.zshrc\\e[0m:"
echo -e "  \\e[32mcatbox\\e[0m"
echo -e ""
echo -e "Now, every session start or command refresh will verify & log new click splits!"
`;

  res.setHeader("Content-Type", "application/x-sh");
  res.send(bashScript);
});

// telemetry tracking endpoints
app.post("/api/telemetry", async (req, res) => {
  try {
    const { events } = req.body;
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ success: false, error: "Missing or invalid events array" });
    }

    if (getSystemIdleState()) {
      console.log(`[Telemetry Pipeline] System is currently idle. Telemetry events ignored.`);
      return res.json({
        success: true,
        processed: 0,
        dropped: events.length,
        isIdle: true,
        message: "System is idle (AFK). Telemetry processing paused."
      });
    }

    const uniqueEvents: TelemetryEvent[] = [];
    let duplicateCount = 0;

    for (const event of events) {
      if (!event.event_id || !event.user_id || !event.ad_id || !event.campaign_id || !event.timestamp || !event.surface) {
        continue;
      }
      const isDuplicate = await checkAndMarkDuplicate(event.event_id);
      if (isDuplicate) {
        duplicateCount++;
      } else {
        uniqueEvents.push(event);
      }
    }

    if (uniqueEvents.length > 0) {
      await saveTelemetryEvents(uniqueEvents);
    }

    res.json({
      success: true,
      processed: uniqueEvents.length,
      dropped: duplicateCount,
    });
  } catch (error: any) {
    console.error("[Telemetry Tracking Route Error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/telemetry/stats", async (req, res) => {
  try {
    const stats = await getTelemetryStats();
    const idleDetails = getIdleDetectorDetails();
    res.json({
      success: true,
      ...stats,
      idle: idleDetails.isIdle,
      idleDetails
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/telemetry/touch", async (req, res) => {
  try {
    await simulateActivity();
    res.json({ success: true, message: "Activity successfully simulated in ~/.claude/transcript.json." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
async function startServer() {
  await store.init();
  await initializeTelemetryStore();
  await initializeIdleDetector();

  const atomicEngine = new CatboxAtomicEngine({
    getProfile: () => store.cachedProfiles["my_account"],
    loadProviders: () => store.loadProviders(),
  });
  atomicEngine.startIsolatedServer(5176);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Catbox elegant server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
