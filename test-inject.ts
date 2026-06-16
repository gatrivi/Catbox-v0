import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { injectCatboxVerbs, restoreOriginalSettings } from './src/utils/claudeInterceptor.ts';

async function runSmokeTest() {
  const targetPath = path.join(os.homedir(), '.claude', 'settings.json');
  const backupPath = path.join(os.homedir(), '.catbox', 'settings.backup.json');
  
  // Reset any cached/persistent state for a hermetic test run
  if (fs.existsSync(targetPath)) {
    try { fs.unlinkSync(targetPath); } catch (e) {}
  }
  if (fs.existsSync(backupPath)) {
    try { fs.unlinkSync(backupPath); } catch (e) {}
  }

  const testString = "✶ Test Ad — Hello from Catbox ↗";
  try {
    await injectCatboxVerbs(testString);
    const postInject = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
    const assertValue = postInject.spinnerVerbs?.[0] === testString;
    
    await restoreOriginalSettings();
    const targetPathExistsAfter = fs.existsSync(targetPath);
    const postRestore = targetPathExistsAfter ? JSON.parse(fs.readFileSync(targetPath, 'utf-8')) : {};
    const assertRestore = postRestore.spinnerVerbs?.[0] !== testString;

    console.log(assertValue && assertRestore ? "🟢 PASS" : "🔴 FAIL");
  } catch (e) {
    console.log("🔴 FAIL:", e);
  }
}
runSmokeTest();
