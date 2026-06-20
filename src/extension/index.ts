import * as vscode from "vscode";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

type TelemetrySurface = "statusbar" | "visual_panel";
type TelemetryType = "impression_rendered" | "impression_viewable" | "view_tick" | "click";

interface AdPayload {
  text: string;
  link: string;
  id: string;
  campaignId: string;
  imageUrl?: string;
  providerId?: string;
  providerType?: string;
}

let statusBarItem: vscode.StatusBarItem;
let visualAdProvider: CatboxVisualAdProvider | undefined;
let currentAd: AdPayload = {
  text: "Catbox: strictly-typed developer ecosystem",
  link: "https://neodeco-db.io",
  id: "default_ad",
  campaignId: "system_house",
};

let viewableTimer: NodeJS.Timeout | undefined;
let visualViewableTimer: NodeJS.Timeout | undefined;
let statusBarViewableTracked = false;
let visualViewableTracked = false;

const TELEMETRY_SECRET = "catbox_daily_gold_secret";
const MAIN_SERVER = "http://127.0.0.1:3000";
const VISUAL_PANEL_IMAGE = "assets/sponsor-ad-1.jpeg";
const VISUAL_PANEL_LINK = "https://www.instagram.com/lastortasdemamamabel";
const VISUAL_PANEL_COPY = "Las Tortas de Mamá Mabel";

function isVisualAdEnabled(): boolean {
  return vscode.workspace.getConfiguration("catbox").get<boolean>("visualAd.enabled") === true;
}

function getDailyTelemetryToken(): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  return crypto.createHmac("sha256", TELEMETRY_SECRET).update(dateStr).digest("hex");
}

function getUserId(): string {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) {
    return "my_account";
  }
  const metaPath = path.join(folders[0].uri.fsPath, "metadata.json");
  try {
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      return meta.CATBOX_PUB_ID || meta.CATBOX_WALLET || "my_account";
    }
  } catch {
    // fall through
  }
  return "my_account";
}

async function touchActivity(): Promise<void> {
  try {
    await fetch(`${MAIN_SERVER}/api/telemetry/touch`, { method: "POST" });
  } catch {
    // fail-silent when daemon offline
  }
}

async function emitTelemetry(
  type: TelemetryType,
  adId: string,
  campaignId: string,
  surface: TelemetrySurface,
  visibleDurationMs: number = 0
): Promise<void> {
  const event = {
    event_id: crypto.randomUUID(),
    user_id: getUserId(),
    ad_id: adId,
    campaign_id: campaignId,
    timestamp: new Date().toISOString(),
    surface,
    type,
    visible_duration_ms: visibleDurationMs,
  };

  try {
    await fetch(`${MAIN_SERVER}/api/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: [event] }),
    });
  } catch (err) {
    console.warn("[Catbox Extension] Telemetry dispatch offline:", err);
  }
}

function scheduleViewableTracking(
  adId: string,
  campaignId: string,
  surface: TelemetrySurface
): void {
  if (surface === "visual_panel") {
    if (visualViewableTimer) clearTimeout(visualViewableTimer);
    visualViewableTracked = false;
    visualViewableTimer = setTimeout(() => {
      if (vscode.window.state.focused && !visualViewableTracked && isVisualAdEnabled()) {
        visualViewableTracked = true;
        emitTelemetry("impression_viewable", adId, campaignId, "visual_panel");
      }
    }, 5000);
    return;
  }

  if (viewableTimer) clearTimeout(viewableTimer);
  statusBarViewableTracked = false;
  viewableTimer = setTimeout(() => {
    if (vscode.window.state.focused && !statusBarViewableTracked) {
      statusBarViewableTracked = true;
      emitTelemetry("impression_viewable", adId, campaignId, "statusbar");
    }
  }, 5000);
}

async function onAdDisplayed(surface: TelemetrySurface): Promise<void> {
  await touchActivity();
  if (surface === "visual_panel") {
    await emitTelemetry("impression_rendered", "visual_panel_default", "visual_panel_house", surface);
    scheduleViewableTracking("visual_panel_default", "visual_panel_house", surface);
    return;
  }
  await emitTelemetry("impression_rendered", currentAd.id, currentAd.campaignId, surface);
  scheduleViewableTracking(currentAd.id, currentAd.campaignId, surface);
}

async function reportClick(surface: TelemetrySurface): Promise<void> {
  if (surface === "visual_panel") {
    await reportVisualPanelClick();
    return;
  }

  if (!currentAd.link) return;

  vscode.env.openExternal(vscode.Uri.parse(currentAd.link));

  try {
    await fetch(`${MAIN_SERVER}/api/atomic/report-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creativeText: currentAd.text,
        url: currentAd.link,
        clickedAt: new Date().toISOString(),
        providerId: currentAd.providerId,
        providerType: currentAd.providerType,
        creativeId: currentAd.id,
        campaignId: currentAd.campaignId,
        eventId: crypto.randomUUID(),
        surface,
      }),
    });
  } catch (err) {
    console.warn("[Catbox Extension] Click report offline:", err);
  }

  await touchActivity();
  await emitTelemetry("click", currentAd.id, currentAd.campaignId, surface);
}

async function reportVisualPanelClick(): Promise<void> {
  const adId = "visual_panel_default";
  const campaignId = "visual_panel_house";

  vscode.env.openExternal(vscode.Uri.parse(VISUAL_PANEL_LINK));

  try {
    await fetch(`${MAIN_SERVER}/api/atomic/report-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creativeText: VISUAL_PANEL_COPY,
        url: VISUAL_PANEL_LINK,
        clickedAt: new Date().toISOString(),
        creativeId: adId,
        campaignId,
        eventId: crypto.randomUUID(),
        surface: "visual_panel",
      }),
    });
  } catch (err) {
    console.warn("[Catbox Extension] Click report offline:", err);
  }

  await touchActivity();
  await emitTelemetry("click", adId, campaignId, "visual_panel");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

class CatboxVisualAdProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private visualImageUri = "";

  constructor(private readonly extensionUri: vscode.Uri) {}

  setVisualImageUri(uri: vscode.Uri): void {
    this.visualImageUri = uri.toString();
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    this.setVisualImageUri(
      webviewView.webview.asWebviewUri(
        vscode.Uri.joinPath(this.extensionUri, ...VISUAL_PANEL_IMAGE.split("/"))
      )
    );
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg?.type === "click") {
        await reportClick("visual_panel");
      }
      if (msg?.type === "hide") {
        await vscode.commands.executeCommand("catbox.hideVisualAd");
      }
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible && isVisualAdEnabled()) {
        onAdDisplayed("visual_panel").catch(() => undefined);
      }
    });

    this.render();
    if (webviewView.visible && isVisualAdEnabled()) {
      onAdDisplayed("visual_panel").catch(() => undefined);
    }
  }

  update(payload: AdPayload): void {
    currentAd = payload;
    this.render();
  }

  private render(): void {
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
}

function showVisualOnboarding(context: vscode.ExtensionContext): void {
  if (context.globalState.get<boolean>("catbox.visualAd.onboardingShown")) return;
  context.globalState.update("catbox.visualAd.onboardingShown", true);

  vscode.window
    .showInformationMessage(
      "Catbox: Optional pets-sized sponsor panel can earn extra revenue. Dev-tool ads only. Enable anytime in settings.",
      "Enable panel",
      "Not now"
    )
    .then((choice) => {
      if (choice === "Enable panel") {
        vscode.commands.executeCommand("catbox.enableVisualAd");
      }
    });
}

function applyAdToSurfaces(): void {
  statusBarItem.text = `$(globe) ${currentAd.text}`;
  if (isVisualAdEnabled()) {
    visualAdProvider?.update(currentAd);
  }
}

export function activate(context: vscode.ExtensionContext) {
  visualAdProvider = new CatboxVisualAdProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("catbox.visualAd", visualAdProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = "catbox.openAd";
  statusBarItem.tooltip = "Sponsored by Catbox • Click to support & explore details";
  statusBarItem.text = "$(globe) Catbox: Connecting...";
  statusBarItem.show();

  const openAdCommand = vscode.commands.registerCommand("catbox.openAd", () => {
    reportClick("statusbar");
  });

  const enableVisualCommand = vscode.commands.registerCommand("catbox.enableVisualAd", async () => {
    await vscode.workspace
      .getConfiguration("catbox")
      .update("visualAd.enabled", true, vscode.ConfigurationTarget.Global);
    await vscode.commands.executeCommand("catbox.visualAd.focus");
    visualAdProvider?.update(currentAd);
    await onAdDisplayed("visual_panel");
    vscode.window.showInformationMessage("Catbox visual sponsor panel enabled. Hide anytime via panel button or settings.");
  });

  const hideVisualCommand = vscode.commands.registerCommand("catbox.hideVisualAd", async () => {
    await vscode.workspace
      .getConfiguration("catbox")
      .update("visualAd.enabled", false, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage("Catbox visual sponsor panel hidden.");
  });

  const configListener = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("catbox.visualAd.enabled") && isVisualAdEnabled()) {
      vscode.commands.executeCommand("catbox.visualAd.focus").then(undefined, () => undefined);
      visualAdProvider?.update(currentAd);
      onAdDisplayed("visual_panel").catch(() => undefined);
    }
  });

  const fetchAdPayload = async () => {
    try {
      const token = getDailyTelemetryToken();
      const useMock =
        process.env.CATBOX_MOCK_AD === "1" ||
        context.extensionMode === vscode.ExtensionMode.Development;
      const mockQuery = useMock ? "&mock=1" : "";
      const response = await fetch(`${MAIN_SERVER}/api/atomic/stream?token=${token}${mockQuery}`, {
        headers: { "x-catbox-telemetry-token": token },
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
            providerType: data.providerType,
          };
          applyAdToSurfaces();
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
          campaign_id: "campaign_neodeco",
        },
        {
          id: "fb_saffron",
          text: "Saffron-Host: Built by gold-standard architects, loved by elite coders.",
          link: "https://saffron-host.net",
          campaign_id: "campaign_saffron",
        },
        {
          id: "fb_drizzle",
          text: "Drizzle ORM: Strictly typed queries for high-performance apps.",
          link: "https://orm.drizzle.team",
          campaign_id: "campaign_drizzle",
        },
      ];
      const fallback = localSponsors[Math.floor(Math.random() * localSponsors.length)];
      currentAd = {
        text: fallback.text,
        link: fallback.link,
        id: fallback.id,
        campaignId: fallback.campaign_id,
      };
      applyAdToSurfaces();
      await onAdDisplayed("statusbar");
    }
  };

  touchActivity();
  fetchAdPayload();
  const pollTimer = setInterval(fetchAdPayload, 60000);
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
    },
  });
}

export function deactivate() {
  if (viewableTimer) clearTimeout(viewableTimer);
  if (visualViewableTimer) clearTimeout(visualViewableTimer);
  if (statusBarItem) statusBarItem.hide();
}
