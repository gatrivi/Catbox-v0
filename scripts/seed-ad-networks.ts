/**
 * Seed plan CPM networks into data/providers.json
 * Usage: npx tsx scripts/seed-ad-networks.ts
 */
import fs from "fs/promises";
import path from "path";
import { PLAN_NETWORK_PROVIDERS } from "../src/server/providers/seedNetworks";

const providersPath = path.join(process.cwd(), "data", "providers.json");

async function main() {
  let existing: typeof PLAN_NETWORK_PROVIDERS = [];
  try {
    const raw = await fs.readFile(providersPath, "utf8");
    existing = JSON.parse(raw);
  } catch {
    /* fresh seed */
  }

  const byId = new Map(existing.map((p) => [p.id, p]));
  let added = 0;
  for (const planned of PLAN_NETWORK_PROVIDERS) {
    if (!byId.has(planned.id)) {
      byId.set(planned.id, planned);
      added++;
    }
  }

  const merged = Array.from(byId.values());
  await fs.writeFile(providersPath, JSON.stringify(merged, null, 2) + "\n");
  console.log(`Seeded ${added} providers (${merged.length} total) -> ${providersPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
