import { describe, test, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import { reportProviderEvent, readProviderReportCount } from "./reporting";

const AUDIT = path.join(process.cwd(), "data", "provider-reports.jsonl");

describe("reportProviderEvent", () => {
  beforeEach(async () => {
    try {
      await fs.unlink(AUDIT);
    } catch {
      /* fresh */
    }
    process.env.CATBOX_REPORT_DRY_RUN = "1";
  });

  afterEach(() => {
    delete process.env.CATBOX_REPORT_DRY_RUN;
  });

  test("writes audit log on impression", async () => {
    const result = await reportProviderEvent({
      eventId: `test_imp_${Date.now()}`,
      type: "impression",
      providerId: "prov_carbon_cli",
      providerType: "carbon_cli",
      creativeId: "carbon_test",
      campaignId: "campaign_test",
      surface: "vscode_statusbar",
      timestamp: new Date().toISOString(),
    });
    expect(result.ok).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(await readProviderReportCount()).toBe(1);
  });

  test("dedupes duplicate eventId", async () => {
    const eventId = `test_dup_${Date.now()}`;
    const base = {
      eventId,
      type: "impression" as const,
      providerId: "prov_carbon_cli",
      providerType: "carbon_cli",
      creativeId: "x",
      surface: "vscode_statusbar",
      timestamp: new Date().toISOString(),
    };
    await reportProviderEvent(base);
    const second = await reportProviderEvent(base);
    expect(second.skipped).toBe(true);
    expect(second.reason).toBe("duplicate");
    expect(await readProviderReportCount()).toBe(1);
  });
});
