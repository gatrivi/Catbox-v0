import * as vscode from "vscode";
import * as crypto from "crypto";

let statusBarItem: vscode.StatusBarItem;
let currentTargetUrl = "https://neodeco-db.io";
let currentAdText = "Catbox: strictly-typed developer ecosystem";

const TELEMETRY_SECRET = "catbox_daily_gold_secret";

/**
 * Returns a cryptographically secure, signed daily token.
 */
function getDailyTelemetryToken(): string {
  const dateStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  return crypto.createHmac("sha256", TELEMETRY_SECRET).update(dateStr).digest("hex");
}

/**
 * Activates the Catbox VS Code extension.
 * Boots up the status bar micro-hud and registers local synchronization hooks.
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('[Catbox VS Code Extension] Activated and checking local atomic daemon...');

  // 1. Create a custom Status Bar Item placed at the bottom right
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right, 
    100
  );
  
  // Configure action, tracking tooltips and styling
  statusBarItem.command = "catbox.openAd";
  statusBarItem.tooltip = "Sponsored by Catbox • Click to support & explore details";
  statusBarItem.text = "$(globe) Catbox: Connecting...";
  statusBarItem.show();

  // 4. Interaction Command handler (triggers browser navigation & metrics logging)
  const clickCommand = vscode.commands.registerCommand("catbox.openAd", async () => {
    if (currentTargetUrl) {
      console.log(`[Catbox Extension] Navigating to target sponsor resource: ${currentTargetUrl}`);
      
      // Open link in the user's default browser
      vscode.env.openExternal(vscode.Uri.parse(currentTargetUrl));

      // Trigger standard unauthenticated reporting back to the local ad brokerage daemon API
      try {
        const reportUrl = "http://127.0.0.1:5176/api/atomic/report-click";
        await fetch(reportUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creativeText: currentAdText,
            url: currentTargetUrl,
            clickedAt: new Date().toISOString()
          })
        });
        console.log("[Catbox Extension] Click reporting telemetry transmitted successfully.");
      } catch (err) {
        // Safe fail-silent if daemon is inactive or local sandbox is blocked
        console.warn("[Catbox Extension] Telemetry dispatch offline:", err);
      }
    }
  });

  // 2. Integration: Routine update mechanism to query daemon on port 5176
  const fetchAdPayload = async () => {
    try {
      const token = getDailyTelemetryToken();
      const response = await fetch(`http://127.0.0.1:5176/api/atomic/stream?token=${token}`, {
        headers: {
          "x-catbox-telemetry-token": token
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          // 3. Display: Update live status line elements dynamically
          currentAdText = data.creativeText || data.adMessage || currentAdText;
          currentTargetUrl = data.targetUrl || data.link || currentTargetUrl;
          
          statusBarItem.text = `$(globe) ${currentAdText}`;
          return;
        }
      }
      throw new Error("Invalid daemon response format");
    } catch (err: any) {
      // Offline fallback portfolio items for maximum reliability
      const localSponsors = [
        { text: "NeoDeco-DB: Elegant geometric SQL schemas. Speed up Postgres by 10x.", link: "https://neodeco-db.io" },
        { text: "Saffron-Host: Built by gold-standard architects, loved by elite coders.", link: "https://saffron-host.net" },
        { text: "Drizzle ORM: Strictly typed queries for high-performance apps.", link: "https://orm.drizzle.team" }
      ];
      const fallback = localSponsors[Math.floor(Math.random() * localSponsors.length)];
      
      currentAdText = fallback.text;
      currentTargetUrl = fallback.link;
      statusBarItem.text = `$(globe) ${currentAdText}`;
    }
  };

  // Immediate pull of initial broadcast
  fetchAdPayload();

  // Polling Interval configured to trigger every 60 seconds (60000 ms)
  const pollTimer = setInterval(fetchAdPayload, 60000);

  // Push resources to subscriptions so cleanup disposes cleanly
  context.subscriptions.push(statusBarItem);
  context.subscriptions.push(clickCommand);
  context.subscriptions.push({
    dispose: () => clearInterval(pollTimer)
  });
}

/**
 * Handle extension deactivation
 */
export function deactivate() {
  if (statusBarItem) {
    statusBarItem.hide();
  }
}
