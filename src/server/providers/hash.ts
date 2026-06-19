import * as crypto from "crypto";
import type { AdManifestItem } from "../manifestEngine";

export function hashAdCore(core: { id: string; text: string; link: string }): string {
  return crypto.createHash("sha256").update(JSON.stringify(core)).digest("hex");
}

export function toManifestItem(raw: { id?: string; text: string; link: string }): AdManifestItem {
  const id = raw.id || `ad_${crypto.randomBytes(4).toString("hex")}`;
  const core = { id, text: raw.text.slice(0, 120), link: raw.link };
  return { ...core, hash: hashAdCore(core) };
}
