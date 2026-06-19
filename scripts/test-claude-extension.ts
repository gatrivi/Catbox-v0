import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getClaudeIntegrationState,
  getClaudePaths,
  injectClaudeSpinnerText,
  restoreClaudeSettings,
  sanitizeClaudeSpinnerText,
} from "../src/extension/claudeSettings";

type Result = { name: string; ok: boolean; detail?: string };

function makeHome(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "catbox-claude-"));
}

function readSettings(homeDir: string): any {
  const paths = getClaudePaths(homeDir);
  return JSON.parse(fs.readFileSync(paths.settingsPath, "utf-8"));
}

async function run(): Promise<void> {
  const results: Result[] = [];

  results.push({
    name: "creative text sanitized for Claude spinner",
    ok:
      sanitizeClaudeSpinnerText(" Neon branching ").startsWith("✶ ") &&
      sanitizeClaudeSpinnerText(" Neon branching ").endsWith("↗"),
  });

  const freshHome = makeHome();
  await injectClaudeSpinnerText("Test sponsor", freshHome);
  const freshSettings = readSettings(freshHome);
  let freshState = getClaudeIntegrationState(freshHome);
  results.push({
    name: "fresh install creates ~/.claude/settings.json",
    ok:
      freshState.settingsExists &&
      freshSettings.spinnerVerbs?.[0] === "✶ Test sponsor ↗",
    detail: freshState.settingsPath,
  });

  await restoreClaudeSettings(freshHome);
  freshState = getClaudeIntegrationState(freshHome);
  results.push({
    name: "fresh restore removes Catbox-created settings",
    ok: !freshState.settingsExists && !freshState.backupExists,
  });

  const existingHome = makeHome();
  const existingPaths = getClaudePaths(existingHome);
  fs.mkdirSync(existingPaths.claudeDir, { recursive: true });
  fs.writeFileSync(
    existingPaths.settingsPath,
    JSON.stringify({ spinnerVerbs: ["original"], theme: "dark" }, null, 2),
    "utf-8"
  );

  await injectClaudeSpinnerText("✶ Paid sponsor ↗", existingHome);
  const injected = readSettings(existingHome);
  results.push({
    name: "existing settings are backed up and replaced atomically",
    ok:
      getClaudeIntegrationState(existingHome).backupExists &&
      injected.spinnerVerbs?.[0] === "✶ Paid sponsor ↗" &&
      injected.theme === "dark",
  });

  await restoreClaudeSettings(existingHome);
  const restored = readSettings(existingHome);
  results.push({
    name: "restore recovers original Claude settings",
    ok:
      restored.spinnerVerbs?.[0] === "original" &&
      restored.theme === "dark" &&
      !getClaudeIntegrationState(existingHome).backupExists,
  });

  const invalidHome = makeHome();
  const invalidPaths = getClaudePaths(invalidHome);
  fs.mkdirSync(invalidPaths.claudeDir, { recursive: true });
  fs.writeFileSync(invalidPaths.settingsPath, "{ not valid json", "utf-8");
  await injectClaudeSpinnerText("Fallback sponsor", invalidHome);
  await restoreClaudeSettings(invalidHome);
  results.push({
    name: "invalid original JSON is still restored byte-for-byte",
    ok: fs.readFileSync(invalidPaths.settingsPath, "utf-8") === "{ not valid json",
  });

  let allOk = true;
  console.log("\n=== Catbox Claude Extension Test ===\n");
  for (const result of results) {
    const mark = result.ok ? "PASS" : "FAIL";
    console.log(`${mark}  ${result.name}${result.detail ? ` — ${result.detail}` : ""}`);
    if (!result.ok) allOk = false;
  }

  console.log(allOk ? "\nPASS — Claude settings integration is safe to demo" : "\nFAIL — fix Claude settings integration");
  process.exit(allOk ? 0 : 1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
