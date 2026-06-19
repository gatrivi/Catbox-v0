import type { AdManifestItem } from "../manifestEngine";
import { isValidAdItem } from "../manifestEngine";
import { toManifestItem } from "./hash";

export function toManifestCore(item: {
  id: string;
  text: string;
  link: string;
  hash: string;
}): AdManifestItem {
  return { id: item.id, text: item.text, link: item.link, hash: item.hash };
}

export function filterValidManifestItems(
  items: Array<{ id: string; text: string; link: string; hash: string }>
): AdManifestItem[] {
  const valid: AdManifestItem[] = [];
  for (const item of items) {
    const core = toManifestCore(item);
    if (isValidAdItem(core)) {
      valid.push(core);
    }
  }
  return valid;
}

/** Map common third-party JSON shapes to AdManifestItem[]. */
export function normalizeManifestPayload(payload: unknown): AdManifestItem[] {
  if (!payload) return [];

  const items: AdManifestItem[] = [];

  const pushRaw = (raw: {
    id?: string;
    text?: string;
    link?: string;
    url?: string;
    headline?: string;
    title?: string;
    message?: string;
    creative?: string;
    imageUrl?: string;
    image?: string;
  }) => {
    const text = raw.text || raw.headline || raw.title || raw.message || raw.creative;
    const link = raw.link || raw.url;
    if (text && link) {
      const item = toManifestItem({ id: raw.id, text, link });
      const imageUrl = raw.imageUrl || raw.image;
      if (imageUrl && isValidAdItem({ ...item, imageUrl })) {
        items.push({ ...item, imageUrl });
      } else if (isValidAdItem(item)) {
        items.push(item);
      }
    }
  };

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      if (typeof entry === "object" && entry !== null) {
        if ("id" in entry && "text" in entry && "link" in entry && "hash" in entry) {
          if (isValidAdItem(entry)) items.push(entry as AdManifestItem);
        } else {
          pushRaw(entry as Parameters<typeof pushRaw>[0]);
        }
      }
    }
    return items;
  }

  if (typeof payload === "object" && payload !== null) {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.ads)) return normalizeManifestPayload(obj.ads);
    if (Array.isArray(obj.creatives)) return normalizeManifestPayload(obj.creatives);
    if (Array.isArray(obj.items)) return normalizeManifestPayload(obj.items);
    pushRaw(obj as Parameters<typeof pushRaw>[0]);
  }

  return items;
}
