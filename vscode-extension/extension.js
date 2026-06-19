const vscode = require("vscode");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const SECRET = "catbox_daily_gold_secret";
const FALLBACK = [
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

let item;
let current = {
  id: "system_house",
  campaignId: "system_house",
  text: "✶ Catbox — privacy-first developer sponsorships ↗",
  link: "https://github.com/gatrivi/Catbox-v0",
};
let pollTimer;
let viewTimer;

function paths(homeDir = os.homedir()) {
  return {
    claudeDir: path.join(homeDir, ".claude"),
    settingsPath: path.join(homeDir, ".claude", "settings.json"),
    backupDir: path.join(homeDir, ".catbox"),
    backupPath: path.join(homeDir, ".catbox", "claude-settings.backup.json"),
    markerPath: path.join(homeDir, ".catbox", "claude-settings.created"),
  };
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8") || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function cleanText(text) {
  const trimmed = String(text || "").replace(/\s+/g, " ").trim();
  if (!trimmed) throw new Error("empty sponsor line");
  const starred = trimmed.startsWith("✶") ? trimmed : `✶ ${trimmed}`;
  const linked = starred.endsWith("↗") ? starred : `${starred} ↗`;
  return linked.slice(0, 140);
}

async function writeClaude(text) {
  const p = paths();
  fs.mkdirSync(p.claudeDir, { recursive: true });
  fs.mkdirSync(p.backupDir, { recursive: true });
  if (fs.existsSync(p.settingsPath) && !fs.existsSync(p.backupPath)) {
    fs.copyFileSync(p.settingsPath, p.backupPath);
  } else if (!fs.existsSync(p.settingsPath)) {
    fs.writeFileSync(p.markerPath, new Date().toISOString(), "utf-8");
  }
  const settings = readJson(p.settingsPath);
  settings.spinnerVerbs = [cleanText(text)];
  const tmp = `${p.settingsPath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(settings, null, 2), "utf-8");
  fs.renameSync(tmp, p.settingsPath);
  return {
    backupExists: fs.existsSync(p.backupPath),
    settingsPath: p.settingsPath,
  };
}

async function restoreClaudeSettings() {
  const p = paths();
  fs.mkdirSync(p.claudeDir, { recursive: true });
  if (fs.existsSync(p.backupPath)) {
    fs.copyFileSync(p.backupPath, p.settingsPath);
    fs.unlinkSync(p.backupPath);
  } else if (fs.existsSync(p.markerPath) && fs.existsSync(p.settingsPath)) {
    fs.unlinkSync(p.settingsPath);
  }
  if (fs.existsSync(p.markerPath)) fs.unlinkSync(p.markerPath);
}

function cfg() {
  return vscode.workspace.getConfiguration("catbox");
}

function serverUrl() {
  return cfg().get("serverUrl") || "http://127.0.0.1:3000";
}

function claudeOn() {
  return cfg().get("claudeInjection.enabled") === true;
}

function userId() {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!root) return "my_account";
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(root, "metadata.json"), "utf-8"));
    return meta.CATBOX_PUB_ID || meta.CATBOX_WALLET || "my_account";
  } catch {
    return "my_account";
  }
}

function token() {
  const day = new Date().toISOString().slice(0, 10);
  return crypto.createHmac("sha256", SECRET).update(day).digest("hex");
}

async function event(type, surface, ms = 0) {
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
  } catch {}
}

async function touch() {
  try {
    await fetch(`${serverUrl()}/api/telemetry/touch`, { method: "POST" });
  } catch {}
}

async function syncClaude() {
  if (!claudeOn()) return;
  const state = await writeClaude(current.text);
  item.tooltip = `Catbox sponsor • Claude sync ON • backup=${state.backupExists ? "yes" : "no"}`;
}

function render() {
  item.text = `$(globe) ${current.text}`;
  item.tooltip = claudeOn()
    ? "Catbox sponsor • Claude Code spinner sync ON"
    : "Catbox sponsor • click to open";
}

async function markShown() {
  await touch();
  await event("impression_rendered", "statusbar");
  if (viewTimer) clearTimeout(viewTimer);
  viewTimer = setTimeout(() => {
    if (vscode.window.state.focused) {
      event("impression_viewable", "statusbar", 5000).catch(() => undefined);
    }
  }, 5000);
}

async function loadSponsor() {
  try {
    const t = token();
    const mock = vscode.env.appName.toLowerCase().includes("cursor") ? "&mock=1" : "";
    const res = await fetch(`${serverUrl()}/api/atomic/stream?token=${t}${mock}`, {
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

async function openCurrent() {
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
  } catch {}
  await event("click", "statusbar");
}

function activate(context) {
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
      await restoreClaudeSettings();
      vscode.window.showInformationMessage("Catbox Claude Code settings restored.");
    }),
    vscode.commands.registerCommand("catbox.revertClaudeSettings", async () => {
      await cfg().update("claudeInjection.enabled", false, vscode.ConfigurationTarget.Global);
      await restoreClaudeSettings();
      vscode.window.showInformationMessage("Catbox restored Claude Code settings.");
    }),
    vscode.commands.registerCommand("catbox.enableVisualAd", () => {
      vscode.window.showInformationMessage("Catbox visual panel is parked for this MVP; status bar + Claude sync are active.");
    }),
    vscode.commands.registerCommand("catbox.hideVisualAd", () => {
      vscode.window.showInformationMessage("Catbox visual panel hidden.");
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration("catbox.claudeInjection.enabled")) return;
      if (claudeOn()) syncClaude().catch(() => undefined);
      else restoreClaudeSettings().catch(() => undefined);
    })
  );

  loadSponsor().catch(() => undefined);
  pollTimer = setInterval(() => loadSponsor().catch(() => undefined), 60000);
  context.subscriptions.push({ dispose: () => pollTimer && clearInterval(pollTimer) });
}

function deactivate() {
  if (pollTimer) clearInterval(pollTimer);
  if (viewTimer) clearTimeout(viewTimer);
  if (item) item.hide();
}

module.exports = { activate, deactivate };
