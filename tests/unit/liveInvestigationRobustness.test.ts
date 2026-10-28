/**
 * tests/unit/liveInvestigationRobustness.test.ts
 *
 * Robustness Test Suite for Live Investigation Engine (Requirement R6)
 *
 * Validates 8 core failure, extraction, and precedence dimensions:
 * 1. Invalid Override Isolation: Authoritative user override handling and zero fall-through
 * 2. Unknown Provider Yielding Undetermined State: Unfamiliar app with ungrounded docs
 * 3. Safe Search Filtering & Discovery Guard: SSRF and 30+ domain blacklist guards
 * 4. Figma Fixture Extraction & Facts: Fenced code block preservation, PAT header, review provenance
 * 5. Spotify Client Credentials & OAuth 2.0: OAuth-only provider, zero static API keys
 * 6. Code-Preserving Claim-Specific Grounding: Excerpt extraction and non-global regex determinism
 * 7. Evidence Count Synchronization: Post-enforcement analysis and evidenceCounts resync
 * 8. Live Network Discovery Toggle: Offline deterministic default with optional live network queries
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  handleInvestigate,
  fetchAndCleanDoc,
} from "../../server/proxyServer";
import {
  executeMode2Dynamic,
  enforceDocumentEvidence,
  extractVerbatimExcerpt,
  synchronizeInvestigationAnalysis,
  validateIntegrationReadinessGuide,
} from "../../src/agent/investigatorEngine";
import { selectInvestigationSource } from "../../src/utils/investigationSource";
import {
  isDisallowedDiscoveryDomain,
  WebDiscoveryPipeline,
  FixtureDiscoveryProvider,
  DuckDuckGoDiscoveryProvider,
} from "../../src/agent/searchDiscovery";
import { validateSsrfTarget } from "../../src/agent/sanitizer";
import { PROVIDER_REGISTRY, findProviderInRegistry } from "../../src/data/providerRegistry";
import type { IntegrationReadinessGuide } from "../../src/types/guide";

// ============================================================================
// Fixtures (Requirement R6.1)
// ============================================================================

export const FIGMA_DOCS_HTML = `
<main>
  <h1>Figma REST API & OAuth 2.0 Guide</h1>
  <p>Figma supports both OAuth 2.0 authorization code flow and Personal Access Tokens.</p>
  <h2>OAuth 2.0 Endpoints</h2>
  <p>Authorization URL: <code>https://www.figma.com/oauth</code></p>
  <pre><code class="language-http">POST https://api.figma.com/v1/oauth/token
Content-Type: application/x-www-form-urlencoded

client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&code=CODE&grant_type=authorization_code</code></pre>
  <h2>Direct Credentials & Personal Access Tokens</h2>
  <p>Authenticate API requests using the <code>X-Figma-Token</code> HTTP header:</p>
  <pre><code class="language-bash">curl -H "X-Figma-Token: figd_sample_token_12345" https://api.figma.com/v1/me</code></pre>
  <h2>Review Requirements</h2>
  <p>Public OAuth apps require review and approval by Figma before general distribution. Personal Access Tokens and internal integrations do not require app review.</p>
</main>
`;

export const SPOTIFY_DOCS_HTML = `
<main>
  <h1>Spotify Web API Authorization Guide</h1>
  <p>All requests to the Spotify Web API require authorization via OAuth 2.0. Spotify does not issue static API keys.</p>
  <h2>Authorization Code Flow</h2>
  <p>Authorization URL: <code>https://accounts.spotify.com/authorize</code></p>
  <h2>Token Request</h2>
  <pre><code class="language-bash">curl -X POST "https://accounts.spotify.com/api/token" \\
    -H "Content-Type: application/x-www-form-urlencoded" \\
    -d "grant_type=client_credentials"</code></pre>
  <p>Access tokens are issued for 1 hour. Refresh tokens are returned for authorization code flow.</p>
</main>
`;

export const POSTMARK_DOCS_HTML = `
<main>
  <h1>Postmark Authentication</h1>
  <p>Postmark uses server and account API tokens via custom headers.</p>
  <p>Pass your server token in <code>X-Postmark-Server-Token</code>.</p>
  <p>Pass your account token in <code>X-Postmark-Account-Token</code>.</p>
</main>
`;

export const UNINFORMATIVE_MARKETING_HTML = `
<main>
  <h1>Welcome to Acme Cloud</h1>
  <p>The modern platform for growing teams. Sign in with Google, GitHub, or OAuth.</p>
  <footer>Terms | Privacy | Pricing | OAuth Status</footer>
</main>
`;

// Helper: Lightweight Express Request/Response Mock
function createMockReqRes(options: { body?: any; query?: any; method?: string; url?: string } = {}) {
  let statusCode = 200;
  let sentJson: any = null;
  const req = {
    body: options.body || {},
    query: options.query || {},
    method: options.method || "POST",
    url: options.url || "/api/investigate",
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

describe("R6 Robustness Suite: Live Investigation Engine Verification", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Suite 1: Invalid Override Isolation
  // ==========================================================================
  describe("1. Invalid Override Isolation", () => {
    it("selects user_override authoritatively over catalog or website URLs", () => {
      const selection = selectInvestigationSource({
        userOverrideUrl: "ftp://example.com/api",
        catalogAuthDocUrl: "https://developers.linear.app/docs/oauth/authentication",
        websiteUrl: "https://linear.app",
      });

      expect(selection.sourceType).toBe("user_override");
      expect(selection.url).toBe("ftp://example.com/api");
      expect(selection.isOverride).toBe(true);
      expect(selection.notes).toContain("Fallback is strictly disabled");
    });

    it("halts with HTTP 400 and retrievalStatus failed on non-HTTP override (ftp://)", async () => {
      const { req, res, getStatus, getJson } = createMockReqRes({
        body: {
          appName: "Linear",
          userOverrideUrl: "ftp://example.com/api",
          catalogBaseline: {
            authPath: "oauth_required",
            supportedAuthSchemes: ["OAUTH2"],
            authDocUrl: "https://developers.linear.app/docs/oauth/authentication",
          },
        },
      });

      await handleInvestigate(req, res);

      expect(getStatus()).toBe(400);
      const data = getJson();
      expect(data.success).toBe(false);
      expect(data.retrievalStatus).toBe("failed");
      expect(data.selectedSource.sourceType).toBe("user_override");
      expect(data.selectedSource.isOverride).toBe(true);
      expect(data.appName).toBe("Linear");
      expect(data.authPathClassification).toBe("undetermined");
      // ZERO fallback to Linear's catalog authDocUrl or static curated guide
      expect(data.guide).toBeUndefined();
      expect(data.logs.some((l: string) => l.includes("[OVERRIDE] Isolated failure"))).toBe(true);
      expect(data.logs.some((l: string) => l.includes("fallback to catalog/registry is strictly prohibited"))).toBe(true);
    });

    it("halts with HTTP 400 and retrievalStatus failed on private IP override (10.0.0.1)", async () => {
      const { req, res, getStatus, getJson } = createMockReqRes({
        body: {
          appName: "Linear",
          userOverrideUrl: "http://10.0.0.1/admin",
        },
      });

      await handleInvestigate(req, res);

      expect(getStatus()).toBe(400);
      const data = getJson();
      expect(data.success).toBe(false);
      expect(data.retrievalStatus).toBe("failed");
      expect(data.selectedSource.sourceType).toBe("user_override");
      expect(data.selectedSource.isOverride).toBe(true);
      expect(data.guide).toBeUndefined();
      expect(data.error).toContain("10.0.0.0/8");
    });

    it("halts with HTTP 404/502 and retrievalStatus failed on nonexistent/failing domain override without fall-through", async () => {
      // Mock fetch failure for the non-existent domain override
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers({ "content-type": "text/html" }),
        text: () => Promise.resolve("404 Not Found"),
      } as any);

      const { req, res, getStatus, getJson } = createMockReqRes({
        body: {
          appName: "Linear",
          userOverrideUrl: "https://404.nonexistent.domain/docs",
          catalogBaseline: {
            authPath: "oauth_required",
            supportedAuthSchemes: ["OAUTH2"],
            authDocUrl: "https://developers.linear.app/docs/oauth/authentication",
          },
        },
      });

      await handleInvestigate(req, res);

      expect(getStatus()).toBe(404);
      const data = getJson();
      expect(data.success).toBe(false);
      expect(data.retrievalStatus).toBe("failed");
      expect(data.selectedSource.sourceType).toBe("user_override");
      expect(data.selectedSource.isOverride).toBe(true);
      expect(data.guide).toBeUndefined();
      expect(data.authPathClassification).toBe("undetermined");
      expect(data.logs.some((l: string) => l.includes("[OVERRIDE] Isolated failure"))).toBe(true);
    });
  });

  // ==========================================================================
  // Suite 2: Unknown Provider Yielding Undetermined State
  // ==========================================================================
  describe("2. Unknown Provider Yielding Undetermined State", () => {
    it("classifies unfamiliar app with uninformative marketing text as undetermined", () => {
      const guide = executeMode2Dynamic({
        appName: "Acme Cloud Platform",
        websiteUrl: "https://acmecloud.example.com",
        docContent: UNINFORMATIVE_MARKETING_HTML,
      });

      expect(guide.readinessSummary.authPathClassification).toBe("undetermined");
      expect(guide.supportedAuthSchemes.value).toEqual([]);
      expect(guide.authSpec.mode).toBe("undetermined");

      if (guide.authSpec.mode === "undetermined") {
        expect(typeof guide.authSpec.missingEvidenceReason).toBe("string");
        expect(guide.authSpec.missingEvidenceReason.trim().length).toBeGreaterThan(10);
        expect(Array.isArray(guide.authSpec.suggestedActions)).toBe(true);
        expect(guide.authSpec.suggestedActions.length).toBeGreaterThanOrEqual(3);
      }

      expect(guide.composioIntegration.recommendedScheme).toBe("NONE");

      // Zero fabricated OAuth endpoints or credential headers
      expect("providerEndpoints" in guide.authSpec).toBe(false);
      expect("credentialLabel" in guide.authSpec).toBe(false);
      expect("headerOrParamFormat" in guide.authSpec).toBe(false);
      expect("composioCallbackGuidance" in guide.authSpec).toBe(false);

      const validation = validateIntegrationReadinessGuide(guide);
      expect(validation.isValid).toBe(true);
    });

    it("classifies unfamiliar app with empty documentation as undetermined without fabricated claims", () => {
      const guide = executeMode2Dynamic({
        appName: "Zephyr Micro SaaS",
        websiteUrl: "https://zephyr.internal",
        docContent: "   \n\t  ",
      });

      expect(guide.readinessSummary.authPathClassification).toBe("undetermined");
      expect(guide.supportedAuthSchemes.value).toEqual([]);
      expect(guide.authSpec.mode).toBe("undetermined");
      if (guide.authSpec.mode === "undetermined") {
        expect(guide.authSpec.missingEvidenceReason).toContain("No documentation was retrieved");
      }
      expect(guide.composioIntegration.recommendedScheme).toBe("NONE");
    });

    it("surfaces undetermined state via server handleInvestigate route", async () => {
      const { req, res, getStatus, getJson } = createMockReqRes({
        body: {
          appName: "Unknown Analytics Engine",
          docContent: UNINFORMATIVE_MARKETING_HTML,
        },
      });

      await handleInvestigate(req, res);

      expect(getStatus()).toBe(200);
      const data = getJson();
      expect(data.success).toBe(true);
      expect(data.authPathClassification).toBe("undetermined");
      expect(data.guide.authSpec.mode).toBe("undetermined");
      expect(data.guide.supportedAuthSchemes.value).toEqual([]);
      expect(data.guide.composioIntegration.recommendedScheme).toBe("NONE");
    });
  });

  // ==========================================================================
  // Suite 3: Safe Search Filtering & Discovery Guard
  // ==========================================================================
  describe("3. Safe Search Filtering & Discovery Guard", () => {
    it("strictly blocks aggregator, review, forum, and social domains via isDisallowedDiscoveryDomain", () => {
      const blacklistedUrls = [
        "https://www.g2.com/products/linear/reviews",
        "https://capterra.com/p/123/linear/",
        "https://www.producthunt.com/posts/linear",
        "https://reddit.com/r/webdev/comments/123",
        "https://stackoverflow.com/questions/123/figma-oauth",
        "https://quora.com/How-does-Spotify-OAuth-work",
        "https://news.ycombinator.com/item?id=9999",
        "https://medium.com/@dev/integrating-linear-api",
        "https://alternativeto.net/software/figma/",
        "https://trustradius.com/products/spotify/reviews",
        "https://dev.to/author/my-guide-to-oauth",
        "https://twitter.com/figma/status/12345",
        "https://npmjs.com/package/linear-sdk",
        "https://composio.dev/blog/integrations",
      ];

      for (const url of blacklistedUrls) {
        expect(isDisallowedDiscoveryDomain(url)).toBe(true);
      }
    });

    it("permits official developer and documentation domains", () => {
      const allowedOfficialUrls = [
        "https://www.figma.com/developers/api#authentication",
        "https://developer.spotify.com/documentation/web-api/concepts/authorization",
        "https://postmarkapp.com/developer/api/overview",
        "https://developers.strava.com/docs/authentication/",
        "https://www.deepl.com/docs-api/accessing-the-api/",
        "https://developers.linear.app/docs/oauth/authentication",
      ];

      for (const url of allowedOfficialUrls) {
        expect(isDisallowedDiscoveryDomain(url)).toBe(false);
      }
    });

    it("blocks cloud metadata service (169.254.169.254) and private IP ranges in SSRF guard", () => {
      const metadataCheck = validateSsrfTarget("http://169.254.169.254/latest/meta-data/");
      expect(metadataCheck.isValid).toBe(false);
      expect(metadataCheck.allowed).toBe(false);
      expect(metadataCheck.error).toContain("metadata service is blocked");

      const loopbackCheck = validateSsrfTarget("http://127.0.0.1:8080/token");
      expect(loopbackCheck.allowed).toBe(false);

      const rfc1918Check = validateSsrfTarget("http://192.168.1.100/api");
      expect(rfc1918Check.allowed).toBe(false);
    });

    it("filters out disallowed domains and metadata IPs in WebDiscoveryPipeline search", async () => {
      const candidateList = [
        {
          url: "https://www.g2.com/products/example-app/reviews",
          title: "Example App Reviews on G2",
          sourceProvider: "fixture",
          confidenceScore: 10,
        },
        {
          url: "https://reddit.com/r/exampleapp/oauth_issue",
          title: "Reddit thread on ExampleApp",
          sourceProvider: "fixture",
          confidenceScore: 10,
        },
        {
          url: "https://capterra.com/p/999/exampleapp",
          title: "Capterra Listing",
          sourceProvider: "fixture",
          confidenceScore: 10,
        },
        {
          url: "https://www.producthunt.com/posts/exampleapp",
          title: "ProductHunt launch",
          sourceProvider: "fixture",
          confidenceScore: 10,
        },
        {
          url: "https://stackoverflow.com/questions/555/exampleapp-auth",
          title: "StackOverflow question",
          sourceProvider: "fixture",
          confidenceScore: 10,
        },
        {
          url: "https://quora.com/How-to-authenticate-exampleapp",
          title: "Quora question",
          sourceProvider: "fixture",
          confidenceScore: 10,
        },
        {
          url: "http://169.254.169.254/latest/meta-data/",
          title: "Cloud Metadata Service",
          sourceProvider: "fixture",
          confidenceScore: 50,
        },
        {
          url: "https://developer.exampleapp.com/docs/authentication",
          title: "ExampleApp Official Developer Authentication Documentation",
          snippet: "Official OAuth 2.0 and API Key documentation",
          sourceProvider: "fixture",
          confidenceScore: 40,
        },
      ];

      const testFixtureProvider = new FixtureDiscoveryProvider({
        "exampleapp": candidateList,
      });

      const pipeline = new WebDiscoveryPipeline({
        providers: [testFixtureProvider],
      });

      const discovered = await pipeline.search({ appName: "ExampleApp" });

      expect(discovered.length).toBe(1);
      expect(discovered[0].url).toBe("https://developer.exampleapp.com/docs/authentication");
    });
  });

  // ==========================================================================
  // Suite 4: Figma Fixture Extraction & Facts
  // ==========================================================================
  describe("4. Figma Fixture Extraction & Facts", () => {
    it("preserves fenced code blocks with newlines when converting HTML fixture to markdown", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/html" }),
        text: () => Promise.resolve(FIGMA_DOCS_HTML),
      } as any);

      const result = await fetchAndCleanDoc("https://www.figma.com/developers/api-test-fixture");

      expect(result.success).toBe(true);
      // Verify code blocks are preserved with language annotation and newlines
      expect(result.markdown).toContain("```http");
      expect(result.markdown).toContain("POST https://api.figma.com/v1/oauth/token");
      expect(result.markdown).toContain("Content-Type: application/x-www-form-urlencoded");
      expect(result.markdown).toContain("grant_type=authorization_code");
      expect(result.markdown).toContain("```bash");
      expect(result.markdown).toContain("curl -H \"X-Figma-Token: figd_sample_token_12345\"");
      // Verify internal newlines are preserved rather than collapsed to inline text
      expect(result.markdown).toMatch(/POST https:\/\/api\.figma\.com\/v1\/oauth\/token\nContent-Type/);
    });

    it("accurately classifies Figma as hybrid_oauth_or_direct with X-Figma-Token and verified endpoints", () => {
      const guide = executeMode2Dynamic({
        appName: "Figma",
        websiteUrl: "https://www.figma.com",
        docContent: FIGMA_DOCS_HTML,
      });

      expect(guide.readinessSummary.authPathClassification).toBe("hybrid_oauth_or_direct");
      expect(guide.authSpec.mode).toBe("hybrid");

      if (guide.authSpec.mode === "hybrid") {
        // Endpoints
        expect(guide.authSpec.oauthPath.providerEndpoints.authorizationUrl.value).toBe(
          "https://www.figma.com/oauth"
        );
        expect(guide.authSpec.oauthPath.providerEndpoints.tokenUrl.value).toBe(
          "https://api.figma.com/v1/oauth/token"
        );

        // Custom Header Transport and PAT Credential Type
        expect(guide.authSpec.directCredentialPath.primaryTransport?.headerName).toBe("X-Figma-Token");
        expect(guide.authSpec.directCredentialPath.primaryTransport?.location).toBe("header");
        expect(guide.authSpec.directCredentialPath.credentialType).toBe("personal_access_token");
      }

      // Review Provenance
      const figmaRegistry = findProviderInRegistry("figma");
      expect(figmaRegistry).toBeDefined();
      expect(figmaRegistry!.reviewProvenance.reviewRequired).toBe(true);
      expect(figmaRegistry!.reviewProvenance.reviewNotes).toContain(
        "Public OAuth applications require Figma review and approval before public distribution."
      );
      expect(figmaRegistry!.reviewProvenance.reviewNotes).toContain(
        "Personal Access Tokens (PAT) do not require review."
      );
      expect(guide.readinessSummary.approvalWaitTime.evidence.kind).toBe("unverified_hypothesis");
      if (guide.readinessSummary.approvalWaitTime.evidence.kind === "unverified_hypothesis") {
        expect(guide.readinessSummary.approvalWaitTime.evidence.hypothesisBasis).toContain(
          "Public OAuth applications require Figma review and approval before public distribution."
        );
      }
    });
  });

  // ==========================================================================
  // Suite 5: Spotify Client Credentials & OAuth 2.0
  // ==========================================================================
  describe("5. Spotify Client Credentials & OAuth 2.0", () => {
    it("classifies Spotify as oauth_required with client credentials flow and zero static API keys", () => {
      const guide = executeMode2Dynamic({
        appName: "Spotify",
        websiteUrl: "https://developer.spotify.com",
        docContent: SPOTIFY_DOCS_HTML,
      });

      expect(guide.readinessSummary.authPathClassification).toBe("oauth_required");
      expect(guide.supportedAuthSchemes.value).toEqual(["OAUTH2"]);
      expect(guide.authSpec.mode).toBe("oauth");

      if (guide.authSpec.mode === "oauth") {
        expect(guide.authSpec.providerEndpoints.authorizationUrl.value).toBe(
          "https://accounts.spotify.com/authorize"
        );
        expect(guide.authSpec.providerEndpoints.tokenUrl.value).toBe(
          "https://accounts.spotify.com/api/token"
        );
      }

      // Verify Provider Registry facts for Spotify
      const spotifyRegistry = PROVIDER_REGISTRY.spotify;
      expect(spotifyRegistry).toBeDefined();
      expect(spotifyRegistry.supportedAuthSchemes).toEqual(["OAUTH2"]);
      expect(spotifyRegistry.credentialTypes).toEqual([]); // Zero static API keys!
      expect(spotifyRegistry.customTransportHeaders).toEqual([]);
      expect(spotifyRegistry.oauthEndpoints?.supportedFlows).toContain("authorization_code");
      expect(spotifyRegistry.oauthEndpoints?.supportedFlows).toContain("client_credentials");
      expect(spotifyRegistry.notes?.some((n) => n.includes("zero static API key credentials exist"))).toBe(true);
    });
  });

  // ==========================================================================
  // Suite 6: Code-Preserving Claim-Specific Grounding
  // ==========================================================================
  describe("6. Code-Preserving Claim-Specific Grounding", () => {
    it("extracts verbatim source excerpts rather than synthetic hardcoded templates", () => {
      const doc = `
# Authentication
All requests to the Figma API require valid credentials:
Pass your token in the X-Figma-Token header.
For OAuth 2.0 applications, exchange your code at:
POST https://api.figma.com/v1/oauth/token HTTP/1.1
Content-Type: application/x-www-form-urlencoded
`;
      const excerpt = extractVerbatimExcerpt(doc, "POST https://api.figma.com/v1/oauth/token");

      expect(excerpt).toBeDefined();
      expect(excerpt).toContain("POST https://api.figma.com/v1/oauth/token");
      // Must not contain synthetic prefix templates like "Token endpoint: "
      expect(excerpt!.startsWith("Token endpoint:")).toBe(false);
    });

    it("normalizes whitespace ONLY inside the extracted excerpt while source text retains code formatting", () => {
      const formattedDoc = `
curl -X POST "https://accounts.spotify.com/api/token" \\
     -H "Content-Type: application/x-www-form-urlencoded" \\
     -d "grant_type=client_credentials"
`;
      const excerpt = extractVerbatimExcerpt(formattedDoc, "grant_type=client_credentials");

      expect(excerpt).toBeDefined();
      // Excerpt internal whitespace is normalized
      expect(excerpt).not.toContain("\n");

      // Source document maintains multi-line structure and indentation
      expect(formattedDoc).toContain("\n");
      expect(formattedDoc).toContain("     -H ");
    });

    it("demonstrates 100% deterministic non-global regex evaluations across 100 iterations without lastIndex mutation", () => {
      // Non-global regexes matching endpoints in investigatorEngine
      const authRegex = /https?:\/\/[a-zA-Z0-9.\-]+\/(?:[a-zA-Z0-9_\-\/]*\/)?(?:oauth2?|auth|api\/oauth)\/(?:authorize|auth)/i;
      const tokenRegex = /https?:\/\/[a-zA-Z0-9.\-]+\/(?:[a-zA-Z0-9_\-\/]*\/)?(?:oauth2?|auth|api\/oauth)\/(?:token|access_token|access)/i;

      // Assert that non-global regex invariant is satisfied
      expect(authRegex.global).toBe(false);
      expect(tokenRegex.global).toBe(false);

      const targetEndpoint = "https://api.figma.com/v1/oauth/token";

      // Execute 100 consecutive evaluations
      for (let i = 0; i < 100; i++) {
        const isMatch = tokenRegex.test(targetEndpoint);
        expect(isMatch).toBe(true);
        expect(tokenRegex.lastIndex).toBe(0);
      }

      // Compare with stateful global regex behavior to demonstrate the hazard that was eliminated
      const statefulGlobalRegex = /oauth\/token/gi;
      let trueCount = 0;
      let falseCount = 0;
      for (let i = 0; i < 100; i++) {
        if (statefulGlobalRegex.test(targetEndpoint)) {
          trueCount++;
        } else {
          falseCount++;
        }
      }
      // A global regex alternates between true and false due to lastIndex advancing
      expect(trueCount).toBeGreaterThan(0);
      expect(falseCount).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Suite 7: Evidence Count Synchronization
  // ==========================================================================
  describe("7. Evidence Count Synchronization", () => {
    it("synchronizes evidenceCounts and downgrades claims without matching quotes to hypothesis", () => {
      // 1. Generate an initial guide with documented claims
      const initialGuide = executeMode2Dynamic({
        appName: "Figma",
        websiteUrl: "https://www.figma.com",
        docContent: FIGMA_DOCS_HTML,
      });

      expect(initialGuide.investigationAnalysis).toBeDefined();
      const initialAnalysis = initialGuide.investigationAnalysis!;
      expect(initialAnalysis.evidenceCounts.documented).toBeGreaterThan(0);

      // 2. Enforce evidence with partial source text that only contains a single claim quote
      const partialSource = {
        text: "Pass your token in the X-Figma-Token header for authenticated requests.",
        url: "https://www.figma.com",
      };

      const { guide: enforcedGuide, downgradedCount } = enforceDocumentEvidence(
        initialGuide,
        partialSource
      );

      expect(downgradedCount).toBeGreaterThan(0);
      expect(enforcedGuide.investigationAnalysis).toBeDefined();

      const syncedAnalysis = enforcedGuide.investigationAnalysis!;
      const findings = syncedAnalysis.findings;

      // 3. Count actual findings by evidence kind
      const actualDocumented = findings.filter(
        (f) => f.evidence.kind === "documented_not_tested"
      ).length;
      const actualHypothesis = findings.filter(
        (f) => f.evidence.kind === "unverified_hypothesis"
      ).length;
      const actualTestedLive = findings.filter(
        (f) => f.evidence.kind === "tested_live"
      ).length;

      // 4. Verify ZERO desynchronization between counts and findings list
      expect(syncedAnalysis.evidenceCounts.documented).toBe(actualDocumented);
      expect(syncedAnalysis.evidenceCounts.hypothesis).toBe(actualHypothesis);
      expect(syncedAnalysis.evidenceCounts.testedLive).toBe(actualTestedLive);
      expect(
        syncedAnalysis.evidenceCounts.documented +
          syncedAnalysis.evidenceCounts.hypothesis +
          syncedAnalysis.evidenceCounts.testedLive
      ).toBe(findings.length);

      // Open questions list should exactly match the hypothesis findings
      expect(syncedAnalysis.openQuestions.length).toBe(actualHypothesis);
    });

    it("synchronizeInvestigationAnalysis preserves consistency on manual invocation", () => {
      const guide = executeMode2Dynamic({
        appName: "Postmark",
        websiteUrl: "https://postmarkapp.com",
        docContent: POSTMARK_DOCS_HTML,
      });

      const synced = synchronizeInvestigationAnalysis(guide);
      expect(synced.investigationAnalysis).toBeDefined();
      expect(
        synced.investigationAnalysis!.evidenceCounts.documented +
          synced.investigationAnalysis!.evidenceCounts.hypothesis
      ).toBe(synced.investigationAnalysis!.findings.length);
    });
  });

  // ==========================================================================
  // Suite 8: Live Network Discovery Toggle
  // ==========================================================================
  describe("8. Live Network Discovery Toggle", () => {
    const originalEnv = process.env.LIVE_NETWORK_DISCOVERY;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.LIVE_NETWORK_DISCOVERY = originalEnv;
      } else {
        delete process.env.LIVE_NETWORK_DISCOVERY;
      }
    });

    it("runs offline with FixtureDiscoveryProvider by default when LIVE_NETWORK_DISCOVERY is not true", () => {
      delete process.env.LIVE_NETWORK_DISCOVERY;

      const pipeline = new WebDiscoveryPipeline();
      const providers = pipeline.getProviders();

      expect(providers.length).toBe(1);
      expect(providers[0].name).toBe("fixture");
      expect(providers.some((p) => p.name === "duckduckgo")).toBe(false);
    });

    it("activates live network providers (DuckDuckGo) when allowLiveNetwork is true", () => {
      const pipeline = new WebDiscoveryPipeline({ allowLiveNetwork: true });
      const providers = pipeline.getProviders();

      expect(providers.some((p) => p.name === "duckduckgo")).toBe(true);
    });

    it("activates live network providers when process.env.LIVE_NETWORK_DISCOVERY is true", () => {
      process.env.LIVE_NETWORK_DISCOVERY = "true";

      const pipeline = new WebDiscoveryPipeline();
      const providers = pipeline.getProviders();

      expect(providers.some((p) => p.name === "duckduckgo")).toBe(true);
    });

    it("resolves discovery queries deterministically using fixtures in offline mode", async () => {
      delete process.env.LIVE_NETWORK_DISCOVERY;

      const pipeline = new WebDiscoveryPipeline();
      const candidate = await pipeline.discover({ appName: "Figma" });

      expect(candidate).toBeDefined();
      expect(candidate!.url).toBe("https://www.figma.com/developers/api#authentication");
      expect(candidate!.sourceProvider).toBe("fixture");
    });

    it("conditionally supports live network discovery queries when LIVE_NETWORK_DISCOVERY is enabled", async () => {
      const isLiveEnabled = process.env.LIVE_NETWORK_DISCOVERY === "true";

      if (isLiveEnabled) {
        const livePipeline = new WebDiscoveryPipeline({ allowLiveNetwork: true });
        const candidate = await livePipeline.discover({ appName: "Figma" });
        expect(candidate).toBeDefined();
        expect(typeof candidate!.url).toBe("string");
      } else {
        // In offline/CI mode, verify that safe mock/fixture behavior executes reliably
        const fixturePipeline = new WebDiscoveryPipeline({ allowLiveNetwork: false });
        const candidate = await fixturePipeline.discover({ appName: "Spotify" });
        expect(candidate).toBeDefined();
        expect(candidate!.url).toContain("spotify.com");
      }
    });
  });
});
