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

export default function App() {
  // Pane Toggles (All panes can be hidden)
  const [showLeftPane, setShowLeftPane] = useState(true);
  const [showCenterPane, setShowCenterPane] = useState(true);
  const [showRightPane, setShowRightPane] = useState(true);

  // Background Customization States for Stained Glass Themes
  const [bgType, setBgType] = useState<"dark" | "roof" | "custom">("custom");
  const [customBgUrl, setCustomBgUrl] = useState(stainedGlassCarrier);


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
  
  // Interaction and Form States
  const [loadingAd, setLoadingAd] = useState(false);
  const [actionType, setActionType] = useState<"IMPRESSION" | "CLICK">("IMPRESSION");
  const [cliContext, setCliContext] = useState("geometric rust container");
  const [cliFormat, setCliFormat] = useState("VS Code Status Bar");
  
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
    }
  }, [profile?.id, profile?.daysSinceBoost]);

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
        triggerToast(
          type === "CLICK"
            ? `Ad click tracked! Earned $${data.devPayout.toFixed(4)} with ${100 - data.platformFeePercent}% user split!`
            : `Ad impression served! Recorded with SHA-256 block ledger transparency`
        );
        refreshAllData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAd(false);
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
              onClick={handleLedgerHardReset}
              className="px-2.5 py-1 text-[10px] font-mono border border-zinc-800 text-zinc-500 bg-black hover:text-gold-400 hover:border-gold-700/50 rounded uppercase transition-colors"
              title="Reset the global transparent simulated state back to original ledger genesis"
            >
              Reset State
            </button>
          </div>
        </div>
      </header>

      {/* Pane Toggles Strip - Directly answers: "All panes can be hidden" */}
      <section className="bg-zinc-950 border-b border-gold-900/40 px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">
              HUD Controls:
            </span>
            <div className="h-4 border-l border-zinc-800"></div>
            <span className="text-xs text-gold-400/80 font-mono">
              Toggle Panels to customize your code dashboard layout ({activePanesCount} open)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowLeftPane(!showLeftPane)}
              className={`px-3 py-1 text-[10px] font-mono rounded uppercase transition-all flex items-center gap-1.5 border ${
                showLeftPane 
                  ? "bg-gold-950/50 text-gold-400 border-gold-600" 
                  : "bg-black text-zinc-650 border-zinc-800"
              }`}
            >
              {showLeftPane ? <Eye className="w-3.5 h-3.5 text-gold-400" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-600" />}
              <span>Ad Setup ({showLeftPane ? "Show" : "Hide"})</span>
            </button>

            <button
              onClick={() => setShowCenterPane(!showCenterPane)}
              className={`px-3 py-1 text-[10px] font-mono rounded uppercase transition-all flex items-center gap-1.5 border ${
                showCenterPane 
                  ? "bg-gold-950/50 text-gold-400 border-gold-600" 
                  : "bg-black text-zinc-650 border-zinc-800"
              }`}
            >
              {showCenterPane ? <Eye className="w-3.5 h-3.5 text-gold-400" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-600" />}
              <span>Interactive CLI ({showCenterPane ? "Show" : "Hide"})</span>
            </button>

            <button
              onClick={() => setShowRightPane(!showRightPane)}
              className={`px-3 py-1 text-[10px] font-mono rounded uppercase transition-all flex items-center gap-1.5 border ${
                showRightPane 
                  ? "bg-gold-950/50 text-gold-400 border-gold-600" 
                  : "bg-black text-zinc-650 border-zinc-800"
              }`}
            >
              {showRightPane ? <Eye className="w-3.5 h-3.5 text-gold-400" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-600" />}
              <span>Ledger & Escrow ({showRightPane ? "Show" : "Hide"})</span>
            </button>
          </div>
        </div>
      </section>

      {/* Background Stained Glass Settings Strip */}
      <section className="bg-zinc-950/90 border-b border-gold-900/40 px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold-400 animate-pulse" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-gold-300">
              Stained Glass Theme Backdrop:
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
                  : "bg-black text-zinc-400 border-zinc-800 hover:text-white"
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
                  : "bg-black text-zinc-400 border-zinc-800 hover:text-white"
              }`}
            >
              🖼️ Custom Background URL
            </button>
            <button
              onClick={() => setBgType("dark")}
              className={`px-3 py-1 text-[9px] font-mono rounded uppercase transition-all border cursor-pointer ${
                bgType === "dark"
                  ? "bg-gold-400 text-black border-gold-400 font-bold"
                  : "bg-black text-zinc-400 border-zinc-800 hover:text-white"
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

      {/* Main Container - Collapsible Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-12 gap-6 items-start">
        
        {/* Left Sidebar - Bring Your Own Provider & Custom split configurations */}
        {showLeftPane && (
          <aside className={`${
            activePanesCount === 1 
              ? "col-span-12" 
              : activePanesCount === 2 
                ? "col-span-12 lg:col-span-4" 
                : "col-span-12 lg:col-span-4 xl:col-span-3"
          } space-y-6 animate-fade-in`}>

            {/* Pane Label */}
            <div className="flex items-center justify-between border-b-2 border-gold-600 pb-1.5">
              <h2 className="font-deco text-sm font-bold tracking-widest text-gold-400">
                AD PROVIDERS PANEL
              </h2>
              <span className="font-mono text-[9px] text-zinc-500 uppercase">SYS_SETUP_01</span>
            </div>

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

        {/* Center Console - Main display screen, dynamic logs, CLI customization & click simulator */}
        {showCenterPane && (
          <section className={`${
            activePanesCount === 1 
              ? "col-span-12" 
              : activePanesCount === 2 
                ? "col-span-12 lg:col-span-8" 
                : "col-span-12 lg:col-span-8 xl:col-span-6"
          } space-y-6 animate-fade-in`}>

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
                <div className="flex gap-1.5">
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
                  <div className="bg-zinc-950 border border-zinc-90 w-full rounded-sm px-3 py-2 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                    <span>
                      {cliFormat === "VS Code Status Bar" ? "vscode: statusLine.show(CATBOX_AD)" : "cli_$ catbox --render --json"}
                    </span>
                    <span className="text-[8px] px-1.5 py-0.5 bg-gold-950 text-gold-400 border border-gold-900 uppercase font-bold tracking-wider rounded">
                      ready
                    </span>
                  </div>
                  <span className="text-[9px] text-gold-600 font-mono block">Custom string targets match local output</span>
                </div>

              </div>

              {/* VS Code Output terminal emulator */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  Simulated Code Environment output window
                </label>

                {/* Symmetrical golden double-line terminal box */}
                <div className="bg-black border-2 border-gold-700/60 rounded-sm p-5 font-mono text-xs text-zinc-300 shadow-inner relative space-y-3.5">
                  
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2 text-[10px]">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-gold-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-gold-600/60"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-900"></div>
                    </div>
                    <span className="text-zinc-600 uppercase tracking-wider text-[9px]">Catbox Code Agent Simulator</span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-zinc-505">
                      <span className="text-gold-500 font-semibold">[Catbox-Bin]</span> serving Customizable Wheel stream...
                    </p>
                    <p className="text-zinc-400">
                      <span className="text-zinc-550">$</span> curl -s {window.location.origin}/api/atomic/stream | grep "message"
                    </p>
                  </div>

                  {/* Active Simulator Display message panel */}
                  <div className="border border-gold-900 bg-zinc-950/90 p-4 rounded-sm space-y-3 relative hover:border-gold-500 transition-all">
                    
                    <div className="flex items-center justify-between text-[9px] text-zinc-450 font-mono border-b border-zinc-900 pb-2">
                      <span className="text-gold-400 font-bold uppercase tracking-widest">ACTIVE VSCODE STATUS AD STRING</span>
                      <span className="px-1 bg-gold-950 text-gold-400 rounded text-[9px] font-mono border border-gold-900 italic">GENRE: {cliContext || "general"}</span>
                    </div>

                    <div className="py-2">
                      <p className="text-gold-300 font-deco text-sm font-semibold tracking-wide italic">
                        "Secure your routes elegantly with Aurum Auth. Get 20% off with promo code CATTBACKS"
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between gap-1.5 text-[8.5px] text-zinc-500 uppercase font-mono pt-1.5 border-t border-zinc-900">
                      <span>Rate: Standard CPM-Bid (Carbon Deco Ads)</span>
                      <span className="text-gold-400">Yield Share: User gets 85% / platform gets 15%</span>
                    </div>
                  </div>

                  <div className="text-zinc-600 text-[10px] italic">
                    &gt;&gt; Live events generate automated blockchain ledger verification hash in real-time.
                  </div>

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

        {/* Right Sidebar - Blockchain Transaction Ledger Log & Escrow Release Portal */}
        {showRightPane && (
          <aside className={`${
            activePanesCount === 1 
              ? "col-span-12" 
              : activePanesCount === 2 
                ? "col-span-12 lg:col-span-4" 
                : "col-span-12 lg:col-span-4 xl:col-span-3"
          } space-y-6 animate-fade-in`}>

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

          </aside>
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
