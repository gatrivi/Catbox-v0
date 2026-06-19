import * as vscode from "vscode";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import {
  getClaudeIntegrationState,
  injectClaudeSpinnerText,
  restoreClaudeSettings,
} from "./claudeSettings";

type Surface = "statusbar" | "visual_panel";
type EventType = "impression_rendered" | "impression_viewable" | "click";

interface SponsorLine {
  text: string;
  link: string;
  id: string;
  campaignId: string;
  providerId?: string;
  providerType?: string;
}

const SECRET = "catbox_daily_gold_secret";
const FALLBACK: SponsorLine[] = [
  {
    id: "fb_neodeco",
    campaignId: "campaign_neodeco",
    text: "✶ NeoDeco-DB — geometric SQL schemas for Postgres ↗",
    link: "https://neodeco-db.io",
  },
  {
    id: "fb_saffron",
    campaignId: "campaign_saffron",
    text: "✶ Saffron-Host — deploy fast without cloud sprawl ↗",
    link: "https://saffron-host.net",
  },
  {
    id: "fb_drizzle",
    campaignId: "campaign_drizzle",
    text: "✶ Drizzle ORM — strictly typed queries for Node apps ↗",
    link: "https://orm.drizzle.team",
  },
];

let item: vscode.StatusBarItem;
let current: SponsorLine = {
  id: "system_house",
  campaignId: "system_house",
  text: "✶ Catbox — privacy-first developer sponsorships ↗",
  link: "https://github.com/gatrivi/Catbox-v0",
};
let pollTimer: NodeJS.Timeout | undefined;
let viewTimer: NodeJS.Timeout | undefined;

function cfg(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration("catbox");
}

function serverUrl(): string {
  return cfg().get<string>("serverUrl") || "http://127.0.0.1:3000";
}

function claudeSyncEnabled(): boolean {
  return cfg().get<boolean>("claudeInjection.enabled") === true;
}

function userId(): string {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!root) return "my_account";
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(root, "metadata.json"), "utf-8"));
    return meta.CATBOX_PUB_ID || meta.CATBOX_WALLET || "my_account";
  } catch {
    return "my_account";
  }
}

function token(): string {
  const day = new Date().toISOString().slice(0, 10);
  return crypto.createHmac("sha256", SECRET).update(day).digest("hex");
}

async function postEvent(type: EventType, surface: Surface, ms = 0): Promise<void> {
  try {
    await fetch(`${serverUrl()}/api/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events: [
          {
            event_id: crypto.randomUUID(),
            user_id: userId(),
            ad_id: current.id,
            campaign_id: current.campaignId,
            timestamp: new Date().toISOString(),
            surface,
            type,
            visible_duration_ms: ms,
          },
        ],
      }),
    });
  } catch {
    // local-first: daemon may be offline
  }
}

async function touch(): Promise<void> {
  try {
    await fetch(`${serverUrl()}/api/telemetry/touch`, { method: "POST" });
  } catch {
    // ignore offline daemon
  }
}

async function syncClaude(): Promise<void> {
  if (!claudeSyncEnabled()) return;
  await injectClaudeSpinnerText(current.text);
  const state = getClaudeIntegrationState();
  item.tooltip = `Catbox sponsor • Claude sync ON • backup=${state.backupExists ? "yes" : "no"}`;
}

function render(): void {
  item.text = `$(globe) ${current.text}`;
  item.tooltip = claudeSyncEnabled()
    ? "Catbox sponsor • Claude Code spinner sync ON"
    : "Catbox sponsor • click to open";
}

async function markShown(): Promise<void> {
  await touch();
  await postEvent("impression_rendered", "statusbar");
  if (viewTimer) clearTimeout(viewTimer);
  viewTimer = setTimeout(() => {
    if (vscode.window.state.focused) {
      postEvent("impression_viewable", "statusbar", 5000).catch(() => undefined);
    }
  }, 5000);
}

async function loadSponsor(): Promise<void> {
  try {
    const t = token();
    const dev = vscode.env.appName.toLowerCase().includes("cursor") ? "&mock=1" : "";
    const res = await fetch(`${serverUrl()}/api/atomic/stream?token=${t}${dev}`, {
      headers: { "x-catbox-telemetry-token": t },
    });
    const data = await res.json();
    if (!res.ok || !data?.success) throw new Error("bad sponsor payload");
    current = {
      text: data.creativeText || data.adMessage || current.text,
      link: data.targetUrl || data.link || current.link,
      id: data.id || current.id,
      campaignId: data.campaign_id || current.campaignId,
      providerId: data.providerId,
      providerType: data.providerType,
    };
  } catch {
    current = FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
  }

  render();
  await syncClaude();
  await markShown();
}

async function openCurrent(): Promise<void> {
  await vscode.env.openExternal(vscode.Uri.parse(current.link));
  try {
    await fetch(`${serverUrl()}/api/atomic/report-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creativeText: current.text,
        url: current.link,
        clickedAt: new Date().toISOString(),
        providerId: current.providerId,
        providerType: current.providerType,
        creativeId: current.id,
        campaignId: current.campaignId,
        eventId: crypto.randomUUID(),
        surface: "statusbar",
      }),
    });
  } catch {
    // ignore offline daemon
  }
  await postEvent("click", "statusbar");
}

async function restoreClaude(message: string): Promise<void> {
  await restoreClaudeSettings();
  vscode.window.showInformationMessage(message);
}

export function activate(context: vscode.ExtensionContext): void {
  item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.command = "catbox.openAd";
  item.text = "$(globe) Catbox: Connecting...";
  item.show();

  context.subscriptions.push(
    item,
    vscode.commands.registerCommand("catbox.openAd", openCurrent),
    vscode.commands.registerCommand("catbox.enableClaudeInjection", async () => {
      await cfg().update("claudeInjection.enabled", true, vscode.ConfigurationTarget.Global);
      await syncClaude();
      vscode.window.showInformationMessage("Catbox Claude Code spinner sync enabled.");
    }),
    vscode.commands.registerCommand("catbox.disableClaudeInjection", async () => {
      await cfg().update("claudeInjection.enabled", false, vscode.ConfigurationTarget.Global);
      await restoreClaude("Catbox Claude Code settings restored.");
    }),
    vscode.commands.registerCommand("catbox.revertClaudeSettings", async () => {
      await cfg().update("claudeInjection.enabled", false, vscode.ConfigurationTarget.Global);
      await restoreClaude("Catbox restored Claude Code settings.");
    }),
    vscode.commands.registerCommand("catbox.enableVisualAd", () => {
      vscode.window.showInformationMessage("Catbox visual panel is parked for this MVP; status bar + Claude sync are active.");
    }),
    vscode.commands.registerCommand("catbox.hideVisualAd", () => {
      vscode.window.showInformationMessage("Catbox visual panel hidden.");
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("catbox.claudeInjection.enabled")) return;
      if (claudeSyncEnabled()) {
        syncClaude().catch(() => undefined);
      } else {
        restoreClaudeSettings().catch(() => undefined);
      }
    })
  );

  loadSponsor().catch(() => undefined);
  pollTimer = setInterval(() => loadSponsor().catch(() => undefined), 60000);
  context.subscriptions.push({ dispose: () => pollTimer && clearInterval(pollTimer) });
}

export function deactivate(): void {
  if (pollTimer) clearInterval(pollTimer);
  if (viewTimer) clearTimeout(viewTimer);
  if (item) item.hide();
}
