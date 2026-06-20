import { describe, test, expect } from "vitest";
import { normalizeManifestPayload } from "./normalize";
import { toManifestItem, hashAdCore } from "./hash";
import { isValidAdItem } from "../manifestEngine";
import { carbonCliAdapter } from "./carbon";
import { buySellAdsAdapter } from "./buysellads";
import { pavedAdapter } from "./paved";
import { sovrnAdapter } from "./sovrn";
import { infolinksAdapter } from "./infolinks";
import { directSponsorAdapter } from "./directSponsor";
import {
  adsterraSmartlinkAdapter,
  appendPlacementSubId,
  buildSmartlinkManifestItem,
  resolveSmartlinkUrl,
} from "./adsterra";
import { selectWeightedCreative } from "./index";
import type { AdProvider } from "../../types";
import type { TaggedCreative } from "./types";

const baseProvider = (overrides: Partial<AdProvider>): AdProvider => ({
  id: "prov_test",
  name: "Test",
  baseUrl: "https://example.com",
  sharedWithCommunity: false,
  creatorId: "my_account",
  cpmRate: 1.0,
  status: "active",
  ...overrides,
});

describe("normalizeManifestPayload", () => {
  test("maps headline/url shapes to AdManifestItem", () => {
    const items = normalizeManifestPayload([
      { id: "a1", headline: "Hello world", url: "https://example.com" },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].text).toBe("Hello world");
    expect(items[0].link).toBe("https://example.com");
    expect(isValidAdItem(items[0])).toBe(true);
  });
});

describe("provider adapters (fixture fallback)", () => {
  test("carbon_cli loads local fixture", async () => {
    const items = await carbonCliAdapter.fetchCreatives(
      baseProvider({ providerType: "carbon_cli", baseUrl: "https://www.carbonads.net" })
    );
    expect(items.length).toBeGreaterThan(0);
    expect(isValidAdItem(items[0])).toBe(true);
  });

  test("buysellads loads local fixture", async () => {
    const items = await buySellAdsAdapter.fetchCreatives(
      baseProvider({ providerType: "buysellads" })
    );
    expect(items.length).toBeGreaterThan(0);
  });

  test("paved loads local fixture", async () => {
    const items = await pavedAdapter.fetchCreatives(
      baseProvider({ providerType: "paved", siteId: "catbox-terminal" })
    );
    expect(items.length).toBeGreaterThan(0);
  });

  test("sovrn backfill loads local fixture", async () => {
    const items = await sovrnAdapter.fetchCreatives(
      baseProvider({ providerType: "sovrn" })
    );
    expect(items.length).toBeGreaterThan(0);
  });

  test("infolinks backfill loads local fixture", async () => {
    const items = await infolinksAdapter.fetchCreatives(
      baseProvider({ providerType: "infolinks" })
    );
    expect(items.length).toBeGreaterThan(0);
  });

  test("direct_sponsor falls back to local fixture when remote returns house ads", async () => {
    const items = await directSponsorAdapter.fetchCreatives(
      baseProvider({
        id: "prov_direct_cursor",
        providerType: "direct_sponsor",
        baseUrl: "https://cursor.com",
      })
    );
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].text).toContain("Cursor");
    expect(items[0].id).not.toMatch(/^fb_/);
  });

  test("adsterra_smartlink loads local fixture when no env URL", async () => {
    const prev = process.env.ADSTERRA_SMARTLINK_URL;
    delete process.env.ADSTERRA_SMARTLINK_URL;
    const items = await adsterraSmartlinkAdapter.fetchCreatives(
      baseProvider({ providerType: "adsterra_smartlink", baseUrl: "" })
    );
    if (prev !== undefined) process.env.ADSTERRA_SMARTLINK_URL = prev;
    expect(items.length).toBeGreaterThan(0);
    expect(isValidAdItem(items[0])).toBe(true);
  });

  test("adsterra_smartlink builds live URL with placement_sub_id", async () => {
    const prev = process.env.ADSTERRA_SMARTLINK_URL;
    process.env.ADSTERRA_SMARTLINK_URL = "https://smartlink.example.test/go";
    const items = await adsterraSmartlinkAdapter.fetchCreatives(
      baseProvider({ providerType: "adsterra_smartlink" }),
      { surface: "vscode_statusbar" }
    );
    if (prev !== undefined) process.env.ADSTERRA_SMARTLINK_URL = prev;
    else delete process.env.ADSTERRA_SMARTLINK_URL;
    expect(items).toHaveLength(1);
    expect(items[0].link).toContain("placement_sub_id=catbox_vscode_statusbar_");
    expect(items[0].text.length).toBeGreaterThan(0);
  });
});

describe("selectWeightedCreative", () => {
  test("prefers higher cpmRate over many draws", () => {
    const pool: TaggedCreative[] = [
      { ...toManifestItem({ id: "low", text: "low", link: "https://a.com" }), providerId: "p1", providerName: "Low", cpmRate: 0.1 },
      { ...toManifestItem({ id: "high", text: "high", link: "https://b.com" }), providerId: "p2", providerName: "High", cpmRate: 100 },
    ];

    let highWins = 0;
    for (let i = 0; i < 50; i++) {
      const pick = selectWeightedCreative(pool);
      if (pick?.providerId === "p2") highWins++;
    }
    expect(highWins).toBeGreaterThan(40);
  });
});

describe("hashAdCore", () => {
  test("produces stable sha256 hex", () => {
    const core = { id: "x", text: "y", link: "https://z.com" };
    expect(hashAdCore(core)).toBe(hashAdCore(core));
    expect(hashAdCore(core)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("adsterra smartlink helpers", () => {
  test("appendPlacementSubId adds query param", () => {
    expect(appendPlacementSubId("https://go.test/a", "sub_1")).toBe(
      "https://go.test/a?placement_sub_id=sub_1"
    );
    expect(appendPlacementSubId("https://go.test/a?x=1", "sub_2")).toBe(
      "https://go.test/a?x=1&placement_sub_id=sub_2"
    );
  });

  test("buildSmartlinkManifestItem includes hash", () => {
    const item = buildSmartlinkManifestItem(
      "https://go.test/sl",
      { surface: "terminal" },
      "Test sponsor"
    );
    expect(item.text).toBe("Test sponsor");
    expect(item.link).toContain("placement_sub_id=");
    expect(item.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test("resolveSmartlinkUrl prefers env over provider baseUrl", () => {
    const prev = process.env.ADSTERRA_SMARTLINK_URL;
    process.env.ADSTERRA_SMARTLINK_URL = "https://env.test/link";
    expect(resolveSmartlinkUrl({ baseUrl: "https://provider.test" } as AdProvider)).toBe(
      "https://env.test/link"
    );
    if (prev !== undefined) process.env.ADSTERRA_SMARTLINK_URL = prev;
    else delete process.env.ADSTERRA_SMARTLINK_URL;
  });
});
