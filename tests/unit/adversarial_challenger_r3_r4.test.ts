/**
 * tests/unit/adversarial_challenger_r3_r4.test.ts
 *
 * Empirical Challenger 2 Stress Harness for Requirements R3 and R4:
 *
 * R3: Web Discovery Pipeline Ordering & Fixture Handling:
 * - Live search providers execute first when allowLiveNetwork is true
 * - Live search results are returned without being swallowed by fixtures
 * - Graceful fallback to FixtureDiscoveryProvider when live search fails/throws/returns empty/returns inauthentic domains
 * - Only FixtureDiscoveryProvider is registered/executed when allowLiveNetwork is false
 *
 * R4: Classification Provenance & Fallback:
 * - Empty doc ("") produces baseline_fallback (with baseline) or undetermined
 * - Marketing copy with zero auth evidence produces baseline_fallback or undetermined, NEVER evidence_derived
 * - Authentic docs (OAuth, Direct Key, Hybrid, Custom Headers) produce evidence_derived and "Evidence-based" summary
 * - Synchronization between readinessSummary and investigationAnalysis provenance
 */

import { describe, it, expect, vi } from "vitest";
import {
  WebDiscoveryPipeline,
  FixtureDiscoveryProvider,
  DuckDuckGoDiscoveryProvider,
  BraveSearchDiscoveryProvider,
} from "../../src/agent/searchDiscovery";
import type {
  SearchDiscoveryProvider,
  DiscoveredCandidate,
  DiscoveryQuery,
} from "../../src/agent/searchDiscovery";
import { executeMode2Dynamic } from "../../src/agent/investigatorEngine";
import { CATALOG_100_APPS } from "../../src/data/catalog100";
import { PROVIDER_REGISTRY } from "../../src/data/providerRegistry";

// ============================================================================
// PART 1: Challenge R3 (Web Discovery Pipeline Ordering & Fixture Handling)
// ============================================================================

describe("CHALLENGE R3: Web Discovery Pipeline Ordering & Fixture Handling", () => {
  it("verifies provider registration order when allowLiveNetwork is true", () => {
    const pipeline = new WebDiscoveryPipeline({ allowLiveNetwork: true });
    const providers = pipeline.getProviders();

    expect(providers.length).toBeGreaterThanOrEqual(2);

    const providerNames = providers.map((p) => p.name);
    const fixtureIdx = providerNames.indexOf("fixture");
    const ddgIdx = providerNames.indexOf("duckduckgo");

    expect(ddgIdx).toBeGreaterThanOrEqual(0);
    expect(fixtureIdx).toBeGreaterThanOrEqual(0);

    // CRITICAL: Live providers MUST execute BEFORE fixture provider
    expect(ddgIdx).toBeLessThan(fixtureIdx);

    // If Brave API key is set, brave must be first
    const braveIdx = providerNames.indexOf("brave");
    if (braveIdx >= 0) {
      expect(braveIdx).toBeLessThan(ddgIdx);
      expect(braveIdx).toBeLessThan(fixtureIdx);
    }
  });

  it("verifies only FixtureDiscoveryProvider is registered when allowLiveNetwork is false", () => {
    const pipeline = new WebDiscoveryPipeline({ allowLiveNetwork: false });
    const providers = pipeline.getProviders();

    expect(providers.length).toBe(1);
    expect(providers[0].name).toBe("fixture");
    expect(providers[0]).toBeInstanceOf(FixtureDiscoveryProvider);
  });

  it("ensures live results for fixture-seeded apps (Figma, Spotify, Postmark, Strava, DeepL) are returned without being swallowed by fixtures", async () => {
    const seededApps = [
      { name: "Figma", liveUrl: "https://developers.figma.com/live-docs/auth" },
      { name: "Spotify", liveUrl: "https://developer.spotify.com/live-docs/api" },
      { name: "Postmark", liveUrl: "https://postmarkapp.com/developer/live-api/tokens" },
      { name: "Strava", liveUrl: "https://developers.strava.com/live/oauth" },
      { name: "DeepL", liveUrl: "https://www.deepl.com/docs-api/live/auth" },
    ];

    for (const app of seededApps) {
      const mockLiveProvider: SearchDiscoveryProvider = {
        name: "mock-live-search",
        async search(query: DiscoveryQuery): Promise<DiscoveredCandidate[]> {
          return [
            {
              url: app.liveUrl,
              title: `${app.name} Fresh Live Auth Docs`,
              snippet: `Live documentation for ${app.name}`,
              sourceProvider: "mock-live-search",
              confidenceScore: 95,
            },
          ];
        },
      };

      const fixtureProvider = new FixtureDiscoveryProvider();

      // Ordering: live provider first, then fixture provider
      const pipeline = new WebDiscoveryPipeline({
        providers: [mockLiveProvider, fixtureProvider],
      });

      const result = await pipeline.discover({ appName: app.name });

      expect(result).toBeDefined();
      expect(result?.sourceProvider).toBe("mock-live-search");
      expect(result?.url).toBe(app.liveUrl);
      expect(result?.isAuthenticDomain).toBe(true);

      // Verify fixture candidate was NOT chosen
      const fixtureResults = await fixtureProvider.search({ appName: app.name });
      expect(fixtureResults.length).toBeGreaterThan(0);
      expect(result?.url).not.toBe(fixtureResults[0].url);
    }
  });

  it("falls back gracefully to FixtureDiscoveryProvider when live provider throws an unhandled exception", async () => {
    const throwingProvider: SearchDiscoveryProvider = {
      name: "throwing-live-provider",
      async search(): Promise<DiscoveredCandidate[]> {
        throw new Error("DNS resolution error: ENOTFOUND");
      },
    };

    const fixtureProvider = new FixtureDiscoveryProvider();
    const pipeline = new WebDiscoveryPipeline({
      providers: [throwingProvider, fixtureProvider],
    });

    const result = await pipeline.discover({ appName: "Spotify" });

    expect(result).toBeDefined();
    expect(result?.sourceProvider).toBe("fixture");
    expect(result?.url).toBe("https://developer.spotify.com/documentation/web-api/concepts/authorization");
  });

  it("falls back gracefully to FixtureDiscoveryProvider when live provider returns an empty array", async () => {
    const emptyProvider: SearchDiscoveryProvider = {
      name: "empty-live-provider",
      async search(): Promise<DiscoveredCandidate[]> {
        return [];
      },
    };

    const fixtureProvider = new FixtureDiscoveryProvider();
    const pipeline = new WebDiscoveryPipeline({
      providers: [emptyProvider, fixtureProvider],
    });

    const result = await pipeline.discover({ appName: "Postmark" });

    expect(result).toBeDefined();
    expect(result?.sourceProvider).toBe("fixture");
    expect(result?.url).toBe("https://postmarkapp.com/developer/api/overview");
  });

  it("falls back gracefully to FixtureDiscoveryProvider when live provider results fail domain authenticity or SSRF checks", async () => {
    const inauthenticProvider: SearchDiscoveryProvider = {
      name: "spam-live-provider",
      async search(): Promise<DiscoveredCandidate[]> {
        return [
          {
            url: "https://spammy-third-party-blog.org/figma-tokens",
            title: "Unofficial Figma Tutorial",
            sourceProvider: "spam-live-provider",
            confidenceScore: 99,
          },
          {
            url: "http://169.254.169.254/latest/meta-data", // SSRF target
            title: "Metadata",
            sourceProvider: "spam-live-provider",
            confidenceScore: 99,
          },
          {
            url: "https://reddit.com/r/figma/comments/api_tokens", // Disallowed domain
            title: "Reddit Thread",
            sourceProvider: "spam-live-provider",
            confidenceScore: 99,
          },
        ];
      },
    };

    const fixtureProvider = new FixtureDiscoveryProvider();
    const pipeline = new WebDiscoveryPipeline({
      providers: [inauthenticProvider, fixtureProvider],
    });

    const result = await pipeline.discover({ appName: "Figma" });

    expect(result).toBeDefined();
    expect(result?.sourceProvider).toBe("fixture");
    expect(result?.url).toBe("https://www.figma.com/developers/api#authentication");
  });

  it("correctly traverses multi-stage fallback cascades (Provider 1 error -> Provider 2 empty -> Provider 3 inauthentic -> Fixture)", async () => {
    const p1: SearchDiscoveryProvider = {
      name: "p1-crash",
      async search(): Promise<DiscoveredCandidate[]> {
        throw new Error("HTTP 502 Bad Gateway");
      },
    };
    const p2: SearchDiscoveryProvider = {
      name: "p2-empty",
      async search(): Promise<DiscoveredCandidate[]> {
        return [];
      },
    };
    const p3: SearchDiscoveryProvider = {
      name: "p3-unauthentic",
      async search(): Promise<DiscoveredCandidate[]> {
        return [
          {
            url: "https://random-forum.org/deepl-docs",
            title: "DeepL forum",
            sourceProvider: "p3-unauthentic",
            confidenceScore: 80,
          },
        ];
      },
    };

    const fixtureProvider = new FixtureDiscoveryProvider();
    const pipeline = new WebDiscoveryPipeline({
      providers: [p1, p2, p3, fixtureProvider],
    });

    const result = await pipeline.discover({ appName: "DeepL" });

    expect(result).toBeDefined();
    expect(result?.sourceProvider).toBe("fixture");
    expect(result?.url).toBe("https://www.deepl.com/docs-api/accessing-the-api/");
  });
});

// ============================================================================
// PART 2: Challenge R4 (Classification Provenance & Fallback)
// ============================================================================

describe("CHALLENGE R4: Classification Provenance & Fallback", () => {
  describe("1. Empty Documentation String Handling", () => {
    const emptyInputs = ["", "   ", "\n\t\r\n", "      \n   "];

    it("assigns 'baseline_fallback' and preserves catalog baseline for empty doc inputs across Direct, Hybrid, and OAuth apps", () => {
      const testCases = [
        {
          appName: "Supabase",
          websiteUrl: "https://supabase.com",
          catalogBaseline: {
            authPath: "direct_credential_only" as const,
            supportedAuthSchemes: ["API_KEY" as const],
            authDocUrl: "https://supabase.com/docs/guides/getting-started/api-keys",
          },
          expectedAuthPath: "direct_credential_only",
        },
        {
          appName: "GitLab",
          websiteUrl: "https://gitlab.com",
          catalogBaseline: {
            authPath: "hybrid_oauth_or_direct" as const,
            supportedAuthSchemes: ["OAUTH2" as const, "BEARER_TOKEN" as const],
            authDocUrl: "https://docs.gitlab.com/ee/api/oauth2.html",
          },
          expectedAuthPath: "hybrid_oauth_or_direct",
        },
        {
          appName: "Linear",
          websiteUrl: "https://linear.app",
          catalogBaseline: {
            authPath: "oauth_required" as const,
            supportedAuthSchemes: ["OAUTH2" as const],
            authDocUrl: "https://developers.linear.app/docs/oauth/authentication",
          },
          expectedAuthPath: "oauth_required",
        },
      ];

      for (const tc of testCases) {
        for (const emptyDoc of emptyInputs) {
          const guide = executeMode2Dynamic({
            appName: tc.appName,
            websiteUrl: tc.websiteUrl,
            docContent: emptyDoc,
            catalogBaseline: tc.catalogBaseline,
          });

          expect(guide.readinessSummary.authPathClassification).toBe(tc.expectedAuthPath);
          expect(guide.readinessSummary.classificationProvenance).toBe("baseline_fallback");
          expect(guide.readinessSummary.oneLineSummary).toContain("Baseline fallback");
          expect(guide.readinessSummary.oneLineSummary).toContain("preserving catalog baseline");
          expect(guide.readinessSummary.oneLineSummary).not.toContain("Evidence-based");

          // Invariant: investigationAnalysis reflects identical provenance
          expect(guide.investigationAnalysis?.classificationProvenance).toBe("baseline_fallback");
        }
      }
    });

    it("assigns 'baseline_fallback' and preserves provider registry baseline when catalog baseline is omitted but registry matches", () => {
      for (const emptyDoc of emptyInputs) {
        const guide = executeMode2Dynamic({
          appName: "Figma",
          websiteUrl: "https://www.figma.com",
          docContent: emptyDoc,
        });

        expect(guide.readinessSummary.authPathClassification).toBe("hybrid_oauth_or_direct");
        expect(guide.readinessSummary.classificationProvenance).toBe("baseline_fallback");
        expect(guide.readinessSummary.oneLineSummary).toContain("Baseline fallback");
        expect(guide.readinessSummary.oneLineSummary).toContain("retaining provider registry baseline");
        expect(guide.readinessSummary.oneLineSummary).not.toContain("Evidence-based");
      }
    });

    it("assigns 'undetermined' when doc is empty and neither baseline nor registry entry exists", () => {
      for (const emptyDoc of emptyInputs) {
        const guide = executeMode2Dynamic({
          appName: "TotallyUnknownMysteryApp99",
          websiteUrl: "https://mystery-app.example.com",
          docContent: emptyDoc,
        });

        expect(guide.readinessSummary.authPathClassification).toBe("undetermined");
        expect(guide.readinessSummary.classificationProvenance).toBe("undetermined");
        expect(guide.readinessSummary.oneLineSummary).toContain("Provisional undetermined");
        expect(guide.readinessSummary.oneLineSummary).not.toContain("Evidence-based");
        expect(guide.readinessSummary.oneLineSummary).not.toContain("Baseline fallback");
        expect(guide.supportedAuthSchemes.value).toEqual([]);
        expect(guide.authSpec.mode).toBe("undetermined");
      }
    });
  });

  describe("2. Marketing Copy with Zero Auth Evidence", () => {
    const marketingPages = [
      {
        title: "Terms and Privacy",
        doc: `
          <h1>Terms of Service</h1>
          <p>By using our service, you agree to these terms. Privacy policy applies.</p>
          <footer>Copyright 2026. All rights reserved. OAuth Status: Operational.</footer>
        `,
      },
      {
        title: "Social Logins & SSO Footer",
        doc: `
          <h1>Log In to Your Workspace</h1>
          <p>Welcome back! Choose your preferred login method:</p>
          <button>Sign in with Google</button>
          <button>Sign in with Apple</button>
          <button>Log in with OAuth</button>
          <p>Enterprise SSO available on higher tiers.</p>
        `,
      },
      {
        title: "Feature Landing Page",
        doc: `
          <h1>Scale Your Infrastructure</h1>
          <p>The developer-first cloud platform. Fast, reliable, and secure.</p>
          <p>Integrate with 100+ partner apps. Read our case studies and customer stories.</p>
          <a href="/pricing">View Pricing</a>
        `,
      },
      {
        title: "API Status Fluff",
        doc: `
          <h1>System Status</h1>
          <p>All systems operational. API uptime: 99.99%. OAuth status: Active.</p>
        `,
      },
    ];

    it("NEVER labels marketing copy as 'evidence_derived' - assigns 'baseline_fallback' when baseline provided", () => {
      for (const page of marketingPages) {
        const guide = executeMode2Dynamic({
          appName: "Supabase",
          websiteUrl: "https://supabase.com",
          docContent: page.doc,
          catalogBaseline: {
            authPath: "direct_credential_only",
            supportedAuthSchemes: ["API_KEY"],
            authDocUrl: "https://supabase.com/docs/guides/getting-started/api-keys",
          },
        });

        expect(guide.readinessSummary.authPathClassification).toBe("direct_credential_only");
        expect(guide.readinessSummary.classificationProvenance).toBe("baseline_fallback");
        expect(guide.readinessSummary.classificationProvenance).not.toBe("evidence_derived");
        expect(guide.readinessSummary.oneLineSummary).toContain("Baseline fallback");
        expect(guide.readinessSummary.oneLineSummary).not.toContain("Evidence-based");
        expect(guide.investigationAnalysis?.classificationProvenance).toBe("baseline_fallback");
      }
    });

    it("NEVER labels marketing copy as 'evidence_derived' - assigns 'undetermined' when ungrounded app has no baseline", () => {
      for (const page of marketingPages) {
        const guide = executeMode2Dynamic({
          appName: "AcmeUnlistedTool",
          websiteUrl: "https://acme-unlisted.example.com",
          docContent: page.doc,
        });

        expect(guide.readinessSummary.authPathClassification).toBe("undetermined");
        expect(guide.readinessSummary.classificationProvenance).toBe("undetermined");
        expect(guide.readinessSummary.classificationProvenance).not.toBe("evidence_derived");
        expect(guide.readinessSummary.oneLineSummary).toContain("Provisional undetermined");
        expect(guide.readinessSummary.oneLineSummary).not.toContain("Evidence-based");
        expect(guide.supportedAuthSchemes.value).toEqual([]);
      }
    });
  });

  describe("3. Official Documentation with Authentic Evidence", () => {
    it("assigns 'evidence_derived' and 'Evidence-based' summary for direct API key documentation (>= 80 chars)", () => {
      const directDocs = [
        "Authenticate all REST API requests by passing your API key in the Authorization: Bearer <key> header.",
        "Include your API token in the X-API-Key header with every authenticate call to our secure API endpoints.",
        "Data requests require your project API keys (anon and service_role). Pass in Authorization: Bearer <key>.",
      ];

      for (const doc of directDocs) {
        const guide = executeMode2Dynamic({
          appName: "CustomDirectApp",
          websiteUrl: "https://custom-direct.example.com",
          docContent: doc,
        });

        expect(guide.readinessSummary.authPathClassification).toBe("direct_credential_only");
        expect(guide.readinessSummary.classificationProvenance).toBe("evidence_derived");
        expect(guide.readinessSummary.oneLineSummary).toContain("Evidence-based");
        expect(guide.readinessSummary.oneLineSummary).toContain("verified against retrieved documentation");
        expect(guide.investigationAnalysis?.classificationProvenance).toBe("evidence_derived");
      }
    });

    it("identifies boundary behavior when authentic evidence is under 80 characters", () => {
      const shortEvidenceDoc = "Pass your API key in the X-API-Key header to authenticate.";
      expect(shortEvidenceDoc.length).toBeLessThan(80);

      const guide = executeMode2Dynamic({
        appName: "CustomDirectApp",
        websiteUrl: "https://custom-direct.example.com",
        docContent: shortEvidenceDoc,
      });

      // Provenance is correctly detected as evidence_derived from explicit direct regex
      expect(guide.readinessSummary.classificationProvenance).toBe("evidence_derived");
      expect(guide.readinessSummary.authPathClassification).toBe("direct_credential_only");

      // However, line 1087 gates 'Evidence-based' on rawText.trim().length >= 80
      // producing 'Provisional' summary despite evidence_derived provenance
      expect(guide.readinessSummary.oneLineSummary).toContain("Provisional");
    });

    it("assigns 'evidence_derived' and 'Evidence-based' summary for OAuth 2.0 documentation", () => {
      const oauthDocs = [
        "To authorize applications, direct users to https://api.example.com/oauth/authorize with client_id and redirect_uri. Exchange the authorization code at https://api.example.com/oauth/token with client_secret.",
        "Our API uses OAuth 2.0 authorization code grant flow. Register an OAuth application to obtain credentials.",
      ];

      for (const doc of oauthDocs) {
        const guide = executeMode2Dynamic({
          appName: "CustomOAuthApp",
          websiteUrl: "https://custom-oauth.example.com",
          docContent: doc,
        });

        expect(guide.readinessSummary.authPathClassification).toBe("oauth_required");
        expect(guide.readinessSummary.classificationProvenance).toBe("evidence_derived");
        expect(guide.readinessSummary.oneLineSummary).toContain("Evidence-based");
        expect(guide.readinessSummary.oneLineSummary).toContain("verified against retrieved documentation");
        expect(guide.investigationAnalysis?.classificationProvenance).toBe("evidence_derived");
      }
    });

    it("assigns 'evidence_derived' and 'Evidence-based' summary for Hybrid authentication documentation", () => {
      const hybridDoc = "Single-tenant internal scripts can authenticate using a Personal Access Token or private app token. Public multi-tenant integrations must use OAuth 2.0 authorization code flow.";

      const guide = executeMode2Dynamic({
        appName: "CustomHybridApp",
        websiteUrl: "https://custom-hybrid.example.com",
        docContent: hybridDoc,
      });

      expect(guide.readinessSummary.authPathClassification).toBe("hybrid_oauth_or_direct");
      expect(guide.readinessSummary.classificationProvenance).toBe("evidence_derived");
      expect(guide.readinessSummary.oneLineSummary).toContain("Evidence-based");
      expect(guide.readinessSummary.oneLineSummary).toContain("verified against retrieved documentation");
      expect(guide.investigationAnalysis?.classificationProvenance).toBe("evidence_derived");
    });

    it("assigns 'evidence_derived' when custom transport header is mentioned in docs for a registered provider", () => {
      // Figma custom header: X-Figma-Token
      const figmaDoc = "Execute API requests with your personal access token: curl -H 'X-Figma-Token: figd_123' https://api.figma.com/v1/me";
      const figmaGuide = executeMode2Dynamic({
        appName: "Figma",
        websiteUrl: "https://www.figma.com",
        docContent: figmaDoc,
      });
      expect(figmaGuide.readinessSummary.classificationProvenance).toBe("evidence_derived");
      expect(figmaGuide.readinessSummary.oneLineSummary).toContain("Evidence-based");

      // Postmark custom header: X-Postmark-Server-Token
      const postmarkDoc = "Send transactional emails by attaching X-Postmark-Server-Token: token_123 to your HTTP request.";
      const postmarkGuide = executeMode2Dynamic({
        appName: "Postmark",
        websiteUrl: "https://postmarkapp.com",
        docContent: postmarkDoc,
      });
      expect(postmarkGuide.readinessSummary.classificationProvenance).toBe("evidence_derived");
      expect(postmarkGuide.readinessSummary.oneLineSummary).toContain("Evidence-based");
    });
  });

  describe("4. Exhaustive 100-Catalog App Baseline Preservation Test", () => {
    it("preserves exact catalog baseline classification for all 100 catalog apps when doc is empty", () => {
      for (const app of CATALOG_100_APPS) {
        const guide = executeMode2Dynamic({
          appName: app.name,
          websiteUrl: app.websiteUrl,
          docContent: "",
          catalogBaseline: {
            authPath: app.authPath,
            supportedAuthSchemes: app.supportedAuthSchemes,
            authDocUrl: app.authDocUrl,
          },
        });

        // 1. Classification matches catalog baseline badge
        expect(guide.readinessSummary.authPathClassification).toBe(app.authPath);

        // 2. Provenance is strictly baseline_fallback
        expect(guide.readinessSummary.classificationProvenance).toBe("baseline_fallback");

        // 3. Summary indicates baseline fallback
        expect(guide.readinessSummary.oneLineSummary).toContain("Baseline fallback");
        expect(guide.readinessSummary.oneLineSummary).not.toContain("Evidence-based");

        // 4. Analysis provenance synchronized
        expect(guide.investigationAnalysis?.classificationProvenance).toBe("baseline_fallback");
      }
    });
  });
});
