import type { AdProvider } from "../../types";
import type { AdManifestItem } from "../manifestEngine";

export interface AdContext {
  surface?: "terminal" | "vscode_statusbar" | "vscode_visual_panel" | "web_dashboard";
}

export interface TaggedCreative extends AdManifestItem {
  providerId: string;
  providerName: string;
  cpmRate: number;
  providerType?: string;
}

export interface ProviderAdapter {
  type: AdProvider["providerType"];
  fetchCreatives(provider: AdProvider, ctx?: AdContext): Promise<AdManifestItem[]>;
}
