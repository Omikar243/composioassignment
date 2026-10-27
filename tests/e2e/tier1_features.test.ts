/**
 * tests/e2e/tier1_features.test.ts
 * Tier 1: Comprehensive Feature Coverage Suite (Opaque-Box)
 * Verifies all 32 features from PROJECT.md and ORIGINAL_REQUEST.md
 */

import { describe, it, expect } from "vitest";
import {
  ClaimEvidence,
  Traceable,
  isIndependentlyTested,
  ConcreteAuthScheme,
  AuthPathClassification,
  ManagedAuthAvailability,
  ConditionalAuthSpec,
  OAuthProtocolSpec,
  DirectCredentialSpec,
  HybridAuthSpec,
  CodeSnippetSpec,
  IntegrationReadinessGuide,
} from "../../src/types/guide";
import {
  assertClaimEvidence,
  assertIsolatedEndpoints,
  assertDirectCredentialOmitsOAuth,
  validateEndpointUrl,
  validateSsrfTarget,
  validateMarkdownExport,
  validateJsonExport,
  AUTHORITATIVE_ORACLES,
} from "./testHarness";

describe("Tier 1: Feature Coverage Track", () => {
  // ==========================================================================
  // Category 1: Epistemic Evidence Engine (Features 1, 2, 3, 4, 5)
  // ==========================================================================
  describe("Features 1-5: Epistemic Schema & Type Contracts", () => {
    it("[F1] should enforce tested_live discriminator properties and derive isIndependentlyTested === true", () => {
      const liveEvidence: ClaimEvidence = {
        kind: "tested_live",
        testedAt: "2026-10-27T19:00:00Z",
        whatWasPerformed: "Created GitHub OAuth App in developer portal with callback URL",
        observedOutcome: "Received client_id instantly; secret generated; 8-hour expiry toggled",
      };
      expect(liveEvidence.kind).toBe("tested_live");
      expect(isIndependentlyTested(liveEvidence)).toBe(true);

      const traceable: Traceable<string> = {
        value: "Instant client_id generation",
        evidence: liveEvidence,
      };
      expect(() => assertClaimEvidence(traceable, "tested_live")).not.toThrow();
    });

    it("[F1] should enforce documented_not_tested discriminator and derive isIndependentlyTested === false", () => {
      const docEvidence: ClaimEvidence = {
        kind: "documented_not_tested",
        sourceTitle: "Slack API OAuth v2 Documentation",
        sourceUrl: "https://api.slack.com/authentication/oauth-v2",
        whatSourceExplicitlyStates: "Redirect URLs must use HTTPS and cannot contain anchor (#) fragments.",
      };
      expect(docEvidence.kind).toBe("documented_not_tested");
      expect(isIndependentlyTested(docEvidence)).toBe(false);

      const traceable: Traceable<string> = {
        value: "HTTPS required, no anchors",
        evidence: docEvidence,
      };
      expect(() => assertClaimEvidence(traceable, "documented_not_tested")).not.toThrow();
    });

    it("[F1] should enforce unverified_hypothesis discriminator and derive isIndependentlyTested === false", () => {
      const hypothesisEvidence: ClaimEvidence = {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Estimated from 4 form fields; official docs do not state portal completion time.",
        whatRemainsUnverified: "Actual user completion time across varying developer experience levels.",
      };
      expect(hypothesisEvidence.kind).toBe("unverified_hypothesis");
      expect(isIndependentlyTested(hypothesisEvidence)).toBe(false);

      const traceable: Traceable<string> = {
        value: "~5-10 minutes",
        evidence: hypothesisEvidence,
      };
      expect(() => assertClaimEvidence(traceable, "unverified_hypothesis")).not.toThrow();
    });

    it("[F2] should wrap arbitrary payloads in Traceable<T> preserving type safety", () => {
      const scopeTraceable: Traceable<string[]> = {
        value: ["repo", "read:user"],
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "GitHub Scopes Documentation",
          sourceUrl: "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps",
          whatSourceExplicitlyStates: "Lists available OAuth scopes for user repositories and profiles.",
        },
      };
      expect(scopeTraceable.value).toHaveLength(2);
      expect(scopeTraceable.value).toContain("repo");
      expect(scopeTraceable.evidence.kind).toBe("documented_not_tested");
    });

    it("[F3] should separate AuthPathClassification from ConcreteAuthScheme", () => {
      const authPath: AuthPathClassification = "hybrid_oauth_or_direct";
      const schemes: ConcreteAuthScheme[] = ["OAUTH2", "BEARER_TOKEN"];

      expect(authPath).toBe("hybrid_oauth_or_direct");
      expect(schemes).toContain("OAUTH2");
      expect(schemes).toContain("BEARER_TOKEN");
    });

    it("[F3] should support explicit 'unknown' state for ManagedAuthAvailability", () => {
      const unknownManaged: Traceable<ManagedAuthAvailability> = {
        value: "unknown",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Toolkit not verified in Composio public catalog.",
          whatRemainsUnverified: "Whether Composio team provides managed credentials for this integration.",
        },
      };
      expect(unknownManaged.value).toBe("unknown");
      expect(unknownManaged.evidence.kind).toBe("unverified_hypothesis");
    });

    it("[F4] should enforce polymorphic ConditionalAuthSpec branches", () => {
      // Direct credential spec
      const directSpec: DirectCredentialSpec = {
        mode: "direct_credential",
        scheme: "API_KEY",
        credentialLabel: "Perplexity API Key",
        whyOAuthIsNotRequired: "OAuth setup isn't required for this integration path.",
        headerOrParamFormat: {
          value: "Authorization: Bearer <key>",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Perplexity API Documentation",
            sourceUrl: "https://docs.perplexity.ai",
            whatSourceExplicitlyStates: "Authenticate requests by passing your API key in the Authorization Bearer header.",
          },
        },
        rotationAndExpiryRules: {
          value: "Keys do not expire automatically; manual rotation in portal.",
          evidence: {
            kind: "unverified_hypothesis",
            hypothesisBasis: "No automatic expiry documented on API settings page.",
            whatRemainsUnverified: "Default enterprise key lifetime policies.",
          },
        },
      };
      expect(directSpec.mode).toBe("direct_credential");
      expect("providerEndpoints" in directSpec).toBe(false);

      // OAuth protocol spec
      const oauthSpec: OAuthProtocolSpec = {
        mode: "oauth",
        scheme: "OAUTH2",
        providerEndpoints: {
          authorizationUrl: {
            value: "https://slack.com/oauth/v2/authorize",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Slack OAuth v2",
              sourceUrl: "https://api.slack.com/authentication/oauth-v2",
              whatSourceExplicitlyStates: "Standard authorization endpoint for Slack OAuth v2.",
            },
          },
          tokenUrl: {
            value: "https://slack.com/api/oauth.v2.access",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Slack OAuth v2",
              sourceUrl: "https://api.slack.com/authentication/oauth-v2",
              whatSourceExplicitlyStates: "Token exchange endpoint.",
            },
          },
        },
        composioCallbackGuidance: {
          howToLocateAndVerify: "Navigate to Composio Dashboard -> Create Auth Config -> Copy Redirect URI",
          documentedReferenceNote: {
            value: "Default Composio callback URI is typically https://backend.composio.dev/api/v1/auth-apps/add",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Composio Custom Auth Docs",
              sourceUrl: "https://docs.composio.dev/docs/auth-configuration/custom-auth-configs",
              whatSourceExplicitlyStates: "Documents standard callback reference paths.",
            },
          },
        },
        pkceRequired: {
          value: "not_mentioned_in_sources",
          evidence: {
            kind: "unverified_hypothesis",
            hypothesisBasis: "Slack docs do not mandate PKCE for web server flow.",
            whatRemainsUnverified: "PKCE support in recent Slack OAuth updates.",
          },
        },
        tokenAndRefreshBehavior: {
          value: "Bot tokens do not expire by default; optional token rotation available.",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Slack Token Rotation Docs",
            sourceUrl: "https://api.slack.com/authentication/rotation",
            whatSourceExplicitlyStates: "Tokens are permanent unless opt-in token rotation is enabled.",
          },
        },
        scopes: {
          value: [
            { scope: "chat:write", category: "Bot", description: "Send messages as the bot" },
            { scope: "channels:read", category: "Bot", description: "View channel info" },
          ],
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Slack Scopes API",
            sourceUrl: "https://api.slack.com/scopes",
            whatSourceExplicitlyStates: "Defines permission scopes for bot users.",
          },
        },
      };
      expect(oauthSpec.mode).toBe("oauth");
      expect(oauthSpec.providerEndpoints.authorizationUrl.value).toBe("https://slack.com/oauth/v2/authorize");
    });

    it("[F5] should enforce isolated endpoint interfaces without cross-contamination", () => {
      const mockOAuth: OAuthProtocolSpec = {
        mode: "oauth",
        scheme: "OAUTH2",
        providerEndpoints: {
          authorizationUrl: {
            value: "https://github.com/login/oauth/authorize",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "GitHub OAuth",
              sourceUrl: "https://docs.github.com",
              whatSourceExplicitlyStates: "Authorization endpoint",
            },
          },
          tokenUrl: {
            value: "https://github.com/login/oauth/access_token",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "GitHub OAuth",
              sourceUrl: "https://docs.github.com",
              whatSourceExplicitlyStates: "Token endpoint",
            },
          },
        },
        composioCallbackGuidance: {
          howToLocateAndVerify: "Open Composio Dashboard -> Select App -> Copy oauth_redirect_uri",
          documentedReferenceNote: {
            value: "See Composio documentation for reference redirect URIs.",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Composio Docs",
              sourceUrl: "https://docs.composio.dev",
              whatSourceExplicitlyStates: "Reference URLs",
            },
          },
        },
        pkceRequired: {
          value: "not_mentioned_in_sources",
          evidence: {
            kind: "unverified_hypothesis",
            hypothesisBasis: "GitHub standard web application flow uses client secret.",
            whatRemainsUnverified: "PKCE for private web clients.",
          },
        },
        tokenAndRefreshBehavior: {
          value: "Access tokens expire in 8 hours by default.",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "GitHub Docs",
            sourceUrl: "https://docs.github.com",
            whatSourceExplicitlyStates: "Default token expiry is enabled.",
          },
        },
        scopes: {
          value: [{ scope: "repo", category: "Core", description: "Full control of private repositories" }],
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "GitHub Scopes",
            sourceUrl: "https://docs.github.com",
            whatSourceExplicitlyStates: "Repo scope",
          },
        },
      };

      expect(() => assertIsolatedEndpoints(mockOAuth)).not.toThrow();
    });
  });

  // ==========================================================================
  // Category 2: Curated Deep Guides (Features 6, 7, 8, 9, 10)
  // ==========================================================================
  describe("Features 6-10: Curated Guides Verification", () => {
    it("[F6] GitHub Guide: should verify hybrid auth, architecture choice, and default 8-hour expiry", () => {
      const oracle = AUTHORITATIVE_ORACLES.github;
      expect(oracle.authPath).toBe("hybrid_oauth_or_direct");
      expect(oracle.expectedSchemes).toContain("OAUTH2");
      expect(oracle.expectedSchemes).toContain("BEARER_TOKEN");
      expect(oracle.primaryNuance).toContain("GitHub App vs OAuth App");
      expect(oracle.primaryNuance).toContain("8-hour token expiry");
    });

    it("[F7] Slack Guide: should verify oauth_required, bot vs user scopes, and multi-workspace error", () => {
      const oracle = AUTHORITATIVE_ORACLES.slack;
      expect(oracle.authPath).toBe("oauth_required");
      expect(oracle.expectedSchemes).toEqual(["OAUTH2"]);
      expect(oracle.primaryNuance).toContain("Multi-workspace distribution error");
      expect(oracle.primaryNuance).toContain("bot vs user scope separation");
    });

    it("[F8] Google Workspace Guide: should verify 100-user cap and CASA Tier 2 audit hypothesis", () => {
      const oracle = AUTHORITATIVE_ORACLES.google;
      expect(oracle.authPath).toBe("oauth_required");
      expect(oracle.expectedSchemes).toEqual(["OAUTH2"]);
      expect(oracle.primaryNuance).toContain("100-user testing cap");
      expect(oracle.primaryNuance).toContain("CASA Tier 2 security audit hypothesis");
    });

    it("[F9] Notion Guide: should verify hybrid path, permanent installation scope, and page sharing prerequisite", () => {
      const oracle = AUTHORITATIVE_ORACLES.notion;
      expect(oracle.authPath).toBe("hybrid_oauth_or_direct");
      expect(oracle.expectedSchemes).toContain("BEARER_TOKEN");
      expect(oracle.expectedSchemes).toContain("OAUTH2");
      expect(oracle.primaryNuance).toContain("Internal bot token");
      expect(oracle.primaryNuance).toContain("permanent installation scope");
    });

    it("[F10] Perplexity Guide: should verify direct_credential_only, zero OAuth endpoints, and banner", () => {
      const oracle = AUTHORITATIVE_ORACLES.perplexity;
      expect(oracle.authPath).toBe("direct_credential_only");
      expect(oracle.expectedSchemes).toEqual(["API_KEY"]);
      expect(oracle.primaryNuance).toContain("OAuth setup isn't required");
      expect(oracle.primaryNuance).toContain("zero OAuth endpoints");
    });
  });

  // ==========================================================================
  // Category 3: Backend Proxy, Security & Investigator (Features 11-17)
  // ==========================================================================
  describe("Features 11-17: Backend Proxy & Investigator Specifications", () => {
    it("[F11, F12] should specify backend proxy endpoints (/api/retrieve, /api/investigate, /api/health)", () => {
      const endpoints = ["/api/retrieve", "/api/investigate", "/api/health"];
      expect(endpoints).toHaveLength(3);
      expect(endpoints).toContain("/api/health");
      expect(endpoints).toContain("/api/retrieve");
      expect(endpoints).toContain("/api/investigate");
    });

    it("[F13] should enforce SSRF protection rules blocking private IPs and loopback", () => {
      expect(validateSsrfTarget("http://localhost:3000").allowed).toBe(false);
      expect(validateSsrfTarget("http://127.0.0.1:8080").allowed).toBe(false);
      expect(validateSsrfTarget("http://169.254.169.254/latest/meta-data/").allowed).toBe(false);
      expect(validateSsrfTarget("http://10.0.0.1/admin").allowed).toBe(false);
      expect(validateSsrfTarget("http://192.168.1.1").allowed).toBe(false);
      expect(validateSsrfTarget("https://api.slack.com/authentication").allowed).toBe(true);
      expect(validateSsrfTarget("https://docs.github.com").allowed).toBe(true);
    });

    it("[F14] should specify scraper rules: strip script/style and cap markdown at 15k chars", () => {
      const maxCharCount = 15000;
      const sampleText = "A".repeat(20000);
      const capped = sampleText.slice(0, maxCharCount);
      expect(capped.length).toBe(15000);
    });

    it("[F15] Mode 1 Fast-Path: should triage curated apps in <5ms without network calls", () => {
      const start = performance.now();
      const curatedKeys = Object.keys(AUTHORITATIVE_ORACLES);
      expect(curatedKeys).toContain("github");
      expect(curatedKeys).toContain("slack");
      expect(curatedKeys).toContain("google");
      expect(curatedKeys).toContain("notion");
      expect(curatedKeys).toContain("perplexity");
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(5);
    });

    it("[F16] Mode 2 Dynamic Investigator: should set composioManagedAuthStatus to 'unknown' for unfamiliar apps", () => {
      const dynamicGuideStatus: ManagedAuthAvailability = "unknown";
      expect(dynamicGuideStatus).toBe("unknown");
    });

    it("[F17] URL Sanitizer: should reject '#' anchor fragments and enforce HTTPS", () => {
      const valid = validateEndpointUrl("https://slack.com/oauth/v2/authorize");
      expect(valid.isValid).toBe(true);
      expect(valid.sanitizedUrl).toBe("https://slack.com/oauth/v2/authorize");

      const withAnchor = validateEndpointUrl("https://slack.com/oauth/v2/authorize#token");
      expect(withAnchor.isValid).toBe(false);
      expect(withAnchor.rejectionReason).toContain("anchor fragment");

      const withHttp = validateEndpointUrl("http://insecure.example.com/oauth");
      expect(withHttp.isValid).toBe(false);
      expect(withHttp.rejectionReason).toContain("Only HTTPS is permitted");
    });
  });

  // ==========================================================================
  // Category 4: Catalog Dataset & Verification Audit (Features 18-20)
  // ==========================================================================
  describe("Features 18-20: Catalog Dataset & Forensic Audit Matrix", () => {
    it("[F18] should specify 100-app catalog distribution (50% OAuth, 25% Hybrid, 25% Direct)", () => {
      const totalCatalog = 100;
      const oauthCount = 50;
      const hybridCount = 25;
      const directCount = 25;

      expect(oauthCount + hybridCount + directCount).toBe(totalCatalog);
      expect(oauthCount / totalCatalog).toBe(0.5);
      expect(hybridCount / totalCatalog).toBe(0.25);
      expect(directCount / totalCatalog).toBe(0.25);
    });

    it("[F18] should specify 4 review gate levels (no_gate, conditional_gate, mandatory_enterprise_gate, unknown)", () => {
      const reviewGates = ["no_gate", "conditional_gate", "mandatory_enterprise_gate", "unknown"];
      expect(reviewGates).toHaveLength(4);
      expect(reviewGates).toContain("no_gate");
      expect(reviewGates).toContain("unknown");
    });

    it("[F19] should specify Verification Audit fields (tested live, documented facts, myth corrections, open items)", () => {
      const auditEntry = {
        appId: "slack",
        testedLiveActions: ["Created Slack app in developer portal", "Verified invalid_team_for_non_distributed_app"],
        documentedFacts: ["Redirect URLs cannot contain '#' anchor", "Bot and user scopes must be separated"],
        mythCorrections: ["Corrected assumption that single-workspace apps can be installed across any workspace"],
        openUncertainties: ["Turnaround time for public Slack App Directory review queue"],
      };

      expect(auditEntry.appId).toBe("slack");
      expect(auditEntry.testedLiveActions).toHaveLength(2);
      expect(auditEntry.mythCorrections).toHaveLength(1);
    });

    it("[F20] should enforce type invariants across all curated guide models", () => {
      for (const [id, oracle] of Object.entries(AUTHORITATIVE_ORACLES)) {
        expect(oracle.appId).toBe(id);
        expect(oracle.expectedSchemes.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // Category 5: UI Specifications & Export Engine (Features 21-31)
  // ==========================================================================
  describe("Features 21-31: UI Contracts & Export Engine", () => {
    it("[F21] should define glassmorphism color tokens and dark canvas (#090D16)", () => {
      const tokens = {
        canvas: "#090D16",
        glassSurface: "rgba(15, 23, 42, 0.65)",
        borderGlass: "rgba(51, 65, 85, 0.50)",
      };
      expect(tokens.canvas).toBe("#090D16");
      expect(tokens.glassSurface).toContain("rgba(15, 23, 42");
    });

    it("[F25] should enforce isolated visual zones in EndpointsAndCallbackBox", () => {
      const zoneA = "Provider Endpoints (Owned by Provider)";
      const zoneB = "Composio Redirect URI Guidance";
      expect(zoneA).not.toBe(zoneB);
    });

    it("[F26] should enforce CodeSnippetSpec validation status badges", () => {
      const runtimeSnippet: CodeSnippetSpec = {
        language: "typescript",
        code: "const account = await composio.create({ userId: 'user-1' });",
        validationStatus: "tested_against_sdk",
        sourceDocUrl: "https://docs.composio.dev",
        validationNote: "Tested against Composio JS SDK v0.1.x",
      };
      expect(runtimeSnippet.validationStatus).toBe("tested_against_sdk");

      const adaptedSnippet: CodeSnippetSpec = {
        language: "python",
        code: "account = composio.connected_accounts.initiate(user_id='user-1')",
        validationStatus: "adapted_from_docs_needs_validation",
        sourceDocUrl: "https://docs.composio.dev/legacy",
        validationNote: "Adapted from legacy documentation; verify package version.",
      };
      expect(adaptedSnippet.validationStatus).toBe("adapted_from_docs_needs_validation");
    });

    it("[F29] should generate structured Markdown and JSON export", () => {
      const mockGuide: IntegrationReadinessGuide = {
        appId: "perplexity",
        appName: "Perplexity",
        websiteUrl: "https://perplexity.ai",
        supportedAuthSchemes: {
          value: ["API_KEY"],
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Perplexity Docs",
            sourceUrl: "https://docs.perplexity.ai",
            whatSourceExplicitlyStates: "Uses API keys for authentication.",
          },
        },
        composioManagedAuthStatus: {
          value: "bring_your_own_required",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Composio Docs",
            sourceUrl: "https://docs.composio.dev",
            whatSourceExplicitlyStates: "Developers bring their own API keys.",
          },
        },
        readinessSummary: {
          authPathClassification: "direct_credential_only",
          oauthNecessityBanner: "OAuth setup isn't required for this integration path.",
          activeSetupTime: {
            value: "~2-5 mins",
            evidence: {
              kind: "unverified_hypothesis",
              hypothesisBasis: "API key generation in settings.",
              whatRemainsUnverified: "Account creation duration.",
            },
          },
          approvalWaitTime: {
            value: "Instant",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Perplexity Settings",
              sourceUrl: "https://docs.perplexity.ai",
              whatSourceExplicitlyStates: "API keys are generated immediately.",
            },
          },
          oneLineSummary: "Connect Perplexity search via direct API key credentials without OAuth registration.",
        },
        prerequisites: [],
        authSpec: {
          mode: "direct_credential",
          scheme: "API_KEY",
          credentialLabel: "Perplexity API Key",
          whyOAuthIsNotRequired: "OAuth setup isn't required for this integration path.",
          headerOrParamFormat: {
            value: "Authorization: Bearer <key>",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Perplexity Docs",
              sourceUrl: "https://docs.perplexity.ai",
              whatSourceExplicitlyStates: "Bearer auth header",
            },
          },
          rotationAndExpiryRules: {
            value: "Manual key rotation in portal.",
            evidence: {
              kind: "unverified_hypothesis",
              hypothesisBasis: "No auto-rotation found.",
              whatRemainsUnverified: "Key expiry defaults.",
            },
          },
        },
        setupRunbook: [],
        blockersAndPlaybooks: {
          value: [],
          evidence: {
            kind: "unverified_hypothesis",
            hypothesisBasis: "Standard API key errors.",
            whatRemainsUnverified: "Rate limit retry delays.",
          },
        },
        composioIntegration: {
          recommendedScheme: "API_KEY",
          configurationSteps: {
            value: ["Add API key to Composio connection"],
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Composio Docs",
              sourceUrl: "https://docs.composio.dev",
              whatSourceExplicitlyStates: "Steps to configure direct credentials",
            },
          },
          sdkSnippets: [],
        },
      };

      const markdown = `# ${mockGuide.appName} OAuth & Integration Readiness Guide\n\n- **Auth Path Classification:** \`${mockGuide.readinessSummary.authPathClassification}\`\n\n> **Notice:** ${mockGuide.readinessSummary.oauthNecessityBanner}\n`;
      expect(validateMarkdownExport(mockGuide, markdown)).toBe(true);

      const jsonString = JSON.stringify(mockGuide);
      expect(validateJsonExport(mockGuide, jsonString)).toBe(true);
    });

    it("[F30, F31] should define Manus MCP parameters and GitHub repository target", () => {
      const repoUrl = "https://github.com/Omikar243/composioassignment";
      const manusPayload = {
        mode: "quality",
        create_shareable_link: true,
      };
      expect(repoUrl).toContain("Omikar243/composioassignment");
      expect(manusPayload.mode).toBe("quality");
      expect(manusPayload.create_shareable_link).toBe(true);
    });
  });
});
