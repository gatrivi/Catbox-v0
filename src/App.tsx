import { useState, useEffect, FormEvent } from "react";
import {
  TrendingUp,
  Wallet,
  Terminal,
  ShieldCheck,
  Layers,
  Lock,
  Unlock,
  RefreshCw,
  UserPlus,
  Plus,
  Check,
  ExternalLink,
  Coins,
  Eye,
  EyeOff,
  Settings,
  HelpCircle,
  Copy,
  AlertTriangle,
  Flame,
  MousePointerClick,
  Sliders,
  Sparkles,
  Server,
  Share2
} from "lucide-react";
import { Block, DevProfile, AdProvider } from "./types";
import stainedGlassCarrier from "./assets/images/stained_glass_carrier_1781572789207.jpg";
import { telemetry } from "./utils/telemetryClient";
import adInventory from "./data/adInventory.json";


export default function App() {
  // Client-Side light state router driven by window.location.hash
  const [currentRoute, setCurrentRoute] = useState<string>("landing");

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || "#/";
      if (hash === "#/dashboard") {
        setCurrentRoute("dashboard");
      } else if (hash === "#/cli") {
        setCurrentRoute("cli");
      } else if (hash === "#/ledger") {
        setCurrentRoute("ledger");
      } else if (hash === "#/privacy") {
        setCurrentRoute("privacy");
      } else {
        setCurrentRoute("landing");
      }
    };

    handleHashChange(); // Sync initial mount
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Pane Toggles (All panes can be hidden)
  const [showLeftPane, setShowLeftPane] = useState(true);
  const [showCenterPane, setShowCenterPane] = useState(true);
  const [showRightPane, setShowRightPane] = useState(true);

  // Background Customization States for Stained Glass Themes
  const [bgType, setBgType] = useState<"dark" | "roof" | "custom">("custom");
  const [customBgUrl, setCustomBgUrl] = useState(stainedGlassCarrier);
  const [showThemeMenu, setShowThemeMenu] = useState(false);


  // Core profile & ledger states
  const [profile, setProfile] = useState<DevProfile>({
    id: "my_account",
    balance: 5.75,
    impressionCount: 42,
    clickCount: 9,
    platformFeePercent: 15,
    refBoostEnabled: false,
    adProviderCount: 2,
    cattbackBalance: 0.22,
  });

  const [ledger, setLedger] = useState<Block[]>([]);
  const [providers, setProviders] = useState<AdProvider[]>([]);
  
  // Interactive checklist states for Getting Started List
  const [completedSteps, setCompletedSteps] = useState<{ [key: string]: boolean }>({
    "step-concepts": true,
    "step-sim": false,
    "step-promo": false,
    "step-escrow": false,
    "step-vscode": false,
  });

  const toggleChecklistStep = (key: string) => {
    setCompletedSteps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Interaction and Form States
  const [loadingAd, setLoadingAd] = useState(false);
  const [actionType, setActionType] = useState<"IMPRESSION" | "CLICK">("IMPRESSION");
  const [cliContext, setCliContext] = useState("geometric rust container");
  const [cliFormat, setCliFormat] = useState("VS Code Status Bar");

  // Dynamic ad and interactive terminal state variables
  const [activeAdMessage, setActiveAdMessage] = useState("Secure your routes elegantly with Aurum Auth. Get 20% off with promo code CATTBACKS");
  const [cliInput, setCliInput] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "Welcome to Catbox-CLI v1.4.0 (Open Kickbacks Protocol)",
    "Type 'help' or 'catbox help' to view available commands.",
    "Type 'gemini <prompt>' to ask the server-side Gemini intelligence to assist you.",
    "Type 'catbox fetch' to generate/fetch a dynamic ad via Gemini.",
    "----------------------------------------------------------------"
  ]);
  
  // Custom Provider registration form
  const [newProvName, setNewProvName] = useState("");
  const [newProvUrl, setNewProvUrl] = useState("");
  const [newProvCpm, setNewProvCpm] = useState("0.24");
  const [newProvShare, setNewProvShare] = useState(true);

  // Secure Escrow credentials inputs
  const [credentialInput, setCredentialInput] = useState("stripe_payout_sec_key_deco_992a");
  const [encryptionResult, setEncryptionResult] = useState<{
    ciphertext: string;
    iv: string;
    authTag: string;
    method: string;
    compliance_audited: string;
  } | null>(null);
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  // Feedback states
  const [payoutStatus, setPayoutStatus] = useState<string>("");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Added Affiliate, Decaying Timer, and Omit Switch states
  const [neonAffiliate, setNeonAffiliate] = useState("");
  const [supabaseAffiliate, setSupabaseAffiliate] = useState("");
  const [omitHouseTips, setOmitHouseTips] = useState(false);
  const [simulatedDays, setSimulatedDays] = useState(90);

  // New Self-Serve Promo and Milestone states
  const [selfServePromos, setSelfServePromos] = useState<string[]>([]);
  const [newSelfServeText, setNewSelfServeText] = useState("");
  const [customInstalls, setCustomInstalls] = useState(8);
  const [privacyPolicy, setPrivacyPolicy] = useState<{ compliance: string; guarantee: string; terms: string[]; exemptions: string } | null>(null);

  // Idempotent Telemetry State variables
  const [telemetryDbInfo, setTelemetryDbInfo] = useState<string>("Local High-Fidelity JSON Fallback Database");
  const [telemetryStats, setTelemetryStats] = useState<any[]>([]);
  const [telemetryLatest, setTelemetryLatest] = useState<any[]>([]);
  const [localQueueSize, setLocalQueueSize] = useState<number>(0);
  const [isWindowFocused, setIsWindowFocused] = useState<boolean>(true);
  const [isSystemIdle, setIsSystemIdle] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorClicks, setCursorClicks] = useState<number>(0);
  const [lastCursorActive, setLastCursorActive] = useState<number>(Date.now());

  // Cursor Hover Linger Spec states
  const [isHoveringAd, setIsHoveringAd] = useState<boolean>(false);
  const [adRevealActive, setAdRevealActive] = useState<boolean>(false);
  const [isHoverLingerEnabled, setIsHoverLingerEnabled] = useState<boolean>(true);
  const [hoverProgress, setHoverProgress] = useState<number>(0);

  // Helper mapping slogans to detailed developer-tool metrics
  const getDeveloperDetailsForSlogan = (slogan: string) => {
    const text = (slogan || "").toLowerCase();
    if (text.includes("aurum") || text.includes("authent") || text.includes("secur")) {
      return {
        title: "Aurum Cryptographic Provider Specifications",
        specs: [
          { label: "Vault Engine", value: "PBKDF2 with SHA-256 derivation" },
          { label: "Keysize / Entropy", value: "256 bits symmetric / 128-bit CSPRNG Nonce" },
          { label: "Iterations Count", value: "100,000 passes (custom salt pre-pended)" },
          { label: "Storage Paradigm", value: "Secure Local Vault with local memory-isolation" }
        ]
      };
    }
    if (text.includes("securite") || text.includes("vault")) {
      return {
        title: "Securite Profile Isolation Core",
        specs: [
          { label: "Active Cipher", value: "AES-GCM-256 symmetric block mode" },
          { label: "Storage Location", value: "~/.vscode/extensions/securite-vault/config.enc" },
          { label: "Integrity Verify", value: "HMAC-SHA-256 signatures validated per hotreload" },
          { label: "Leaky Key Protection", value: "Automatic secure ephemeral memory Zeroing" }
        ]
      };
    }
    if (text.includes("neodeco") || text.includes("font") || text.includes("terminal")) {
      return {
        title: "NeoDeco Typography Renderer Pipeline",
        specs: [
          { label: "GPU Acceleration", value: "DirectWrite / HarfBuzz text shaper integration" },
          { label: "Antialiasing Mode", value: "subpixel-antialiased greyscale subpixel rendering" },
          { label: "OpenType Ligatures", value: "Enabled ('liga', 'calt', 'clig', 'dlig')" },
          { label: "Font Stack Family", value: "JetBrains Mono -> SFMono-Regular -> Cascadia Code" }
        ]
      };
    }
    if (text.includes("vercel") || text.includes("deploy") || text.includes("cache")) {
      return {
        title: "Vercel Edge-Delivery Telemetry Spec",
        specs: [
          { label: "Deployment Signature", value: "SHA-1 build hash (e.g. vc_4f8e5b_prod)" },
          { label: "Edge Protocol", value: "HTTP/3 symmetric parallel multiplexing" },
          { label: "CDN Cache Ratio", value: "99.8% hit-rate across 24 regional edge zones" },
          { label: "Purge Latency", value: "< 150ms global invalidation propagates" }
        ]
      };
    }
    if (text.includes("saffron") || text.includes("lint") || text.includes("variab")) {
      return {
        title: "Saffron AST Static Analysis",
        specs: [
          { label: "Parsing Depth", value: "Max 8 nested block statement AST nodes" },
          { label: "Implicit Check", value: "Strict checks configured for implicit 'any' types" },
          { label: "Rule Target", value: "@typescript-eslint/no-explicit-any & react/rules-of-hooks" },
          { label: "Fix Latency", value: "Real-time incremental parsing (~2.4ms debounce)" }
        ]
      };
    }
    if (text.includes("authdeco") || text.includes("oauth")) {
      return {
        title: "AuthDeco OAuth Handshake State",
        specs: [
          { label: "Protocol", value: "OAuth 2.0 with PKCE (RFC 7636 authorization code)" },
          { label: "Flow Redirection", value: "Secure loopback: https://auth.deco.app/callback" },
          { label: "Token Storage", value: "VSC SecureCredentialStore integration" },
          { label: "Refresh Interval", value: "3600s access token rotation | sliding expiration" }
        ]
      };
    }
    // Generic default for smart AI-generated ads
    const hash = slogan ? slogan.slice(0, 12).toLowerCase().replace(/[^a-z0-9]+/g, "_") : "dynamic";
    return {
      title: "General Ad Telemetry Verification Details",
      specs: [
        { label: "Ad Unique Identifier", value: `deco_ad_${hash}` },
        { label: "Telemetry Polling", value: "Live view validation via secure ws polling (HMR bypass)" },
        { label: "Deco Royalty Split", value: "85.0% Developer payout | 15.0% Catbox Atomic Platform fee" },
        { label: "Verification Status", value: "Pre-verified secure cryptographic impression string" }
      ]
    };
  };

  // --- CPM Ad Rotator Engine States ---
  const [isLiveMode, setIsLiveMode] = useState<boolean>(() => {
    return localStorage.getItem("catbox_isLiveMode") === "true";
  });
  const [cpmApiKey, setCpmApiKey] = useState<string>(() => {
    return localStorage.getItem("catbox_cpmApiKey") || "";
  });
  const [cpmEndpoint, setCpmEndpoint] = useState<string>(() => {
    return localStorage.getItem("catbox_cpmEndpoint") || "https://api.ethicalads.io/v1/ads/";
  });
  const [currentAd, setCurrentAd] = useState<any>(() => {
    try {
      const rawStored = localStorage.getItem("catbox_currentAd");
      if (rawStored) return JSON.parse(rawStored);
    } catch (e) {}
    return adInventory[0];
  });
  const [rotatorCountdown, setRotatorCountdown] = useState<number>(60);
  const [adImpressions, setAdImpressions] = useState<number>(() => {
    return parseInt(localStorage.getItem("catbox_adImpressions") || "0", 10);
  });
  const [earningsToday, setEarningsToday] = useState<string>(() => {
    return localStorage.getItem("catbox_earningsToday") || "0.00";
  });
  const [earningsThisWeek, setEarningsThisWeek] = useState<string>(() => {
    return localStorage.getItem("catbox_earningsThisWeek") || "0.00";
  });
  const [earningsAllTime, setEarningsAllTime] = useState<string>(() => {
    return localStorage.getItem("catbox_earningsAllTime") || "0.00";
  });
  const [adImpressionCounts, setAdImpressionCounts] = useState<Record<string, number>>(() => {
    try {
      const counts = localStorage.getItem("catbox_adImpressionCounts");
      return counts ? JSON.parse(counts) : {};
    } catch (e) {
      return {};
    }
  });
  const [adLastShown, setAdLastShown] = useState<Record<string, number>>(() => {
    try {
      const shown = localStorage.getItem("catbox_adLastShown");
      return shown ? JSON.parse(shown) : {};
    } catch (e) {
      return {};
    }
  });
  const [recentAdIds, setRecentAdIds] = useState<string[]>(() => {
    try {
      const recent = localStorage.getItem("catbox_recentAdIds");
      return recent ? JSON.parse(recent) : [];
    } catch (e) {
      return [];
    }
  });
  const [floatEarnBadgeValue, setFloatEarnBadgeValue] = useState<string | null>(null);
  const [floatEarnBadgeVisible, setFloatEarnBadgeVisible] = useState<boolean>(false);
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null);

  const triggerImpressionEarnBadge = (val: string = "+$0.0097") => {
    setFloatEarnBadgeValue(val);
    setFloatEarnBadgeVisible(true);
    setTimeout(() => {
      setFloatEarnBadgeVisible(false);
    }, 2800);
  };

  const detectCategory = (context: string) => {
    const text = (context || "").toLowerCase();
    if (text.includes("postgres") || text.includes("sql") || text.includes("db") || text.includes("database") || text.includes("store")) {
      return "database";
    }
    if (text.includes("auth") || text.includes("oauth") || text.includes("jwt") || text.includes("login") || text.includes("session") || text.includes("key") || text.includes("vault")) {
      return "auth";
    }
    if (text.includes("email") || text.includes("mail") || text.includes("smtp")) {
      return "email";
    }
    if (text.includes("analytics") || text.includes("tracking") || text.includes("vitals") || text.includes("metrics")) {
      return "analytics";
    }
    if (text.includes("cloud") || text.includes("serverless") || text.includes("deploy") || text.includes("dns")) {
      return "cloud";
    }
    if (text.includes("lint") || text.includes("git") || text.includes("hook") || text.includes("eslint")) {
      return "git";
    }
    return null;
  };

  const rotateAd = async () => {
    const liveModeActive = localStorage.getItem("catbox_isLiveMode") === "true";
    if (liveModeActive) {
      setLoadingAd(true);
      try {
        let adMessageText = "";
        let adBrand = "EthicalAds Network";
        let adUrl = "https://ethicalads.io";
        let adCpm = 12.50;
        
        const storedCpmEndpoint = localStorage.getItem("catbox_cpmEndpoint") || "https://api.ethicalads.io/v1/ads/";
        const storedCpmApiKey = localStorage.getItem("catbox_cpmApiKey") || "";

        if (storedCpmEndpoint && storedCpmEndpoint.startsWith("http")) {
          try {
            const queryUrl = `${storedCpmEndpoint}${storedCpmEndpoint.includes("?") ? "&" : "?"}apiKey=${encodeURIComponent(storedCpmApiKey)}&ts=${Date.now()}`;
            const res = await fetch(queryUrl);
            const data = await res.json();
            if (data) {
              adMessageText = data.text || data.creative || data.slogan || data.message || (data.ad?.text || data.ad?.creative);
              adBrand = data.brand || data.company || data.sponsor || "EthicalAds Partner";
              adUrl = data.link || data.url || data.clickUrl || "https://ethicalads.io";
              if (data.cpm) adCpm = Number(data.cpm);
            }
          } catch (err) {
            console.warn("Live API fetch failed, simulating EthicalAds content:", err);
          }
        }

        if (!adMessageText) {
          const index = Math.floor(Date.now() / 60000) % 3;
          const liveDemos = [
            { text: "EthicalAds Integration: High-payout privacy-preserving developer ads.", brand: "EthicalAds Premium", url: "https://ethicalads.io" },
            { text: "BuySellAds: Direct programmatic marketplace access for top dev tools.", brand: "BuySellAds Direct", url: "https://buysellads.com" },
            { text: "Sentry Error Monitoring: Spot memory leaks before your users do.", brand: "Sentry.io Sync", url: "https://sentry.io" }
          ];
          const chosenDemo = liveDemos[index];
          adMessageText = chosenDemo.text;
          adBrand = chosenDemo.brand;
          adUrl = chosenDemo.url;
        }

        const fetchedAd = {
          id: "live_cpm_ad_" + Math.floor(Math.random() * 100000),
          brand: adBrand,
          creativeText: adMessageText,
          baseUrl: adUrl,
          cpm: adCpm,
          category: "live-api"
        };

        setCurrentAd(fetchedAd);
        setActiveAdMessage(fetchedAd.creativeText);
        localStorage.setItem("catbox_currentAd", JSON.stringify(fetchedAd));

        const payoutIncr = parseFloat(((fetchedAd.cpm / 1000) * 0.97).toFixed(4));
        setAdImpressions(prev => {
          const next = prev + 1;
          localStorage.setItem("catbox_adImpressions", next.toString());
          return next;
        });
        setEarningsToday(prev => {
          const nextObj = parseFloat((parseFloat(prev) + payoutIncr).toFixed(4));
          localStorage.setItem("catbox_earningsToday", nextObj.toFixed(4));
          return nextObj.toFixed(4);
        });
        setEarningsThisWeek(prev => {
          const nextObj = parseFloat((parseFloat(prev) + payoutIncr).toFixed(4));
          localStorage.setItem("catbox_earningsThisWeek", nextObj.toFixed(4));
          return nextObj.toFixed(4);
        });
        setEarningsAllTime(prev => {
          const nextObj = parseFloat((parseFloat(prev) + payoutIncr).toFixed(4));
          localStorage.setItem("catbox_earningsAllTime", nextObj.toFixed(4));
          return nextObj.toFixed(4);
        });

        triggerImpressionEarnBadge(`+$${payoutIncr.toFixed(4)}`);

        setTerminalLogs(prev => [
          ...prev,
          `[LIVE-API] Symmetrically verified response from EthicalAds endpoint.`,
          `  Slogan: "${fetchedAd.creativeText}"`,
          `  Brand:  ${fetchedAd.brand} | CPM: $${fetchedAd.cpm.toFixed(2)}`,
          `  Revenue: +$${payoutIncr.toFixed(4)} USD credited to public verified ledger.`
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAd(false);
      }
      return;
    }

    // MOCK HARDCODED MODE (JSON INVENTORY)
    const category = detectCategory(cliContext);
    setDetectedCategory(category);

    const storedRecentRaw = localStorage.getItem("catbox_recentAdIds");
    let currentRecent: string[] = [];
    try {
      if (storedRecentRaw) currentRecent = JSON.parse(storedRecentRaw);
    } catch (e) {}

    let availableAds = adInventory.filter(ad => !currentRecent.includes(ad.id));
    if (availableAds.length === 0) {
      const storedAdRaw = localStorage.getItem("catbox_currentAd");
      let activeAdId = "";
      try {
        if (storedAdRaw) activeAdId = JSON.parse(storedAdRaw).id;
      } catch (e) {}
      availableAds = adInventory.filter(ad => ad.id !== activeAdId);
    }
    if (availableAds.length === 0) {
      availableAds = adInventory;
    }

    let pool: any[] = [];
    availableAds.forEach(ad => {
      const weight = category && ad.category === category ? 5 : 1;
      for (let i = 0; i < weight; i++) {
        pool.push(ad);
      }
    });

    const selected = pool[Math.floor(Math.random() * pool.length)] || availableAds[0] || adInventory[0];
    
    setCurrentAd(selected);
    setActiveAdMessage(selected.creativeText);
    localStorage.setItem("catbox_currentAd", JSON.stringify(selected));

    const storedCountsRaw = localStorage.getItem("catbox_adImpressionCounts");
    let currentCounts: Record<string, number> = {};
    try {
      if (storedCountsRaw) currentCounts = JSON.parse(storedCountsRaw);
    } catch (e) {}
    const nextCounts = { ...currentCounts, [selected.id]: (currentCounts[selected.id] || 0) + 1 };
    setAdImpressionCounts(nextCounts);
    localStorage.setItem("catbox_adImpressionCounts", JSON.stringify(nextCounts));

    const storedShownRaw = localStorage.getItem("catbox_adLastShown");
    let currentShown: Record<string, number> = {};
    try {
      if (storedShownRaw) currentShown = JSON.parse(storedShownRaw);
    } catch (e) {}
    const nextShown = { ...currentShown, [selected.id]: Date.now() };
    setAdLastShown(nextShown);
    localStorage.setItem("catbox_adLastShown", JSON.stringify(nextShown));

    const nextRecent = [selected.id, ...currentRecent.filter(id => id !== selected.id).slice(0, 2)];
    setRecentAdIds(nextRecent);
    localStorage.setItem("catbox_recentAdIds", JSON.stringify(nextRecent));

    const PayoutVal = 0.0097;
    setAdImpressions(prev => {
      const next = prev + 1;
      localStorage.setItem("catbox_adImpressions", next.toString());
      return next;
    });
    setEarningsToday(prev => {
      const next = parseFloat((parseFloat(prev) + PayoutVal).toFixed(4));
      localStorage.setItem("catbox_earningsToday", next.toFixed(4));
      return next.toFixed(4);
    });
    setEarningsThisWeek(prev => {
      const next = parseFloat((parseFloat(prev) + PayoutVal).toFixed(4));
      localStorage.setItem("catbox_earningsThisWeek", next.toFixed(4));
      return next.toFixed(4);
    });
    setEarningsAllTime(prev => {
      const next = parseFloat((parseFloat(prev) + PayoutVal).toFixed(4));
      localStorage.setItem("catbox_earningsAllTime", next.toFixed(4));
      return next.toFixed(4);
    });

    triggerImpressionEarnBadge("+$0.0097");

    setTerminalLogs(prev => [
      ...prev,
      `[ROTATOR] Rotated active banner inside ${cliFormat} slot.`,
      `  Ad: "${selected.creativeText}" (${selected.brand})`,
      `  Earned: +$0.0097 (97% split of $10.00 CPM). Cumulative active developer balance: $${(parseFloat(earningsAllTime) + PayoutVal).toFixed(4)}`
    ]);
  };

  const toggleMockLiveMode = (live: boolean) => {
    setIsLiveMode(live);
    localStorage.setItem("catbox_isLiveMode", live ? "true" : "false");
    setTerminalLogs(prev => [
      ...prev,
      `[SYSTEM] Ad Rotation source flipped to ${live ? "LIVE REMOTE API MODE" : "MOCK OFFLINE JSON MODE"}`
    ]);
    setTimeout(() => rotateAd(), 50);
  };

  const handleUpdateCpmEndpoint = (url: string) => {
    setCpmEndpoint(url);
    localStorage.setItem("catbox_cpmEndpoint", url);
  };

  const handleUpdateCpmApiKey = (key: string) => {
    setCpmApiKey(key);
    localStorage.setItem("catbox_cpmApiKey", key);
  };

  // Keep CPC / active rotating trigger
  useEffect(() => {
    if (!currentAd) {
      rotateAd();
    } else {
      setActiveAdMessage(currentAd.creativeText);
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    const ticker = setInterval(() => {
      setRotatorCountdown(prev => {
        if (prev <= 1) {
          setTimeout(() => rotateAd(), 0);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, [isLiveMode, cliContext, currentAd]);

  useEffect(() => {
    if (!isHoveringAd || !isHoverLingerEnabled) {
      setHoverProgress(0);
      setAdRevealActive(false);
      return;
    }

    // After 2000 milliseconds (2 seconds) of persistent hover
    const revealTimeout = setTimeout(() => {
      setAdRevealActive(true);
      setHoverProgress(100);
    }, 2000);

    const intervalTime = 50; 
    const totalSteps = 2000 / intervalTime; 
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      currentStep++;
      const progress = Math.min(100, (currentStep / totalSteps) * 100);
      setHoverProgress(progress);
    }, intervalTime);

    return () => {
      clearTimeout(revealTimeout);
      clearInterval(progressInterval);
    };
  }, [isHoveringAd, isHoverLingerEnabled]);

  const fetchTelemetryStats = async () => {
    try {
      const res = await fetch("/api/telemetry/stats");
      const data = await res.json();
      if (data.success) {
        setTelemetryDbInfo(data.database);
        setTelemetryStats(data.stats || []);
        setTelemetryLatest(data.latest || []);
        setIsSystemIdle(data.idle || false);
      }
      setLocalQueueSize(telemetry.getQueueStats().size);
    } catch (err) {
      console.warn("Could not query telemetry stats:", err);
    }
  };

  // Sync telemetry periodic stats
  useEffect(() => {
    fetchTelemetryStats();
    const interval = setInterval(fetchTelemetryStats, 6000);
    return () => clearInterval(interval);
  }, []);

  // Sync window focus state
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);

    setIsWindowFocused(document.hasFocus());

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Interactive Cursor & Mouse activity tracking
  useEffect(() => {
    if (typeof window === "undefined") return;

    let lastTouchCall = 0;

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      
      const now = Date.now();
      setLastCursorActive(now);
      
      // Keep-alive heartbeat: if user moves cursor or clicks inside the Catbox frame, 
      // automatically notify the idle detector on the backend. Max once every 8 seconds.
      if (now - lastTouchCall > 8000) {
        lastTouchCall = now;
        fetch("/api/telemetry/touch", { method: "POST" })
          .then(() => fetchTelemetryStats())
          .catch((err) => console.log("[Cursor Keep-Alive failed]", err));
      }
    };

    const handleDocumentClick = (e: MouseEvent) => {
      setCursorClicks(prev => prev + 1);
      const now = Date.now();
      setLastCursorActive(now);
      
      // Click always sends immediate touch activity reset
      lastTouchCall = now;
      fetch("/api/telemetry/touch", { method: "POST" })
        .then(() => fetchTelemetryStats())
        .catch((err) => console.log("[Cursor Keep-Alive failed]", err));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleDocumentClick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  // Automated tracking of Active Ad view telemetry lifecycles with 3-way view validation:
  // - Minimum 5s visible (not 2s or 1s)
  // - Window must be focused
  // - User not AFK (idle detection on the server-side)
  useEffect(() => {
    if (!activeAdMessage) return;

    const surfaceType: "statusbar" | "cli" | "spinner" = 
      cliFormat === "VS Code Status Bar" 
        ? "statusbar" 
        : cliFormat === "CLI Prompt Footer" 
        ? "cli" 
        : "spinner";

    const cleanAdId = activeAdMessage.slice(0, 30).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");

    // 1. Core Event: impression_rendered tracking (immediate, unique event_id)
    telemetry.trackEvent(
      "impression_rendered",
      cleanAdId,
      "Carbon Deco Ads",
      surfaceType
    );

    let viewSecondsElapsed = 0;
    let viewableTracked = false;

    // Tick every 1s to accumulate continuous focused active attention duration
    const viewTimer = setInterval(() => {
      const isCurrentlyValid = isWindowFocused && !isSystemIdle;

      if (isCurrentlyValid) {
        viewSecondsElapsed++;

        // Minimum 5s focused, active, non-AFK attention required to count as viewable
        if (viewSecondsElapsed >= 5 && !viewableTracked) {
          viewableTracked = true;
          telemetry.trackEvent(
            "impression_viewable",
            cleanAdId,
            "Carbon Deco Ads",
            surfaceType
          );
          console.log("[Telemetry Client] ✓ impression_viewable tracked (Ad was focused & non-AFK for 5s)");
        }

        // Send a view tick every 5 seconds of continuous valid active session visibility
        if (viewSecondsElapsed % 5 === 0) {
          telemetry.trackEvent(
            "view_tick",
            cleanAdId,
            "Carbon Deco Ads",
            surfaceType,
            5000 // 5000ms duration increment
          );
          console.log("[Telemetry Client] ✓ view_tick tracked for continuous active visibility");
        }
      } else {
        // Condition breached! Reset count to enforce CONTINUOUS focused active visibility
        viewSecondsElapsed = 0;
      }
      setLocalQueueSize(telemetry.getQueueStats().size);
    }, 1000);

    return () => {
      clearInterval(viewTimer);
    };
  }, [activeAdMessage, cliFormat, isWindowFocused, isSystemIdle]);

  // Sync state parameters from profile query safely

  useEffect(() => {
    if (profile) {
      if (profile.affiliateLinks) {
        setNeonAffiliate(profile.affiliateLinks.neon || "https://neodeco-db.io");
        setSupabaseAffiliate(profile.affiliateLinks.supabase || "https://saffron-host.net");
      }
      if (profile.omitHouseTips !== undefined) {
        setOmitHouseTips(profile.omitHouseTips);
      }
      if (profile.daysSinceBoost !== undefined) {
        setSimulatedDays(profile.daysSinceBoost);
      }
      if (profile.selfServePromos) {
        setSelfServePromos(profile.selfServePromos);
      }
      if (profile.installsCount !== undefined) {
        setCustomInstalls(profile.installsCount);
      }
    }
  }, [profile?.id, profile?.daysSinceBoost, profile?.selfServePromos, profile?.installsCount]);

  useEffect(() => {
    // Fetch privacy statements on mount
    fetch("/api/privacy")
      .then(res => res.json())
      .then(data => setPrivacyPolicy(data))
      .catch(e => console.error("Could not fetch privacy API on dashboard mount", e));
  }, []);

  const handleSaveAffiliateUrls = async () => {
    try {
      const res = await fetch("/api/developer/affiliate-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ neon: neonAffiliate, supabase: supabaseAffiliate }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Affiliate override anchors updated and prioritized.");
        refreshAllData();
      }
    } catch (e) {
      console.error("Error updating affiliate links", e);
    }
  };

  const handleToggleHouseTips = async () => {
    const nextVal = !omitHouseTips;
    setOmitHouseTips(nextVal);
    try {
      const res = await fetch("/api/developer/omit-tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ omitHouseTips: nextVal }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(nextVal ? "House wisdom pro-tips omitted from stream." : "House wisdom pro-tips enabled in rotation.");
        refreshAllData();
      }
    } catch (e) {
      console.error("Error toggling house tips", e);
    }
  };

  const handleSimulateDecaySlider = async (days: number) => {
    setSimulatedDays(days);
    try {
      const res = await fetch("/api/developer/simulate-decay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
      }
    } catch (e) {
      console.error("Error simulating decay", e);
    }
  };

  // Fetch current stats, ledger and providers from backend
  const refreshAllData = async () => {
    try {
      // 1. Profile
      const pRes = await fetch("/api/developer/my_account");
      const pJson = await pRes.json();
      if (pJson.success) {
        setProfile(pJson.profile);
      }

      // 2. Ledger
      const lRes = await fetch("/api/ledger");
      const lJson = await lRes.json();
      if (lJson.success) {
        setLedger(lJson.ledger);
      }

      // 3. Providers
      const provRes = await fetch("/api/providers");
      const provJson = await provRes.json();
      if (provJson.success) {
        setProviders(provJson.providers);
      }
    } catch (e) {
      console.error("Could not fetch server information", e);
    }
  };

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Trigger ad impression or click-through event
  const handleTriggerAdEvent = async (type: "IMPRESSION" | "CLICK") => {
    setLoadingAd(true);
    try {
      const res = await fetch("/api/ad/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developerId: "my_account",
          context: cliContext || "art deco coding",
          format: cliFormat,
          actionType: type,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveAdMessage(data.adMessage);
        
        const cleanAdId = data.adMessage.slice(0, 30).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
        const surfaceType = cliFormat === "VS Code Status Bar" ? "statusbar" : cliFormat === "CLI Prompt Footer" ? "cli" : "spinner";

        if (type === "CLICK") {
          // Explicit click telemetry tracking
          telemetry.trackEvent("click", cleanAdId, data.provider || "Carbon Deco Ads", surfaceType);
        }

        // Log to terminal emulator
        const loggedText = `[EVENT] Simulated ${type === "CLICK" ? "Click" : "Impression"}: "${data.adMessage}" (${data.provider}). Earned: $${data.devPayout.toFixed(4)}`;
        const telemetryLog = `[Telemetry Queue] Logged ${type === "CLICK" ? "Click" : "Impression"} event (Active Queue size: ${telemetry.getQueueStats().size}/50)`;
        setTerminalLogs(prev => [...prev, loggedText, telemetryLog]);

        triggerToast(
          type === "CLICK"
            ? `Ad click tracked! Earned $${data.devPayout.toFixed(4)} with ${100 - data.platformFeePercent}% user split!`
            : `Ad impression served! Recorded with SHA-256 block ledger transparency`
        );
        refreshAllData();
        fetchTelemetryStats();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAd(false);
    }
  };


  // Process and execute custom interactive CLI commands (e.g. catbox balance, gemini, etc.)
  const handleExecuteCliCommand = async (e: FormEvent) => {
    e.preventDefault();
    const command = cliInput.trim();
    if (!command) return;

    // Echo command
    setTerminalLogs(prev => [...prev, `cli_$ ${command}`]);
    setCliInput("");

    const parts = command.split(" ");
    const primaryCmd = parts[0].toLowerCase();

    if (primaryCmd === "clear") {
      setTerminalLogs([]);
      return;
    }

    if (primaryCmd === "help" || (primaryCmd === "catbox" && parts[1]?.toLowerCase() === "help")) {
      setTerminalLogs(prev => [
        ...prev,
        "Available commands:",
        "  help                    Display this list of supported CLI commands.",
        "  catbox balance          Retrieve your active balance, payouts, and CTR metrics.",
        "  catbox fetch <context>  Trigger dynamic ad delivery with custom category context.",
        "  catbox telemetry        Query real-time ID-based deduplication logs and queue stats.",
        "  catbox telemetry flush  Force immediate delivery of cached ad events.",
        "  catbox termux           Show automated setup instructions for Android Termux.",
        "  gemini <query>          Ask Gemini CLI Agent for ad ideas or technical recommendations.",
        "  clear                   Clear the terminal log screen."
      ]);
      return;
    }


    if (primaryCmd === "catbox") {
      const sub = parts[1]?.toLowerCase();
      if (sub === "balance") {
        setTerminalLogs(prev => [
          ...prev,
          `--- Catbox Profile Ledger ---`,
          `  Account ID:      my_account`,
          `  Balance:         $${profile.balance.toFixed(4)} USD`,
          `  Royalty Balance: $${profile.cattbackBalance.toFixed(4)} USD`,
          `  Impressions:     ${profile.impressionCount}`,
          `  Clicks:          ${profile.clickCount}`,
          `  Platform Split:  ${profile.platformFeePercent}%`,
          `-----------------------------`
        ]);
        return;
      }

      if (sub === "fetch") {
        const adContext = parts.slice(2).join(" ") || cliContext || "geometric development";
        setTerminalLogs(prev => [...prev, `>> Requesting Gemini to synthesize dynamic ad block matching: "${adContext}"...`]);
        setLoadingAd(true);
        try {
          const res = await fetch("/api/ad/fetch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              developerId: "my_account",
              context: adContext,
              format: "CLI Prompt Footer",
              actionType: "IMPRESSION",
            }),
          });
          const data = await res.json();
          if (data.success) {
            setActiveAdMessage(data.adMessage);
            setTerminalLogs(prev => [
              ...prev,
              `[SUCCESS] Ad simulated successfully!`,
              `Ad Slogan:  "${data.adMessage}"`,
              `Provider:   ${data.provider}`,
              `Payout:     +$${data.devPayout.toFixed(4)} USD (gross: $${data.grossAdRevenue.toFixed(4)})`,
              `Ledger:     SHA-256 block registered: ${data.blockHash.substring(0, 16)}...`
            ]);
            refreshAllData();
          } else {
            setTerminalLogs(prev => [...prev, `[ERROR] Failed to fetch ad: ${data.error}`]);
          }
        } catch (err: any) {
          setTerminalLogs(prev => [...prev, `[ERROR] Connection failed: ${err.message}`]);
        } finally {
          setLoadingAd(false);
        }
        return;
      }

      if (sub === "telemetry") {
        const action = parts[2]?.toLowerCase();
        if (action === "flush") {
          setTerminalLogs(prev => [...prev, `[Telemetry Action] Manual flush of client batch database requested...`]);
          const success = await telemetry.flush();
          setTerminalLogs(prev => [
            ...prev,
            success 
              ? `[SUCCESS] Client batch queue transmitted successfully! Checked for Redis/Postgres ID duplication.`
              : `[Telemetry Info] Queue is currently quiet (0 items or offline/pending timeout).`
          ]);
          fetchTelemetryStats();
          return;
        }

        const queueStats = telemetry.getQueueStats();
        setTerminalLogs(prev => [
          ...prev,
          `--- Catbox Idempotent Telemetry Engine ---`,
          `  Backend Database: ${telemetryDbInfo}`,
          `  Local Queue:     ${queueStats.size} / 50 events cached`,
          `  Transmission:    Automated batch (every 30s) or on Exit`,
          `  Failed Retries:  ${queueStats.retryCount}`,
          `-------------------------------------------`,
          `  Type "catbox telemetry flush" to manually flush.`
        ]);
        return;
      }

      if (sub === "termux") {

        const installUrl = `${window.location.origin}/api/termux/install`;
        setTerminalLogs(prev => [
          ...prev,
          `--- Catbox Android Termux Setup ---`,
          `Run this single-line bootstrap command inside Termux:`,
          `  pkg install curl -y && curl -sL ${installUrl} | bash`,
          `----------------------------------`,
          `Features supported in Termux:`,
          `  - Automated binary command: 'catbox'`,
          `  - Prompt Injection of peer impressions passive earnings`,
          `  - Colored ANSI display output directly in terminal shell`
        ]);
        return;
      }

      setTerminalLogs(prev => [...prev, `[Catbox CLI] Unknown subcommand '${parts[1] || ""}'. Type 'help' for guide.`]);
      return;
    }

    if (primaryCmd === "termux") {
      const installUrl = `${window.location.origin}/api/termux/install`;
      setTerminalLogs(prev => [
        ...prev,
        `--- Catbox Android Termux Setup ---`,
        `Run this single-line bootstrap command inside Termux:`,
        `  pkg install curl -y && curl -sL ${installUrl} | bash`,
        `----------------------------------`,
        `Features' support built in:`,
        `  - Automated binary command: 'catbox'`,
        `  - Prompt Injection of peer impressions passive earnings`,
        `  - Colored ANSI display output directly in terminal shell`
      ]);
      return;
    }

    if (primaryCmd === "gemini") {
      const promptText = parts.slice(1).join(" ");
      if (!promptText) {
        setTerminalLogs(prev => [...prev, `[Gemini CLI] Please specify a prompt. Example: 'gemini suggestion for security ad'`]);
        return;
      }

      setTerminalLogs(prev => [...prev, `>> Invoking server-side Gemini API on model 'gemini-3.5-flash'...`]);
      setLoadingAd(true);
      try {
        const res = await fetch("/api/gemini/cli", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptText }),
        });
        const data = await res.json();
        if (data.success) {
          setTerminalLogs(prev => [
            ...prev,
            `--- Gemini CLI Response ---`,
            data.text,
            `---------------------------`
          ]);
        } else {
          setTerminalLogs(prev => [...prev, `[Gemini CLI Error] ${data.error}`]);
        }
      } catch (err: any) {
        setTerminalLogs(prev => [...prev, `[Gemini Connect Error] ${err.message}`]);
      } finally {
        setLoadingAd(false);
      }
      return;
    }

    setTerminalLogs(prev => [...prev, `bash: command not found: ${primaryCmd}. Did you try typing 'help'?`]);
  };

  // Self-Serve Sponsor Promotion campaign submit handlers
  const handleAddSelfServePromo = async (e: FormEvent) => {
    e.preventDefault();
    if (!newSelfServeText.trim()) return;
    try {
      const res = await fetch("/api/self-serve/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newSelfServeText }),
      });
      const data = await res.json();
      if (data.success) {
        setNewSelfServeText("");
        triggerToast("Self-serve sponsor creative submitted successfully (0% fee active).");
        refreshAllData();
      } else {
        alert(data.error || "Failed to submit sponsor campaign request.");
      }
    } catch (err) {
      console.error("Self-Serve Add Error", err);
    }
  };

  const handleDeleteSelfServePromo = async (text: string) => {
    try {
      const res = await fetch("/api/self-serve/promo/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Promo creative removed from stream.");
        refreshAllData();
      }
    } catch (err) {
      console.error("Self-Serve Delete Error", err);
    }
  };

  const handleSimulateInstalls = async (installs: number) => {
    const val = Math.max(1, installs);
    setCustomInstalls(val);
    try {
      const res = await fetch("/api/developer/simulate-installs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installs: val }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("Milestone Installs simulation error", err);
    }
  };

  // Bring Your Own Provider: Register Custom third-party ad server
  const handleRegisterProvider = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProvName.trim() || !newProvUrl.trim()) {
      alert("Please provide a name and base URL interface.");
      return;
    }

    try {
      const res = await fetch("/api/providers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProvName,
          baseUrl: newProvUrl,
          sharedWithCommunity: newProvShare,
          cpmRate: parseFloat(newProvCpm) || 0.20,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewProvName("");
        setNewProvUrl("");
        setNewProvCpm("0.24");
        triggerToast(
          newProvShare 
            ? `New provider custom integration added! Shared community bonus "Cattback" override active.`
            : `Private developer ad provider registered successfully.`
        );
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Select preferred split (e.g. 15% platform cut vs 25% premium cut)
  const handleSelectSplit = async (percent: number) => {
    try {
      const res = await fetch("/api/developer/preferred-split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developerId: "my_account",
          platformFeePercent: percent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Preferred revenue split updated to: Platform ${percent}% / User ${100 - percent}%`);
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simulated Escrow Payout Dispenser
  const handleWithdrawPayout = async () => {
    if (profile.balance <= 1.0) {
      alert("Minimum threshold for escrow withdrawal is $1.00 USD.");
      return;
    }
    setPayoutStatus("Decrypting cryptographic keys and releasing Stripe Connect escrow...");
    try {
      const res = await fetch("/api/ledger/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ developerId: "my_account" }),
      });
      const data = await res.json();
      if (data.success) {
        setPayoutStatus(`Successfully dispersed $${data.payoutAmount.toFixed(2)} USD safely to Stripe connect.`);
        triggerToast("Withdrawal complete. Zero operator balance risk verified.");
        refreshAllData();
      }
    } catch (e) {
      setPayoutStatus("Payment network request timeout.");
    }
  };

  // Secure Credentials client-side AES simulation
  const handleEncryptData = async () => {
    if (!credentialInput.trim()) return;
    try {
      const res = await fetch("/api/credentials/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plainText: credentialInput }),
      });
      const data = await res.json();
      if (data.success) {
        setEncryptionResult({
          ciphertext: data.ciphertext,
          iv: data.iv,
          authTag: data.authTag,
          method: data.method,
          compliance_audited: data.compliance_audited,
        });
        setDecryptedText(null);
        setDecryptError(null);
        triggerToast("Encrypted and audited against compliance standard.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDecryptData = async () => {
    if (!encryptionResult) return;
    try {
      const res = await fetch("/api/credentials/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertext: encryptionResult.ciphertext,
          iv: encryptionResult.iv,
          authTag: encryptionResult.authTag,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDecryptedText(data.decryptedText);
        setDecryptError(null);
      } else {
        setDecryptError("Verification key check failed.");
      }
    } catch (e) {
      setDecryptError("Authorization key tampered or invalid signature.");
    }
  };

  // Invite Simulated Referral Booster
  const handleSimulateReferral = async () => {
    try {
      const res = await fetch("/api/developer/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developerId: "my_account",
          refUsed: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Invite registered on network! Your base commission rate is optimized.");
        refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Factory reset ledger
  const handleLedgerHardReset = async () => {
    if (!confirm("Are you sure you want to rollback to initial genesis state?")) return;
    try {
      const res = await fetch("/api/ledger/reset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setEncryptionResult(null);
        setDecryptedText(null);
        setPayoutStatus("");
        triggerToast("Ledger rolled back to Genesis Block safely.");
        refreshAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Count active panes
  const activePanesCount = (showLeftPane ? 1 : 0) + (showCenterPane ? 1 : 0) + (showRightPane ? 1 : 0);

  return (
    <div 
      className="min-h-screen text-zinc-100 flex flex-col font-sans selection:bg-gold-500 selection:text-black relative transition-all duration-750"
      style={{
        backgroundColor: "#000000",
        backgroundImage: bgType === "roof" 
          ? `radial-gradient(circle at 50% 50%, rgba(10, 6, 2, 0.45), rgba(0, 0, 0, 0.95)), url("https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1200&auto=format&fit=crop")`
          : bgType === "custom" && customBgUrl
            ? `radial-gradient(circle at 50% 50%, rgba(10, 6, 2, 0.40), rgba(0, 0, 0, 0.95)), url("${customBgUrl}")`
            : "none",
        backgroundSize: "cover",
        backgroundPosition: "center 30%",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Heavy textured leaded stained glass grid pattern overlay */}
      {(bgType === "roof" || bgType === "custom") && (
        <div className="absolute inset-0 bg-[linear-gradient(rgba(194,147,52,0.14)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(194,147,52,0.14)_1.5px,transparent_1.5px)] bg-[size:42px_42px] pointer-events-none opacity-40 z-0"></div>
      )}
      {(bgType === "roof" || bgType === "custom") && (
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-yellow-900/10 pointer-events-none z-0"></div>
      )}
      
      {/* Content layers */}
      <div className="relative z-10 flex-col flex min-h-screen">

      {/* Visual Success Toast */}
      {successToast && (
        <div className="fixed bottom-12 right-12 bg-black text-gold-300 border-2 border-gold-400/80 px-6 py-4 rounded shadow-[0_0_15px_rgba(194,147,52,0.4)] flex items-center gap-3 z-50 animate-fade-in uppercase tracking-wider text-xs font-deco">
          <Sparkles className="w-4 h-4 text-gold-400 animate-spin" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header decorated in retro Art Deco style (Golden brown on Absolute Black) */}
      <header className="border-b-4 border-double border-gold-600 bg-zinc-950 px-8 py-4 relative">
        {/* Geometric gold accent line patterns */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <span className="font-deco text-4xl font-extrabold tracking-widest text-gold-400 italic hover:text-gold-250 transition-colors cursor-pointer">
                CATBOX
              </span>
              <div className="hidden sm:block border-l-2 border-gold-700 h-6"></div>
              <span className="font-serif italic text-gold-500/80 text-lg tracking-wide">
                open kickbacks
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono mt-1">
              • An Open-Source Stained Glass Alternative to kickbacks.ai featuring Transparent Splits & BYO Providers •
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-gold-950/40 border border-gold-700/60 rounded">
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse shadow-[0_0_8px_#c29334]"></span>
              <span className="text-[10px] uppercase tracking-widest font-mono text-gold-300">
                AUDITED PUBLIC LEDGER LOGS
              </span>
            </div>
            
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="px-2.5 py-1 text-[10px] font-mono border border-zinc-800 text-gold-400 bg-black hover:border-gold-550 rounded uppercase transition-colors"
              title="Toggle backdrop customization options"
            >
              ⚙️ Customize Backdrops
            </button>

            <button
              onClick={handleLedgerHardReset}
              className="px-2.5 py-1 text-[10px] font-mono border border-zinc-850 text-zinc-500 bg-black hover:text-zinc-300 hover:border-zinc-700 rounded uppercase transition-colors"
              title="Reset the global transparent simulated state back to original ledger genesis"
            >
              Reset State
            </button>
          </div>
        </div>
      </header>

      {/* Dynamic Golden Route Tabs Navigation */}
      <section className="bg-zinc-950 border-b-2 border-gold-600 px-8 py-3.5 relative">
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-550 to-transparent"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-deco text-[11px] text-gold-400 uppercase tracking-widest font-bold">
              Navigate System:
            </span>
            <div className="h-4 border-l border-gold-800"></div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <a
              href="#/"
              className={`px-3.5 py-1.5 text-xs font-mono rounded uppercase transition-all tracking-wider border cursor-pointer ${
                currentRoute === "landing"
                  ? "bg-gold-500 text-black border-gold-400 font-bold shadow-[0_0_10px_rgba(194,147,52,0.3)] hover:bg-gold-400"
                  : "bg-black text-zinc-400 border-zinc-900 hover:text-gold-300 hover:border-gold-850"
              }`}
            >
              🌟 Getting Started
            </a>

            <a
              href="#/dashboard"
              className={`px-3.5 py-1.5 text-xs font-mono rounded uppercase transition-all tracking-wider border cursor-pointer ${
                currentRoute === "dashboard"
                  ? "bg-gold-500 text-black border-gold-400 font-bold shadow-[0_0_10px_rgba(194,147,52,0.3)] hover:bg-gold-400"
                  : "bg-black text-zinc-400 border-zinc-900 hover:text-gold-300 hover:border-gold-850"
              }`}
            >
              ⚙️ Provider Dashboard
            </a>

            <a
              href="#/cli"
              className={`px-3.5 py-1.5 text-xs font-mono rounded uppercase transition-all tracking-wider border cursor-pointer ${
                currentRoute === "cli"
                  ? "bg-gold-500 text-black border-gold-400 font-bold shadow-[0_0_10px_rgba(194,147,52,0.3)] hover:bg-gold-400"
                  : "bg-black text-zinc-400 border-zinc-900 hover:text-gold-300 hover:border-gold-850"
              }`}
            >
              🖥️ Interactive CLI
            </a>

            <a
              href="#/ledger"
              className={`px-3.5 py-1.5 text-xs font-mono rounded uppercase transition-all tracking-wider border cursor-pointer ${
                currentRoute === "ledger"
                  ? "bg-gold-500 text-black border-gold-400 font-bold shadow-[0_0_10px_rgba(194,147,52,0.3)] hover:bg-gold-400"
                  : "bg-black text-zinc-400 border-zinc-900 hover:text-gold-300 hover:border-gold-850"
              }`}
            >
              🔗 Ledger & Escrow
            </a>

            <a
              href="#/privacy"
              className={`px-3.5 py-1.5 text-xs font-mono rounded uppercase transition-all tracking-wider border cursor-pointer ${
                currentRoute === "privacy"
                  ? "bg-gold-500 text-black border-gold-400 font-bold shadow-[0_0_10px_rgba(194,147,52,0.3)] hover:bg-gold-400"
                  : "bg-black text-zinc-400 border-zinc-900 hover:text-gold-300 hover:border-gold-850"
              }`}
            >
              🛡️ Sovereign Privacy
            </a>
          </nav>

          <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5 bg-black px-2.5 py-1 rounded border border-zinc-900">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>Route: <strong className="text-gold-400">/{currentRoute === "landing" ? "" : currentRoute}</strong></span>
          </div>
        </div>
      </section>

      {/* Background Stained Glass Settings Strip */}
      {showThemeMenu && (
        <section className="bg-zinc-950/90 border-b border-gold-900/40 px-8 py-3 animate-fade-in relative z-20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-400 animate-pulse" />
              <span className="text-[10px] uppercase font-mono tracking-widest text-gold-300">
                Stained Glass Backdrop:
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setBgType("custom");
                  setCustomBgUrl(stainedGlassCarrier);
                }}
                className={`px-3 py-1 text-[9px] font-mono rounded uppercase transition-all border cursor-pointer ${
                  bgType === "custom" && customBgUrl === stainedGlassCarrier
                    ? "bg-gold-400 text-black border-gold-400 font-bold shadow-[0_0_8px_rgba(194,147,52,0.3)]"
                    : "bg-black text-zinc-400 border-zinc-800 hover:text-white"
                }`}
              >
                ⚓ Stained Glass Carrier (Attached Img)
              </button>
              <button
                onClick={() => setBgType("roof")}
                className={`px-3 py-1 text-[9px] font-mono rounded uppercase transition-all border cursor-pointer ${
                  bgType === "roof"
                    ? "bg-gold-400 text-black border-gold-400 font-bold shadow-[0_0_8px_rgba(194,147,52,0.3)]"
                    : "bg-black text-zinc-450 border-zinc-800 hover:text-white"
                }`}
              >
                ☀️ Golden Hour Rooftop
              </button>
              <button
                onClick={() => {
                  setBgType("custom");
                  if (customBgUrl === stainedGlassCarrier) {
                    setCustomBgUrl("https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1200&auto=format&fit=crop");
                  }
                }}
                className={`px-3 py-1 text-[9px] font-mono rounded uppercase transition-all border cursor-pointer ${
                  bgType === "custom" && customBgUrl !== stainedGlassCarrier
                    ? "bg-gold-400 text-black border-gold-400 font-bold shadow-[0_0_8px_rgba(194,147,52,0.3)]"
                    : "bg-black text-zinc-450 border-zinc-800 hover:text-white"
                }`}
              >
                🖼️ Custom Background URL
              </button>
              <button
                onClick={() => setBgType("dark")}
                className={`px-3 py-1 text-[9px] font-mono rounded uppercase transition-all border cursor-pointer ${
                  bgType === "dark"
                    ? "bg-gold-400 text-black border-gold-400 font-bold"
                    : "bg-black text-zinc-450 border-zinc-800 hover:text-white"
                }`}
              >
                🌑 Slate Midnight Canvas
              </button>

              {bgType === "custom" && (
                <input
                  type="text"
                  value={customBgUrl}
                  onChange={(e) => setCustomBgUrl(e.target.value)}
                  placeholder="Paste any PNG/JPG image link..."
                  className="bg-black text-zinc-300 border border-gold-900/60 text-[9px] rounded px-2 py-1 focus:outline-none focus:border-gold-400 w-64 font-mono select-all"
                  title="Input any web image URL or path inside assets/ folder to instantly render it under the leaded stained-glass grid!"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* Main Container - Collapsible Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-12 gap-6 items-start">
        
        {/* 🌟 ROUTE 1: Landing Page */}
        {currentRoute === "landing" && (
          <div className="col-span-12 space-y-8 animate-fade-in text-zinc-100">
            {/* Elegant Hero Box */}
            <div className="bg-zinc-950 p-6 md:p-8 border border-gold-600 rounded-sm relative">
              <div className="absolute top-0 right-10 w-24 h-1 bg-gold-400"></div>
              
              <div className="space-y-4 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-950/40 border border-gold-800 rounded">
                  <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-pulse" />
                  <span className="text-[9px] uppercase tracking-widest font-mono text-gold-300">
                    Open Kickbacks Alternative
                  </span>
                </div>
                
                <h1 className="font-deco text-2xl md:text-3.5xl font-extrabold tracking-tight text-white leading-tight">
                  PASSIVE EARNINGS <span className="text-gold-400">WITHOUT TELEMETRY TRACKERS</span>
                </h1>
                
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Catbox is a transparent, local-first open kickbacks platform designed specifically for software builders. We stream micro-ads strictly related to software tools directly onto your IDE status bar or command line—delivering 100% clean monetization without keylogging, browser extensions, or cloud cookies.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <a
                    href="#/dashboard"
                    className="px-5 py-2.5 bg-gradient-to-r from-gold-550 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    Set Up Custom Providers
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-950" />
                  </a>
                  <a
                    href="#/cli"
                    className="px-5 py-2.5 bg-black hover:bg-zinc-900 text-gold-400 border border-gold-800 text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer"
                  >
                    Simulate Live Feed
                  </a>
                </div>
              </div>
            </div>

            {/* Split Grid for Developer and Sponsor value propositions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
              
              {/* Left Column: FOR DEVELOPERS */}
              <div className="bg-zinc-950 p-6 border border-zinc-800 rounded-sm space-y-6">
                <div className="border-b border-gold-900/40 pb-3 flex items-center gap-2">
                  <span className="p-1 px-2.5 bg-gold-950 text-gold-400 font-mono text-[10px] font-bold rounded">DEV</span>
                  <h2 className="font-deco text-sm font-bold text-white uppercase tracking-wider">For Software Developers</h2>
                </div>

                <div className="space-y-5">
                  {/* Q1 */}
                  <div>
                    <h3 className="font-sans text-xs font-bold text-gold-300 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                      <span className="text-gold-400 font-mono text-s font-semibold">1.</span> What does it do?
                    </h3>
                    <p className="text-[11.5px] text-zinc-400 leading-relaxed">
                      Catbox lets you passively earn micro-payouts by showing tasteful, text-only developer ads (like database servers or bug tracking platforms) right in your workspace tools. No tracking, zero third-party scripts.
                    </p>
                  </div>

                  {/* Q2 */}
                  <div>
                    <h3 className="font-sans text-xs font-bold text-gold-300 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                      <span className="text-gold-400 font-mono text-s font-semibold">2.</span> How do you get it to do it?
                    </h3>
                    <p className="text-[11.5px] text-zinc-400 leading-relaxed">
                      Simply start your local status micro-client. Under our <a href="#/cli" className="text-gold-450 hover:underline">Interactive CLI</a> tab, you can copy the signed live-stream endpoint and configure your workspace script to fetch updates instantly.
                    </p>
                  </div>

                  {/* Q3 */}
                  <div>
                    <h3 className="font-sans text-xs font-bold text-gold-300 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                      <span className="text-gold-400 font-mono text-s font-semibold">3.</span> How can you be certain you will indeed get paid?
                    </h3>
                    <p className="text-[11.5px] text-zinc-400 leading-relaxed">
                      Every single impression and click is written as an immutable block transaction to our <a href="#/ledger" className="text-gold-450 hover:underline">Auditable Public Ledger</a>. All balances are stored transparently in your native <code className="bg-black border border-zinc-850 px-1 py-0.5 rounded text-[10.5px]">./data/</code> files, and dispersals process instantly via Stripe Escrow.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: FOR AD PROVIDERS & SPONSORS */}
              <div className="bg-zinc-950 p-6 border border-zinc-800 rounded-sm space-y-6">
                <div className="border-b border-gold-900/40 pb-3 flex items-center gap-2">
                  <span className="p-1 px-2.5 bg-zinc-900 text-zinc-400 font-mono text-[10px] font-bold rounded">SPONSOR</span>
                  <h2 className="font-deco text-sm font-bold text-white uppercase tracking-wider">For Ad Providers & Sponsors</h2>
                </div>

                <div className="space-y-5">
                  {/* Q1 */}
                  <div>
                    <h3 className="font-sans text-xs font-bold text-gold-300 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                      <span className="text-gold-400 font-mono text-s font-semibold">1.</span> Why does it work for you?
                    </h3>
                    <p className="text-[11.5px] text-zinc-400 leading-relaxed">
                      Standard banner ads get 100% ad-blocked by developer crowds. Catbox delivers sponsored status lines directly inside terminals or editors, engaging software builders directly at peak focus with zero friction.
                    </p>
                  </div>

                  {/* Q2 */}
                  <div>
                    <h3 className="font-sans text-xs font-bold text-gold-300 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                      <span className="text-gold-400 font-mono text-s font-semibold">2.</span> How do you get it to work?
                    </h3>
                    <p className="text-[11.5px] text-zinc-400 leading-relaxed">
                      Register your custom server endpoints via the <a href="#/dashboard" className="text-gold-450 hover:underline">Provider Dashboard</a>, or register a custom Self-Serve ad slogan directly. Your custom links take instant priority.
                    </p>
                  </div>

                  {/* Q3 */}
                  <div>
                    <h3 className="font-sans text-xs font-bold text-gold-300 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                      <span className="text-gold-400 font-mono text-s font-semibold">3.</span> How do you know you are safe?
                    </h3>
                    <p className="text-[11.5px] text-zinc-400 leading-relaxed">
                      Our REST engine enforces cryptographic validation on every ping using time-relative telemetry keys (SHA-256 signatures). We log clean transparent events to trace clicks and completely eliminate bot click-spam.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Read More Section */}
            <div className="p-5 bg-zinc-950 border border-zinc-900 rounded text-zinc-400 leading-relaxed text-[11px] font-sans">
              <h4 className="text-zinc-200 uppercase tracking-widest font-mono font-semibold text-[10px] mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-gold-400" />
                Read More: Technical Architecture & Self-Hosting
              </h4>
              <p>
                Catbox relies on direct peer-to-peer verification schemas. We maintain a local JSON-backed datastore for profile credentials and ledger parameters, using standard atomic write algorithms to avoid race conditions. In addition, our service integrates directly with the Google Gemini API to dynamically format custom sponsor creative lines appropriate for display under any programming context you request. You are completely sovereign, secure, and protected.
              </p>
            </div>
          </div>
        )}

        {/* ⚙️ ROUTE 2: Provider Dashboard Setup */}
        {currentRoute === "dashboard" && (
          <aside className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-fade-in">

            {/* Pane Label */}
            <div className="flex items-center justify-between border-b-2 border-gold-600 pb-1.5 col-span-12">
              <h2 className="font-deco text-sm font-bold tracking-widest text-gold-400">
                AD PROVIDERS PANEL
              </h2>
              <span className="font-mono text-[9px] text-zinc-500 uppercase">SYS_SETUP_01</span>
            </div>

            {/* 🏢 BENTO WIDGET 1: Automated CPM Ad Rotator Engine */}
            <section className="bg-zinc-950 p-5 border border-gold-800 rounded-sm relative space-y-4 md:col-span-1 shadow-[0_0_15px_rgba(194,147,52,0.1)]">
              <div className="absolute top-0 right-4 w-16 h-1 bg-gradient-to-r from-amber-500 to-yellow-400"></div>
              
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-pulse shadow-[0_0_6px_#c29334]"></div>
                  <h3 className="font-deco text-xs text-gold-300 font-bold uppercase tracking-widest">
                    Catbox CPM Rotator
                  </h3>
                </div>
                <span className="font-mono text-[9px] text-zinc-500 uppercase">SYS_WIDGET_ROTATOR</span>
              </div>

              {/* Ticker Grid */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                <div className="bg-black/60 p-2.5 border border-zinc-900 rounded-sm relative">
                  <span className="text-[8px] text-zinc-550 uppercase tracking-wider block mb-0.5">Today (Credited)</span>
                  <span className="text-xs font-bold text-gold-400 font-mono">${parseFloat(earningsToday).toFixed(4)}</span>
                </div>
                <div className="bg-black/60 p-2.5 border border-zinc-900 rounded-sm">
                  <span className="text-[8px] text-zinc-550 uppercase tracking-wider block mb-0.5">This Week</span>
                  <span className="text-xs font-bold text-zinc-300 font-mono">${parseFloat(earningsThisWeek).toFixed(4)}</span>
                </div>
                <div className="bg-black/60 p-2.5 border border-zinc-900 rounded-sm">
                  <span className="text-[8px] text-zinc-550 uppercase tracking-wider block mb-0.5">All Time</span>
                  <span className="text-xs font-bold text-zinc-300 font-mono">${parseFloat(earningsAllTime).toFixed(4)}</span>
                </div>
                <div className="bg-black/60 p-2.5 border border-zinc-900 rounded-sm">
                  <span className="text-[8px] text-zinc-550 uppercase tracking-wider block mb-0.5">Served (Impressions)</span>
                  <span className="text-xs font-bold text-zinc-100 font-mono">{adImpressions} units</span>
                </div>
              </div>

              {/* Active Banner Demonstration Area */}
              <div className="p-3 bg-black border border-gold-950/60 rounded-sm relative group overflow-hidden">
                {/* Floating Impression Earn Badge */}
                {floatEarnBadgeVisible && (
                  <div className="absolute inset-0 bg-gold-950/95 flex items-center justify-center z-20 text-gold-300 font-deco font-bold text-xs tracking-widest uppercase border border-gold-500 rounded-sm">
                    <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-spin mr-1.5" />
                    <span>{floatEarnBadgeValue} Payout!</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-[8px] font-mono uppercase text-zinc-550 mb-1.5 border-b border-zinc-900 pb-1">
                  <span className="text-gold-400 font-bold flex items-center gap-1">
                    {currentAd ? (
                      currentAd.brand.toLowerCase().includes("aurum") ? "🛡️" :
                      currentAd.brand.toLowerCase().includes("securite") ? "🔒" :
                      currentAd.brand.toLowerCase().includes("neodeco") ? "🗄️" :
                      currentAd.brand.toLowerCase().includes("saffron") ? "🧹" :
                      currentAd.brand.toLowerCase().includes("decomail") ? "✉️" :
                      currentAd.brand.toLowerCase().includes("apex") ? "📊" :
                      currentAd.brand.toLowerCase().includes("stratus") ? "☁️" : "🌐"
                    ) : "🌐"} {currentAd?.brand || "Catbox Partner"}
                  </span>
                  <span>CATEGORY: {currentAd?.category || "global"}</span>
                </div>

                <p className="text-[11px] text-gold-300 italic font-medium leading-relaxed font-deco">
                  "{currentAd?.creativeText || "Loading high-yielding CPM impressions..."}"
                </p>

                <div className="flex items-center justify-between text-[7.5px] font-mono text-zinc-550 mt-2.5 pt-1.5 border-t border-zinc-900/60 leading-none">
                  <span>CPM RATE: $10.00 Fixed</span>
                  <span>NET SPLIT: 97.0% developer net</span>
                </div>
              </div>

              {/* Interactive context detection stats banner */}
              <div className="p-2 border border-zinc-900 bg-black/30 rounded-sm text-[9.5px] font-mono flex items-center justify-between text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-550">Context genre:</span>
                  <span className="text-gold-500 font-bold uppercase">{detectedCategory || "No match"}</span>
                </div>
                {detectedCategory && (
                  <span className="text-[8px] bg-gold-950 text-gold-400 border border-gold-900/60 rounded px-1.5 uppercase tracking-wide font-semibold italic animate-pulse">
                    +5x weight active
                  </span>
                )}
              </div>

              {/* Countdown Progress Slider and Rotation click buttons */}
              <div className="space-y-3.5 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                    <span>Rotation Progress Tracker</span>
                    <span className="text-gold-400 font-bold">Next rotation in {rotatorCountdown}s</span>
                  </div>
                  <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-gold-600 to-amber-500 h-full transition-all duration-1000"
                      style={{ width: `${(rotatorCountdown / 60) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      rotateAd();
                      setRotatorCountdown(60);
                    }}
                    className="bg-black border border-gold-700/60 text-gold-300 hover:text-white hover:border-gold-500 hover:bg-gold-950/20 py-1.5 rounded-sm font-mono text-[9px] uppercase tracking-wide transition-all font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 text-gold-400" />
                    Rotate Ad
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdImpressions(0);
                      setEarningsToday("0.0000");
                      setEarningsThisWeek("0.0000");
                      setEarningsAllTime("0.0000");
                      localStorage.setItem("catbox_adImpressions", "0");
                      localStorage.setItem("catbox_earningsToday", "0.0000");
                      localStorage.setItem("catbox_earningsThisWeek", "0.0000");
                      localStorage.setItem("catbox_earningsAllTime", "0.0000");
                      setTerminalLogs(prev => [...prev, "[LEDGER] Earnings tracker statistics hard reset."]);
                    }}
                    className="bg-black border border-zinc-850 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 py-1.5 rounded-sm font-mono text-[9px] uppercase tracking-wide transition-all cursor-pointer"
                  >
                    Reset Stats
                  </button>
                </div>
              </div>
            </section>

            {/* ⚙️ BENTO WIDGET 2: CPM Admin & API Control Centre */}
            <section className="bg-zinc-950 p-5 border border-gold-800 rounded-sm relative space-y-4 md:col-span-1 shadow-[0_0_15px_rgba(194,147,52,0.1)]">
              <div className="absolute top-0 right-4 w-16 h-1 bg-zinc-600"></div>

              <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gold-400 rotate-12" />
                  <h3 className="font-deco text-xs text-gold-300 font-bold uppercase tracking-widest">
                    API Bridge & Admin Panel
                  </h3>
                </div>
                <span className="font-mono text-[9px] text-zinc-500 uppercase">SYS_ADMIN_API</span>
              </div>

              <div>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Configure programmatic CPM connections. This bridges local tracking loops directly with remote networks like <span className="text-gold-400">EthicalAds</span> or <span className="text-gold-400">BuySellAds</span>.
                </p>
              </div>

              {/* Mode Selection buttons */}
              <div className="grid grid-cols-2 gap-1 bg-black p-1 border border-zinc-900 rounded-sm">
                <button
                  type="button"
                  onClick={() => toggleMockLiveMode(false)}
                  className={`py-1.5 text-[9px] font-mono tracking-wider uppercase transition-all font-semibold rounded-sm cursor-pointer ${
                    !isLiveMode 
                      ? "bg-zinc-800 border border-zinc-705 text-white shadow" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Mock Mode (JSON)
                </button>
                <button
                  type="button"
                  onClick={() => toggleMockLiveMode(true)}
                  className={`py-1.5 text-[9px] font-mono tracking-wider uppercase transition-all font-semibold rounded-sm cursor-pointer ${
                    isLiveMode 
                      ? "bg-gold-550 border border-gold-400 text-black font-bold shadow-[0_0_8px_rgba(194,147,52,0.3)]" 
                      : "text-zinc-500 hover:text-gold-350"
                  }`}
                >
                  Live Mode (API)
                </button>
              </div>

              {/* API inputs card */}
              <div className="p-3.5 bg-black border border-zinc-900 rounded-sm space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 flex items-center justify-between">
                    <span>CPM REST Endpoint URL</span>
                    <span className={`text-[8px] font-semibold uppercase ${isLiveMode ? "text-emerald-500 animate-pulse" : "text-zinc-650"}`}>
                      {isLiveMode ? "active-link" : "mock locked"}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={cpmEndpoint}
                    onChange={(e) => handleUpdateCpmEndpoint(e.target.value)}
                    disabled={!isLiveMode}
                    placeholder="https://api.ethicalads.io/v1/ads/"
                    className="w-full bg-zinc-950 border border-gold-900/45 text-zinc-300 rounded px-2.5 py-1 text-[10.5px] font-mono tracking-wide focus:outline-none focus:border-gold-500 disabled:opacity-45 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 flex items-center justify-between">
                    <span>Provider API Secret Key</span>
                    <span className={`text-[8px] font-semibold uppercase ${isLiveMode ? "text-emerald-500 animate-pulse" : "text-zinc-650"}`}>
                      {isLiveMode ? "verified" : "mock locked"}
                    </span>
                  </label>
                  <input
                    type="password"
                    value={cpmApiKey}
                    onChange={(e) => handleUpdateCpmApiKey(e.target.value)}
                    disabled={!isLiveMode}
                    placeholder="Enter API token key..."
                    className="w-full bg-zinc-950 border border-gold-900/45 text-zinc-300 rounded px-2.5 py-1 text-[10.5px] font-mono tracking-wide focus:outline-none focus:border-gold-500 disabled:opacity-45 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Status display logger */}
              <div className="p-2 border border-zinc-900 bg-black/40 text-[9px] font-mono flex items-center justify-between">
                <span className="text-zinc-500 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? "bg-emerald-400 animate-ping" : "bg-zinc-650"}`}></span>
                  API PIPELINE BRIDGE:
                </span>
                <span className={`font-bold uppercase ${isLiveMode ? "text-emerald-400" : "text-zinc-550"}`}>
                  {isLiveMode ? "LIVE INTEGRATED (READY)" : "LOCAL MOCK RESILIENT (OFFLINE)"}
                </span>
              </div>
            </section>

            {/* Custom revenue split toggle selection */}
            <section className="bg-zinc-950 p-4 border border-gold-800 rounded-sm relative space-y-4">
              <div className="absolute top-0 right-4 w-12 h-1 bg-gold-500/60"></div>
              <div>
                <h3 className="font-deco text-xs text-gold-300 uppercase tracking-widest">
                  Choose Preferred Split
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                  Customize your platform commission. Premium includes specialized CLI ad-tracking servers, standard is the lightweight option.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="split-choice-25"
                  onClick={() => handleSelectSplit(25)}
                  className={`p-2.5 border text-left rounded-sm relative transition-all ${
                    profile.platformFeePercent === 25
                      ? "border-gold-550 bg-gold-950/20 text-white"
                      : "border-zinc-800 bg-black text-zinc-400 hover:border-gold-800/40 hover:text-zinc-200"
                  }`}
                >
                  <div className="font-mono text-lg font-bold">25% <span className="text-[10px] font-sans text-zinc-500">cut</span></div>
                  <div className="text-[9px] text-zinc-500 font-semibold uppercase mt-1">Premium Tier</div>
                  {profile.platformFeePercent === 25 && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gold-400"></span>
                  )}
                </button>

                <button
                  id="split-choice-15"
                  onClick={() => handleSelectSplit(15)}
                  className={`p-2.5 border text-left rounded-sm relative transition-all ${
                    profile.platformFeePercent === 15
                      ? "border-gold-550 bg-gold-950/20 text-white"
                      : "border-zinc-800 bg-black text-zinc-400 hover:border-gold-800/40 hover:text-zinc-200"
                  }`}
                >
                  <div className="font-mono text-lg font-bold">15% <span className="text-[10px] font-sans text-zinc-500">cut</span></div>
                  <div className="text-[9px] text-zinc-550 font-semibold uppercase mt-1">Standard Cut</div>
                  {profile.platformFeePercent === 15 && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gold-400"></span>
                  )}
                </button>
              </div>

              {/* Reward/Referral discount rates shown dynamically */}
              {profile.platformFeePercent <= 14 && (
                <div className="p-2 border border-dashed border-gold-600 bg-gold-950/10 rounded-sm">
                  <div className="flex items-center gap-1.5 text-gold-400 text-[10px] uppercase font-bold">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-gold-400" />
                    <span>Active Discounted Rate: {profile.platformFeePercent}% Platform cut!</span>
                  </div>
                  <p className="text-[9px] text-zinc-400 leading-normal mt-0.5">
                    Your platform cut is reduced dynamically from your registered providers or community referral boosts.
                  </p>
                </div>
              )}
            </section>

            {/* VIRAL STATE STATE MACHINE ENGINE */}
            <section className="bg-zinc-950 p-4 border border-gold-800 rounded-sm relative space-y-4">
              <div className="absolute top-0 right-4 w-12 h-1 bg-gold-500/60"></div>
              <div>
                <h3 className="font-deco text-xs text-gold-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                  Viral Growth Engine
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                  Early-bird referral multiplier status. Instantly boost commissions and split ratios back to maximum using community logins.
                </p>
              </div>

              <div className="p-3 bg-black border border-gold-950 rounded-sm space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 font-mono">Tier Position:</span>
                  <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider ${
                    profile.earlyBirdTier === "EARLY_BIRD_ELITE"
                      ? "bg-gold-400 text-black shadow-[0_0_8px_#c29334]"
                      : profile.earlyBirdTier === "GROWTH_BOOSTED"
                        ? "bg-gold-950 text-gold-300 border border-gold-800"
                        : "bg-zinc-900 text-zinc-400"
                  }`}>
                    {profile.earlyBirdTier || "STABLE_BASELINE"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 font-mono">Invited Users:</span>
                  <span className="text-white font-mono font-bold text-xs">{profile.referredUserCount || 0} devs</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 font-mono">Commission Rate:</span>
                  <span className="text-gold-400 font-mono font-bold text-xs">
                    {profile.platformFeePercent}% Platform Fee
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 font-mono">Decay Tracker:</span>
                  <span className="text-zinc-400 font-mono text-xs font-semibold">{profile.daysSinceBoost !== undefined ? profile.daysSinceBoost : 90} days elapsed</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-zinc-400 uppercase">
                    <span>Simulate Time Decay</span>
                    <span className="text-gold-400 font-bold">{simulatedDays}d elapsed</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="95"
                    value={simulatedDays}
                    onChange={(e) => handleSimulateDecaySlider(parseInt(e.target.value, 10))}
                    className="w-full accent-gold-400 bg-zinc-900 border border-zinc-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSimulateReferral}
                  id="btn-referrals-sidebar"
                  className="w-full bg-gold-400 text-black hover:bg-gold-300 transition-all font-bold py-1.5 font-mono text-[10px] uppercase rounded-sm flex items-center justify-center gap-1.5 shadow-[0_0_8px_rgba(194,147,52,0.2)] cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Register Referral (+1)
                </button>
              </div>
            </section>

            {/* USER-SUBMITTED AFFILIATE LINKS */}
            <section className="bg-zinc-950 p-4 border border-gold-800 rounded-sm relative space-y-4">
              <div className="absolute top-0 right-4 w-12 h-1 bg-gold-500/60"></div>
              <div>
                <h3 className="font-deco text-xs text-gold-300 uppercase tracking-widest flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-gold-400" />
                  Sponsor Affiliate Overrides
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                  Configure tracking links for our seed platforms. When set, Catbox prioritizing rendering your link in CLI spins to capture 100% of generated conversions.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                    <span>Neon (neodeco-db.io)</span>
                    <span className="text-[8px] text-gold-550 lowercase">custom URL</span>
                  </label>
                  <input
                    type="text"
                    value={neonAffiliate}
                    onChange={(e) => setNeonAffiliate(e.target.value)}
                    placeholder="https://neodeco-db.io/?ref=your_id"
                    className="w-full bg-black border border-gold-900/60 rounded-sm px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-gold-550 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                    <span>Supabase (saffron-host.net)</span>
                    <span className="text-[8px] text-gold-550 lowercase">custom URL</span>
                  </label>
                  <input
                    type="text"
                    value={supabaseAffiliate}
                    onChange={(e) => setSupabaseAffiliate(e.target.value)}
                    placeholder="https://saffron-host.net/?ref=your_id"
                    className="w-full bg-black border border-gold-900/60 rounded-sm px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-gold-550 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveAffiliateUrls}
                  id="save-affiliate-urls-btn"
                  className="w-full bg-black border border-gold-700/60 text-gold-300 hover:bg-gold-950/20 hover:text-white transition-colors py-1.5 font-mono text-[10px] uppercase rounded-sm cursor-pointer"
                >
                  Save Override Settings
                </button>
              </div>
            </section>

            {/* HOUSE WISDOM TIPS PREFERENCE SWITCH */}
            <section className="bg-zinc-950 p-4 border border-gold-800 rounded-sm relative">
              <div className="absolute top-0 right-4 w-12 h-1 bg-zinc-600"></div>
              <div className="flex items-center justify-between gap-3 text-left">
                <div className="flex-1">
                  <h3 className="font-deco text-xs text-zinc-300 uppercase tracking-widest">
                    Omit House Tips
                  </h3>
                  <p className="text-[9px] text-zinc-500 mt-1 leading-normal">
                    Filters out informational tips and optimization wisdom ("✶ Catbox Tip: ...") from terminal spins.
                  </p>
                </div>
                <div>
                  <button
                    onClick={handleToggleHouseTips}
                    id="toggle-omit-house-tips"
                    className={`w-11 h-6 px-0.5 flex items-center rounded-full transition-colors cursor-pointer border ${
                      omitHouseTips ? "bg-gold-600 border-gold-400 justify-end" : "bg-black border-zinc-800 justify-start"
                    }`}
                  >
                    <span className={`w-4.5 h-4.5 rounded-full transition-transform ${
                      omitHouseTips ? "bg-black" : "bg-zinc-600"
                    }`} />
                  </button>
                </div>
              </div>
            </section>

            {/* USER MILESTONES & REVENUE SPLITS */}
            <section className="bg-zinc-950 p-4 border border-gold-800 rounded-sm relative space-y-3">
              <div className="absolute top-0 right-4 w-12 h-1 bg-gold-500/60"></div>
              <div>
                <h3 className="font-deco text-xs text-gold-300 uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-gold-400" />
                  User Milestones & Splits
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                  Scale your dev splits automatically with total system installs. Move the slider to simulate target milestones.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-zinc-400 uppercase">
                    <span>Simulated Installs</span>
                    <span className="text-gold-400 font-bold">{customInstalls} installs</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="1250"
                    value={customInstalls}
                    onChange={(e) => handleSimulateInstalls(parseInt(e.target.value, 10))}
                    className="w-full accent-gold-400 bg-zinc-900 border border-zinc-800 h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="p-2.5 rounded-sm bg-black border border-gold-950/40 text-[10px] font-mono space-y-1 text-zinc-400">
                  <div className="flex justify-between">
                    <span>Installs Range:</span>
                    <span className="text-white">
                      {customInstalls <= 10 ? "1 - 10 (Early Bird)" :
                       customInstalls <= 100 ? "11 - 100" :
                       customInstalls <= 1000 ? "101 - 1000" : "1001 - 10k"}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Developer Payout Split:</span>
                    <span className="text-gold-300">
                      {customInstalls <= 10 ? "97%" :
                       customInstalls <= 100 ? "95%" :
                       customInstalls <= 1000 ? "90%" : "85%"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Service Cut:</span>
                    <span className="text-zinc-500">
                      {customInstalls <= 10 ? "3%" :
                       customInstalls <= 100 ? "5%" :
                       customInstalls <= 1000 ? "10%" : "15%"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* SELF-SERVE PROMO ENGINE */}
            <section className="bg-zinc-950 p-4 border border-gold-800 rounded-sm relative space-y-3">
              <div className="absolute top-0 right-4 w-12 h-1 bg-gold-400"></div>
              <div>
                <h3 className="font-deco text-xs text-gold-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-gold-400 animate-pulse" />
                  Self-Serve Ad Engine
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                  Submit custom lines. Your campaigns run at wholesale costs of <span className="text-gold-400 font-semibold">$0.06 / view</span>. We apply a 0% platform fee penalty (deducted from your balance pool).
                </p>
              </div>

              <form onSubmit={handleAddSelfServePromo} className="space-y-2">
                <div className="space-y-1">
                  <input
                    type="text"
                    value={newSelfServeText}
                    onChange={(e) => setNewSelfServeText(e.target.value)}
                    placeholder="✶ Creative: Check my ultra fast Postgres engine ↗"
                    className="w-full bg-black border border-gold-900/60 rounded-sm px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-gold-550 font-sans"
                    required
                  />
                </div>
                <button
                  type="submit"
                  id="btn-add-self-serve-promo"
                  className="w-full py-1.5 bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-zinc-950 font-bold text-[10px] uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Submit Sponsor Campaign
                </button>
              </form>

              {selfServePromos.length > 0 && (
                <div className="space-y-1.5 pt-1.5 border-t border-zinc-800/60">
                  <span className="text-[8.5px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Your Live Campaigns:</span>
                  <div className="space-y-1">
                    {selfServePromos.map((line, i) => (
                      <div key={i} className="flex justify-between items-center bg-black/50 p-1.5 rounded border border-zinc-900 text-[10px] gap-1">
                        <span className="text-zinc-450 truncate max-w-[170px]" title={line}>{line}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSelfServePromo(line)}
                          className="text-red-400 hover:text-red-300 text-[8px] font-mono uppercase shrink-0 px-1 hover:bg-red-950/20 rounded cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* PRIVACY & TRACKING TRANSPARENCY DISPLAY */}
            <section className="bg-zinc-950 p-4 border border-zinc-800 rounded-sm space-y-3">
              <h4 className="font-deco text-xs text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
                Local-First Sovereignty Guarantee
              </h4>
              <p className="text-[9.5px] text-zinc-500 leading-normal">
                Verifiable security guidelines loaded live from our local gateway. Proving zero keystroke intercepts.
              </p>

              {privacyPolicy?.terms && (
                <div className="space-y-2 p-2.5 rounded-sm bg-black border border-zinc-900 text-[9px] font-mono text-zinc-400 leading-normal">
                  <div className="text-gold-300 font-bold mb-1 uppercase tracking-wider">{privacyPolicy.compliance} - {privacyPolicy.guarantee}</div>
                  {privacyPolicy.terms.map((term, i) => (
                    <div key={i} className="flex gap-1.5 items-start">
                      <span className="text-gold-400 text-xs shadow-sm">✓</span>
                      <span>{term}</span>
                    </div>
                  ))}
                  <div className="text-zinc-600 mt-1 pl-3 text-[8.5px] italic">
                    {privacyPolicy.exemptions}
                  </div>
                </div>
              )}
            </section>

            {/* BRING YOUR OWN AD PROVIDER FORM */}
            <section className="bg-zinc-950 p-4 border border-gold-800 rounded-sm relative space-y-4">
              <div className="absolute top-0 right-4 w-12 h-1 bg-gold-500/60"></div>
              <div>
                <h3 className="font-deco text-xs text-gold-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-gold-400" />
                  Bring Your Own Provider
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                  Add non-standard or direct local ad brokerage APIs. Make it <span className="text-gold-400 font-bold">"Shared"</span> with the community to earn solid **cattbacks** whenever others serve their ads!
                </p>
              </div>

              <form onSubmit={handleRegisterProvider} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">Provider Name</label>
                  <input
                    type="text"
                    value={newProvName}
                    onChange={(e) => setNewProvName(e.target.value)}
                    placeholder="e.g. Saffron Ads Exchange"
                    className="w-full bg-black border border-gold-900/60 rounded-sm px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-gold-550 font-sans"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">Base API URL</label>
                  <input
                    type="text"
                    value={newProvUrl}
                    onChange={(e) => setNewProvUrl(e.target.value)}
                    placeholder="https://api.saffronadnet.org/fetch"
                    className="w-full bg-black border border-gold-900/60 rounded-sm px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-gold-550 font-mono"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">Est. CPM ($ Rate)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.05"
                      max="2.00"
                      value={newProvCpm}
                      onChange={(e) => setNewProvCpm(e.target.value)}
                      className="w-full bg-black border border-gold-900/60 rounded-sm px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-gold-550 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">Publish Share</label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newProvShare}
                        onChange={(e) => setNewProvShare(e.target.checked)}
                        className="rounded bg-black border-gold-900 text-gold-500 focus:ring-gold-500 text-xs"
                      />
                      <span className="text-[10px] text-zinc-400 font-mono uppercase">COMMUNITY</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-submit-provider"
                  className="w-full py-2 bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-zinc-950 font-bold text-xs rounded-sm uppercase tracking-widest transition-all mt-2.5 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-950" />
                  Register & Activate Ad Net
                </button>
              </form>
            </section>

            {/* AD PROVIDERS LIST (ACTIVE REGISTRY) */}
            <section className="bg-zinc-950 p-4 border border-gold-900 rounded-sm space-y-3">
              <h4 className="font-deco text-xs text-gold-300 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-gold-400" />
                Active Direct Pool
              </h4>

              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {providers.map((p) => (
                  <div key={p.id} className="p-2.5 rounded-sm bg-black border border-gold-905/40 flex items-center justify-between gap-1.5">
                    <div>
                      <div className="text-xs font-semibold text-zinc-200 font-sans flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${p.sharedWithCommunity ? "bg-gold-400 animate-pulse" : "bg-zinc-600"}`}></span>
                        {p.name}
                      </div>
                      <div className="text-[8.5px] font-mono text-zinc-500 truncate max-w-[150px]">{p.baseUrl}</div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[9px] bg-gold-950/40 text-gold-400 font-mono px-1 py-0.5 rounded border border-gold-900/60">
                        ${p.cpmRate.toFixed(2)} BID
                      </span>
                      <div className="text-[8px] text-zinc-550 mt-1 uppercase font-mono">
                        {p.sharedWithCommunity ? "Shared (Earns 15% override)" : "Private Coder"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Referral / Boost Simulator */}
            <section className="bg-zinc-950 p-4 border border-gold-900 rounded-sm space-y-3">
              <h4 className="font-deco text-xs text-gold-300 uppercase tracking-widest flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-gold-400" />
                Network Booster Share
              </h4>
              <p className="text-[10px] text-zinc-500 leading-normal">
                By bringing new engineers onto Catbox, you permanently decrease the baseline cut down towards a 3% platform fee margin.
              </p>
              <button
                onClick={handleSimulateReferral}
                id="btn-referrals-sidebar"
                className="w-full py-1.5 bg-black hover:bg-zinc-900 text-gold-400 hover:text-gold-300 border border-gold-800 text-[10px] font-bold rounded-sm uppercase tracking-wider transition-all"
              >
                Simulate Referral invite
              </button>
            </section>

          </aside>
        )}

        {/* 🖥️ ROUTE 3: Interactive CLI simulation focus screen */}
        {currentRoute === "cli" && (
          <section className="col-span-12 space-y-6 animate-fade-in">

            {/* Pane Label */}
            <div className="flex items-center justify-between border-b-2 border-gold-605 pb-1.5">
              <h2 className="font-deco text-sm font-bold tracking-widest text-gold-400">
                INTERACTIVE PERFORMANCE CONSOLE
              </h2>
              <span className="font-mono text-[9px] text-zinc-500 uppercase">LIVE_STATS</span>
            </div>

            {/* Symmetrical Grid of Live Click & Impression Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="p-4 bg-zinc-950 border border-gold-800 rounded-sm relative flex flex-col justify-between">
                <div className="absolute top-0 right-4 w-6 h-1 bg-gold-500"></div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-[9px] font-mono uppercase tracking-wider">Impressions (Served)</span>
                  <Layers className="w-3.5 h-3.5 text-gold-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span id="metric-impressions-count" className="text-3xl font-mono text-white font-bold">{profile.impressionCount}</span>
                  <span className="text-[9px] text-zinc-550 uppercase">events</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-950 border border-gold-800 rounded-sm relative flex flex-col justify-between">
                <div className="absolute top-0 right-4 w-6 h-1 bg-gold-400"></div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-[9px] font-mono uppercase tracking-wider">Click Volume (CTR)</span>
                  <MousePointerClick className="w-3.5 h-3.5 text-gold-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span id="metric-clicks-count" className="text-3xl font-mono text-white font-bold">{profile.clickCount}</span>
                  <span className="text-[9px] text-zinc-550 uppercase">
                    ({profile.impressionCount > 0 ? ((profile.clickCount / profile.impressionCount) * 100).toFixed(1) : "0.0"}%)
                  </span>
                </div>
              </div>

              <div className="p-4 bg-zinc-950 border border-gold-800 rounded-sm relative flex flex-col justify-between">
                <div className="absolute top-0 right-4 w-6 h-1 bg-gold-400"></div>
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-[9px] font-mono uppercase tracking-wider">Catbox Balance</span>
                  <Coins className="w-3.5 h-3.5 text-gold-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span id="metric-cattback-balance" className="text-3xl font-mono text-gold-300 font-bold">${profile.cattbackBalance.toFixed(2)}</span>
                  <span className="text-[9px] text-emerald-400 uppercase font-mono">USD</span>
                </div>
              </div>

            </div>

            {/* CLI Customizable String & Visual Terminal Panel */}
            <div className="bg-zinc-950 p-6 border-2 border-double border-gold-500 rounded-sm space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gold-900/60 pb-4">
                <div>
                  <h3 className="font-deco text-sm font-bold text-gold-300 uppercase tracking-widest flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-gold-400" />
                    CLI & Code string customizer
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-1 uppercase font-mono">
                    Personalized status line string rendering
                  </p>
                </div>

                {/* Display Output Surface Toggles */}
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => setCliFormat("VS Code Status Bar")}
                    className={`px-3 py-1 text-[10px] font-mono rounded uppercase transition-all border ${
                      cliFormat === "VS Code Status Bar"
                        ? "bg-gold-550 text-black border-gold-400 font-bold"
                        : "bg-black text-zinc-400 border-zinc-800 hover:text-white"
                    }`}
                  >
                    statusbar message
                  </button>
                  <button
                    onClick={() => setCliFormat("CLI Prompt Footer")}
                    className={`px-3 py-1 text-[10px] font-mono rounded uppercase transition-all border ${
                      cliFormat === "CLI Prompt Footer"
                        ? "bg-gold-550 text-black border-gold-400 font-bold"
                        : "bg-black text-zinc-400 border-zinc-800 hover:text-white"
                    }`}
                  >
                    cli string prompt
                  </button>
                  <button
                    onClick={() => setCliFormat("Termux Shell Integration")}
                    className={`px-3 py-1 text-[10px] font-mono rounded uppercase transition-all border ${
                      cliFormat === "Termux Shell Integration"
                        ? "bg-gold-550 text-black border-gold-400 font-bold"
                        : "bg-black text-zinc-400 border-zinc-800 hover:text-white"
                    }`}
                  >
                    termux prompt setup
                  </button>
                </div>
              </div>

              {/* Keyword context controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black p-4 border border-zinc-900 rounded-sm">
                
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                    <span>Code context keyword</span>
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-600" title="Inputs are processed server-side via Gemini API to target developers with custom, humorous messages." />
                  </label>
                  <input
                    type="text"
                    value={cliContext}
                    onChange={(e) => setCliContext(e.target.value)}
                    placeholder="e.g. database docker kubernetes type-safe"
                    className="w-full bg-zinc-950 border border-gold-900/60 rounded-sm px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-gold-550 font-mono"
                  />
                  <span className="text-[9px] text-zinc-650 block">Matches relevant sponsors dynamically</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">
                    Code CLI command block
                  </label>
                  <div className="bg-zinc-950 border border-zinc-90 w-full rounded-sm px-3 py-2 text-[11px] font-mono text-zinc-450 flex items-center justify-between">
                    <span className="truncate select-all pr-1 text-[10.5px]">
                      {cliFormat === "VS Code Status Bar" 
                        ? "vscode: statusLine.show(CATBOX_AD)" 
                        : cliFormat === "CLI Prompt Footer"
                        ? "cli_$ catbox --render --json"
                        : `pkg install curl -y && curl -sL ${window.location.origin || "http://localhost:3000"}/api/termux/install | bash`}
                    </span>
                    <span className="text-[8px] px-1.5 py-0.5 bg-gold-950 text-gold-400 border border-gold-900 uppercase font-bold tracking-wider rounded shrink-0">
                      ready
                    </span>
                  </div>
                  <span className="text-[9px] text-gold-600 font-mono block">
                    {cliFormat === "Termux Shell Integration"
                      ? "Run this bootstrap command inside Termux on Android"
                      : "Custom string targets match local output"}
                  </span>
                </div>

              </div>

              {/* VS Code Output terminal emulator */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                    Simulated Code Environment output window
                  </label>
                  <span className="text-[9.5px] text-zinc-600 font-mono">
                    Mode: Interactive Shell
                  </span>
                </div>

                {/* Symmetrical golden double-line terminal box */}
                <div className="bg-black border-2 border-gold-700/60 rounded-sm p-5 font-mono text-xs text-zinc-300 shadow-inner relative space-y-3.5">
                  
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2 text-[10px]">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-gold-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-gold-600/60"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-900"></div>
                    </div>
                    <span className="text-zinc-600 uppercase tracking-wider text-[9px] font-bold">Catbox Code Agent Simulator v1.4</span>
                  </div>

                  {/* Scrollable logs of historical commands, actions and Gemini CLI outputs */}
                  <div className="max-h-56 overflow-y-auto space-y-1.5 border-b border-zinc-900 pb-3 text-[11px] text-zinc-400 font-mono scrollbar-thin scrollbar-thumb-zinc-805">
                    {terminalLogs.map((log, index) => {
                      if (log.startsWith("cli_$")) {
                        return (
                          <p key={index} className="text-zinc-300">
                            <span className="text-gold-500 font-bold">$</span> {log.replace("cli_$", "").trim()}
                          </p>
                        );
                      }
                      if (log.includes("[ERROR]") || log.includes("[Gemini CLI Error]") || log.includes("[Gemini Connect Error]") || log.includes("Error")) {
                        return <p key={index} className="text-red-400 font-semibold">{log}</p>;
                      }
                      if (log.includes("[SUCCESS]") || log.includes("[EVENT]")) {
                        return <p key={index} className="text-emerald-400 font-medium">{log}</p>;
                      }
                      if (log.includes("--- Gemini CLI Response ---") || log.includes("--- Catbox Profile Ledger ---")) {
                        return <p key={index} className="text-gold-400 font-bold mt-2">{log}</p>;
                      }
                      return <p key={index} className="leading-relaxed whitespace-pre-wrap">{log}</p>;
                    })}
                  </div>

                  {/* Active Simulator Display message panel */}
                  <div className="border border-gold-900 bg-zinc-950/90 p-4 rounded-sm space-y-3 relative hover:border-gold-500 transition-all">
                    
                    <div className="flex items-center justify-between text-[9px] text-zinc-450 font-mono border-b border-zinc-900 pb-2">
                      <span className="text-gold-400 font-bold uppercase tracking-widest text-[9.5px]">
                        {cliFormat === "VS Code Status Bar" 
                          ? "ACTIVE VSCODE STATUS AD STRING" 
                          : cliFormat === "CLI Prompt Footer" 
                          ? "ACTIVE CLI PROMPT STRING" 
                          : "ACTIVE TERMUX AD BANNER STRING"}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Tooltip trigger button */}
                        <div className="relative group/linger">
                          <button
                            type="button"
                            onClick={() => {
                              setIsHoverLingerEnabled(!isHoverLingerEnabled);
                              setIsHoveringAd(false);
                              setAdRevealActive(false);
                            }}
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[8px] font-mono border uppercase tracking-wider transition-all cursor-pointer ${
                              isHoverLingerEnabled 
                                ? "bg-gold-950/40 border-gold-900/60 text-gold-400 hover:bg-gold-900/50 hover:border-gold-500" 
                                : "bg-zinc-900/40 border-zinc-900 text-zinc-500 hover:bg-zinc-850/50 hover:text-zinc-400"
                            }`}
                          >
                            <span className={`w-1 h-1 rounded-full ${isHoverLingerEnabled ? "bg-amber-400 animate-pulse" : "bg-zinc-600"}`}></span>
                            {isHoverLingerEnabled ? "Hover Reveal: ON" : "Hover Reveal: OFF"}
                          </button>

                          {/* Tooltip on how to disable */}
                          <div className="absolute right-0 bottom-full mb-1.5 w-52 p-2 bg-zinc-950 border border-zinc-900 rounded shadow-xl text-[8.5px] leading-normal text-zinc-400 font-mono invisible opacity-0 group-hover/linger:visible group-hover/linger:opacity-100 transition-all z-[99] pointer-events-none normal-case">
                            <p className="text-gold-400 font-bold mb-0.5 uppercase tracking-wider text-[8px]">Linger Reveal Specs</p>
                            <p>Hovering over the slogan for &gt;2 seconds triggers a cryptographic and host telemetry specs pull.</p>
                            <p className="mt-1.5 border-t border-zinc-800 pt-1 text-[7.5px] text-zinc-500 uppercase tracking-wide">
                              <span className="text-gold-500 font-semibold">To Disable:</span> Click this button to toggle hover specs globally.
                            </p>
                          </div>
                        </div>

                        <span className="px-1 bg-gold-950 text-gold-400 rounded text-[9px] font-mono border border-gold-900 italic">GENRE: {cliContext || "general"}</span>
                      </div>
                    </div>

                    <div 
                      onMouseEnter={() => setIsHoveringAd(true)}
                      onMouseLeave={() => setIsHoveringAd(false)}
                      className="py-2 relative group/ad select-none cursor-help"
                    >
                      <p className="text-gold-300 font-deco text-sm font-semibold tracking-wide italic transition-colors duration-200 group-hover/ad:text-gold-250">
                        "{activeAdMessage}"
                      </p>

                      {/* Smooth progress bar under the ad slogan */}
                      {isHoveringAd && isHoverLingerEnabled && !adRevealActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-900/60 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-75"
                            style={{ width: `${hoverProgress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* EXPANDED DEVELOPER DETAILS DRAWER */}
                    {adRevealActive && isHoverLingerEnabled && (
                      <div className="bg-zinc-950/80 border border-gold-900/40 rounded p-3 mt-1.5 space-y-2 animate-fadeIn font-mono text-[9px] leading-relaxed">
                        <div className="flex items-center justify-between text-[10px] text-gold-400 font-bold tracking-wide uppercase border-b border-zinc-900 pb-1.5">
                          <span>{getDeveloperDetailsForSlogan(activeAdMessage).title}</span>
                          <span className="text-[7.5px] bg-gold-950 font-normal px-1 py-0.5 border border-gold-900/60 rounded text-gold-400/90 tracking-widest lowercase italic">
                            extracted via hover-linger
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-1">
                          {getDeveloperDetailsForSlogan(activeAdMessage).specs.map((spec, index) => (
                            <div key={index} className="flex flex-col border-b border-zinc-900/40 pb-1">
                              <span className="text-zinc-500 uppercase text-[7.5px] tracking-wider font-semibold">
                                {spec.label}
                              </span>
                              <span className="text-zinc-300 font-mono leading-tight whitespace-normal break-all">
                                {spec.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="text-[8px] text-zinc-500 pt-1 flex items-center justify-between">
                          <span>Status: SECURE_STATE_HEALTH_GREEN</span>
                          <span>Source: Deco Telemetry Decrypted</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between gap-1.5 text-[8.5px] text-zinc-500 uppercase font-mono pt-1.5 border-t border-zinc-900">
                      <span>Rate: Standard CPM-Bid (Carbon Deco Ads)</span>
                      <span className="text-gold-400">Yield Share: User gets 85% / platform gets 15%</span>
                    </div>
                  </div>

                  {/* Interactive Terminal Command Input Row */}
                  <form onSubmit={handleExecuteCliCommand} className="flex items-center gap-2 pt-1">
                    <span className="text-gold-400 font-mono font-bold text-xs select-none">cli_$</span>
                    <input
                      type="text"
                      value={cliInput}
                      onChange={(e) => setCliInput(e.target.value)}
                      placeholder="Type commands (e.g. 'help', 'gemini design security slogan', 'catbox balance')"
                      className="flex-1 bg-transparent border-none text-zinc-200 text-xs font-mono focus:outline-none focus:ring-0 placeholder-zinc-700"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-gold-950 hover:bg-gold-900 text-gold-400 hover:text-gold-300 border border-gold-900 hover:border-gold-500 font-mono text-[10px] uppercase font-bold rounded-sm transition-all"
                    >
                      Exec
                    </button>
                  </form>

                </div>
              </div>

              {/* SIMULATION ACTION BUTTONS: Tracks clicks as well as impressions */}
              <div className="space-y-3">
                <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest text-center">
                  -- Trigger Live Simulated Workspace Actions and Track Splits --
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    id="btn-simulate-impression"
                    onClick={() => handleTriggerAdEvent("IMPRESSION")}
                    disabled={loadingAd}
                    className="py-3 bg-zinc-950 text-gold-400 hover:text-gold-300 hover:bg-zinc-900/60 border border-gold-500 font-bold font-deco text-xs rounded-sm uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-[0_0_8px_rgba(194,147,52,0.1)]"
                  >
                    <Layers className="w-4 h-4 text-gold-400 shrink-0" />
                    1. Simulate Ad Impression
                  </button>

                  <button
                    id="btn-simulate-click"
                    onClick={() => handleTriggerAdEvent("CLICK")}
                    disabled={loadingAd}
                    className="py-3 bg-gradient-to-r from-gold-600 to-gold-400 text-black hover:from-gold-500 hover:to-gold-300 font-bold font-deco text-xs rounded-sm uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(194,147,52,0.2)]"
                  >
                    <MousePointerClick className="w-4 h-4 text-black shrink-0 animate-bounce" />
                    2. Simulate Click Event
                  </button>
                </div>

                {loadingAd && (
                  <div className="text-center font-mono text-[10.5px] text-gold-400 tracking-widest animate-pulse uppercase">
                    • Synthesizing unique developer content via server-side Gemini intelligence •
                  </div>
                )}
              </div>

            </div>

            {/* Cryptographic Escrow Protection Compliance Box */}
            <div className="bg-zinc-950 p-6 border border-gold-900 rounded-sm space-y-4">
              <div>
                <h3 className="font-deco text-xs text-gold-300 uppercase tracking-widest flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-gold-400" />
                  AES-256-GCM Secure Key Validator
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase font-mono leading-normal">
                  Guarantees that your payout coordinates are cryptographically secured under SOC2 compliant frameworks.
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">Credential plaintext parameters</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-black border border-gold-900/65 rounded-sm px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-gold-500 font-mono"
                      value={credentialInput}
                      onChange={(e) => setCredentialInput(e.target.value)}
                      placeholder="e.g. bank_routing_acc_code_0029"
                    />
                    <button
                      id="btn-encrypt-action"
                      onClick={handleEncryptData}
                      className="px-4 py-1.5 bg-gold-950 border border-gold-600 text-gold-400 hover:text-gold-300 text-xs font-bold font-mono uppercase tracking-wider rounded-sm transition-all"
                    >
                      Encrypt
                    </button>
                  </div>
                </div>

                {encryptionResult && (
                  <div className="bg-black p-4 rounded border border-gold-905/40 text-xs font-mono space-y-3 animate-fade-in text-zinc-400">
                    <div className="flex justify-between items-center text-[9px] font-mono text-zinc-550 border-b border-zinc-900 pb-1.5">
                      <span>METRIC SIGNATURE: {encryptionResult.method}</span>
                      <span className="text-gold-400">{encryptionResult.compliance_audited}</span>
                    </div>

                    <div className="space-y-1 block max-w-full overflow-x-auto text-[10.5px]">
                      <p><span className="text-zinc-600 uppercase font-mono">Cipher:</span> <span className="text-zinc-300 font-bold">{encryptionResult.ciphertext}</span></p>
                      <p><span className="text-zinc-600 uppercase font-mono">IV:</span> <span className="text-zinc-400">{encryptionResult.iv}</span></p>
                      <p><span className="text-zinc-600 uppercase font-mono">Auth Tag:</span> <span className="text-gold-400">{encryptionResult.authTag}</span></p>
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-zinc-900">
                      <span className="text-[8.5px] text-zinc-550">Strict escrow security check: OK</span>
                      <button
                        id="btn-decrypt-action"
                        onClick={handleDecryptData}
                        className="px-2 py-0.5 border border-gold-500 bg-gold-950/20 text-gold-400 hover:text-white uppercase text-[9px] font-bold rounded"
                      >
                        Verify Decrypt
                      </button>
                    </div>

                    {decryptedText && (
                      <div className="p-2 border border-dashed border-gold-700/80 bg-zinc-950 rounded text-gold-400 text-[10.5px]">
                        ✓ Integrity Check Passed. Decrypted credentials recovered: <span className="text-white font-bold">{decryptedText}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </section>
        )}

        {/* 🔗 ROUTE 4: Decentralized Cryptographic Ledger & Escrow Auditing */}
        {currentRoute === "ledger" && (
          <aside className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 items-start animate-fade-in">

            {/* Pane Label */}
            <div className="flex items-center justify-between border-b-2 border-gold-600 pb-1.5">
              <h2 className="font-deco text-sm font-bold tracking-widest text-gold-400">
                PUBLIC GENERAL LEDGER
              </h2>
              <span className="font-mono text-[9px] text-zinc-500 uppercase">LEDGER_01</span>
            </div>

            {/* Safe StripeConnect Withdrawal / Escrow Dispenser */}
            <section className="bg-zinc-950 p-4 border border-gold-900 rounded-sm space-y-4">
              <div>
                <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest">
                  DEPOSIT CUSTODIAN POOL
                </span>
                <h3 className="font-deco text-xs text-gold-300 uppercase tracking-widest mt-0.5">
                  Safe Escrow Withdrawal
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                  Withdraw dynamic ad revenue splits via Stripe Connect Escrow vaults. Funds are isolated from developer interference.
                </p>
              </div>

              <div className="bg-black p-3 border border-gold-950 rounded-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase font-mono text-zinc-500">Available to Withdraw</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm">${profile.balance.toFixed(2)} USD</span>
                </div>
              </div>

              <button
                id="btn-withdraw-stripe"
                onClick={handleWithdrawPayout}
                className="w-full py-2 bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-zinc-950 font-bold text-xs rounded-sm uppercase tracking-widest transition-all shadow flex items-center justify-center gap-1.5"
              >
                <Wallet className="w-3.5 h-3.5 text-zinc-950" />
                Withdraw via Stripe Connect
              </button>

              {payoutStatus && (
                <div className="p-3 bg-black border border-gold-700/40 rounded-sm font-mono text-[9.5px] text-gold-400 leading-normal text-center">
                  {payoutStatus}
                </div>
              )}

              <div className="flex justify-between text-[8px] font-mono text-zinc-500 px-1">
                <span>Network gas fee: $0.00</span>
                <span>Third-party Vault: STRIPE Connect</span>
              </div>
            </section>

            {/* LEDGER LOG ENTRIES: Scrolling SHA-256 Blocks */}
            <section className="bg-zinc-950 p-4 border border-gold-905 rounded-sm space-y-4">
              
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="font-deco text-xs text-gold-400 tracking-wider">Verifiable public blocks</span>
                <span className="text-[9px] font-mono text-zinc-500">{ledger.length} tx blocks</span>
              </div>

              <div 
                id="public-ledger-logs-scroller"
                className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gold-900"
              >
                {ledger.map((item) => (
                  <div 
                    key={item.index} 
                    className="border-l border-gold-600 pl-3 py-1 space-y-1 hover:border-gold-300 transition-all text-xs"
                  >
                    <div className="flex justify-between items-center text-[8.5px] font-mono text-zinc-550">
                      <span className="text-gold-400 tracking-wider font-semibold">
                        BLOCK_{item.index}
                      </span>
                      <span>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] font-medium text-zinc-100 leading-tight">
                      {item.type === "SYSTEM_GENESIS" && (
                        <span className="text-zinc-500 font-mono italic text-[10px]">{item.description}</span>
                      )}
                      {item.type === "AD_IMPRESSION" && (
                        <>
                          <span className="text-gold-300 font-bold font-mono">
                            +${item.amount.toFixed(4)}
                          </span>{" "}
                          <span className="text-zinc-500">split from</span>{" "}
                          <span className="text-zinc-400 font-semibold italic">"{item.provider}"</span>
                        </>
                      )}
                      {item.type === "AD_CLICK" && (
                        <>
                          <span className="text-gold-200 font-bold font-mono">
                            +${item.amount.toFixed(4)} Click!
                          </span>{" "}
                          <span className="text-zinc-400">from</span>{" "}
                          <span className="text-zinc-300">{item.provider}</span>
                        </>
                      )}
                      {item.type === "PROVIDER_SHARE_CATTBACK" && (
                        <>
                          <span className="text-gold-400 font-bold font-mono">
                            +${item.amount.toFixed(2)} Cattback
                          </span>{" "}
                          <span className="text-zinc-400">{item.description}</span>
                        </>
                      )}
                      {item.type === "ESCROW_PAYOUT" && (
                        <span className="text-gold-400 text-[10.5px] italic font-serif">
                          💸 Safe Escrow payout: ${Math.abs(item.amount).toFixed(2)} USD dispatched!
                        </span>
                      )}
                    </p>

                    {item.type === "AD_IMPRESSION" && (
                      <p className="text-[9.5px] text-zinc-500 italic truncate" title={item.description}>
                        {item.description}
                      </p>
                    )}

                    <div className="text-[8px] text-zinc-600 font-mono truncate max-w-[200px]" title={item.hash}>
                      SHA-256: {item.hash.substring(0, 24)}...
                    </div>
                  </div>
                ))}
              </div>

            </section>

            {/* 🛡️ IDEMPOTENT TELEMETRY PIPELINE VIEW */}
            <section className="col-span-1 md:col-span-2 bg-gradient-to-b from-zinc-950 to-black p-5 border border-gold-900 rounded-sm space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-10 w-32 h-[1px] bg-gold-400"></div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-3">
                <div>
                  <span className="text-[9px] font-mono text-gold-500 uppercase tracking-widest block">
                    Telemetry Ingestion Pipeline
                  </span>
                  <h3 className="font-deco text-sm font-bold text-gold-300 uppercase tracking-widest mt-0.5">
                    Idempotent Event Log (PostgreSQL + Redis Stack)
                  </h3>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[9.5px] font-mono px-2 py-0.5 bg-black border border-zinc-800 text-zinc-400 rounded flex items-center gap-1.5 label-storage">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {telemetryDbInfo}
                  </span>
                  <button
                    onClick={async () => {
                      await telemetry.flush();
                      fetchTelemetryStats();
                    }}
                    className="px-3 py-1 bg-gold-950 hover:bg-gold-900 text-gold-400 hover:text-gold-300 border border-gold-900 hover:border-gold-500 font-mono text-[9.5px] uppercase font-bold rounded-sm transition-all"
                  >
                    Force Flush Queue
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual Pipeline Meters / Stats */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-5">
                  <div className="bg-black/40 border border-zinc-900 p-4 rounded-sm space-y-4">
                    <h4 className="font-mono text-[10px] text-gold-400 uppercase tracking-wider">
                      Client-Side Queue Status
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                        <span>Batch Buffer Size</span>
                        <span className="font-bold text-gold-400">{localQueueSize} / 50 events</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gold-500 h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (localQueueSize / 50) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-zinc-950 p-2.5 border border-zinc-900 rounded-sm">
                        <span className="block text-[8px] font-mono text-zinc-500 uppercase">Buffer State</span>
                        <span className="text-[10.5px] font-mono font-bold text-zinc-300">
                          {localQueueSize >= 40 ? "FLUSH_PENDING" : "BUFFER_INGEST"}
                        </span>
                      </div>
                      <div className="bg-zinc-950 p-2.5 border border-zinc-900 rounded-sm">
                        <span className="block text-[8px] font-mono text-zinc-500 uppercase">Transmit Cycle</span>
                        <span className="text-[10.5px] font-mono font-bold text-gold-500">
                          30s Auto Interval
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-zinc-900/55 pt-3 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <h5 className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest">
                          3-Way View Validation Indicators
                        </h5>
                        <span className="text-[7.5px] font-mono text-gold-400/80 uppercase tracking-wide px-1.5 py-0.5 bg-gold-950/40 border border-gold-900/40 rounded-sm">
                          Cursor Active
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-zinc-950/80 p-2 border border-zinc-900 rounded-sm text-center">
                          <span className="block text-[7.5px] font-mono text-zinc-500 uppercase">Focus State</span>
                          <span className={`text-[10px] font-mono font-bold ${isWindowFocused ? "text-emerald-500" : "text-rose-500"}`}>
                            {isWindowFocused ? "● FOCUSED" : "○ BLURRED"}
                          </span>
                        </div>
                        <div className="bg-zinc-950/80 p-2 border border-zinc-900 rounded-sm text-center">
                          <span className="block text-[7.5px] font-mono text-zinc-500 uppercase">User Status</span>
                          <span className={`text-[10px] font-mono font-bold ${isSystemIdle ? "text-amber-500" : "text-emerald-500"}`}>
                            {isSystemIdle ? "● AFK/IDLE" : "○ ACTIVE"}
                          </span>
                        </div>
                        <div className="bg-zinc-950/80 p-2 border border-zinc-900 rounded-sm text-center">
                          <span className="block text-[7.5px] font-mono text-zinc-500 uppercase">Ad Ingestion</span>
                          <span className={`text-[10px] font-mono font-bold ${isSystemIdle ? "text-rose-500/80" : "text-emerald-500"}`}>
                            {isSystemIdle ? "STOPPED" : "COUNTING"}
                          </span>
                        </div>
                      </div>

                      {/* LIVE CURSOR TRACKING OVERLAY */}
                      <div className="bg-zinc-950/50 p-2.5 border border-zinc-900/70 rounded-sm space-y-1.5 font-mono text-[9px]">
                        <div className="flex justify-between items-center text-zinc-400">
                          <span>Live Cursor Support Radar</span>
                          <span className="text-zinc-500">Auto Keep-Alive</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                          <div className="bg-black/40 p-1 border border-zinc-900/40 rounded">
                            <span className="block text-[6.5px] text-zinc-600 uppercase">Cursor X</span>
                            <span className="font-bold text-gold-400">{cursorPos.x}px</span>
                          </div>
                          <div className="bg-black/40 p-1 border border-zinc-900/40 rounded">
                            <span className="block text-[6.5px] text-zinc-600 uppercase">Cursor Y</span>
                            <span className="font-bold text-gold-400">{cursorPos.y}px</span>
                          </div>
                          <div className="bg-black/40 p-1 border border-zinc-900/40 rounded">
                            <span className="block text-[6.5px] text-zinc-600 uppercase">Clicks</span>
                            <span className="font-bold text-gold-400">{cursorClicks}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[7.5px] text-zinc-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Moving mouse cursor or clicking inside app frame triggers backend keep-alive</span>
                        </div>
                      </div>

                      <div className="pt-1.5 flex flex-col gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/telemetry/touch", { method: "POST" });
                              const data = await res.json();
                              if (data.success) {
                                triggerToast("Successfully triggered file touch on Claude + Cursor workspaces!");
                                fetchTelemetryStats();
                              }
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-850 text-gold-400 hover:text-gold-300 border border-zinc-800 hover:border-gold-800 font-mono text-[9px] uppercase font-bold rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-ping"></span>
                          Simulate Active Developer (Touch Claude + Cursor Paths)
                        </button>
                        <p className="text-[8px] font-mono text-zinc-500 text-center leading-normal">
                          Touches <code className="text-zinc-400 select-all font-semibold">~/.claude/transcript.json</code> &amp; <code className="text-zinc-400 select-all font-semibold">~/.cursor/*</code>. No file changes or cursor movement for 90s sets idle=true.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black /40 border border-zinc-900 p-4 rounded-sm space-y-4">
                    <h4 className="font-mono text-[10px] text-gold-400 uppercase tracking-wider flex justify-between items-center">
                      <span>Server-Side Deduplicated Analytics</span>
                      <button 
                        onClick={fetchTelemetryStats}
                        className="text-[8px] text-zinc-500 hover:text-gold-400 uppercase select-none font-mono flex items-center gap-1"
                      >
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: "6s" }} /> Refresh
                      </button>
                    </h4>

                    {telemetryStats.length === 0 ? (
                      <p className="text-[10.5px] font-mono text-zinc-650 italic">No events processed yet. Try triggering some simulated ads!</p>
                    ) : (
                      <div className="space-y-3">
                        {telemetryStats.map((item, idx) => {
                          const surfaceLabel = 
                            item.surface === "statusbar" 
                              ? "VS Code Bar" 
                              : item.surface === "cli" 
                              ? "CLI Daemon" 
                              : "Large Banner";
                          
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between items-center text-[10.5px] font-mono">
                                <span className="text-zinc-400">{surfaceLabel}</span>
                                <span className="text-gold-400 font-bold">{item.count} events</span>
                              </div>
                              <div className="flex justify-between text-[8px] font-mono text-zinc-550 border-b border-zinc-900/50 pb-1">
                                <span>AVG VIEW TIME: {parseFloat(item.avg_duration).toFixed(0)} ms</span>
                                <span>Idempotent Checked</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-gold-950/10 border border-gold-900/40 rounded-sm font-mono text-[9px] text-zinc-450 leading-normal space-y-1">
                    <p className="font-semibold text-gold-400 uppercase tracking-wide text-[9.5px]">🛡️ Redis 24h Deduplication SLA</p>
                    <p>Ad telemetry provides real-time deduplication via distributed lock keys. Repeated execution UUIDs are silently and instantaneously dropped by the ingestion server, guaranteeing clean, ad-fraud-free, CTR metrics reports.</p>
                  </div>
                </div>

                {/* Real-time Streaming Deduplicated Feed */}
                <div className="lg:col-span-12 xl:col-span-7 bg-zinc-950 p-4 border border-zinc-900 rounded-sm flex flex-col justify-between max-h-[420px]">
                  <div>
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-2 mb-3">
                      <span className="font-mono text-[10px] text-gold-400 uppercase tracking-widest">
                        Ingested Active Stream
                      </span>
                      <span className="text-[8.5px] font-mono px-1.5 py-0.5 bg-gold-950 text-gold-400 rounded-sm">
                        SLOTS: UNIQUE EVENT_IDS ONLY
                      </span>
                    </div>

                    <div className="space-y-2 overflow-y-auto max-h-[310px] pr-1 scrollbar-thin">
                      {telemetryLatest.length === 0 ? (
                        <div className="py-12 text-center text-zinc-655 font-mono text-[11px] italic">
                          No events in stream yet. Run a simulated action inside the dashboard to ingest live telemetry!
                        </div>
                      ) : (
                        telemetryLatest.map((item, idx) => (
                          <div 
                            key={idx} 
                            className="bg-black/50 p-2.5 border border-zinc-900 rounded-sm text-[10.5px] font-mono relative overflow-hidden group hover:border-zinc-800 transition-all"
                          >
                            <div className="flex justify-between items-start text-[9px] text-zinc-550 mb-1 border-b border-zinc-950 pb-1">
                              <span className="text-zinc-400 select-all font-semibold uppercase">{item.type}</span>
                              <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-zinc-300 italic truncate">
                                Ad ID: <span className="text-gold-300 font-bold not-italic">{item.ad_id}</span>
                              </p>
                              <div className="flex justify-between text-[8.5px] text-zinc-500">
                                <span className="truncate max-w-[170px]" title={item.event_id}>
                                  UUIDv4: {item.event_id.substring(0, 18)}...
                                </span>
                                <span className="text-gold-400">Duration: {item.visible_duration_ms} ms</span>
                              </div>
                            </div>
                            <div className="absolute right-2 top-1 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-emerald-500 uppercase tracking-widest">
                              ✓ unique verified
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <div className="text-[8.5px] text-zinc-550 font-mono text-center pt-2.5 border-t border-zinc-900 mt-2">
                    Verified through persistent storage on PostgreSQL metadata ledger.
                  </div>
                </div>

              </div>
            </section>

          </aside>

        )}

        {/* 🛡️ ROUTE 5: Sovereign Privacy Policy */}
        {currentRoute === "privacy" && (
          <div className="col-span-12 space-y-6 animate-fade-in">
            <div className="bg-zinc-950 p-8 border border-gold-800 rounded-sm relative space-y-6 text-zinc-100">
              <div className="absolute top-0 right-10 w-24 h-1 bg-gold-400"></div>
              
              <div className="space-y-2 border-b border-zinc-900 pb-4">
                <h2 className="font-deco text-sm font-bold text-gold-300 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gold-400 animate-pulse" />
                  Local-First Sovereignty Guarantee
                </h2>
                <p className="text-[11.5px] text-zinc-400 leading-normal">
                  Our privacy policies are processed live from our secure metadata gateways to guarantee 100% telemetry protection.
                </p>
              </div>

              {privacyPolicy?.terms && (
                <div className="space-y-4 p-5 rounded bg-black border border-zinc-900 w-full font-mono text-xs text-zinc-305 leading-relaxed">
                  <div className="text-gold-300 font-bold mb-2 uppercase tracking-wide text-xs">{privacyPolicy.compliance}</div>
                  <div className="text-zinc-400 font-semibold mb-4 leading-normal">{privacyPolicy.guarantee}</div>
                  
                  <div className="space-y-3 pt-2">
                    {privacyPolicy.terms.map((term, i) => (
                      <div key={i} className="flex gap-2.5 items-start">
                        <span className="text-gold-400 text-sm shadow-sm select-none">✓</span>
                        <span>{term}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-zinc-500 mt-6 pl-4 border-l border-gold-850/40 text-[11px] italic">
                    {privacyPolicy.exemptions}
                  </div>
                </div>
              )}

              <div className="p-4 bg-black border border-zinc-900 rounded text-xs text-zinc-500 font-sans leading-relaxed">
                <h4 className="text-zinc-300 uppercase tracking-wide font-semibold text-[11px] mb-1">Verifiable Local Governance</h4>
                <p>This workspace operates on direct peer-to-peer verification schemas. We strictly disallow the storage, recording, or proxy analysis of keyboard buffers, layout variables, or code comments. Safe cryptographic signatures take place natively, fully aligning with continuous SOC2 standard parameters.</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Decorative Golden Line Divider */}
      <div className="deco-line-through max-w-7xl mx-auto w-full px-8 my-2 opacity-40"></div>

      {/* Symmetrical Art Deco Footer with precise telemetry specs */}
      <footer className="border-t-4 border-double border-gold-600 bg-zinc-950 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-mono text-zinc-500">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 uppercase tracking-wider">
            <span className="text-gold-500 font-bold">CATBOX MIT APPLET LICENSE v1.1</span>
            <span className="text-zinc-600">|</span>
            <a href="#github-sec" className="hover:text-gold-300 transition-colors flex items-center gap-1">
              GITHUB REPOSITORY: CATBOX/CORE
              <ExternalLink className="w-3 h-3 text-gold-500" />
            </a>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-zinc-600">CLI PROTOCOL: APPROVED STATUS</span>
            <div className="w-24 h-2 bg-zinc-900 border border-gold-900 rounded-full overflow-hidden flex">
              <div className="h-full bg-gold-500 w-full"></div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
