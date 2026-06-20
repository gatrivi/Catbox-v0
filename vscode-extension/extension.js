var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension/index.ts
var index_exports = {};
__export(index_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(index_exports);
var vscode2 = __toESM(require("vscode"));
var crypto = __toESM(require("crypto"));
var fs3 = __toESM(require("fs"));
var path3 = __toESM(require("path"));

// src/utils/claudeInterceptor.ts
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
var os = __toESM(require("os"), 1);
var CLAUDE_SETTINGS_PATH = path.join(os.homedir(), ".claude", "settings.json");
var BACKUP_SETTINGS_PATH = path.join(os.homedir(), ".catbox", "settings.backup.json");
function formatSpinnerVerb(adText) {
  const trimmed = adText.trim();
  if (trimmed.startsWith("\u2736")) {
    return trimmed;
  }
  return `\u2736 ${trimmed}`;
}
function buildSpinnerVerbsConfig(adText) {
  return {
    mode: "replace",
    verbs: [formatSpinnerVerb(adText)]
  };
}
async function injectCatboxVerbs(adText) {
  try {
    const claudeDir = path.dirname(CLAUDE_SETTINGS_PATH);
    const catboxDir = path.dirname(BACKUP_SETTINGS_PATH);
    if (!fs.existsSync(claudeDir)) fs.mkdirSync(claudeDir, { recursive: true });
    if (!fs.existsSync(catboxDir)) fs.mkdirSync(catboxDir, { recursive: true });
    let settings = {};
    if (fs.existsSync(CLAUDE_SETTINGS_PATH)) {
      const raw = fs.readFileSync(CLAUDE_SETTINGS_PATH, "utf-8");
      try {
        settings = JSON.parse(raw || "{}");
      } catch {
        settings = {};
      }
      if (!fs.existsSync(BACKUP_SETTINGS_PATH)) {
        fs.writeFileSync(BACKUP_SETTINGS_PATH, raw, "utf-8");
      }
    }
    settings.spinnerVerbs = buildSpinnerVerbsConfig(adText);
    const tmpPath = `${CLAUDE_SETTINGS_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(settings, null, 2), "utf-8");
    fs.renameSync(tmpPath, CLAUDE_SETTINGS_PATH);
  } catch (error) {
    await restoreOriginalSettings();
    throw error;
  }
}
async function restoreOriginalSettings() {
  if (fs.existsSync(BACKUP_SETTINGS_PATH)) {
    fs.copyFileSync(BACKUP_SETTINGS_PATH, CLAUDE_SETTINGS_PATH);
    try {
      fs.unlinkSync(BACKUP_SETTINGS_PATH);
    } catch {
    }
  } else if (fs.existsSync(CLAUDE_SETTINGS_PATH)) {
    try {
      fs.unlinkSync(CLAUDE_SETTINGS_PATH);
    } catch {
    }
  }
}

// src/extension/cursorSpinner.ts
var vscode = __toESM(require("vscode"));
var fs2 = __toESM(require("fs"));
var path2 = __toESM(require("path"));
var os2 = __toESM(require("os"));
var BACKUP_PATH = path2.join(os2.homedir(), ".catbox", "cursor-spinnerVerbs.backup.json");
async function injectCursorSpinnerVerbs(adText) {
  const config = vscode.workspace.getConfiguration("claudeCode");
  const backupDir = path2.dirname(BACKUP_PATH);
  if (!fs2.existsSync(backupDir)) {
    fs2.mkdirSync(backupDir, { recursive: true });
  }
  if (!fs2.existsSync(BACKUP_PATH)) {
    const current = config.get("spinnerVerbs");
    fs2.writeFileSync(BACKUP_PATH, JSON.stringify(current ?? null), "utf-8");
  }
  await config.update(
    "spinnerVerbs",
    buildSpinnerVerbsConfig(adText),
    vscode.ConfigurationTarget.Global
  );
}
async function restoreCursorSpinnerVerbs() {
  if (!fs2.existsSync(BACKUP_PATH)) {
    return;
  }
  const backup = JSON.parse(fs2.readFileSync(BACKUP_PATH, "utf-8"));
  const config = vscode.workspace.getConfiguration("claudeCode");
  if (backup === null) {
    await config.update("spinnerVerbs", void 0, vscode.ConfigurationTarget.Global);
  } else {
    await config.update("spinnerVerbs", backup, vscode.ConfigurationTarget.Global);
  }
  try {
    fs2.unlinkSync(BACKUP_PATH);
  } catch {
  }
}

// src/extension/index.ts
var statusBarItem;
var visualAdProvider;
var currentAd = {
  text: "Catbox: strictly-typed developer ecosystem",
  link: "https://neodeco-db.io",
  id: "default_ad",
  campaignId: "system_house"
};
var viewableTimer;
var visualViewableTimer;
var statusBarViewableTracked = false;
var visualViewableTracked = false;
var TELEMETRY_SECRET = "catbox_daily_gold_secret";
var MAIN_SERVER = "http://127.0.0.1:3000";
var VISUAL_PANEL_IMAGE = "assets/sponsor-ad-1.jpeg";
var VISUAL_PANEL_LINK = "https://www.instagram.com/lastortasdemamamabel";
var VISUAL_PANEL_COPY = "Las Tortas de Mam\xE1 Mabel";
function isVisualAdEnabled() {
  return vscode2.workspace.getConfiguration("catbox").get("visualAd.enabled") === true;
}
function getDailyTelemetryToken() {
  const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return crypto.createHmac("sha256", TELEMETRY_SECRET).update(dateStr).digest("hex");
}
function getUserId() {
  const folders = vscode2.workspace.workspaceFolders;
  if (!folders?.length) {
    return "my_account";
  }
  const metaPath = path3.join(folders[0].uri.fsPath, "metadata.json");
  try {
    if (fs3.existsSync(metaPath)) {
      const meta = JSON.parse(fs3.readFileSync(metaPath, "utf-8"));
      return meta.CATBOX_PUB_ID || meta.CATBOX_WALLET || "my_account";
    }
  } catch {
  }
  return "my_account";
}
async function touchActivity() {
  try {
    await fetch(`${MAIN_SERVER}/api/telemetry/touch`, { method: "POST" });
  } catch {
  }
}
async function emitTelemetry(type, adId, campaignId, surface, visibleDurationMs = 0) {
  const event = {
    event_id: crypto.randomUUID(),
    user_id: getUserId(),
    ad_id: adId,
    campaign_id: campaignId,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    surface,
    type,
    visible_duration_ms: visibleDurationMs
  };
  try {
    await fetch(`${MAIN_SERVER}/api/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: [event] })
    });
  } catch (err) {
    console.warn("[Catbox Extension] Telemetry dispatch offline:", err);
  }
}
function scheduleViewableTracking(adId, campaignId, surface) {
  if (surface === "visual_panel") {
    if (visualViewableTimer) clearTimeout(visualViewableTimer);
    visualViewableTracked = false;
    visualViewableTimer = setTimeout(() => {
      if (vscode2.window.state.focused && !visualViewableTracked && isVisualAdEnabled()) {
        visualViewableTracked = true;
        emitTelemetry("impression_viewable", adId, campaignId, "visual_panel");
      }
    }, 5e3);
    return;
  }
  if (viewableTimer) clearTimeout(viewableTimer);
  statusBarViewableTracked = false;
  viewableTimer = setTimeout(() => {
    if (vscode2.window.state.focused && !statusBarViewableTracked) {
      statusBarViewableTracked = true;
      emitTelemetry("impression_viewable", adId, campaignId, "statusbar");
    }
  }, 5e3);
}
async function onAdDisplayed(surface) {
  await touchActivity();
  if (surface === "visual_panel") {
    await emitTelemetry("impression_rendered", "visual_panel_default", "visual_panel_house", surface);
    scheduleViewableTracking("visual_panel_default", "visual_panel_house", surface);
    return;
  }
  await emitTelemetry("impression_rendered", currentAd.id, currentAd.campaignId, surface);
  scheduleViewableTracking(currentAd.id, currentAd.campaignId, surface);
}
async function reportClick(surface) {
  if (surface === "visual_panel") {
    await reportVisualPanelClick();
    return;
  }
  if (!currentAd.link) return;
  vscode2.env.openExternal(vscode2.Uri.parse(currentAd.link));
  try {
    await fetch(`${MAIN_SERVER}/api/atomic/report-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creativeText: currentAd.text,
        url: currentAd.link,
        clickedAt: (/* @__PURE__ */ new Date()).toISOString(),
        providerId: currentAd.providerId,
        providerType: currentAd.providerType,
        creativeId: currentAd.id,
        campaignId: currentAd.campaignId,
        eventId: crypto.randomUUID(),
        surface
      })
    });
  } catch (err) {
    console.warn("[Catbox Extension] Click report offline:", err);
  }
  await touchActivity();
  await emitTelemetry("click", currentAd.id, currentAd.campaignId, surface);
}
async function reportVisualPanelClick() {
  const adId = "visual_panel_default";
  const campaignId = "visual_panel_house";
  vscode2.env.openExternal(vscode2.Uri.parse(VISUAL_PANEL_LINK));
  try {
    await fetch(`${MAIN_SERVER}/api/atomic/report-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creativeText: VISUAL_PANEL_COPY,
        url: VISUAL_PANEL_LINK,
        clickedAt: (/* @__PURE__ */ new Date()).toISOString(),
        creativeId: adId,
        campaignId,
        eventId: crypto.randomUUID(),
        surface: "visual_panel"
      })
    });
  } catch (err) {
    console.warn("[Catbox Extension] Click report offline:", err);
  }
  await touchActivity();
  await emitTelemetry("click", adId, campaignId, "visual_panel");
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
var CatboxVisualAdProvider = class {
  constructor(extensionUri) {
    this.extensionUri = extensionUri;
    this.visualImageUri = "";
  }
  setVisualImageUri(uri) {
    this.visualImageUri = uri.toString();
  }
  resolveWebviewView(webviewView) {
    this.view = webviewView;
    this.setVisualImageUri(
      webviewView.webview.asWebviewUri(
        vscode2.Uri.joinPath(this.extensionUri, ...VISUAL_PANEL_IMAGE.split("/"))
      )
    );
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };
    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg?.type === "click") {
        await reportClick("visual_panel");
      }
      if (msg?.type === "hide") {
        await vscode2.commands.executeCommand("catbox.hideVisualAd");
      }
    });
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible && isVisualAdEnabled()) {
        onAdDisplayed("visual_panel").catch(() => void 0);
      }
    });
    this.render();
    if (webviewView.visible && isVisualAdEnabled()) {
      onAdDisplayed("visual_panel").catch(() => void 0);
    }
  }
  update(payload) {
    currentAd = payload;
    this.render();
  }
  render() {
    if (!this.view) return;
    const imageSrc = this.visualImageUri;
    const safeText = escapeHtml(VISUAL_PANEL_COPY);
    const safeImage = escapeHtml(imageSrc);
    this.view.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family, system-ui, sans-serif);
      background: var(--vscode-sideBar-background, #1e1e1e);
      color: var(--vscode-foreground, #ccc);
      padding: 8px;
    }
    .card {
      width: 260px;
      max-width: 100%;
      margin: 0 auto;
      border: 1px solid var(--vscode-panel-border, #3c3c3c);
      border-radius: 6px;
      overflow: hidden;
      cursor: pointer;
      background: var(--vscode-editor-background, #252526);
    }
    .card:hover { outline: 1px solid var(--vscode-focusBorder, #007fd4); }
    .visual {
      width: 100%;
      height: 200px;
      object-fit: cover;
      display: block;
      background: #1a1f2e;
    }
    .copy { padding: 10px 12px; font-size: 12px; line-height: 1.4; }
    .label {
      font-size: 10px;
      opacity: 0.65;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .hide {
      display: block;
      width: 100%;
      margin-top: 8px;
      padding: 6px;
      font-size: 11px;
      background: transparent;
      color: var(--vscode-foreground, #ccc);
      border: 1px solid var(--vscode-panel-border, #3c3c3c);
      border-radius: 4px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card" id="ad" role="button" tabindex="0" aria-label="Sponsored content">
    <img class="visual" src="${safeImage}" alt="" />
    <div class="copy">
      <div class="label">Sponsored</div>
      <div>${safeText}</div>
    </div>
  </div>
  <button class="hide" id="hide">Hide sponsor panel</button>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById("ad").addEventListener("click", () => vscode.postMessage({ type: "click" }));
    document.getElementById("hide").addEventListener("click", () => vscode.postMessage({ type: "hide" }));
  </script>
</body>
</html>`;
  }
};
function showVisualOnboarding(context) {
  if (context.globalState.get("catbox.visualAd.onboardingShown")) return;
  context.globalState.update("catbox.visualAd.onboardingShown", true);
  vscode2.window.showInformationMessage(
    "Catbox: Optional pets-sized sponsor panel can earn extra revenue. Dev-tool ads only. Enable anytime in settings.",
    "Enable panel",
    "Not now"
  ).then((choice) => {
    if (choice === "Enable panel") {
      vscode2.commands.executeCommand("catbox.enableVisualAd");
    }
  });
}
function applyAdToSurfaces() {
  statusBarItem.text = `$(globe) ${currentAd.text}`;
  if (isVisualAdEnabled()) {
    visualAdProvider?.update(currentAd);
  }
}
async function injectSpinnerFromAd(adText) {
  try {
    await injectCatboxVerbs(adText);
    await injectCursorSpinnerVerbs(adText);
  } catch (err) {
    console.warn("[Catbox Extension] Spinner inject failed:", err);
  }
}
function activate(context) {
  visualAdProvider = new CatboxVisualAdProvider(context.extensionUri);
  context.subscriptions.push(
    vscode2.window.registerWebviewViewProvider("catbox.visualAd", visualAdProvider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );
  statusBarItem = vscode2.window.createStatusBarItem(vscode2.StatusBarAlignment.Right, 100);
  statusBarItem.command = "catbox.openAd";
  statusBarItem.tooltip = "Sponsored by Catbox \u2022 Click to support & explore details";
  statusBarItem.text = "$(globe) Catbox: Connecting...";
  statusBarItem.show();
  const openAdCommand = vscode2.commands.registerCommand("catbox.openAd", () => {
    reportClick("statusbar");
  });
  const enableVisualCommand = vscode2.commands.registerCommand("catbox.enableVisualAd", async () => {
    await vscode2.workspace.getConfiguration("catbox").update("visualAd.enabled", true, vscode2.ConfigurationTarget.Global);
    await vscode2.commands.executeCommand("catbox.visualAd.focus");
    visualAdProvider?.update(currentAd);
    await onAdDisplayed("visual_panel");
    vscode2.window.showInformationMessage("Catbox visual sponsor panel enabled. Hide anytime via panel button or settings.");
  });
  const hideVisualCommand = vscode2.commands.registerCommand("catbox.hideVisualAd", async () => {
    await vscode2.workspace.getConfiguration("catbox").update("visualAd.enabled", false, vscode2.ConfigurationTarget.Global);
    vscode2.window.showInformationMessage("Catbox visual sponsor panel hidden.");
  });
  const configListener = vscode2.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("catbox.visualAd.enabled") && isVisualAdEnabled()) {
      vscode2.commands.executeCommand("catbox.visualAd.focus").then(void 0, () => void 0);
      visualAdProvider?.update(currentAd);
      onAdDisplayed("visual_panel").catch(() => void 0);
    }
  });
  const fetchAdPayload = async () => {
    try {
      const token = getDailyTelemetryToken();
      const useMock = process.env.CATBOX_MOCK_AD === "1" || context.extensionMode === vscode2.ExtensionMode.Development;
      const mockQuery = useMock ? "&mock=1" : "";
      const response = await fetch(`${MAIN_SERVER}/api/atomic/stream?token=${token}${mockQuery}`, {
        headers: { "x-catbox-telemetry-token": token }
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.success) {
          currentAd = {
            text: data.creativeText || data.adMessage || currentAd.text,
            link: data.targetUrl || data.link || currentAd.link,
            id: data.id || currentAd.id,
            campaignId: data.campaign_id || currentAd.campaignId,
            imageUrl: data.imageUrl,
            providerId: data.providerId,
            providerType: data.providerType
          };
          applyAdToSurfaces();
          await injectSpinnerFromAd(currentAd.text);
          await onAdDisplayed("statusbar");
          if (isVisualAdEnabled()) {
            await onAdDisplayed("visual_panel");
          }
          return;
        }
      }
      throw new Error("Invalid daemon response format");
    } catch {
      const localSponsors = [
        {
          id: "fb_deco_db",
          text: "NeoDeco-DB: Elegant geometric SQL schemas. Speed up Postgres by 10x.",
          link: "https://neodeco-db.io",
          campaign_id: "campaign_neodeco"
        },
        {
          id: "fb_saffron",
          text: "Saffron-Host: Built by gold-standard architects, loved by elite coders.",
          link: "https://saffron-host.net",
          campaign_id: "campaign_saffron"
        },
        {
          id: "fb_drizzle",
          text: "Drizzle ORM: Strictly typed queries for high-performance apps.",
          link: "https://orm.drizzle.team",
          campaign_id: "campaign_drizzle"
        }
      ];
      const fallback = localSponsors[Math.floor(Math.random() * localSponsors.length)];
      currentAd = {
        text: fallback.text,
        link: fallback.link,
        id: fallback.id,
        campaignId: fallback.campaign_id
      };
      applyAdToSurfaces();
      await injectSpinnerFromAd(currentAd.text);
      await onAdDisplayed("statusbar");
    }
  };
  touchActivity();
  fetchAdPayload();
  const pollTimer = setInterval(fetchAdPayload, 6e4);
  showVisualOnboarding(context);
  context.subscriptions.push(statusBarItem);
  context.subscriptions.push(openAdCommand);
  context.subscriptions.push(enableVisualCommand);
  context.subscriptions.push(hideVisualCommand);
  context.subscriptions.push(configListener);
  context.subscriptions.push({
    dispose: () => {
      clearInterval(pollTimer);
      if (viewableTimer) clearTimeout(viewableTimer);
      if (visualViewableTimer) clearTimeout(visualViewableTimer);
    }
  });
}
async function deactivate() {
  if (viewableTimer) clearTimeout(viewableTimer);
  if (visualViewableTimer) clearTimeout(visualViewableTimer);
  if (statusBarItem) statusBarItem.hide();
  await restoreCursorSpinnerVerbs();
  await restoreOriginalSettings();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
