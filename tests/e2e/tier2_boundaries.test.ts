/**
 * tests/e2e/tier2_boundaries.test.ts
 * Tier 2: Boundary & Corner Cases Suite (Opaque-Box)
 * Verifies defensive constraints: empty inputs, invalid URLs, missing scopes, timeout simulations, unknown apps
 */

import { describe, it, expect } from "vitest";
import {
  ClaimEvidence,
  Traceable,
  isIndependentlyTested,
  ManagedAuthAvailability,
  OAuthProtocolSpec,
  DirectCredentialSpec,
  IntegrationReadinessGuide,
} from "../../src/types/guide";
import {
  validateEndpointUrl,
  validateSsrfTarget,
  assertClaimEvidence,
  assertIsolatedEndpoints,
  assertDirectCredentialOmitsOAuth,
  EpistemicAssertionError,
} from "./testHarness";

describe("Tier 2: Boundary & Corner Cases Track", () => {
  // ==========================================================================
  // Category 1: Empty Inputs & Malformed Values
  // ==========================================================================
  describe("Category 1: Empty Inputs & Malformed Data", () => {
    it("should reject empty string as endpoint URL", () => {
      const res = validateEndpointUrl("");
      expect(res.isValid).toBe(false);
      expect(res.rejectionReason).toContain("cannot be empty");
    });

    it("should reject whitespace-only string as endpoint URL", () => {
      const res = validateEndpointUrl("   \t\n  ");
      expect(res.isValid).toBe(false);
      expect(res.rejectionReason).toContain("cannot be empty");
    });

    it("should throw EpistemicAssertionError on missing evidence object in Traceable", () => {
      const invalidTraceable = { value: "some-value" } as any;
      expect(() => assertClaimEvidence(invalidTraceable)).toThrow(EpistemicAssertionError);
    });

    it("should throw EpistemicAssertionError on missing kind in ClaimEvidence", () => {
      const invalidEvidence = { value: "val", evidence: {} } as any;
      expect(() => assertClaimEvidence(invalidEvidence)).toThrow(EpistemicAssertionError);
    });

    it("should throw EpistemicAssertionError when tested_live is missing mandatory fields", () => {
      const incompleteLive: Traceable<string> = {
        value: "Token generation",
        evidence: {
          kind: "tested_live",
          testedAt: "2026-10-27T19:00:00Z",
          // missing whatWasPerformed and observedOutcome
        } as any,
      };
      expect(() => assertClaimEvidence(incompleteLive)).toThrow(EpistemicAssertionError);
    });
  });

  // ==========================================================================
  // Category 2: URL & Redirect URI Boundaries
  // ==========================================================================
  describe("Category 2: URL & Redirect URI Boundaries", () => {
    it("should strictly reject URLs containing '#' anchor fragments", () => {
      const cases = [
        "https://example.com/oauth/callback#access_token=xyz",
        "https://slack.com/oauth#token",
        "https://app.composio.dev/auth/callback#",
        "https://api.github.com/v3/#ref",
      ];
      for (const url of cases) {
        const res = validateEndpointUrl(url);
        expect(res.isValid).toBe(false);
        expect(res.rejectionReason).toContain("anchor fragment");
      }
    });

    it("should reject non-HTTPS protocols (http, ftp, file, javascript, data)", () => {
      const invalidProtocols = [
        "http://insecure.api.com/oauth",
        "ftp://ftp.example.com/api",
        "file:///etc/passwd",
        "javascript:alert(1)",
        "data:text/html,<h1>Hello</h1>",
      ];
      for (const url of invalidProtocols) {
        const res = validateEndpointUrl(url);
        expect(res.isValid).toBe(false);
      }
    });

    it("should reject malformed or nonsensical URL strings", () => {
      const malformed = [
        "://missing-protocol.com",
        "https://",
        "not-a-valid-url",
        "https:invalid_domain",
      ];
      for (const url of malformed) {
        const res = validateEndpointUrl(url);
        expect(res.isValid).toBe(false);
      }
    });

    it("should safely sanitize valid HTTPS URLs with query parameters", () => {
      const valid = "https://slack.com/oauth/v2/authorize?client_id=123&scope=chat:write";
      const res = validateEndpointUrl(valid);
      expect(res.isValid).toBe(true);
      expect(res.sanitizedUrl).toBe(valid);
    });

    it("should allow http protocol ONLY for localhost when explicit flag is enabled for local dev", () => {
      const local = validateEndpointUrl("http://localhost:3000/callback", true);
      expect(local.isValid).toBe(true);

      const localBlocked = validateEndpointUrl("http://localhost:3000/callback", false);
      expect(localBlocked.isValid).toBe(false);
    });
  });

  // ==========================================================================
  // Category 3: SSRF & Cloud Metadata Protection
  // ==========================================================================
  describe("Category 3: SSRF & Security Defense Boundaries", () => {
    it("should block loopback addresses (127.0.0.1, ::1, localhost, 0.0.0.0)", () => {
      expect(validateSsrfTarget("http://127.0.0.1").allowed).toBe(false);
      expect(validateSsrfTarget("http://127.0.0.1:3001/admin").allowed).toBe(false);
      expect(validateSsrfTarget("http://localhost:8080").allowed).toBe(false);
      expect(validateSsrfTarget("http://[::1]:8080").allowed).toBe(false);
      expect(validateSsrfTarget("http://0.0.0.0").allowed).toBe(false);
    });

    it("should block AWS/GCP cloud instance metadata services (169.254.169.254 and link-local)", () => {
      expect(validateSsrfTarget("http://169.254.169.254/latest/meta-data/").allowed).toBe(false);
      expect(validateSsrfTarget("http://169.254.1.1/info").allowed).toBe(false);
    });

    it("should block RFC 1918 private IPv4 subnets (10.x, 172.16-31.x, 192.168.x)", () => {
      expect(validateSsrfTarget("http://10.0.0.1").allowed).toBe(false);
      expect(validateSsrfTarget("http://10.254.254.254").allowed).toBe(false);
      expect(validateSsrfTarget("http://172.16.0.1").allowed).toBe(false);
      expect(validateSsrfTarget("http://172.31.255.255").allowed).toBe(false);
      expect(validateSsrfTarget("http://192.168.0.1").allowed).toBe(false);
      expect(validateSsrfTarget("http://192.168.100.50").allowed).toBe(false);
    });

    it("should block carrier-grade NAT subnet (100.64.0.0/10)", () => {
      expect(validateSsrfTarget("http://100.64.0.1").allowed).toBe(false);
      expect(validateSsrfTarget("http://100.127.255.255").allowed).toBe(false);
    });

    it("should allow verified public developer documentation hosts", () => {
      expect(validateSsrfTarget("https://docs.github.com/en/apps").allowed).toBe(true);
      expect(validateSsrfTarget("https://api.slack.com/authentication").allowed).toBe(true);
      expect(validateSsrfTarget("https://developers.google.com/identity").allowed).toBe(true);
      expect(validateSsrfTarget("https://developers.notion.com").allowed).toBe(true);
      expect(validateSsrfTarget("https://docs.perplexity.ai").allowed).toBe(true);
    });
  });

  // ==========================================================================
  // Category 4: Epistemic Fallback & Silence in Documentation
  // ==========================================================================
  describe("Category 4: Epistemic Fallback on Documentation Silence", () => {
    it("should enforce unverified_hypothesis when setup duration is not stated in documentation", () => {
      // Simulating a doc with 4 form fields but zero duration stated
      const unstatedDuration: Traceable<string> = {
        value: "~5-10 minutes",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Estimated from 4 form fields; official source does not specify duration.",
          whatRemainsUnverified: "Actual completion time across developer profiles.",
        },
      };

      expect(unstatedDuration.evidence.kind).toBe("unverified_hypothesis");
      expect(isIndependentlyTested(unstatedDuration.evidence)).toBe(false);
      expect(() => assertClaimEvidence(unstatedDuration, "unverified_hypothesis")).not.toThrow();
    });

    it("should enforce 'No review gate identified in the sources checked' instead of assuming instant approval", () => {
      const reviewGateHypothesis: Traceable<string> = {
        value: "No review gate identified in the sources checked",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Official documentation concludes at 'Register' without mentioning approval or review steps.",
          whatRemainsUnverified: "Whether organization-level admin approvals or hidden queue delays exist.",
        },
      };

      expect(reviewGateHypothesis.value).toBe("No review gate identified in the sources checked");
      expect(reviewGateHypothesis.evidence.kind).toBe("unverified_hypothesis");
      expect(reviewGateHypothesis.value).not.toBe("Instant");
    });

    it("should enforce composioManagedAuthStatus === 'unknown' for unfamiliar apps", () => {
      const unfamiliarAppStatus: Traceable<ManagedAuthAvailability> = {
        value: "unknown",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "App not indexed in known Composio public managed auth list.",
          whatRemainsUnverified: "Live Composio runtime toolkit capability.",
        },
      };

      expect(unfamiliarAppStatus.value).toBe("unknown");
    });
  });

  // ==========================================================================
  // Category 5: Direct Credential Invariants & Boundary Leaks
  // ==========================================================================
  describe("Category 5: Direct Credential Invariants & Leaks", () => {
    it("should fail validation if a Direct Credential guide leaks providerEndpoints", () => {
      const leakyGuide = {
        appId: "leaky-app",
        appName: "Leaky App",
        websiteUrl: "https://leaky.example.com",
        supportedAuthSchemes: {
          value: ["API_KEY"],
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Leaky Docs",
            sourceUrl: "https://leaky.example.com",
            whatSourceExplicitlyStates: "Uses API keys.",
          },
        },
        composioManagedAuthStatus: {
          value: "bring_your_own_required",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Composio",
            sourceUrl: "https://docs.composio.dev",
            whatSourceExplicitlyStates: "BYO Key",
          },
        },
        readinessSummary: {
          authPathClassification: "direct_credential_only",
          oauthNecessityBanner: "OAuth setup isn't required for this integration path.",
          activeSetupTime: {
            value: "~2 mins",
            evidence: { kind: "unverified_hypothesis", hypothesisBasis: "key creation", whatRemainsUnverified: "speed" },
          },
          approvalWaitTime: {
            value: "Instant",
            evidence: { kind: "documented_not_tested", sourceTitle: "docs", sourceUrl: "url", whatSourceExplicitlyStates: "instant" },
          },
          oneLineSummary: "Direct key integration",
        },
        prerequisites: [],
        authSpec: {
          mode: "direct_credential",
          scheme: "API_KEY",
          credentialLabel: "API Key",
          whyOAuthIsNotRequired: "OAuth setup isn't required for this integration path.",
          headerOrParamFormat: {
            value: "Authorization: Bearer <key>",
            evidence: { kind: "documented_not_tested", sourceTitle: "docs", sourceUrl: "url", whatSourceExplicitlyStates: "bearer" },
          },
          rotationAndExpiryRules: {
            value: "No expiry",
            evidence: { kind: "unverified_hypothesis", hypothesisBasis: "none", whatRemainsUnverified: "enterprise" },
          },
          // ILLEGAL LEAK:
          providerEndpoints: {
            authorizationUrl: { value: "https://leaky.com/oauth" },
          },
        } as any,
        setupRunbook: [],
        blockersAndPlaybooks: {
          value: [],
          evidence: { kind: "unverified_hypothesis", hypothesisBasis: "none", whatRemainsUnverified: "none" },
        },
        composioIntegration: {
          recommendedScheme: "API_KEY",
          configurationSteps: {
            value: [],
            evidence: { kind: "documented_not_tested", sourceTitle: "docs", sourceUrl: "url", whatSourceExplicitlyStates: "steps" },
          },
          sdkSnippets: [],
        },
      } as unknown as IntegrationReadinessGuide;

      expect(() => assertDirectCredentialOmitsOAuth(leakyGuide)).toThrow(EpistemicAssertionError);
    });

    it("should fail validation if provider authorizationUrl points to a Composio domain", () => {
      const contaminatedSpec: OAuthProtocolSpec = {
        mode: "oauth",
        scheme: "OAUTH2",
        providerEndpoints: {
          authorizationUrl: {
            value: "https://backend.composio.dev/api/v1/auth-apps/add", // WRONG: pointed to Composio!
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Bad Docs",
              sourceUrl: "https://example.com",
              whatSourceExplicitlyStates: "Contaminated endpoint",
            },
          },
          tokenUrl: {
            value: "https://api.provider.com/oauth/token",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Bad Docs",
              sourceUrl: "https://example.com",
              whatSourceExplicitlyStates: "Token endpoint",
            },
          },
        },
        composioCallbackGuidance: {
          howToLocateAndVerify: "Dashboard",
          documentedReferenceNote: {
            value: "ref note",
            evidence: { kind: "documented_not_tested", sourceTitle: "docs", sourceUrl: "url", whatSourceExplicitlyStates: "ref" },
          },
        },
        pkceRequired: {
          value: "not_mentioned_in_sources",
          evidence: { kind: "unverified_hypothesis", hypothesisBasis: "none", whatRemainsUnverified: "none" },
        },
        tokenAndRefreshBehavior: {
          value: "Standard",
          evidence: { kind: "documented_not_tested", sourceTitle: "docs", sourceUrl: "url", whatSourceExplicitlyStates: "standard" },
        },
        scopes: {
          value: [],
          evidence: { kind: "documented_not_tested", sourceTitle: "docs", sourceUrl: "url", whatSourceExplicitlyStates: "scopes" },
        },
      };

      expect(() => assertIsolatedEndpoints(contaminatedSpec)).toThrow(EpistemicAssertionError);
    });
  });
});
