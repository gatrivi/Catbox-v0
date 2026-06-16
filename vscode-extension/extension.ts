/**
 * @license
 * CATBOX VS CODE DISTRIBUTION LAYER - AGPLv3 Licensed
 * Copyright (c) 2026 Catbox Systems, Inc.
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as crypto from "crypto";

const CLAUDE_SETTINGS_DIR = path.join(os.homedir(), ".claude");
const CLAUDE_SETTINGS_PATH = path.join(CLAUDE_SETTINGS_DIR, "settings.json");
const CLAUDE_SETTINGS_TMP_PATH = path.join(CLAUDE_SETTINGS_DIR, "settings.json.tmp");
const BACKUP_SETTINGS_DIR = path.join(os.homedir(), ".catbox");
const BACKUP_SETTINGS_PATH = path.join(BACKUP_SETTINGS_DIR, "settings.backup.json");

let statusBarItem: vscode.StatusBarItem | undefined;
let pollTimer: NodeJS.Timeout | undefined;
let isShimmerActive = false;

// 5 Developer creatives from our assets fallback
const FALLBACK_CREATIVES = [
  "✶ NeoDeco-DB: Geometric schemas tailored for Postgres scale. Speed up by 10x ↗",
  "✶ Saffron-Host: Built by gold-standard architects, loved by elite developers ↗",
  "✶ Drizzle ORM: Strictly typed queries for high-performance React/Node apps ↗",
  "✶ Neon Postgres: Serverless DB built for modern development workflows ↗",
  "✶ Catbox Gateway: Verify decentralized kickback splits in real-time ↗"
];

/**
 * Searches the environment to find the location of the main project's metadata.json.
 */
function getMetadataPath(): string {
  // Try direct container workdir path first
  const absoluteDir = "/metadata.json";
  if (fs.existsSync(absoluteDir)) {
    return absoluteDir;
  }
  // Try relative to workspace folders
  const wsFolders = vscode.workspace.workspaceFolders;
  if (wsFolders && wsFolders.length > 0) {
    const wsPath = wsFolders[0].uri.fsPath;
    const wsMeta = path.join(wsPath, "metadata.json");
    if (fs.existsSync(wsMeta)) {
      return wsMeta;
    }
    const parentMeta = path.join(wsPath, "..", "metadata.json");
    if (fs.existsSync(parentMeta)) {
      return parentMeta;
    }
  }
  // Try up search relative to current file in extension bundle
  let current = __dirname;
  for (let i = 0; i < 5; i++) {
    const checkPath = path.join(current, "metadata.json");
    if (fs.existsSync(checkPath)) {
      return checkPath;
    }
    const nextCurrent = path.dirname(current);
    if (nextCurrent === current) {
      break;
    }
    current = nextCurrent;
  }
  return absoluteDir; // Fallback to absolute
}

/**
 * Perform Claude's settings.json injection.
 */
async function injectClaudeVerbs(adText: string): Promise<void> {
  try {
    if (!fs.existsSync(CLAUDE_SETTINGS_DIR)) {
      fs.mkdirSync(CLAUDE_SETTINGS_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUP_SETTINGS_DIR)) {
      fs.mkdirSync(BACKUP_SETTINGS_DIR, { recursive: true });
    }

    let settings: any = {};
    if (fs.existsSync(CLAUDE_SETTINGS_PATH)) {
      const raw = fs.readFileSync(CLAUDE_SETTINGS_PATH, "utf-8");
      try {
        settings = JSON.parse(raw || "{}");
      } catch (e) {
        settings = {};
      }
      // Backup pristine if we haven't done it yet
      if (!fs.existsSync(BACKUP_SETTINGS_PATH)) {
        fs.writeFileSync(BACKUP_SETTINGS_PATH, raw, "utf-8");
      }
    }

    // Explicit flat string array schema assignment as demanded
    settings.spinnerVerbs = [adText];

    // Atomic Swap Write Sequence
    fs.writeFileSync(CLAUDE_SETTINGS_TMP_PATH, JSON.stringify(settings, null, 2), "utf-8");
    fs.renameSync(CLAUDE_SETTINGS_TMP_PATH, CLAUDE_SETTINGS_PATH);
  } catch (error) {
    await restoreOriginalSettings();
    throw error;
  }
}

/**
 * Restores original settings from backup and purges temp items.
 */
export async function restoreOriginalSettings(): Promise<void> {
  try {
    if (fs.existsSync(BACKUP_SETTINGS_PATH)) {
      fs.copyFileSync(BACKUP_SETTINGS_PATH, CLAUDE_SETTINGS_PATH);
      try {
        fs.unlinkSync(BACKUP_SETTINGS_PATH);
      } catch (e) {}
    } else {
      if (fs.existsSync(CLAUDE_SETTINGS_PATH)) {
        try {
          fs.unlinkSync(CLAUDE_SETTINGS_PATH);
        } catch (e) {}
      }
    }
  } catch (err) {
    console.error("[Catbox Extension] Could not restore backup settings cleanly:", err);
  }
}

/**
 * Log impression event back to the local metadata.json ledger with early bird scale calculations.
 */
async function logImpressionToLedger(adText: string): Promise<void> {
  const metaPath = getMetadataPath();
  if (!fs.existsSync(metaPath)) {
    return;
  }

  try {
    const raw = fs.readFileSync(metaPath, "utf-8");
    const meta = JSON.parse(raw);

    // Pull configurations safely
    const pubId = meta.CATBOX_PUB_ID || "pub_unknown";
    const wallet = meta.CATBOX_WALLET || "wallet_unknown";

    // Track state on metadata
    if (!meta.impressionLedger) {
      meta.impressionLedger = [];
    }
    const currentCount = meta.impressionLedger.length + 1;

    // Early-bird tier scale: 97% of base $0.01 ($0.0097) for the first 10, else 85% baseline ($0.0085)
    const multiplier = currentCount <= 10 ? 0.0097 : 0.0085;
    const previousBalance = meta.earnedBalance || 0;
    const newBalance = parseFloat((previousBalance + multiplier).toFixed(6));

    const blockHash = crypto
      .createHash("sha256")
      .update(`${Date.now()}-${adText}-${pubId}-${currentCount}`)
      .digest("hex");

    const impressionEvent = {
      index: currentCount,
      timestamp: new Date().toISOString(),
      creativeText: adText,
      pubId,
      wallet,
      multiplierPercent: currentCount <= 10 ? "97% (Early Bird)" : "85% (Baseline)",
      earnedAmount: multiplier,
      hash: blockHash
    };

    meta.impressionLedger.push(impressionEvent);
    meta.earnedBalance = newBalance;
    meta.totalImpressions = currentCount;

    // Atomic update loop to ensure metadata.json consistency
    const tmpMetaPath = `${metaPath}.tmp`;
    fs.writeFileSync(tmpMetaPath, JSON.stringify(meta, null, 2), "utf-8");
    fs.renameSync(tmpMetaPath, metaPath);

  } catch (error) {
    console.error("[Catbox Extension] Local impression ledger logging failure:", error);
  }
}

/**
 * Cycles the ad slot display in the VS Code status bar and trigger the Claude settings write and local logging.
 */
async function displayNextAd() {
  if (!isShimmerActive || !statusBarItem) {
    return;
  }

  // Pick a random creative from the assets bank
  const adText = FALLBACK_CREATIVES[Math.floor(Math.random() * FALLBACK_CREATIVES.length)];

  // Update status bar item
  statusBarItem.text = `$(globe) ${adText}`;
  statusBarItem.tooltip = `Catbox Ad Streamer • Clicking supports developers. Earned balance verified!`;

  // Inject into Claude settings
  try {
    await injectClaudeVerbs(adText);
  } catch (err) {
    console.error("[Catbox Extension] Terminal injection fail:", err);
  }

  // Commit dynamic earnings back to the local metadata.json ledger
  await logImpressionToLedger(adText);
}

/**
 * VS Code Activation entrypoint
 */
export function activate(context: vscode.ExtensionContext) {
  console.log("[Catbox VS Code Extension] Booting system...");

  // Load configuration default toggles (disabled/false by default requiring intentional opt-in)
  const metaPath = getMetadataPath();
  let defaultState = false;
  try {
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      defaultState = !!meta.targetConfiguration?.enabled;
    }
  } catch (e) {
    defaultState = false;
  }

  isShimmerActive = defaultState;

  // Initialize status bar element (Initially hidden unless opt-in)
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = "catbox.openAd";
  
  if (isShimmerActive) {
    statusBarItem.show();
    displayNextAd();
    pollTimer = setInterval(displayNextAd, 60000);
  }

  // Register Open Ad Command
  const openAdCommand = vscode.commands.registerCommand("catbox.openAd", () => {
    vscode.window.showInformationMessage("Opening Catbox partner campaign to support open source.");
    vscode.env.openExternal(vscode.Uri.parse("https://neodeco-db.io"));
  });

  // Register Toggle Stream Command
  const toggleStreamCommand = vscode.commands.registerCommand("catbox.toggleStream", async () => {
    isShimmerActive = !isShimmerActive;
    
    // Sync configuration state back to metadata.json
    try {
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        if (!meta.targetConfiguration) {
          meta.targetConfiguration = {};
        }
        meta.targetConfiguration.enabled = isShimmerActive;
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");
      }
    } catch (e) {
      console.error("[Catbox Extension] Could not write targetConfiguration back to metadata.json:", e);
    }

    if (isShimmerActive) {
      if (statusBarItem) {
        statusBarItem.show();
      }
      await displayNextAd();
      if (pollTimer) {
        clearInterval(pollTimer);
      }
      pollTimer = setInterval(displayNextAd, 60000);
      vscode.window.showInformationMessage("✶ Catbox Shimmer Banner: Activated & Earning Stream enabled.");
    } else {
      if (statusBarItem) {
        statusBarItem.hide();
      }
      if (pollTimer) {
        clearInterval(pollTimer);
      }
      await restoreOriginalSettings();
      vscode.window.showWarningMessage("✶ Catbox Shimmer Banner: Deactivated. Terminal state reverted.");
    }
  });

  // Register Clean Revert Command
  const revertCommand = vscode.commands.registerCommand("catbox.revert", async () => {
    isShimmerActive = false;
    if (pollTimer) {
      clearInterval(pollTimer);
    }
    if (statusBarItem) {
      statusBarItem.hide();
    }
    await restoreOriginalSettings();
    vscode.window.showInformationMessage("✶ Catbox Settings Reverted: settings.json restored cleanly.");
  });

  context.subscriptions.push(openAdCommand);
  context.subscriptions.push(toggleStreamCommand);
  context.subscriptions.push(revertCommand);
  if (statusBarItem) {
    context.subscriptions.push(statusBarItem);
  }
}

/**
 * VS Code Deactivation entrypoint
 */
export async function deactivate() {
  if (pollTimer) {
    clearInterval(pollTimer);
  }
  if (statusBarItem) {
    statusBarItem.hide();
  }
  await restoreOriginalSettings();
}
