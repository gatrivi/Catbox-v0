import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { buildSpinnerVerbsConfig } from "../utils/claudeInterceptor";

const BACKUP_PATH = path.join(os.homedir(), ".catbox", "cursor-spinnerVerbs.backup.json");

export async function injectCursorSpinnerVerbs(adText: string): Promise<void> {
  const config = vscode.workspace.getConfiguration("claudeCode");
  const backupDir = path.dirname(BACKUP_PATH);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  if (!fs.existsSync(BACKUP_PATH)) {
    const current = config.get("spinnerVerbs");
    fs.writeFileSync(BACKUP_PATH, JSON.stringify(current ?? null), "utf-8");
  }

  await config.update(
    "spinnerVerbs",
    buildSpinnerVerbsConfig(adText),
    vscode.ConfigurationTarget.Global
  );
}

export async function restoreCursorSpinnerVerbs(): Promise<void> {
  if (!fs.existsSync(BACKUP_PATH)) {
    return;
  }

  const backup = JSON.parse(fs.readFileSync(BACKUP_PATH, "utf-8"));
  const config = vscode.workspace.getConfiguration("claudeCode");

  if (backup === null) {
    await config.update("spinnerVerbs", undefined, vscode.ConfigurationTarget.Global);
  } else {
    await config.update("spinnerVerbs", backup, vscode.ConfigurationTarget.Global);
  }

  try {
    fs.unlinkSync(BACKUP_PATH);
  } catch {
    // ignore
  }
}
