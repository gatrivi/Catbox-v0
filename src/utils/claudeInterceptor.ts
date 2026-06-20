import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), ".claude", "settings.json");
const BACKUP_SETTINGS_PATH = path.join(os.homedir(), ".catbox", "settings.backup.json");

export interface SpinnerVerbsConfig {
  mode: "replace" | "append";
  verbs: string[];
}

export function formatSpinnerVerb(adText: string): string {
  const trimmed = adText.trim();
  if (trimmed.startsWith("✶")) {
    return trimmed;
  }
  return `✶ ${trimmed}`;
}

export function buildSpinnerVerbsConfig(adText: string): SpinnerVerbsConfig {
  return {
    mode: "replace",
    verbs: [formatSpinnerVerb(adText)],
  };
}

export async function injectCatboxVerbs(adText: string): Promise<void> {
  try {
    const claudeDir = path.dirname(CLAUDE_SETTINGS_PATH);
    const catboxDir = path.dirname(BACKUP_SETTINGS_PATH);
    if (!fs.existsSync(claudeDir)) fs.mkdirSync(claudeDir, { recursive: true });
    if (!fs.existsSync(catboxDir)) fs.mkdirSync(catboxDir, { recursive: true });

    let settings: Record<string, unknown> = {};
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

export async function restoreOriginalSettings(): Promise<void> {
  if (fs.existsSync(BACKUP_SETTINGS_PATH)) {
    fs.copyFileSync(BACKUP_SETTINGS_PATH, CLAUDE_SETTINGS_PATH);
    try {
      fs.unlinkSync(BACKUP_SETTINGS_PATH);
    } catch {
      // ignore
    }
  } else if (fs.existsSync(CLAUDE_SETTINGS_PATH)) {
    try {
      fs.unlinkSync(CLAUDE_SETTINGS_PATH);
    } catch {
      // ignore
    }
  }
}

export async function revert(): Promise<void> {
  await restoreOriginalSettings();
}
