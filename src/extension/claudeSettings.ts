import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export interface ClaudeSettingsPaths {
  homeDir: string;
  claudeDir: string;
  settingsPath: string;
  backupDir: string;
  backupPath: string;
  createdMarkerPath: string;
}

export interface ClaudeIntegrationState {
  settingsExists: boolean;
  backupExists: boolean;
  createdMarkerExists: boolean;
  spinnerVerbs: string[];
  settingsPath: string;
  backupPath: string;
  createdMarkerPath: string;
}

export function getClaudePaths(homeDir = os.homedir()): ClaudeSettingsPaths {
  return {
    homeDir,
    claudeDir: path.join(homeDir, ".claude"),
    settingsPath: path.join(homeDir, ".claude", "settings.json"),
    backupDir: path.join(homeDir, ".catbox"),
    backupPath: path.join(homeDir, ".catbox", "claude-settings.backup.json"),
    createdMarkerPath: path.join(homeDir, ".catbox", "claude-settings.created"),
  };
}

export function sanitizeClaudeSpinnerText(adText: string): string {
  const clean = adText.replace(/\s+/g, " ").trim();
  if (!clean) {
    throw new Error("Cannot inject empty Claude spinner text.");
  }

  const starred = clean.startsWith("✶") ? clean : `✶ ${clean}`;
  const linked = starred.endsWith("↗") ? starred : `${starred} ↗`;
  return linked.slice(0, 140);
}

function readJsonObject(filePath: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, "utf-8");
  try {
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function atomicWriteJson(filePath: string, value: unknown): void {
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmpPath, JSON.stringify(value, null, 2), "utf-8");
  fs.renameSync(tmpPath, filePath);
}

export async function injectClaudeSpinnerText(
  adText: string,
  homeDir = os.homedir()
): Promise<ClaudeIntegrationState> {
  const paths = getClaudePaths(homeDir);
  const spinnerText = sanitizeClaudeSpinnerText(adText);

  fs.mkdirSync(paths.claudeDir, { recursive: true });
  fs.mkdirSync(paths.backupDir, { recursive: true });

  if (fs.existsSync(paths.settingsPath) && !fs.existsSync(paths.backupPath)) {
    fs.copyFileSync(paths.settingsPath, paths.backupPath);
  } else if (!fs.existsSync(paths.settingsPath)) {
    fs.writeFileSync(paths.createdMarkerPath, new Date().toISOString(), "utf-8");
  }

  const settings = readJsonObject(paths.settingsPath);
  settings.spinnerVerbs = [spinnerText];
  atomicWriteJson(paths.settingsPath, settings);

  return getClaudeIntegrationState(homeDir);
}

export async function restoreClaudeSettings(
  homeDir = os.homedir()
): Promise<ClaudeIntegrationState> {
  const paths = getClaudePaths(homeDir);
  fs.mkdirSync(paths.claudeDir, { recursive: true });

  if (fs.existsSync(paths.backupPath)) {
    fs.copyFileSync(paths.backupPath, paths.settingsPath);
    fs.unlinkSync(paths.backupPath);
  } else if (fs.existsSync(paths.createdMarkerPath) && fs.existsSync(paths.settingsPath)) {
    fs.unlinkSync(paths.settingsPath);
  }

  if (fs.existsSync(paths.createdMarkerPath)) {
    fs.unlinkSync(paths.createdMarkerPath);
  }

  return getClaudeIntegrationState(homeDir);
}

export function getClaudeIntegrationState(
  homeDir = os.homedir()
): ClaudeIntegrationState {
  const paths = getClaudePaths(homeDir);
  const settings = readJsonObject(paths.settingsPath);
  const spinnerVerbs = Array.isArray(settings.spinnerVerbs)
    ? settings.spinnerVerbs.filter((item): item is string => typeof item === "string")
    : [];

  return {
    settingsExists: fs.existsSync(paths.settingsPath),
    backupExists: fs.existsSync(paths.backupPath),
    createdMarkerExists: fs.existsSync(paths.createdMarkerPath),
    spinnerVerbs,
    settingsPath: paths.settingsPath,
    backupPath: paths.backupPath,
    createdMarkerPath: paths.createdMarkerPath,
  };
}
