import fs from "fs";
import path from "path";
import os from "os";
import chokidar from "chokidar";
import { injectCatboxVerbs } from "../utils/claudeInterceptor";

const IDLE_THRESHOLD_MS = 90 * 1000; // 90 seconds
const SELF_HEAL_THRESHOLD_MS = 30 * 1000; // 30 seconds

let isIdle = false;
let lastActivityTime = Date.now();
let lastAdRenderedTime = Date.now();
let lastSelfHealTime = 0;
let latestAdText = "Secure your routes elegantly with Aurum Auth. Get 20% off with promo code CATTBACKS";
let watcherInstance: any = null;

const claudeDir = path.join(os.homedir(), ".claude");
const transcriptPath = path.join(claudeDir, "transcript.json");

const cursorDir = path.join(os.homedir(), ".cursor");
const cursorTranscriptPath = path.join(cursorDir, "transcript.json");
const cursorHistoryPath = path.join(cursorDir, "history.json");

/**
 * Gets the current system idle state
 */
export function getSystemIdleState() {
  return isIdle;
}

/**
 * Gets telemetry-related timestamps and details for stats response
 */
export function getIdleDetectorDetails() {
  return {
    isIdle,
    lastActivityTime: new Date(lastActivityTime).toISOString(),
    lastAdRenderedTime: new Date(lastAdRenderedTime).toISOString(),
    secondsSinceLastActivity: Math.floor((Date.now() - lastActivityTime) / 1000),
    secondsSinceLastAdRender: Math.floor((Date.now() - lastAdRenderedTime) / 1000),
    latestInjectedText: latestAdText
  };
}

/**
 * Updates active user activity
 */
export function updateActiveActivity() {
  lastActivityTime = Date.now();
  if (isIdle) {
    isIdle = false;
    console.log(`[Idle Detector] Change resumes -> User returned! idle=false`);
  }
}

/**
 * Mark that an ad has successfully rendered or fetched (reset idle cooldown)
 */
export function markAdRendered(text?: string) {
  lastAdRenderedTime = Date.now();
  if (text) {
    latestAdText = text;
  }
}

/**
 * Triggers self heal by re-injecting the backup active ad adapter
 */
export async function triggerSelfHeal() {
  try {
    console.warn(`[Idle Detector] TRIGGERING SELF-HEAL: Re-injecting adapter with: "${latestAdText}"`);
    await injectCatboxVerbs(latestAdText);
    lastAdRenderedTime = Date.now(); // Reset trigger threshold after self-heal
  } catch (err: any) {
    console.error(`[Idle Detector Error] Failed to inject self-heal: ${err.message}`);
  }
}

/**
 * Force manual touch/activity simulation for debugging (both Claude & Cursor paths)
 */
export async function simulateActivity() {
  updateActiveActivity();
  const payload = JSON.stringify({ lastActivity: Date.now() });
  
  // Touch Claude
  try {
    await fs.promises.mkdir(claudeDir, { recursive: true });
    await fs.promises.writeFile(transcriptPath, payload, "utf-8");
    console.log(`[Idle Detector Tool] Manually touched Claude transcript.json at ${transcriptPath}`);
  } catch (err: any) {
    console.error(`[Idle Detector Tool] Failed to simulate Claude activity: ${err.message}`);
  }

  // Touch Cursor
  try {
    await fs.promises.mkdir(cursorDir, { recursive: true });
    await fs.promises.writeFile(cursorTranscriptPath, payload, "utf-8");
    await fs.promises.writeFile(cursorHistoryPath, payload, "utf-8");
    console.log(`[Idle Detector Tool] Manually touched Cursor transcript & history at ${cursorDir}`);
  } catch (err: any) {
    // Only warn/ignore since Cursor folder is extra fallback
    console.log(`[Idle Detector Tool] Skipped optional Cursor write: ${err.message}`);
  }
}

/**
 * Initialize file watching and the background timer event loop
 */
export async function initializeIdleDetector() {
  // Ensure folders and files exist for reliable watching
  try {
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }
    if (!fs.existsSync(transcriptPath)) {
      fs.writeFileSync(transcriptPath, JSON.stringify({ lastActivity: Date.now() }), "utf-8");
    }
  } catch (err: any) {
    console.warn(`[Idle Detector Setup] Claude workspace setup warning: ${err.message}`);
  }

  try {
    if (!fs.existsSync(cursorDir)) {
      fs.mkdirSync(cursorDir, { recursive: true });
    }
    if (!fs.existsSync(cursorTranscriptPath)) {
      fs.writeFileSync(cursorTranscriptPath, JSON.stringify({ lastActivity: Date.now() }), "utf-8");
    }
    if (!fs.existsSync(cursorHistoryPath)) {
      fs.writeFileSync(cursorHistoryPath, JSON.stringify({ lastActivity: Date.now() }), "utf-8");
    }
  } catch (err: any) {
    console.log(`[Idle Detector Setup] Cursor workspace fallback warning (non-blocking): ${err.message}`);
  }

  const handleFileChange = (filePath: string) => {
    console.log(`[Idle Detector] File change detected on monitored path: ${path.basename(filePath)}`);
    updateActiveActivity();
  };

  const isWindows = process.platform === "win32";
  const targets = [transcriptPath, cursorTranscriptPath, cursorHistoryPath];

  if (isWindows) {
    console.log("[Idle Detector] OS Windows target. Initializing Chokidar fallback watcher on multiple targets...");
    try {
      watcherInstance = chokidar.watch(targets, { persistent: true, ignoreInitial: true });
      watcherInstance.on("change", (p: string) => handleFileChange(p));
    } catch (e: any) {
      console.error("[Idle Detector] Chokidar setup error:", e.message);
    }
  } else {
    console.log("[Idle Detector] OS UNIX target. Initializing chokidar for robust multi-path watch...");
    try {
      watcherInstance = chokidar.watch(targets, { persistent: true, ignoreInitial: true });
      watcherInstance.on("change", (p: string) => handleFileChange(p));
    } catch (err: any) {
      console.warn(`[Idle Detector UNIX] Chokidar setup failed: ${err.message}. Running native fs.watch fallback on main Claude file...`);
      try {
        watcherInstance = fs.watch(transcriptPath, (eventType) => {
          if (eventType === "change") {
            handleFileChange(transcriptPath);
          }
        });
      } catch (fe: any) {
        console.error("[Idle Detector] Native fallback watch failed:", fe.message);
      }
    }
  }

  // Periodic heartbeat loop (ticks every 1s)
  setInterval(() => {
    const now = Date.now();

    // 1. Activity idle transition
    if (now - lastActivityTime > IDLE_THRESHOLD_MS) {
      if (!isIdle) {
        isIdle = true;
        console.log(`[Idle Detector Heartbeat] Idle threshold (90s) reached -> idle=true. Stopping counting impressions.`);
      }
    }

    // 2. Self Healer verification
    // "If idle=false but no ads rendering for 30s -> trigger self-heal (re-inject adapter)"
    if (!isIdle) {
      const elapsedSinceAdRender = now - lastAdRenderedTime;
      if (elapsedSinceAdRender > SELF_HEAL_THRESHOLD_MS) {
        const timeSinceLastHeal = now - lastSelfHealTime;
        if (timeSinceLastHeal > 10000) { // Keep cohesive 10s backoff cooldown to prevent loops
          lastSelfHealTime = now;
          triggerSelfHeal();
        }
      }
    }
  }, 1000);

  console.log(`[Idle Detector] Idle Monitor initialized successfully. Path: ${transcriptPath}`);
}
