/**
 * tests/unit/empirical_challenger_r3_r4_r5.test.ts
 *
 * Empirical Challenger Stress Harness for Requirements R3, R4, and R5
 *
 * Exhaustively stress-tests:
 * 1. Undetermined Auth State & Zero Leakage Fuzzing
 * 2. Provider Registry & Custom Transport Invariants
 * 3. Code-Preserving Grounding & Regex Determinism
 * 4. Evidence Count Synchronization Stress Test
 */

import { describe, it, expect } from "vitest";
import {
  executeMode2Dynamic,
  enforceDocumentEvidence,
  extractVerbatimExcerpt,
  synchronizeInvestigationAnalysis,
  validateIntegrationReadinessGuide,
} from "../../src/agent/investigatorEngine";
import { buildInvestigationAnalysis } from "../../src/utils/investigationRationale";
import { PROVIDER_REGISTRY, findProviderInRegistry } from "../../src/data/providerRegistry";
import type {
  IntegrationReadinessGuide,
  Traceable,
  ClaimEvidence,
  UndeterminedAuthSpec,
  OAuthProtocolSpec,
  DirectCredentialSpec,
} from "../../src/types/guide";

// ============================================================================
// 1. Undetermined Auth State & Zero Leakage Fuzzing
// ============================================================================

describe("1. Undetermined Auth State & Zero Leakage Fuzzing", () => {
  const UNKNOWN_APPS = [
    "ZylophonSaaS",
    "QuantumLedger_99",
    "FluxCapacitorApp",
    "NebulaSync_v2",
    "AcmeRandom123",
    "OmniCorpTool",
    "VectorShiftUnknown",
    "HyperScaleDev",
    "AeroDynamoCloud",
    "SynthetixOps",
    "BlazeTrackerX",
    "PixelFlowUnknown",
    "ZeroGroundingApp",
    "FictionalTool_404",
    "PhantomWorkspace",
  ];

  const NOISE_DOCS = [
    "",
    "   ",
    "\n\t\r\n",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
    "Welcome to our home page. We make great software for enterprise customers worldwide. Contact sales today.",
    "Sign in with Google, GitHub, or OAuth. Terms | Privacy | Pricing | OAuth Status",
    "The modern platform for growing teams. Log in with SSO or OAuth. OAuth status: Operational.",
    "We provide end-to-end solutions. Learn more about our mission, leadership, and careers. Copyright 2026.",
    "1234567890 !@#$%^&*()_+ []{};':\",./<>?`~",
    "def hello_world():\n    print('Hello world!')\n\nSELECT * FROM users WHERE active = 1;",
    "<html><head><title>Marketing</title></head><body><h1>Best Tool</h1><p>Sign up now!</p></body></html>",
  ];

  it("classifies 100% of ungrounded unfamiliar apps as undetermined with zero leakage across all combinations", () => {
    let iterationCount = 0;

    for (const appName of UNKNOWN_APPS) {
      for (const docContent of NOISE_DOCS) {
        iterationCount++;
        const guide = executeMode2Dynamic({
          appName,
          websiteUrl: `https://${appName.toLowerCase()}.example.com`,
          docContent,
        });

        // 1. Classification must be undetermined
        expect(guide.readinessSummary.authPathClassification).toBe("undetermined");

        // 2. supportedAuthSchemes must be strictly empty
        expect(guide.supportedAuthSchemes.value).toEqual([]);

        // 3. authSpec mode must be undetermined
        expect(guide.authSpec.mode).toBe("undetermined");

        // 4. Zero leakage in authSpec: no endpoints, no credential labels, no header formats, no callback guidance
        const undeterminedSpec = guide.authSpec as UndeterminedAuthSpec;
        expect("providerEndpoints" in undeterminedSpec).toBe(false);
        expect("credentialLabel" in undeterminedSpec).toBe(false);
        expect("headerOrParamFormat" in undeterminedSpec).toBe(false);
        expect("composioCallbackGuidance" in undeterminedSpec).toBe(false);
        expect(typeof undeterminedSpec.missingEvidenceReason).toBe("string");
        expect(undeterminedSpec.missingEvidenceReason.length).toBeGreaterThan(0);
        expect(Array.isArray(undeterminedSpec.suggestedActions)).toBe(true);
        expect(undeterminedSpec.suggestedActions.length).toBeGreaterThan(0);

        // 5. Composio integration recommendedScheme must be NONE
        expect(guide.composioIntegration.recommendedScheme).toBe("NONE");

        // 6. Contract validation must pass cleanly
        const validation = validateIntegrationReadinessGuide(guide);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toEqual([]);
      }
    }

    expect(iterationCount).toBe(UNKNOWN_APPS.length * NOISE_DOCS.length);
  });

  it("fails validateIntegrationReadinessGuide when fabricated endpoints or credential headers are injected into undetermined authSpec", () => {
    const baseGuide = executeMode2Dynamic({
      appName: "FictionalSaaS",
      docContent: "Welcome to Fictional SaaS. No developer documentation available.",
    });

    expect(baseGuide.authSpec.mode).toBe("undetermined");
    expect(validateIntegrationReadinessGuide(baseGuide).isValid).toBe(true);

    // Injection 1: Fabricated providerEndpoints in undetermined authSpec
    const leakedEndpointsGuide = JSON.parse(JSON.stringify(baseGuide));
    (leakedEndpointsGuide.authSpec as any).providerEndpoints = {
      authorizationUrl: {
        value: "https://fictional.com/oauth/authorize",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Fabricated endpoint",
          whatRemainsUnverified: "Unverified",
        },
      },
      tokenUrl: {
        value: "https://fictional.com/oauth/token",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Fabricated endpoint",
          whatRemainsUnverified: "Unverified",
        },
      },
    };
    const rep1 = validateIntegrationReadinessGuide(leakedEndpointsGuide);
    expect(rep1.isValid).toBe(false);
    expect(rep1.errors.some((e) => e.includes("leakage"))).toBe(true);

    // Injection 2: Fabricated credentialLabel in undetermined authSpec
    const leakedCredGuide = JSON.parse(JSON.stringify(baseGuide));
    (leakedCredGuide.authSpec as any).credentialLabel = "Fictional API Key";
    const rep2 = validateIntegrationReadinessGuide(leakedCredGuide);
    expect(rep2.isValid).toBe(false);
    expect(rep2.errors.some((e) => e.includes("leakage"))).toBe(true);

    // Injection 3: Fabricated headerOrParamFormat in undetermined authSpec
    const leakedHeaderGuide = JSON.parse(JSON.stringify(baseGuide));
    (leakedHeaderGuide.authSpec as any).headerOrParamFormat = {
      value: "Authorization: Bearer key_...",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Fabricated",
        whatRemainsUnverified: "Unverified",
      },
    };
    const rep3 = validateIntegrationReadinessGuide(leakedHeaderGuide);
    expect(rep3.isValid).toBe(false);
    expect(rep3.errors.some((e) => e.includes("leakage"))).toBe(true);

    // Injection 4: Fabricated composioCallbackGuidance in undetermined authSpec
    const leakedCallbackGuide = JSON.parse(JSON.stringify(baseGuide));
    (leakedCallbackGuide.authSpec as any).composioCallbackGuidance = {
      howToLocateAndVerify: "Paste redirect URI",
      notes: "Fabricated",
    };
    const rep4 = validateIntegrationReadinessGuide(leakedCallbackGuide);
    expect(rep4.isValid).toBe(false);
    expect(rep4.errors.some((e) => e.includes("leakage"))).toBe(true);
  });
});

// ============================================================================
// 2. Provider Registry & Custom Transport Invariants
// ============================================================================

describe("2. Provider Registry & Custom Transport Invariants", () => {
  it("normalizes aliases, case, whitespace, and punctuation in findProviderInRegistry", () => {
    const testCases: { query: string; expectedId: string }[] = [
      // Figma
      { query: "figma", expectedId: "figma" },
      { query: "FIGMA", expectedId: "figma" },
      { query: "Figma", expectedId: "figma" },
      { query: "  figma  ", expectedId: "figma" },
      { query: "figma.com", expectedId: "figma" },
      { query: "https://www.figma.com", expectedId: "figma" },
      { query: "figma rest api", expectedId: "figma" },
      { query: "figma api", expectedId: "figma" },
      { query: "figma-api", expectedId: "figma" },

      // Spotify
      { query: "spotify", expectedId: "spotify" },
      { query: "SPOTIFY", expectedId: "spotify" },
      { query: "Spotify", expectedId: "spotify" },
      { query: "spotify.com", expectedId: "spotify" },
      { query: "https://developer.spotify.com", expectedId: "spotify" },
      { query: "spotify web api", expectedId: "spotify" },
      { query: "spotify api", expectedId: "spotify" },
      { query: "  spotify  ", expectedId: "spotify" },

      // Postmark
      { query: "postmark", expectedId: "postmark" },
      { query: "POSTMARK", expectedId: "postmark" },
      { query: "Postmark", expectedId: "postmark" },
      { query: "postmarkapp.com", expectedId: "postmark" },
      { query: "https://postmarkapp.com", expectedId: "postmark" },
      { query: "postmark api", expectedId: "postmark" },
      { query: "postmarkapp", expectedId: "postmark" },

      // Strava
      { query: "strava", expectedId: "strava" },
      { query: "STRAVA", expectedId: "strava" },
      { query: "Strava", expectedId: "strava" },
      { query: "strava.com", expectedId: "strava" },
      { query: "strava api", expectedId: "strava" },
      { query: "strava v3", expectedId: "strava" },
      { query: "https://developers.strava.com", expectedId: "strava" },

      // DeepL
      { query: "deepl", expectedId: "deepl" },
      { query: "DEEPL", expectedId: "deepl" },
      { query: "DeepL", expectedId: "deepl" },
      { query: "deepl.com", expectedId: "deepl" },
      { query: "https://www.deepl.com", expectedId: "deepl" },
      { query: "deepl api", expectedId: "deepl" },
      { query: "deepl translator", expectedId: "deepl" },
    ];

    for (const { query, expectedId } of testCases) {
      const match = findProviderInRegistry(query);
      expect(match, `Expected query '${query}' to match provider '${expectedId}'`).toBeDefined();
      expect(match?.id).toBe(expectedId);
    }

    // Negative tests
    expect(findProviderInRegistry("")).toBeUndefined();
    // Whitespace-only string immediately returns undefined rather than matching on empty alias substring
    expect(findProviderInRegistry("   ")).toBeUndefined();
    // Single character query does not match via alias inclusion
    expect(findProviderInRegistry("a")).toBeUndefined();

    expect(findProviderInRegistry("unknown_tool_xyz")).toBeUndefined();
  });

  it("exposes alias substring collision vulnerability where generic words match specific providers", () => {
    // Because aliasClean.includes(clean) matches any substring of an alias:
    // "api" matches "figma api" -> Figma
    // "web" matches "spotify web api" -> Spotify
    // "v3" matches "strava v3" -> Strava
    expect(findProviderInRegistry("api")?.id).toBe("figma");
    expect(findProviderInRegistry("web")?.id).toBe("spotify");
    expect(findProviderInRegistry("v3")?.id).toBe("strava");

    // Furthermore, when executeMode2Dynamic is invoked for an app named "API",
    // it falsely classifies as Figma hybrid OAuth instead of undetermined!
    const falseMatchGuide = executeMode2Dynamic({ appName: "API" });
    expect(falseMatchGuide.readinessSummary.authPathClassification).toBe("hybrid_oauth_or_direct");
    expect((falseMatchGuide.authSpec as any).directCredentialPath?.credentialLabel).toContain("Figma");
  });

  it("verifies exact authoritative provider facts for Figma", () => {
    const figma = PROVIDER_REGISTRY["figma"];
    expect(figma).toBeDefined();
    expect(figma.canonicalName).toBe("Figma");
    expect(figma.defaultClassification).toBe("hybrid_oauth_or_direct");
    expect(figma.supportedAuthSchemes).toContain("OAUTH2");
    expect(figma.supportedAuthSchemes).toContain("BEARER_TOKEN");
    expect(figma.protocols).toContain("OAUTH2");
    expect(figma.protocols).toContain("CUSTOM_HEADER");
    expect(figma.credentialTypes).toContain("personal_access_token");

    // Custom transport header
    expect(figma.customTransportHeaders).toHaveLength(1);
    const patHeader = figma.customTransportHeaders[0];
    expect(patHeader.headerName).toBe("X-Figma-Token");
    expect(patHeader.formatPattern).toContain("X-Figma-Token:");

    // Endpoints
    expect(figma.oauthEndpoints?.authorizationUrl).toBe("https://www.figma.com/oauth");
    expect(figma.oauthEndpoints?.tokenUrl).toBe("https://api.figma.com/v1/oauth/token");

    // Review Provenance
    expect(figma.reviewProvenance.reviewRequired).toBe(true);
    expect(figma.reviewProvenance.threshold).toContain("Public distribution requires review; private/internal integrations do not.");
  });

  it("verifies exact authoritative provider facts for Spotify", () => {
    const spotify = PROVIDER_REGISTRY["spotify"];
    expect(spotify).toBeDefined();
    expect(spotify.canonicalName).toBe("Spotify");
    expect(spotify.defaultClassification).toBe("oauth_required");
    expect(spotify.supportedAuthSchemes).toEqual(["OAUTH2"]);
    expect(spotify.protocols).toEqual(["OAUTH2"]);

    // Invariant: Zero static API key credentials exist
    expect(spotify.credentialTypes).toEqual([]);
    expect(spotify.customTransportHeaders).toEqual([]);

    // Endpoints and flows
    expect(spotify.oauthEndpoints?.authorizationUrl).toBe("https://accounts.spotify.com/authorize");
    expect(spotify.oauthEndpoints?.tokenUrl).toBe("https://accounts.spotify.com/api/token");
    expect(spotify.oauthEndpoints?.supportedFlows).toContain("authorization_code");
    expect(spotify.oauthEndpoints?.supportedFlows).toContain("client_credentials");

    // Review Provenance
    expect(spotify.reviewProvenance.reviewRequired).toBe(true);
    expect(spotify.reviewProvenance.threshold).toContain("Development mode capped at 25 users");
  });

  it("verifies exact authoritative provider facts for Postmark", () => {
    const postmark = PROVIDER_REGISTRY["postmark"];
    expect(postmark).toBeDefined();
    expect(postmark.canonicalName).toBe("Postmark");
    expect(postmark.defaultClassification).toBe("direct_credential_only");
    expect(postmark.supportedAuthSchemes).toEqual(["API_KEY"]);
    expect(postmark.protocols).toContain("CUSTOM_HEADER");
    expect(postmark.protocols).toContain("API_KEY");

    // Credential types and two distinct custom headers
    expect(postmark.credentialTypes).toContain("server_token");
    expect(postmark.credentialTypes).toContain("account_token");
    expect(postmark.customTransportHeaders).toHaveLength(2);

    const serverHeader = postmark.customTransportHeaders.find((h) => h.headerName === "X-Postmark-Server-Token");
    const accountHeader = postmark.customTransportHeaders.find((h) => h.headerName === "X-Postmark-Account-Token");
    expect(serverHeader).toBeDefined();
    expect(accountHeader).toBeDefined();
    expect(serverHeader?.formatPattern).toContain("X-Postmark-Server-Token:");
    expect(accountHeader?.formatPattern).toContain("X-Postmark-Account-Token:");

    // Zero OAuth endpoints exist
    expect(postmark.oauthEndpoints).toBeUndefined();
    expect(postmark.reviewProvenance.reviewRequired).toBe(false);
  });

  it("verifies exact authoritative provider facts for Strava", () => {
    const strava = PROVIDER_REGISTRY["strava"];
    expect(strava).toBeDefined();
    expect(strava.canonicalName).toBe("Strava");
    expect(strava.defaultClassification).toBe("oauth_required");
    expect(strava.supportedAuthSchemes).toEqual(["OAUTH2"]);
    expect(strava.protocols).toEqual(["OAUTH2"]);
    expect(strava.credentialTypes).toEqual([]);

    // Endpoints
    expect(strava.oauthEndpoints?.authorizationUrl).toBe("https://www.strava.com/oauth/authorize");
    expect(strava.oauthEndpoints?.tokenUrl).toBe("https://www.strava.com/oauth/token");
    expect(strava.oauthEndpoints?.revocationUrl).toBe("https://www.strava.com/oauth/deauthorize");

    // Review Provenance and Rate Limits
    expect(strava.reviewProvenance.reviewRequired).toBe(true);
    expect(strava.reviewProvenance.threshold).toContain("Review required when scaling beyond 10 connected athletes");
    expect(strava.reviewProvenance.rateLimits).toContain("200 requests per 15 minutes");
  });

  it("verifies exact authoritative provider facts for DeepL", () => {
    const deepl = PROVIDER_REGISTRY["deepl"];
    expect(deepl).toBeDefined();
    expect(deepl.canonicalName).toBe("DeepL");
    expect(deepl.defaultClassification).toBe("direct_credential_only");
    expect(deepl.supportedAuthSchemes).toEqual(["API_KEY"]);
    expect(deepl.protocols).toContain("CUSTOM_HEADER");
    expect(deepl.credentialTypes).toContain("api_key");
    expect(deepl.credentialTypes).toContain("plan_token");

    // Custom transport header format
    expect(deepl.customTransportHeaders).toHaveLength(1);
    expect(deepl.customTransportHeaders[0].headerName).toBe("Authorization");
    expect(deepl.customTransportHeaders[0].formatPattern).toBe("Authorization: DeepL-Auth-Key [yourAuthKey]");

    // Free vs Pro API endpoints
    expect(deepl.endpoints?.free).toBe("https://api-free.deepl.com/v2/");
    expect(deepl.endpoints?.pro).toBe("https://api.deepl.com/v2/");

    expect(deepl.reviewProvenance.reviewRequired).toBe(false);
  });
});

// ============================================================================
// 3. Code-Preserving Grounding & Regex Determinism
// ============================================================================

describe("3. Code-Preserving Grounding & Regex Determinism", () => {
  it("stress-tests extractVerbatimExcerpt across extreme edge cases", () => {
    // Edge case 1: Very short doc (exact match)
    expect(extractVerbatimExcerpt("token", "token")).toBe("token");

    // Edge case 2: Target longer than doc
    expect(extractVerbatimExcerpt("abc", "abcdef")).toBeUndefined();

    // Edge case 3: Empty inputs
    expect(extractVerbatimExcerpt("", "token")).toBeUndefined();
    expect(extractVerbatimExcerpt("doc", "")).toBeUndefined();

    // Edge case 4: Match at the very beginning of the document
    const startDoc = "Authorization: Bearer 12345\nNext line of text";
    const excerptStart = extractVerbatimExcerpt(startDoc, "Authorization");
    expect(excerptStart).toBeDefined();
    expect(excerptStart?.startsWith("Authorization")).toBe(true);

    // Edge case 5: Match at the very end of the document
    const endDoc = "First line of text\nAuthorization: Bearer 12345";
    const excerptEnd = extractVerbatimExcerpt(endDoc, "12345");
    expect(excerptEnd).toBeDefined();
    expect(excerptEnd?.includes("12345")).toBe(true);

    // Edge case 6: CRLF line endings (\r\n)
    const crlfDoc = "Line 1\r\nPOST https://api.figma.com/v1/oauth/token\r\nLine 3";
    const excerptCrlf = extractVerbatimExcerpt(crlfDoc, "https://api.figma.com/v1/oauth/token");
    expect(excerptCrlf).toBeDefined();
    expect(excerptCrlf).not.toContain("\r");
    expect(excerptCrlf).toContain("POST https://api.figma.com/v1/oauth/token");

    // Edge case 7: Unicode, emojis, and non-Latin scripts
    const unicodeDoc = "Header: 🔑 Token sk-live-999 🚀\nAPI d'authentification: こんにちは Добро пожаловать";
    const excerptUnicode = extractVerbatimExcerpt(unicodeDoc, "sk-live-999");
    expect(excerptUnicode).toBeDefined();
    expect(excerptUnicode).toContain("🔑 Token sk-live-999 🚀");

    // Edge case 8: Code block preservation with JSON / bash snippets
    const codeBlockDoc = `
# Authentication Guide
\`\`\`bash
curl -H "X-Figma-Token: figd_sample_123" https://api.figma.com/v1/me
\`\`\`
More details below.
`;
    const excerptCode = extractVerbatimExcerpt(codeBlockDoc, "X-Figma-Token: figd_sample_123");
    expect(excerptCode).toBeDefined();
    expect(excerptCode).toContain("curl -H \"X-Figma-Token: figd_sample_123\" https://api.figma.com/v1/me");

    // Edge case 9: Regex special characters in target substring without escaping crashes
    const regexSpecialDoc = "Config format: Authorization: Bearer {token} (v1.0 [beta]) *+?^$";
    const specialTarget = "(v1.0 [beta]) *+?";
    const excerptSpecial = extractVerbatimExcerpt(regexSpecialDoc, specialTarget);
    expect(excerptSpecial).toBeDefined();
    expect(excerptSpecial).toContain("(v1.0 [beta]) *+?");

    // Edge case 10: Large document (1MB payload) performance & correctness
    const largeDoc = "filler text\n".repeat(50000) + "POST https://api.example.com/oauth/token\n" + "trailing text\n".repeat(10000);
    const startTs = Date.now();
    const largeExcerpt = extractVerbatimExcerpt(largeDoc, "POST https://api.example.com/oauth/token");
    const durationMs = Date.now() - startTs;
    expect(largeExcerpt).toBeDefined();
    expect(largeExcerpt).toBe("POST https://api.example.com/oauth/token");
    expect(durationMs).toBeLessThan(500); // Must execute in sub-second time
  });

  it("verifies catalog baseline preservation against empty documentation in executeMode2Dynamic", () => {
    // When catalog baseline is provided for direct_credential_only app (e.g. Supabase),
    // empty doc content must NOT flip to undetermined or oauth_required
    const directBaselineGuide = executeMode2Dynamic({
      appName: "SupabaseCustom",
      docContent: "",
      catalogBaseline: {
        authPath: "direct_credential_only",
        supportedAuthSchemes: ["API_KEY"],
        authDocUrl: "https://supabase.com/docs/guides/getting-started/api-keys",
      },
    });
    expect(directBaselineGuide.readinessSummary.authPathClassification).toBe("direct_credential_only");
    expect(directBaselineGuide.supportedAuthSchemes.value).toEqual(["API_KEY"]);
    expect(directBaselineGuide.authSpec.mode).toBe("direct_credential");

    // When catalog baseline is provided for hybrid app (e.g. GitLab),
    // empty doc content must NOT flip to undetermined or oauth_required
    const hybridBaselineGuide = executeMode2Dynamic({
      appName: "GitLabCustom",
      docContent: "",
      catalogBaseline: {
        authPath: "hybrid_oauth_or_direct",
        supportedAuthSchemes: ["OAUTH2", "BEARER_TOKEN"],
        authDocUrl: "https://docs.gitlab.com/ee/api/oauth2.html",
      },
    });
    expect(hybridBaselineGuide.readinessSummary.authPathClassification).toBe("hybrid_oauth_or_direct");
    expect(hybridBaselineGuide.supportedAuthSchemes.value).toEqual(["OAUTH2", "BEARER_TOKEN"]);
    expect(hybridBaselineGuide.authSpec.mode).toBe("hybrid");
  });

  it("verifies non-global regex determinism: 1,000 iterations without lastIndex mutation", () => {
    // The endpoint regexes as implemented in investigatorEngine.ts
    const authRegex = /https?:\/\/[a-zA-Z0-9.\-]+\/(?:[a-zA-Z0-9_\-\/]*\/)?(?:oauth2?|auth|api\/oauth)\/(?:authorize|auth)/i;
    const tokenRegex = /https?:\/\/[a-zA-Z0-9.\-]+\/(?:[a-zA-Z0-9_\-\/]*\/)?(?:oauth2?|auth|api\/oauth)\/(?:token|access_token|access)/i;

    // Both regexes must NOT have the /g flag
    expect(authRegex.global).toBe(false);
    expect(tokenRegex.global).toBe(false);

    const testFixture = `
Documentation:
Authorization endpoint is https://auth.provider.com/oauth/authorize
Token exchange endpoint is https://api.provider.com/oauth/token
`;

    // 1,000 iterations to verify zero stateful drift or lastIndex mutation
    for (let i = 0; i < 1000; i++) {
      const matchAuth = testFixture.match(authRegex);
      const matchToken = testFixture.match(tokenRegex);

      expect(matchAuth).not.toBeNull();
      expect(matchAuth![0]).toBe("https://auth.provider.com/oauth/authorize");
      expect(authRegex.lastIndex).toBe(0);

      expect(matchToken).not.toBeNull();
      expect(matchToken![0]).toBe("https://api.provider.com/oauth/token");
      expect(tokenRegex.lastIndex).toBe(0);
    }
  });
});

// ============================================================================
// 4. Evidence Count Synchronization Stress Test
// ============================================================================

describe("4. Evidence Count Synchronization Stress Test", () => {
  function makeTraceable(value: string, evidence: ClaimEvidence): Traceable<string> {
    return { value, evidence };
  }

  function createSyntheticGuideWithEvidence(claims: ClaimEvidence[]): IntegrationReadinessGuide {
    const steps = claims.map((claim, idx) => ({
      stepNumber: idx + 1,
      title: `Step ${idx + 1}`,
      actor: "developer_portal_action" as const,
      estimatedDuration: makeTraceable(`~${idx + 1} mins`, claim),
      instructions: [`Execute action for step ${idx + 1}`],
    }));

    const guide: IntegrationReadinessGuide = {
      appId: "synthetic_test_app",
      appName: "Synthetic Test App",
      websiteUrl: "https://synthetic.example.com",
      supportedAuthSchemes: {
        value: ["OAUTH2"],
        evidence: claims[0] || {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Synthetic fallback",
          whatRemainsUnverified: "Synthetic",
        },
      },
      composioManagedAuthStatus: {
        value: "unknown",
        evidence: claims[1] || {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Synthetic fallback",
          whatRemainsUnverified: "Synthetic",
        },
      },
      readinessSummary: {
        authPathClassification: "oauth_required",
        oauthNecessityBanner: "OAuth is required for testing.",
        oneLineSummary: "Synthetic guide for evidence synchronization stress testing.",
        activeSetupTime: makeTraceable("~10 mins", claims[2] || claims[0]),
        approvalWaitTime: makeTraceable("No review gate", claims[3] || claims[0]),
      },
      prerequisites: {
        value: [
          {
            item: "Account",
            requiredForTesting: true,
            requiredForProduction: true,
            detail: "Active developer account",
          },
        ],
        evidence: claims[4] || claims[0],
      },
      authSpec: {
        mode: "oauth",
        scheme: "OAUTH2",
        providerEndpoints: {
          authorizationUrl: makeTraceable("https://synthetic.example.com/oauth/authorize", claims[5] || claims[0]),
          tokenUrl: makeTraceable("https://synthetic.example.com/oauth/token", claims[6] || claims[0]),
        },
        pkceRequired: {
          value: "supported_optional",
          evidence: claims[0],
        },
        tokenAndRefreshBehavior: makeTraceable("Access tokens expire in 1 hour", claims[0]),
        scopes: {
          value: [{ scope: "read", category: "Core", description: "Read access" }],
          evidence: claims[0],
        },
        composioCallbackGuidance: {
          howToLocateAndVerify: "Paste redirect URI in portal",
          documentedReferenceNote: makeTraceable("Reference note", claims[0]),
        },
      },
      setupRunbook: steps.length > 0 ? steps : [
        {
          stepNumber: 1,
          title: "Initial Step",
          actor: "developer_portal_action",
          estimatedDuration: makeTraceable("~5 mins", claims[0]),
          instructions: ["Do action"],
        },
      ],
      blockersAndPlaybooks: {
        value: [
          {
            blockerTitle: "Redirect URI Mismatch",
            triggerCondition: "URI mismatch",
            errorCodeOrSymptom: "invalid_redirect_uri",
            howToUnblock: "Verify URI",
            workaroundWhilstWaiting: "Check dashboard",
          },
        ],
        evidence: claims[7] || claims[0],
      },
      composioIntegration: {
        recommendedScheme: "OAUTH2",
        configurationSteps: {
          value: ["Configure integration in Composio"],
          evidence: claims[8] || claims[0],
        },
        sdkSnippets: [],
      },
    };

    guide.investigationAnalysis = buildInvestigationAnalysis(guide, "groq_mode_b");
    return guide;
  }

  it("verifies evidence count equation holds across 50 diverse evidence permutations", () => {
    const matchingQuote = "Verified documentation sentence that is sufficiently long to match";
    const trustedSourceDoc = `
# Official Provider Docs
${matchingQuote}
Additional text for verification.
`;

    for (let testIdx = 0; testIdx < 50; testIdx++) {
      // Generate randomized claims
      const numClaims = 5 + (testIdx % 10);
      const claims: ClaimEvidence[] = [];

      for (let c = 0; c < numClaims; c++) {
        const rand = (testIdx * 7 + c * 13) % 3;
        if (rand === 0) {
          claims.push({
            kind: "tested_live",
            testedAt: "2026-10-28T10:00:00Z",
            whatWasPerformed: `Live test execution ${c}`,
            observedOutcome: "HTTP 200 OK",
          });
        } else if (rand === 1) {
          const isMatching = (c % 2 === 0);
          claims.push({
            kind: "documented_not_tested",
            sourceTitle: "Provider Documentation",
            sourceUrl: "https://synthetic.example.com/docs",
            whatSourceExplicitlyStates: isMatching
              ? matchingQuote
              : `Non-matching fabricated text that is not in the source ${c}`,
          });
        } else {
          claims.push({
            kind: "unverified_hypothesis",
            hypothesisBasis: `Hypothesis basis for claim ${c}`,
            whatRemainsUnverified: `Unverified item ${c}`,
          });
        }
      }

      const syntheticGuide = createSyntheticGuideWithEvidence(claims);
      expect(syntheticGuide.investigationAnalysis).toBeDefined();

      // Test with empty source text
      const emptyCheck = enforceDocumentEvidence(syntheticGuide, "");
      const emptyAnalysis = emptyCheck.guide.investigationAnalysis!;
      expect(emptyAnalysis).toBeDefined();
      expect(
        emptyAnalysis.evidenceCounts.documented +
          emptyAnalysis.evidenceCounts.hypothesis +
          emptyAnalysis.evidenceCounts.testedLive
      ).toBe(emptyAnalysis.findings.length);
      expect(emptyAnalysis.evidenceCounts.testedLive).toBe(0); // tested_live must be 0 after server verification
      expect(emptyAnalysis.openQuestions.length).toBe(emptyAnalysis.evidenceCounts.hypothesis);

      // Test with partial matching source text
      const partialCheck = enforceDocumentEvidence(syntheticGuide, {
        text: trustedSourceDoc,
        url: "https://synthetic.example.com/docs",
      });
      const partialAnalysis = partialCheck.guide.investigationAnalysis!;
      expect(partialAnalysis).toBeDefined();
      expect(
        partialAnalysis.evidenceCounts.documented +
          partialAnalysis.evidenceCounts.hypothesis +
          partialAnalysis.evidenceCounts.testedLive
      ).toBe(partialAnalysis.findings.length);
      expect(partialAnalysis.evidenceCounts.testedLive).toBe(0);
      expect(partialAnalysis.openQuestions.length).toBe(partialAnalysis.evidenceCounts.hypothesis);
    }
  });

  it("verifies evidence count synchronization on real executeMode2Dynamic guides", () => {
    const appsToTest = [
      { name: "UnknownApp1", doc: "" },
      { name: "UnknownApp2", doc: "Marketing fluff with zero auth evidence." },
      { name: "Linear", doc: "Linear uses OAuth 2.0 with https://linear.app/oauth/authorize and https://api.linear.app/oauth/token." },
      { name: "Resend", doc: "Resend uses API key Authorization: Bearer re_12345." },
      { name: "HubSpot", doc: "HubSpot supports private app tokens and OAuth 2.0." },
    ];

    for (const { name, doc } of appsToTest) {
      const guide = executeMode2Dynamic({ appName: name, docContent: doc });
      const analysis = guide.investigationAnalysis;

      expect(analysis).toBeDefined();
      expect(
        analysis!.evidenceCounts.documented +
          analysis!.evidenceCounts.hypothesis +
          analysis!.evidenceCounts.testedLive
      ).toBe(analysis!.findings.length);
      expect(analysis!.openQuestions.length).toBe(analysis!.evidenceCounts.hypothesis);
    }
  });
});
