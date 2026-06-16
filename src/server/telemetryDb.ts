import pg from "pg";
import { createClient } from "redis";
import fs from "fs/promises";
import path from "path";

const { Pool } = pg;

export interface TelemetryEvent {
  event_id: string;
  user_id: string;
  ad_id: string;
  campaign_id: string;
  timestamp: string;
  surface: "spinner" | "statusbar" | "cli";
  visible_duration_ms: number;
}

// In-memory fallbacks for sandbox environments
const localDeduplicationCache = new Map<string, number>(); // event_id -> expiration timestamp
const localEventsPath = path.join(process.cwd(), "data", "telemetry_fallback.json");

let pgPool: pg.Pool | null = null;
let redisClient: any = null;

let usePgFallback = true;
let useRedisFallback = true;

/**
 * Initialize connections to PostgreSQL and Redis
 */
export async function initializeTelemetryStore() {
  // Ensure data fallback folder exists
  try {
    await fs.mkdir(path.dirname(localEventsPath), { recursive: true });
  } catch (err) {
    // Ignore folder creation errors
  }

  // 1. Setup PostgreSQL
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl !== "postgresql://postgres:password@localhost:5432/catbox_telemetry") {
    try {
      console.log("[Telemetry Store] Initiating PostgreSQL connection pool...");
      pgPool = new Pool({
        connectionString: dbUrl,
        connectionTimeoutMillis: 5000,
      });

      // Test connection & ensure table
      const client = await pgPool.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS telemetry_events (
          event_id VARCHAR(50) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL,
          ad_id VARCHAR(100) NOT NULL,
          campaign_id VARCHAR(100) NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL,
          surface VARCHAR(50) NOT NULL,
          visible_duration_ms INTEGER NOT NULL
        );
      `);
      client.release();
      usePgFallback = false;
      console.log("[Telemetry Store] ✓ PostgreSQL connected & table initialized successfully.");
    } catch (err: any) {
      console.warn(`[Telemetry Store Warning] PostgreSQL connection failed: ${err.message}. Enabling high-fidelity local JSON fallback.`);
      pgPool = null;
      usePgFallback = true;
    }
  } else {
    console.log("[Telemetry Store] PostgreSQL not explicitly configured. Using local JSON fallback.");
    usePgFallback = true;
  }

  // 2. Setup Redis
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl && redisUrl !== "redis://localhost:6379") {
    try {
      console.log("[Telemetry Store] Initiating Redis client connection...");
      redisClient = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
        }
      });
      redisClient.on("error", (err: any) => {
        console.warn(`[Telemetry Store Redis Error] ${err.message}`);
      });
      await redisClient.connect();
      useRedisFallback = false;
      console.log("[Telemetry Store] ✓ Redis connected and cache ready.");
    } catch (err: any) {
      console.warn(`[Telemetry Store Warning] Redis connection failed: ${err.message}. Enabling in-memory TTL deduplication.`);
      redisClient = null;
      useRedisFallback = true;
    }
  } else {
    console.log("[Telemetry Store] Redis not explicitly configured. Using in-memory TTL deduplication.");
    useRedisFallback = true;
  }

  // Set up background process to prune in-memory cache periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, expiry] of localDeduplicationCache.entries()) {
      if (now > expiry) {
        localDeduplicationCache.delete(key);
      }
    }
  }, 60 * 1000); // Prune every minute
}

/**
 * Checks if an event is already processed (Idempotency check).
 * If not, marks it as processed with 24 hours TTL.
 * Returns true if duplicate (already exists), false otherwise.
 */
export async function checkAndMarkDuplicate(eventId: string): Promise<boolean> {
  const ttlSeconds = 24 * 60 * 60; // 24 hours
  const expiryTimeMs = Date.now() + ttlSeconds * 1000;

  if (!useRedisFallback && redisClient) {
    try {
      const redisKey = `telemetry_event:${eventId}`;
      // SETNX returns 1 if key was set, 0 if it already exists
      // In node-redis v4, set return is 'OK' or null, or we can use SET with NX & EX options
      const wasSet = await redisClient.set(redisKey, "1", {
        NX: true,
        EX: ttlSeconds,
      });
      const isDuplicate = wasSet !== "OK" && wasSet !== true;
      return isDuplicate;
    } catch (err: any) {
      console.warn(`[Telemetry Store Redis Runtime Warning] Fallback triggered during duplicate check: ${err.message}`);
    }
  }

  // Local static/in-memory fallback
  const expiry = localDeduplicationCache.get(eventId);
  if (expiry) {
    if (Date.now() < expiry) {
      return true; // Active duplicate
    }
  }

  // Register locally
  localDeduplicationCache.set(eventId, expiryTimeMs);
  return false;
}

/**
 * Saves a list of telemetry events permanently (PostgreSQL schema insertion).
 * Fall back to JSON file logging if DB is offline.
 */
export async function saveTelemetryEvents(events: TelemetryEvent[]) {
  if (events.length === 0) return;

  if (!usePgFallback && pgPool) {
    try {
      const client = await pgPool.connect();
      try {
        // Query chunking or batch insert
        await client.query("BEGIN");
        const queryText = `
          INSERT INTO telemetry_events (event_id, user_id, ad_id, campaign_id, timestamp, surface, visible_duration_ms)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (event_id) DO NOTHING
        `;
        for (const event of events) {
          await client.query(queryText, [
            event.event_id,
            event.user_id,
            event.ad_id,
            event.campaign_id,
            new Date(event.timestamp),
            event.surface,
            event.visible_duration_ms,
          ]);
        }
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
      return;
    } catch (err: any) {
      console.warn(`[Telemetry Store SQL Write Warning] Failed to write to PostgreSQL: ${err.message}. Falling back to file.`);
    }
  }

  // local file append fallback
  try {
    let existing: TelemetryEvent[] = [];
    try {
      const content = await fs.readFile(localEventsPath, "utf8");
      existing = JSON.parse(content);
    } catch (err) {
      existing = [];
    }

    // De-duplicate against file-level records
    const existingIds = new Set(existing.map(e => e.event_id));
    const newUnique = events.filter(e => !existingIds.has(e.event_id));

    if (newUnique.length > 0) {
      const combined = [...existing, ...newUnique];
      await fs.writeFile(localEventsPath, JSON.stringify(combined, null, 2), "utf8");
    }
  } catch (err: any) {
    console.error(`[Telemetry Store Fallback Critical] Unresolvable disk failure during offline write: ${err.message}`);
  }
}

/**
 * Debug retrieve current saved telemetry records
 */
export async function getTelemetryStats() {
  if (!usePgFallback && pgPool) {
    try {
      const result = await pgPool.query(`
        SELECT surface, COUNT(*) as count, AVG(visible_duration_ms) as avg_duration 
        FROM telemetry_events 
        GROUP BY surface
      `);
      const rawEvents = await pgPool.query(`SELECT * FROM telemetry_events ORDER BY timestamp DESC LIMIT 20`);
      return {
        database: "PostgreSQL (Real Cloud Stack)",
        stats: result.rows,
        latest: rawEvents.rows,
      };
    } catch (err: any) {
      console.warn(`[Telemetry Store Stats Error] Failed to retrieve SQL stats: ${err.message}`);
    }
  }

  // fallback statistics
  try {
    const content = await fs.readFile(localEventsPath, "utf8");
    const events: TelemetryEvent[] = JSON.parse(content);
    const surfacesMap: Record<string, { count: number; total_duration: number }> = {};
    for (const e of events) {
      if (!surfacesMap[e.surface]) {
        surfacesMap[e.surface] = { count: 0, total_duration: 0 };
      }
      surfacesMap[e.surface].count++;
      surfacesMap[e.surface].total_duration += e.visible_duration_ms;
    }

    const stats = Object.entries(surfacesMap).map(([surface, data]) => ({
      surface,
      count: String(data.count),
      avg_duration: data.count > 0 ? (data.total_duration / data.count).toFixed(2) : "0",
    }));

    return {
      database: "Local High-Fidelity JSON Fallback Database",
      stats,
      latest: events.slice(-20).reverse(),
    };
  } catch (err) {
    return {
      database: "Local High-Fidelity JSON Fallback Database",
      stats: [],
      latest: [],
    };
  }
}
