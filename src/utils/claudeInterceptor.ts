import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface ClaudeSpinnerVerbs {
  mode: "replace" | "append";
  verbs: string[];
}

interface ClaudeSettings {
  spinnerVerbs?: ClaudeSpinnerVerbs;
  [key: string]: any;
}

// Memory-cache of backups to guarantee safe restorations across lifecycle intervals
const backupCache = new Map<string, { content: string | null; existed: boolean }>();

const homeDir = os.homedir() || process.env.HOME || process.env.USERPROFILE || "";

// Standard local configuration target path matrices
const GLOBAL_CLAUDE_DIR = path.join(homeDir, ".claude");
const GLOBAL_SETTINGS_PATH = path.join(GLOBAL_CLAUDE_DIR, "settings.json");

const PROJECT_CLAUDE_DIR = path.join(process.cwd(), ".claude");
const PROJECT_SETTINGS_PATH = path.join(PROJECT_CLAUDE_DIR, "settings.json");
const PROJECT_LOCAL_SETTINGS_PATH = path.join(PROJECT_CLAUDE_DIR, "settings.local.json");

/**
 * Returns the unified CLI configuration targets.
 */
function getTargetConfigs() {
  return [
    {
      id: "global",
      path: GLOBAL_SETTINGS_PATH,
      backupPath: GLOBAL_SETTINGS_PATH + ".catbox-bak",
      required: false // Create if missing since it represents default CLI parameters
    },
    {
      id: "project",
      path: PROJECT_SETTINGS_PATH,
      backupPath: PROJECT_SETTINGS_PATH + ".catbox-bak",
      required: true // Project-level: Intercept only if explicitly present
    },
    {
      id: "project-local",
      path: PROJECT_LOCAL_SETTINGS_PATH,
      backupPath: PROJECT_LOCAL_SETTINGS_PATH + ".catbox-bak",
      required: true // Project-level local parameters: Intercept only if explicitly present
    }
  ];
}

/**
 * Generates the cross-platform path matrix for VS Code and Cursor preferences settings.
 */
function getIdeTargetConfigs() {
  const paths: string[] = [];
  const isWin = os.platform() === "win32";
  const isMac = os.platform() === "darwin";

  if (isWin) {
    const appData = process.env.APPDATA || path.join(homeDir, "AppData", "Roaming");
    paths.push(
      path.join(appData, "Code", "User", "settings.json"),
      path.join(appData, "Cursor", "User", "settings.json")
    );
  } else if (isMac) {
    paths.push(
      path.join(homeDir, "Library", "Application Support", "Code", "User", "settings.json"),
      path.join(homeDir, "Library", "Application Support", "Cursor", "User", "settings.json")
    );
  } else {
    // Linux / POSIX system structures
    paths.push(
      path.join(homeDir, ".config", "Code", "User", "settings.json"),
      path.join(homeDir, ".config", "Cursor", "User", "settings.json")
    );
  }

  return paths.map((p, idx) => ({
    id: `ide-${idx}`,
    path: p,
    backupPath: p + ".catbox-bak"
  }));
}

/**
 * Saves and cash-caches the original settings payload onto physical disks and in-memory structures.
 */
function secureBackup(filePath: string, backupPath: string) {
  if (backupCache.has(filePath)) {
    return; // Already backed up in this session sequence
  }

  const existed = fs.existsSync(filePath);
  let content: string | null = null;

  if (existed) {
    try {
      content = fs.readFileSync(filePath, "utf8");
      // Physical fallback backup creation
      if (!fs.existsSync(backupPath)) {
        const parentDir = path.dirname(backupPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        fs.writeFileSync(backupPath, content, "utf8");
        console.log(`[Claude Interceptor] Secure backup created successfully at: ${backupPath}`);
      }
    } catch (err) {
      console.error(`[Claude Interceptor] Critical backup write warning for ${filePath}:`, err);
    }
  }

  backupCache.set(filePath, { content, existed });
}

/**
 * Employs safe atomic file writing via temporary file swap mechanism to write configurations safely.
 */
function writeAtomic(filePath: string, fileJson: string) {
  const parentDir = path.dirname(filePath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  const tempPath = `${filePath}.${Date.now()}.${Math.floor(Math.random() * 100000)}.tmp`;
  fs.writeFileSync(tempPath, fileJson, "utf8");
  fs.renameSync(tempPath, filePath);
}

/**
 * Injects ad text dynamically as Claude Code custom CLI spinner verbs across GLOBAL and PROJECT scopes.
 * 
 * @param adText Safely validated sponsored sponsor string line
 */
export async function injectCatboxVerbs(adText: string): Promise<boolean> {
  try {
    const targets = getTargetConfigs();
    let updatedCount = 0;

    for (const target of targets) {
      // For local scopes, intercept if found/exists
      if (target.required && !fs.existsSync(target.path)) {
        continue;
      }

      // 1. Back up present filesystem structure
      secureBackup(target.path, target.backupPath);

      let settings: ClaudeSettings = {};

      // 2. Read present JSON parameters safely
      if (fs.existsSync(target.path)) {
        try {
          const raw = fs.readFileSync(target.path, "utf8");
          settings = JSON.parse(raw);
        } catch (e) {
          console.warn(`[Claude Interceptor] Settings file format mismatch or corrupt at ${target.path}, starting clean.`);
          settings = {};
        }
      }

      // 3. Inject spinnerVerbs, forcing replace mode with the new Catbox sponsored banner
      settings.spinnerVerbs = {
        mode: "replace",
        verbs: [
          adText,
          "Catbox: Open Stained-Glass Art Deco Sponsor Stream Active",
          "Ecosystem auditing in progress with Catbox ledger..."
        ]
      };

      // 4. Atomic write swap sequence
      const targetJson = JSON.stringify(settings, null, 2);
      writeAtomic(target.path, targetJson);

      console.log(`[Claude Interceptor] [${target.id.toUpperCase()}] Updated spinner verbs to: "${adText}"`);
      updatedCount++;
    }

    return updatedCount > 0;
  } catch (err) {
    console.error("[Claude Interceptor] Failed to complete atomic verb injection under active directories:", err);
    return false;
  }
}

/**
 * Synchronizes ad streams directly to local VS Code/Cursor environment settings schemas.
 * 
 * @param adText Safely validated sponsored sponsor string line
 */
export async function injectIdePreferences(adText: string): Promise<boolean> {
  try {
    const ideTargets = getIdeTargetConfigs();
    let updatedCount = 0;

    for (const target of ideTargets) {
      const parentDir = path.dirname(target.path);
      // We only execute if the IDE preference directory exists (meaning the IDE is installed/configured on host)
      if (!fs.existsSync(parentDir)) {
        continue;
      }

      // 1. Back up present layout first
      secureBackup(target.path, target.backupPath);

      let settings: any = {};

      // 2. Read present settings
      if (fs.existsSync(target.path)) {
        try {
          const raw = fs.readFileSync(target.path, "utf8");
          settings = JSON.parse(raw);
        } catch (e) {
          console.warn(`[Claude Interceptor] IDE settings format corrupted at ${target.path}, rebuilding.`);
          settings = {};
        }
      }

      // 3. Inject specialized top-level key "claudeCode.spinnerVerbs"
      settings["claudeCode.spinnerVerbs"] = {
        mode: "replace",
        verbs: [
          adText,
          "Catbox: Open Stained-Glass Art Deco Sponsor Stream Active",
          "Ecosystem auditing in progress with Catbox ledger..."
        ]
      };

      // 4. Update file atomically
      const targetJson = JSON.stringify(settings, null, 2);
      writeAtomic(target.path, targetJson);

      console.log(`[Claude Interceptor] [IDE SYNC] Successfully updated preferences key at: ${target.path}`);
      updatedCount++;
    }

    return updatedCount > 0;
  } catch (err) {
    console.error("[Claude Interceptor] Failed to complete atomic IDE preference injection:", err);
    return false;
  }
}

/**
 * Teardown action: Completely restores the user's original settings files
 * across all three targets configurations and IDE environments on daemon shutdown.
 */
export function restoreOriginalSettings(): boolean {
  try {
    const allConfigs = [
      ...getTargetConfigs(),
      ...getIdeTargetConfigs()
    ];

    let restoredCount = 0;

    for (const target of allConfigs) {
      const cache = backupCache.get(target.path);
      const hasPhysicalBackup = fs.existsSync(target.backupPath);

      if (cache || hasPhysicalBackup) {
        let originalContent: string | null = null;
        let existed = cache ? cache.existed : true;

        if (hasPhysicalBackup) {
          try {
            originalContent = fs.readFileSync(target.backupPath, "utf8");
          } catch (err) {
            console.error(`[Claude Interceptor] Restoration reader error on physical copy ${target.backupPath}:`, err);
          }
        } else if (cache) {
          originalContent = cache.content;
        }

        if (originalContent !== null) {
          try {
            writeAtomic(target.path, originalContent);
            console.log(`[Claude Interceptor] Restored original layout: ${target.path}`);
            restoredCount++;
          } catch (err) {
            console.error(`[Claude Interceptor] Failed atomic write-back restoration for ${target.path}:`, err);
          }
        } else if (!existed && fs.existsSync(target.path)) {
          // If the file originally did not exist, delete our newly generated settings file
          try {
            fs.unlinkSync(target.path);
            console.log(`[Claude Interceptor] Removed transient settings file cleanly: ${target.path}`);
            restoredCount++;
          } catch (err) {
            console.error(`[Claude Interceptor] Failed to cleanly erase transient parameters at ${target.path}:`, err);
          }
        }

        // Clean up physical backup file from filesystem
        if (hasPhysicalBackup) {
          try {
            fs.unlinkSync(target.backupPath);
          } catch (err) {
            console.error(`[Claude Interceptor] Failed to destroy temporary backup copy: ${target.backupPath}`, err);
          }
        }
      }
    }

    // Purge memory cache
    backupCache.clear();

    console.log(`[Claude Interceptor] Multi-Target restoration complete. Restored ${restoredCount} settings domains.`);
    return true;
  } catch (err) {
    console.error("[Claude Interceptor] Deep cleanup teardown execution raised warnings:", err);
    return false;
  }
}

/**
 * Clean revert command to instantly and completely purge all Catbox configurations and backups,
 * leaving host environments completely pristine.
 */
export function revert(): boolean {
  console.log("[Claude Interceptor] Clean revert command invoked. Purging all Catbox-injected properties.");
  return restoreOriginalSettings();
}
