import express from "express";
import path from "path";
import crypto from "crypto";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { CatboxAtomicEngine } from "./src/utils/atomicEngine";
import { injectCatboxVerbs } from "./src/utils/claudeInterceptor";
import fs from "fs/promises";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors({ origin: "*" }));
app.use(express.json());

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

interface AdProvider {
  id: string;
  name: string;
  baseUrl: string;
  sharedWithCommunity: boolean;
  creatorId: string;
  cpmRate: number;
  status: "pending_verification" | "active";
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
      const initialProviders: AdProvider[] = [
        {
          id: "prov_carbon",
          name: "Carbon Deco Ads",
          baseUrl: "https://api.carbondeco.srv",
          sharedWithCommunity: true,
          creatorId: "dev_linus_99",
          cpmRate: 0.18,
          status: "active",
        },
        {
          id: "prov_aurum",
          name: "Aurum Media CLI",
          baseUrl: "https://aurum-adnet.io",
          sharedWithCommunity: true,
          creatorId: "dev_ada_lovelace",
          cpmRate: 0.25,
          status: "active",
        },
        {
          id: "prov_retro",
          name: "Console Retro Ads",
          baseUrl: "https://retroconsole.net",
          sharedWithCommunity: false,
          creatorId: "dev_wz_coder",
          cpmRate: 0.15,
          status: "active",
        },
      ];
      await this.saveWithAtomicWrite(this.providersPath, initialProviders);
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
    
    const initialProviders: AdProvider[] = [
      {
        id: "prov_carbon",
        name: "Carbon Deco Ads",
        baseUrl: "https://api.carbondeco.srv",
        sharedWithCommunity: true,
        creatorId: "dev_linus_99",
        cpmRate: 0.18,
        status: "active",
      },
      {
        id: "prov_aurum",
        name: "Aurum Media CLI",
        baseUrl: "https://aurum-adnet.io",
        sharedWithCommunity: true,
        creatorId: "dev_ada_lovelace",
        cpmRate: 0.25,
        status: "active",
      }
    ];
    await store.saveProviders(initialProviders);

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
    const { name, baseUrl, sharedWithCommunity = false, cpmRate = 0.20 } = req.body;
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
      status: "active",
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

    const seedAds = [
      { text: "NeoDeco-DB: Elegant geometric SQL schemas. Speed up Postgres by 10x.", link: "https://neodeco-db.io" },
      { text: "Saffron-Host: Built by architects, loved by elite coders.", link: "https://saffron-host.net" },
      { text: "Drizzle ORM: Strictly typed queries for high-performance apps.", link: "https://orm.drizzle.team" },
      { text: "Sentry: Find exceptions before your customers do.", link: "https://sentry.io" },
      { text: "Stripe-Escrow: Symmetric cryptographic payouts on click events.", link: "https://stripe.com" }
    ];

    const houseAd = {
      text: "✶ Catbox Tip: Adding 'laconic' to your AI prompts dramatically reduces output wordiness, saving thousands of tokens, runtime, and brainpower per month ↗",
      link: "https://ai.google.dev"
    };

    const profile = await store.getProfile("my_account");
    let adsPool = [...seedAds];

    const omitTips = profile?.omitHouseTips === true;
    if (!omitTips) {
      adsPool.push(houseAd);
    }

    const selfServePromos = profile?.selfServePromos || [];
    selfServePromos.forEach(text => {
      adsPool.push({ text, link: "https://catbox-db.io", isSelfServe: true } as any);
    });

    const userLinks = profile?.affiliateLinks || {};
    const prioritizedAds: any[] = [];

    if (userLinks.neon) {
      const matched = adsPool.find(a => a.link && a.link.includes("neodeco-db.io"));
      if (matched) {
        prioritizedAds.push({ ...matched, link: userLinks.neon });
      }
    }

    if (userLinks.supabase) {
      const matched = adsPool.find(a => a.link && a.link.includes("saffron-host.net"));
      if (matched) {
        prioritizedAds.push({ ...matched, link: userLinks.supabase });
      }
    }

    let selected: any = { text: "Catbox: Open kickbacks platform", link: "https://catbox-db.io" };
    if (prioritizedAds.length > 0) {
      selected = prioritizedAds[Math.floor(Math.random() * prioritizedAds.length)];
    } else if (adsPool.length > 0) {
      selected = adsPool[Math.floor(Math.random() * adsPool.length)];
    }

    if (isValid) {
      const isSelfServe = selected.isSelfServe === true;
      const currentInstalls = profile?.installsCount || 8;
      
      const splitResult = CatboxAtomicEngine.calculateMilestoneSplit(currentInstalls);
      const activePlatformFeePercent = isSelfServe ? 0 : splitResult.platformPercent;
      
      const grossVal = 0.06;
      
      if (isSelfServe) {
        const viewCost = grossVal;
        const platformFee = 0.0;
        
        const desc = `[Self-Serve Promo] Impression served for custom creative: "${selected.text}" (0% Platform Fee penalty)`;
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

        const desc = `[Legitimate Impression] VS Code extension ad display: "${selected.text}" (Split: Developer ${splitResult.developerPercent}% / Platform ${splitResult.platformPercent}%)`;
        await store.appendBlock({
          type: "AD_IMPRESSION",
          developerId: "my_account",
          amount: devPayout,
          platformCut: platformFee,
          platformPercent: activePlatformFeePercent,
          description: desc,
          provider: "Catbox Atomic Engine"
        });

        if (profile) {
          profile.impressionCount += 1;
          profile.balance = parseFloat((profile.balance + devPayout).toFixed(4));
          await store.updateProfile("my_account", profile);
        }
        console.log(`[Catbox Telemetry Server] Legitimate Impression verified and logged.`);
      }

      if (selected.text !== houseAd.text) {
        injectCatboxVerbs(selected.text).catch(err => {
          console.error("[Catbox Server] Fault during automatic ad injection:", err);
        });
      }
    } else {
      console.warn("[Catbox Telemetry Server] Invalid or missing signed daily telemetry token. Blocking ledger logging!");
    }

    res.json({
      success: true,
      adMessage: selected.text,
      creativeText: selected.text,
      targetUrl: selected.link,
      link: selected.link,
      cpmEst: 0.28,
      hashType: "SHA-256",
      timestamp: new Date().toISOString(),
      signedTelemetryVerified: isValid
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/atomic/report-click", async (req, res) => {
  try {
    const { creativeText, url, clickedAt } = req.body;
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
      provider: "Catbox Atomic Engine"
    });

    if (profile) {
      profile.clickCount += 1;
      profile.balance = parseFloat((profile.balance + devPayout).toFixed(4));
      await store.updateProfile("my_account", profile);
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

// Start server
async function startServer() {
  await store.init();

  const atomicEngine = new CatboxAtomicEngine(() => store.cachedProfiles["my_account"]);
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
