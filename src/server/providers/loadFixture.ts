import fs from "fs/promises";
import path from "path";
import type { AdManifestItem } from "../manifestEngine";
import { isValidAdItem } from "../manifestEngine";

export async function loadLocalFixture(fixtureName: string): Promise<AdManifestItem[]> {
  const fixturePath = path.join(process.cwd(), "data", "provider-manifests", `${fixtureName}.json`);
  try {
    const raw = await fs.readFile(fixturePath, "utf8");
    const payload = JSON.parse(raw);
    if (!Array.isArray(payload)) return [];
    return payload.filter(isValidAdItem);
  } catch {
    return [];
  }
}
