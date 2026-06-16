import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Server-side encryption variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "cattbacks_secure_deco_gold_key_2026";
const IV_LENGTH = 12;

// Shared in-Memory State
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
  platformFeePercent: number; // customizable split: 25, 15, or down to 3
  refBoostEnabled: boolean;
  adProviderCount: number;
  cattbackBalance: number;
}

// Generate block hashes
const calculateHash = (block: Omit<Block, "hash">): string => {
  return crypto
    .createHash("sha256")
    .update(`${block.index}${block.timestamp}${block.prevHash}${block.type}${block.developerId}${block.amount}${block.platformCut}${block.description}${block.provider}`)
    .digest("hex");
};

const ledger: Block[] = [];

function createBlock(type: string, developerId: string, amount: number, platformCut: number, platformPercent: number, description: string, provider: string): Block {
  const index = ledger.length;
  const timestamp = new Date().toISOString();
  const prevHash = index === 0 ? "0".repeat(64) : ledger[index - 1].hash;
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

// Custom Ad Providers store with some initial seeded records
const customProviders: AdProvider[] = [
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
    sharedWithCommunity: false, // Private to creator
    creatorId: "dev_wz_coder",
    cpmRate: 0.15,
    status: "active",
  },
];

// Seed ledger historical logs
ledger.push(createBlock("SYSTEM_GENESIS", "cattbacks_root", 0.0, 0.0, 0, "Genesis block for Cattbacks Ledger V1", "System"));
ledger.push(createBlock("AD_IMPRESSION", "dev_linus_99", 0.12, 0.03, 20, "VS Code statusbar: 'Optimized PostgreSQL by Neon: Try it free'", "Carbon Deco Ads"));
ledger.push(createBlock("AD_CLICK", "dev_ada_lovelace", 0.65, 0.15, 18, "Clicked: 'Sentry dynamic tracing inside Docker Compose container'", "Aurum Media CLI"));
ledger.push(createBlock("PROVIDER_SHARE_CATTBACK", "dev_linus_99", 0.05, 0.00, 0, "Provider referral override: Linus gets 5% on community impressions of Carbon Deco Ads", "Carbon Deco Ads"));
ledger.push(createBlock("ESCROW_PAYOUT", "dev_linus_99", 8.40, 0.00, 0, "Verifiable automated Escrow payout dispatched via Stripe Connect ...x88A", "Stripe Custodian"));

const devProfiles: Record<string, DevProfile> = {
  "my_account": {
    id: "my_account",
    balance: 5.75,
    impressionCount: 42,
    clickCount: 9,
    platformFeePercent: 15, // Starts at 15, user can choose 15 or 25, or gain reductions
    refBoostEnabled: false,
    adProviderCount: 2,
    cattbackBalance: 0.22,
  },
};

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
app.get("/api/ledger", (req, res) => {
  res.json({
    success: true,
    ledger: [...ledger].reverse(),
  });
});

// 2. Reset state
app.post("/api/ledger/reset", (req, res) => {
  ledger.length = 0;
  ledger.push(createBlock("SYSTEM_GENESIS", "cattbacks_root", 0.0, 0.0, 0, "Genesis block for Cattbacks Ledger V1", "System"));
  ledger.push(createBlock("AD_IMPRESSION", "dev_linus_99", 0.12, 0.03, 20, "VS Code statusbar: 'Optimized PostgreSQL by Neon: Try it free'", "Carbon Deco Ads"));
  
  // Reset providers list to core seeds
  customProviders.length = 0;
  customProviders.push(
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
  );

  devProfiles["my_account"] = {
    id: "my_account",
    balance: 5.75,
    impressionCount: 42,
    clickCount: 9,
    platformFeePercent: 15,
    refBoostEnabled: false,
    adProviderCount: 2,
    cattbackBalance: 0.22,
  };

  res.json({ success: true, ledger });
});

// 3. Bring Your Own Provider: Register custom third-party ad network
app.post("/api/providers/register", (req, res) => {
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

  customProviders.push(newProvider);

  // If they shared it with others, they get a special reward and boost
  const profile = devProfiles["my_account"];
  profile.adProviderCount = customProviders.filter(p => p.creatorId === "my_account").length + 2;
  
  // Calculate potential platform fee reduction
  if (sharedWithCommunity) {
    // Sharing a custom provider grants a direct cattback bonus block too!
    const rewardReward = 1.50;
    profile.cattbackBalance = parseFloat((profile.cattbackBalance + rewardReward).toFixed(4));
    profile.balance = parseFloat((profile.balance + rewardReward).toFixed(4));
    
    const block = createBlock(
      "PROVIDER_SHARE_CATTBACK", 
      "my_account", 
      rewardReward, 
      0.0, 
      0, 
      `BYO Provider Reward: '${name}' successfully shared with community and verified!`, 
      "Cattbacks System"
    );
    ledger.push(block);
  }

  res.json({
    success: true,
    provider: newProvider,
    profile,
  });
});

// 4. Get all available providers
app.get("/api/providers", (req, res) => {
  res.json({
    success: true,
    providers: customProviders,
  });
});

// 5. Select Preferred Revenue split (e.g. 15% platform cut vs 25% platform cut)
app.post("/api/developer/preferred-split", (req, res) => {
  const { developerId = "my_account", platformFeePercent } = req.body;
  const profile = devProfiles[developerId];
  if (!profile) return res.status(404).json({ success: false, error: "Profile not found" });

  const chosenPercent = parseInt(platformFeePercent);
  if (chosenPercent !== 25 && chosenPercent !== 15 && chosenPercent !== 5 && chosenPercent !== 3) {
    return res.status(400).json({ success: false, error: "Split fee must be 25%, 15%, or lowered slots (5%, 3%)." });
  }

  profile.platformFeePercent = chosenPercent;
  devProfiles[developerId] = profile;

  res.json({
    success: true,
    platformFeePercent: profile.platformFeePercent,
    profile,
  });
});

// 6. Simulate Ad Event (IMPRESSION or CLICK)
app.post("/api/ad/fetch", async (req, res) => {
  const { developerId = "my_account", context = "art deco geometric design", format = "VS Code Status Bar", actionType = "IMPRESSION" } = req.body;
  const profile = devProfiles[developerId] || {
    id: developerId,
    balance: 0.0,
    impressionCount: 0,
    clickCount: 0,
    platformFeePercent: 15,
    refBoostEnabled: false,
    adProviderCount: 2,
    cattbackBalance: 0,
  };

  // Find candidate providers
  const activeProviders = customProviders.filter(p => p.status === "active");
  const fallbackProviders = ["Carbon Deco Ads", "Aurum Media CLI", "Global Ad-Deco Exchange", "Cat-Ad Network"];
  const providerObject = activeProviders.length > 0 
    ? activeProviders[Math.floor(Math.random() * activeProviders.length)]
    : null;
  const selectedProviderName = providerObject ? providerObject.name : fallbackProviders[Math.floor(Math.random() * fallbackProviders.length)];

  // base bidding metrics: clicks pay much higher than standard impressions
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

  // Calculate Revenue Splits based on selected platform fee
  const grossAdRevenue = parseFloat((bidRate * (1 + Math.random() * 0.35)).toFixed(3));
  const platformFee = parseFloat(((grossAdRevenue * profile.platformFeePercent) / 100).toFixed(4));
  const devPayout = parseFloat((grossAdRevenue - platformFee).toFixed(4));

  // Determine if this provider was invited/created by a third-party to issue a Cattback!
  let creatorCattbackBlock: Block | null = null;
  if (providerObject && providerObject.creatorId !== developerId && providerObject.sharedWithCommunity) {
    // Creator gets 10% cattback commission out of the platform cut!
    const commissionCattback = parseFloat((platformFee * 0.15).toFixed(4));
    if (commissionCattback > 0.001) {
      const creatorProfile = devProfiles[providerObject.creatorId] || devProfiles["my_account"];
      creatorProfile.cattbackBalance = parseFloat((creatorProfile.cattbackBalance + commissionCattback).toFixed(4));
      creatorProfile.balance = parseFloat((creatorProfile.balance + commissionCattback).toFixed(4));
      
      creatorCattbackBlock = createBlock(
        "PROVIDER_SHARE_CATTBACK",
        providerObject.creatorId,
        commissionCattback,
        0.0,
        0,
        `Shared Provider Royalty: '${providerObject.name}' matching event by ${developerId}`,
        providerObject.name
      );
    }
  }

  const blockType = actionType === "CLICK" ? "AD_CLICK" : "AD_IMPRESSION";
  const desc = `${format} ${actionType === "CLICK" ? "[CLICK-THROUGH]": "[DISPLAY SURFACE]"}: "${adMessage}"`;
  const block = createBlock(blockType, developerId, devPayout, platformFee, profile.platformFeePercent, desc, selectedProviderName);
  ledger.push(block);

  if (creatorCattbackBlock) {
    ledger.push(creatorCattbackBlock);
  }

  // Update profile
  if (actionType === "CLICK") {
    profile.clickCount += 1;
  } else {
    profile.impressionCount += 1;
  }
  profile.balance = parseFloat((profile.balance + devPayout).toFixed(4));
  devProfiles[developerId] = profile;

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
    res.status(400).json({
      success: false,
      error: "Authorization mismatch or tampered IV/payload. Verification failed."
    });
  }
});

// 8. Escrow dispersion withdrawal
app.post("/api/ledger/payout", (req, res) => {
  const { developerId = "my_account", payoutMethod = "Stripe Escrow Connect" } = req.body;
  const profile = devProfiles[developerId];
  if (!profile) return res.status(404).json({ success: false, error: "Profile not found." });

  const amount = profile.balance;
  if (amount <= 1.0) {
    return res.status(400).json({ success: false, error: "Minimum escrow disbursement limit is $1.00 USD." });
  }

  const desc = `Escrow Payout Dispatched: Signed safe release of $${amount.toFixed(2)} USD via ${payoutMethod}`;
  const block = createBlock("ESCROW_PAYOUT", developerId, -amount, 0.0, 0, desc, "Stripe Custodian");
  ledger.push(block);

  profile.balance = 0.0;
  devProfiles[developerId] = profile;

  res.json({
    success: true,
    payoutAmount: amount,
    newBalance: 0.0,
    blockHash: block.hash,
    escrowCustodian: "Open Escrow Deposit Vault Alpha-Symmetric 0x882A...",
  });
});

// Get profile
app.get("/api/developer/:id", (req, res) => {
  const profile = devProfiles[req.params.id] || devProfiles["my_account"];
  res.json({ success: true, profile });
});

// Start application server
async function startServer() {
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
    console.log(`Cattbacks elegant server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
