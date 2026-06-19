import * as vscode from "vscode";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { getClaudeIntegrationState, injectClaudeSpinnerText, restoreClaudeSettings } from "./claudeSettings";

type TelemetrySurface = "statusbar" | "visual_panel";
type TelemetryType = "impression_rendered" | "impression_viewable" | "view_tick" | "click";

interface AdPayload {
  text: string;
  link: string;
  id: string;
  campaignId: string;
  imageUrl?: string;
  providerId?: string;
  providerType?: string;
}
