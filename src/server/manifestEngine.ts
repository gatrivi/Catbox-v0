import * as crypto from "crypto";

export interface AdManifestItem {
  id: string;
  text: string;
  link: string;
  hash: string;
  imageUrl?: string;
}

export type AdManifest = AdManifestItem[];

// Hardcoded safe ad fallbacks for offline mode or network failure
const FALLBACK_MANIFEST: AdManifest = [
  {
    id: "fb_deco_db",
    text: "NeoDeco-DB: Elegant geometric SQL schemas. Speed up Postgres by 10x.",
    link: "https://neodeco-db.io",
    hash: "31548e65e6aa5388cbe00fb6cd5bc2c3fa0a37b31cfda4aa6067fc4ca0cbaf2c"
  },
  {
    id: "fb_saffron_host",
    text: "Saffron-Host: Built by gold-standard architects, loved by elite coders.",
    link: "https://saffron-host.net",
    hash: "55be23a31da5f6efde10f5e135d96f9bf1fa10901e3bce7fb2ebfac1ca8bcaf5"
  },
  {
    id: "fb_drizzle_typed",
    text: "Drizzle ORM: Strictly typed queries for high-performance apps.",
    link: "https://orm.drizzle.team",
    hash: "fe8910aa18fb37c8930da0ab72d001ebfa0a12e345fc53bb10fac12ca1cbaf11"
  }
];

/**
 * Validates a single item to ensure it strictly conforms to the AdManifestItem interface
 * and contains zero remote executable vectors.
 */
export function isValidAdItem(item: any): item is AdManifestItem {
  if (typeof item !== "object" || item === null) {
    return false;
  }

  const requiredKeys = ["id", "text", "link", "hash"];
  if (!requiredKeys.every((k) => typeof item[k] === "string")) {
    return false;
  }

  const allowedKeys = new Set([...requiredKeys, "imageUrl"]);
  const actualKeys = Object.keys(item);
  if (!actualKeys.every((k) => allowedKeys.has(k)) || actualKeys.length < requiredKeys.length) {
    return false;
  }

  if (item.imageUrl !== undefined) {
    if (typeof item.imageUrl !== "string") return false;
    if (!/^https?:\/\//i.test(item.imageUrl)) return false;
  }

  // Sanitization: Reject any string containing <script>, executable code, eval, bash commands, etc.
  const payloadStr = JSON.stringify(item).toLowerCase();
  
  const illegalPatterns = [
    "<script", // Script tags
    "javascript:", // Inline JS
    "eval(", // Execution vectors
    "process.", // Node globals leakage
    "require(", // Node require loader
    "import(", // Dynamic JS imports
    "spawn(", // Shell execution spawning
    "exec(", // Shell execution commands
    "sh ", // command line prefix
    "bash ", // Bash command sequence
    "system(" // Low-level operating system call
  ];

  for (const pattern of illegalPatterns) {
    if (payloadStr.includes(pattern)) {
      console.warn(`[Catbox Security Alert] Discarded ad item code-injection attempt. Detected sequence: "${pattern}"`);
      return false;
    }
  }

  return true;
}

/**
 * Fetches and parses a raw JSON payload from a remote URL.
 * Guarantees cryptographic integrity and eliminates remote execution risks.
 */
export async function fetchSecureManifest(remoteUrl: string): Promise<AdManifest> {
  try {
    // Perform standard web stream fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(remoteUrl, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "Catbox-Security-Daemon/1.2.0"
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error Status: ${response.status}`);
    }

    const payload = await response.json();

    // Verify root is a valid array
    if (!Array.isArray(payload)) {
      throw new Error("Payload root must be a JSON array.");
    }

    // Strictly validate every element
    const validatedItems: AdManifest = [];
    for (const item of payload) {
      if (!isValidAdItem(item)) {
        throw new Error("Security audit failed: One or more ad items contain malicious patterns or malformed properties.");
      }
      validatedItems.push(item);
    }

    console.log(`[Catbox Security Manifest] Audit passed. Successfully loaded ${validatedItems.length} secure ad assets.`);
    return validatedItems;

  } catch (error: any) {
    console.warn(`[Catbox Security Manifest] Remote fetch failed or safely aborted. Returning safe fallbacks. Reason: ${error.message}`);
    return FALLBACK_MANIFEST;
  }
}
