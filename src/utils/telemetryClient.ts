export interface TelemetryEvent {
  event_id: string; // UUID v4
  user_id: string; // developer account e.g. "my_account"
  ad_id: string; // creative ad identifier
  campaign_id: string; // provider or sponsor campaign id
  timestamp: string; // ISO event time
  surface: "spinner" | "statusbar" | "cli" | "visual_panel";
  type: string; // "impression_rendered" | "impression_viewable" | "view_tick" | "click"
  visible_duration_ms: number; // 0 for impressions, accumulated milliseconds for view ticks
}

// Generate secure UUID v4 with perfect fallback
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class TelemetryClient {
  private queue: TelemetryEvent[] = [];
  private isFlushing = false;
  private intervalId: any = null;
  private retryCount = 0;
  private maxBatchSize = 50;
  private flushIntervalMs = 30000;
  private storageKey = "catbox_telemetry_queue";

  constructor() {
    this.loadFromStorage();
    this.setupPeriodicFlush();
    this.setupPageUnloadHandlers();
  }

  /**
   * Load any preserved telemetry events from cache (e.g. from previous unsent failures)
   */
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`[Telemetry Client] Restored ${this.queue.length} events from local cache.`);
      }
    } catch {
      this.queue = [];
    }
  }

  /**
   * Save queue state to persistent local cache
   */
  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (err) {
      // Ignore quota errors
    }
  }

  /**
   * Record a new telemetry ad execution event
   */
  public trackEvent(
    type: "impression_rendered" | "impression_viewable" | "view_tick" | "click",
    adId: string,
    campaignId: string,
    surface: "spinner" | "statusbar" | "cli" | "visual_panel",
    visibleDurationMs: number = 0
  ) {
    const event: TelemetryEvent = {
      event_id: generateUUID(),
      user_id: "my_account", // Active developer account
      ad_id: adId || "default_ad",
      campaign_id: campaignId || "system_house",
      timestamp: new Date().toISOString(),
      surface,
      type,
      visible_duration_ms: visibleDurationMs,
    };

    this.queue.push(event);
    this.saveToStorage();

    // Max limit auto-triggers immediate flush
    if (this.queue.length >= this.maxBatchSize) {
      console.log(`[Telemetry Client] Queue reached limit ${this.maxBatchSize}, triggering immediate flush.`);
      this.flush();
    }
  }

  /**
   * Flush all accumulated telemetry events to backend
   */
  public async flush(): Promise<boolean> {
    if (this.isFlushing || this.queue.length === 0) {
      return false;
    }

    this.isFlushing = true;
    const batchToSend = [...this.queue];

    try {
      const response = await fetch("/api/telemetry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ events: batchToSend }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Splice off only what was successfully sent (to protect newly added events in parallel)
        this.queue = this.queue.slice(batchToSend.length);
        this.saveToStorage();
        this.retryCount = 0; // Reset backoff
        this.isFlushing = false;
        console.info(`[Telemetry Queue] Flushed ${batchToSend.length} events successfully. Backend reports processed: ${data.processed}, duplicates dropped: ${data.dropped}.`);
        return true;
      } else {
        throw new Error(data.error || "Server success false indicator");
      }
    } catch (err: any) {
      this.isFlushing = false;
      this.retryCount++;
      
      if (this.retryCount > 5) {
        console.error(`[Telemetry Client Queue Error] Flush failed: ${err.message}. Maximum 5 retry attempts reached. Stopping automated retries for this batch.`);
        return false;
      }

      const backoffDelay = Math.min(60000, 1000 * Math.pow(2, this.retryCount));
      console.warn(`[Telemetry Client Queue Error] Flush failed: ${err.message}. Retrying layout dispatch in ${backoffDelay}ms (attempt #${this.retryCount}/5)`);
      
      // Schedule retry with exponential backoff
      setTimeout(() => {
        this.flush();
      }, backoffDelay);
      return false;
    }
  }

  /**
   * Safe, high-priority unload delivery on browser exit
   */
  public flushSyncOnUnload() {
    if (this.queue.length === 0) return;

    const payload = JSON.stringify({ events: this.queue });
    const url = "/api/telemetry";

    // Standard sendBeacon is ideal for non-blocking browser exits
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon(url, blob);
      if (sent) {
        this.queue = [];
        this.saveToStorage();
        console.log("[Telemetry Unload] Dispatched via sendBeacon successfully.");
        return;
      }
    }

    // Modern Fetch fallback with keepalive: true
    try {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
      this.queue = [];
      this.saveToStorage();
      console.log("[Telemetry Unload] Dispatched via keep-alive fetch successfully.");
    } catch (error) {
      console.warn("[Telemetry Unload Error] Terminal dispatch failed:", error);
    }
  }

  private setupPeriodicFlush() {
    this.intervalId = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  private setupPageUnloadHandlers() {
    if (typeof window === "undefined") return;

    window.addEventListener("beforeunload", () => {
      this.flushSyncOnUnload();
    });

    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.flushSyncOnUnload();
      }
    });
  }

  public destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  /**
   * Helper to retrieve active local queue stats
   */
  public getQueueStats() {
    return {
      size: this.queue.length,
      retryCount: this.retryCount,
    };
  }
}

// Single active instance for client-wide ad tracking
export const telemetry = new TelemetryClient();
