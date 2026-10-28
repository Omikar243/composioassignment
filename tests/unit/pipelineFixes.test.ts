/**
 * tests/unit/pipelineFixes.test.ts
 *
 * Dedicated Verification Suite for Requirements R1 through R5:
 * - R1: Frontend Form and URL Precedence
 * - R2: Accurate Proxy Retrieval Failure Reporting
 * - R3: Web Discovery Pipeline Ordering and Fixture Handling
 * - R4: Distinguish Current Evidence from Baseline Fallback in Classification
 * - R5: Official Domain Authenticity Verification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LiveInvestigatorPanel } from "../../src/components/LiveInvestigatorPanel";
import { selectInvestigationSource } from "../../src/utils/investigationSource";
import { handleInvestigate } from "../../server/proxyServer";
import {
  WebDiscoveryPipeline,
  FixtureDiscoveryProvider,
  DuckDuckGoDiscoveryProvider,
  extractRootDomain,
  isAuthenticProviderDomain,
  isDisallowedDiscoveryDomain,
} from "../../src/agent/searchDiscovery";
import { executeMode2Dynamic } from "../../src/agent/investigatorEngine";
import { PROVIDER_REGISTRY } from "../../src/data/providerRegistry";
import { CATALOG_100_APPS } from "../../src/data/catalog100";
import type { SearchDiscoveryProvider, DiscoveredCandidate, DiscoveryQuery } from "../../src/agent/searchDiscovery";

// Mock Request / Response helper for Express route tests
function createMockReqRes(body: any = {}) {
  let statusCode = 200;
  let sentJson: any = null;
  const req = {
    body,
    query: {},
    method: "POST",
    url: "/api/investigate",
  } as any;
  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: any) {
      sentJson = payload;
      return res;
    },
  } as any;
  return {
    req,
    res,
    getStatus: () => statusCode,
    getJson: () => sentJson,
  };
}

describe("R1: Frontend Form and URL Precedence", () => {
  it("renders Field 1 label strictly as 'App Name:'", () => {
    const html = renderToStaticMarkup(
      React.createElement(LiveInvestigatorPanel, {
        onOpenFullGuide: () => {},
      })
    );
    expect(html).toContain("App Name:");
    expect(html).not.toContain("App Name or Documentation URL:");
  });

  it("renders Field 2 label strictly as 'Documentation URL:' without (Optional override): and without helper note", () => {
    const html = renderToStaticMarkup(
      React.createElement(LiveInvestigatorPanel, {
        onOpenFullGuide: () => {},
      })
    );
    expect(html).toContain("Documentation URL:");
    expect(html).not.toContain("Documentation URL (Optional override):");
    expect(html).not.toContain("investigator-doc-url-help");
    expect(html).not.toContain("If provided, this URL is fetched instead of a URL in the first field.");
  });

  it("distinguishes pre-populated catalog default URL from user override in selectInvestigationSource", () => {
    const supabaseApp = CATALOG_100_APPS.find((a) => a.id === "supabase")!;
    // When userOverrideUrl matches the catalog authDocUrl (pre-populated default)
    const selection = selectInvestigationSource({
      userOverrideUrl: supabaseApp.authDocUrl,
      catalogAuthDocUrl: supabaseApp.authDocUrl,
      websiteUrl: supabaseApp.websiteUrl,
    });
    expect(selection.sourceType).toBe("catalog_auth_doc");
    expect(selection.isOverride).toBe(false);
    expect(selection.url).toBe(supabaseApp.authDocUrl);
  });

  it("respects explicit isUserEntered=false flag even if URL is supplied", () => {
    const selection = selectInvestigationSource({
      userOverrideUrl: "https://example.com/doc",
      catalogAuthDocUrl: "https://example.com/catalog-doc",
      isUserEntered: false,
    });
    expect(selection.sourceType).toBe("catalog_auth_doc");
    expect(selection.isOverride).toBe(false);
  });

  it("authoritatively selects user_override when user enters a custom Documentation URL differing from catalog default", () => {
    const supabaseApp = CATALOG_100_APPS.find((a) => a.id === "supabase")!;
    const customUrl = "https://custom-supabase-doc.internal/api-keys";
    const selection = selectInvestigationSource({
      userOverrideUrl: customUrl,
      catalogAuthDocUrl: supabaseApp.authDocUrl,
      websiteUrl: supabaseApp.websiteUrl,
    });
    expect(selection.sourceType).toBe("user_override");
    expect(selection.isOverride).toBe(true);
    expect(selection.url).toBe(customUrl);
  });
});

describe("R2: Accurate Proxy Retrieval Failure Reporting", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("reports retrievalStatus as 'failed' with retrievalError when non-override retrieval fails (HTTP 404)", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "Not Found",
      headers: new Headers({ "content-type": "text/html" }),
    });

    const { req, res, getStatus, getJson } = createMockReqRes({
      appName: "Linear",
      websiteUrl: "https://developers.linear.app/docs/oauth/authentication",
      catalogBaseline: {
        authPath: "oauth_required",
        supportedAuthSchemes: ["OAUTH2"],
        authDocUrl: "https://developers.linear.app/docs/oauth/authentication",
      },
    });

    await handleInvestigate(req, res);

    expect(getStatus()).toBe(200);
    const json = getJson();
    expect(json.success).toBe(true);
    expect(json.retrievalStatus).toBe("failed");
    expect(json.retrievalError).toBeDefined();
    expect(json.retrievalError).toContain("404");
  });

  it("reports retrievalStatus as 'not_attempted' when no URL is targeted", async () => {
    const { req, res, getStatus, getJson } = createMockReqRes({
      appName: "Unlisted SaaS App Without URL",
    });

    await handleInvestigate(req, res);

    expect(getStatus()).toBe(200);
    const json = getJson();
    expect(json.success).toBe(true);
    expect(json.retrievalStatus).toBe("not_attempted");
  });

  it("reports retrievalStatus as 'success' when retrieval succeeds", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => "<main><h1>API Docs</h1><p>Authenticate with api key</p></main>",
      headers: new Headers({ "content-type": "text/html" }),
    });

    const { req, res, getStatus, getJson } = createMockReqRes({
      appName: "Custom API Provider",
      websiteUrl: "https://docs.custom-provider.example.com/api",
    });

    await handleInvestigate(req, res);

    expect(getStatus()).toBe(200);
    const json = getJson();
    expect(json.success).toBe(true);
    expect(json.retrievalStatus).toBe("success");
    expect(json.retrievalError).toBeUndefined();
  });
});

describe("R3: Web Discovery Pipeline Ordering and Fixture Handling", () => {
  it("registers live providers BEFORE FixtureDiscoveryProvider when allowLiveNetwork is true", () => {
    const pipeline = new WebDiscoveryPipeline({ allowLiveNetwork: true });
    const providers = pipeline.getProviders();
    expect(providers.length).toBeGreaterThanOrEqual(2);

    const fixtureIndex = providers.findIndex((p) => p.name === "fixture");
    const duckduckgoIndex = providers.findIndex((p) => p.name === "duckduckgo");

    expect(duckduckgoIndex).toBeGreaterThanOrEqual(0);
    expect(fixtureIndex).toBeGreaterThan(duckduckgoIndex);
  });

  it("registers ONLY FixtureDiscoveryProvider when allowLiveNetwork is false", () => {
    const pipeline = new WebDiscoveryPipeline({ allowLiveNetwork: false });
    const providers = pipeline.getProviders();
    expect(providers.length).toBe(1);
    expect(providers[0].name).toBe("fixture");
  });

  it("allows live search provider to execute first for known fixture app without being swallowed", async () => {
    const mockLiveProvider: SearchDiscoveryProvider = {
      name: "mock-live",
      async search(query: DiscoveryQuery): Promise<DiscoveredCandidate[]> {
        return [
          {
            url: "https://www.figma.com/developers/live-auth-docs",
            title: "Figma Live Developer Documentation",
            sourceProvider: "mock-live",
            confidenceScore: 99,
          },
        ];
      },
    };

    const pipeline = new WebDiscoveryPipeline({
      providers: [mockLiveProvider, new FixtureDiscoveryProvider()],
    });

    const candidate = await pipeline.discover({ appName: "Figma" });
    expect(candidate).toBeDefined();
    expect(candidate?.sourceProvider).toBe("mock-live");
    expect(candidate?.url).toBe("https://www.figma.com/developers/live-auth-docs");
  });

  it("falls back gracefully to FixtureDiscoveryProvider when live provider throws or returns empty", async () => {
    const failingLiveProvider: SearchDiscoveryProvider = {
      name: "failing-live",
      async search(): Promise<DiscoveredCandidate[]> {
        throw new Error("Live search network timeout");
      },
    };

    const pipeline = new WebDiscoveryPipeline({
      providers: [failingLiveProvider, new FixtureDiscoveryProvider()],
    });

    const candidate = await pipeline.discover({ appName: "Spotify" });
    expect(candidate).toBeDefined();
    expect(candidate?.sourceProvider).toBe("fixture");
    expect(candidate?.url).toContain("spotify.com");
  });
});

describe("R4: Distinguish Current Evidence from Baseline Fallback in Classification", () => {
  it("labels fresh authentic evidence as 'evidence_derived' with 'Evidence-based' summary", () => {
    const guide = executeMode2Dynamic({
      appName: "Supabase",
      websiteUrl: "https://supabase.com",
      docContent: "Authenticate data requests using your direct project API keys (anon and service_role). Pass in Authorization: Bearer <key>.",
    });

    expect(guide.readinessSummary.authPathClassification).toBe("direct_credential_only");
    expect(guide.readinessSummary.classificationProvenance).toBe("evidence_derived");
    expect(guide.readinessSummary.oneLineSummary).toContain("Evidence-based");
    expect(guide.readinessSummary.oneLineSummary).toContain("verified against retrieved documentation");
    expect(guide.investigationAnalysis?.classificationProvenance).toBe("evidence_derived");
  });

  it("labels empty documentation with catalog baseline as 'baseline_fallback' preserving catalog baseline", () => {
    const guide = executeMode2Dynamic({
      appName: "Supabase",
      websiteUrl: "https://supabase.com",
      docContent: "",
      catalogBaseline: {
        authPath: "direct_credential_only",
        supportedAuthSchemes: ["API_KEY"],
        authDocUrl: "https://supabase.com/docs/guides/getting-started/api-keys",
      },
    });

    expect(guide.readinessSummary.authPathClassification).toBe("direct_credential_only");
    expect(guide.readinessSummary.classificationProvenance).toBe("baseline_fallback");
    expect(guide.readinessSummary.oneLineSummary).toContain("Baseline fallback");
    expect(guide.readinessSummary.oneLineSummary).toContain("preserving catalog baseline");
    expect(guide.investigationAnalysis?.classificationProvenance).toBe("baseline_fallback");
  });

  it("labels generic marketing copy lacking auth evidence with catalog baseline as 'baseline_fallback'", () => {
    const marketingHtml = "<main><h1>Welcome to Supabase</h1><p>Build production databases fast. Sign in with Google or OAuth.</p><footer>Terms | OAuth Status</footer></main>";
    const guide = executeMode2Dynamic({
      appName: "Supabase",
      websiteUrl: "https://supabase.com",
      docContent: marketingHtml,
      catalogBaseline: {
        authPath: "direct_credential_only",
        supportedAuthSchemes: ["API_KEY"],
      },
    });

    expect(guide.readinessSummary.authPathClassification).toBe("direct_credential_only");
    expect(guide.readinessSummary.classificationProvenance).toBe("baseline_fallback");
    expect(guide.readinessSummary.oneLineSummary).toContain("Baseline fallback");
    expect(guide.readinessSummary.oneLineSummary).not.toContain("Evidence-based");
  });

  it("labels registry entry without baseline as 'baseline_fallback' retaining provider registry baseline", () => {
    const marketingHtml = "<main><h1>Figma Collaboration</h1><p>Design together seamlessly. Privacy | Terms</p></main>";
    const guide = executeMode2Dynamic({
      appName: "Figma",
      websiteUrl: "https://www.figma.com",
      docContent: marketingHtml,
    });

    expect(guide.readinessSummary.authPathClassification).toBe("hybrid_oauth_or_direct");
    expect(guide.readinessSummary.classificationProvenance).toBe("baseline_fallback");
    expect(guide.readinessSummary.oneLineSummary).toContain("Baseline fallback");
    expect(guide.readinessSummary.oneLineSummary).toContain("retaining provider registry baseline");
  });

  it("labels unknown app lacking evidence as 'undetermined'", () => {
    const guide = executeMode2Dynamic({
      appName: "Unlisted Mystery App",
      websiteUrl: "https://unlisted-mystery.example.com",
      docContent: "Welcome to our mystery service. Read our customer stories.",
    });

    expect(guide.readinessSummary.authPathClassification).toBe("undetermined");
    expect(guide.readinessSummary.classificationProvenance).toBe("undetermined");
    expect(guide.readinessSummary.oneLineSummary).toContain("Provisional undetermined");
  });
});

describe("R5: Official Domain Authenticity Verification", () => {
  describe("extractRootDomain", () => {
    it("extracts root domain from standard hostnames", () => {
      expect(extractRootDomain("developer.spotify.com")).toBe("spotify.com");
      expect(extractRootDomain("docs.linear.app")).toBe("linear.app");
      expect(extractRootDomain("api.figma.com")).toBe("figma.com");
      expect(extractRootDomain("www.supabase.com")).toBe("supabase.com");
    });

    it("correctly handles multi-part public suffixes (.co.uk, .com.au, .co.jp)", () => {
      expect(extractRootDomain("developer.service.co.uk")).toBe("service.co.uk");
      expect(extractRootDomain("auth.platform.com.au")).toBe("platform.com.au");
      expect(extractRootDomain("api.company.co.jp")).toBe("company.co.jp");
    });

    it("handles IP addresses and localhost cleanly", () => {
      expect(extractRootDomain("127.0.0.1")).toBe("127.0.0.1");
      expect(extractRootDomain("localhost")).toBe("localhost");
    });
  });

  describe("isAuthenticProviderDomain", () => {
    it("accepts authentic provider subdomains and paths", () => {
      expect(isAuthenticProviderDomain("https://developers.figma.com/api", { appName: "Figma" })).toBe(true);
      expect(isAuthenticProviderDomain("https://developer.spotify.com/documentation", { appName: "Spotify" })).toBe(true);
      expect(isAuthenticProviderDomain("https://developers.linear.app/docs", { appName: "Linear" })).toBe(true);
      expect(isAuthenticProviderDomain("https://supabase.com/docs/guides/api-keys", { appName: "Supabase" })).toBe(true);
    });

    it("accepts candidate domain matching query.websiteUrl", () => {
      expect(
        isAuthenticProviderDomain("https://docs.my-internal-tool.org/api", {
          appName: "Internal Tool",
          websiteUrl: "https://my-internal-tool.org",
        })
      ).toBe(true);
    });

    it("rejects inauthentic third-party tutorials, blogs, and forums", () => {
      expect(isAuthenticProviderDomain("https://random-tech-blog.org/figma-oauth", { appName: "Figma" })).toBe(false);
      expect(isAuthenticProviderDomain("https://saas-integration-guide.net/spotify", { appName: "Spotify" })).toBe(false);
      expect(isAuthenticProviderDomain("https://unofficial-hub.com/linear", { appName: "Linear" })).toBe(false);
    });

    it("rejects typosquatted / lookalike domains for registered providers", () => {
      expect(isAuthenticProviderDomain("https://attacker-spotify.com/token", { appName: "Spotify" })).toBe(false);
      expect(isAuthenticProviderDomain("https://figma-login.phishing.io/docs", { appName: "Figma" })).toBe(false);
    });

    it("accepts unlisted app when candidate domain root matches app brand token", () => {
      expect(isAuthenticProviderDomain("https://developer.brandnewapp.com/docs", { appName: "BrandNewApp" })).toBe(true);
    });

    it("rejects unlisted app when candidate domain has no relation to app name", () => {
      expect(isAuthenticProviderDomain("https://some-random-domain.org/docs", { appName: "BrandNewApp" })).toBe(false);
    });
  });

  describe("WebDiscoveryPipeline candidate filtering", () => {
    it("rejects candidate that passes SSRF and blacklist but fails official domain authenticity", async () => {
      const mockProvider: SearchDiscoveryProvider = {
        name: "mock-discovery",
        async search(): Promise<DiscoveredCandidate[]> {
          return [
            {
              url: "https://random-tech-blog.org/spotify-oauth-guide", // Non-blacklisted, SSRF-safe, but inauthentic domain
              title: "Unofficial Spotify Guide",
              sourceProvider: "mock-discovery",
              confidenceScore: 50,
            },
            {
              url: "https://developer.spotify.com/documentation/web-api/concepts/authorization", // Authentic domain
              title: "Official Spotify Docs",
              sourceProvider: "mock-discovery",
              confidenceScore: 40,
            },
          ];
        },
      };

      const pipeline = new WebDiscoveryPipeline({ providers: [mockProvider] });
      const candidates = await pipeline.search({ appName: "Spotify" });

      expect(candidates.length).toBe(1);
      expect(candidates[0].url).toBe("https://developer.spotify.com/documentation/web-api/concepts/authorization");
      expect(candidates[0].isAuthenticDomain).toBe(true);
    });
  });
});
