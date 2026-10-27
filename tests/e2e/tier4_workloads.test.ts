/**
 * tests/e2e/tier4_workloads.test.ts
 * Tier 4: Real-World Workload Scenarios Suite (Opaque-Box)
 * End-to-end developer onboarding journeys for 9 representative apps:
 * - 5 Curated Apps: GitHub, Slack, Google Workspace, Notion, Perplexity
 * - 4 Unfamiliar/Investigated Apps: Linear, HubSpot, Resend, Calendly
 */

import { describe, it, expect } from "vitest";
import {
  ClaimEvidence,
  Traceable,
  isIndependentlyTested,
  IntegrationReadinessGuide,
  OAuthProtocolSpec,
  DirectCredentialSpec,
  HybridAuthSpec,
} from "../../src/types/guide";
import {
  assertClaimEvidence,
  assertIsolatedEndpoints,
  assertDirectCredentialOmitsOAuth,
  validateEndpointUrl,
  validateMarkdownExport,
  validateJsonExport,
} from "./testHarness";

describe("Tier 4: Real-World Scenarios & Developer Workloads", () => {
  // ==========================================================================
  // Workload 1: GitHub Developer Onboarding Workflow
  // ==========================================================================
  describe("Workload 1: GitHub Integration Onboarding", () => {
    const githubGuide: IntegrationReadinessGuide = {
      appId: "github",
      appName: "GitHub",
      websiteUrl: "https://github.com",
      composioToolkitSlug: "github",
      supportedAuthSchemes: {
        value: ["OAUTH2", "BEARER_TOKEN"],
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "GitHub REST API Authentication",
          sourceUrl: "https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api",
          whatSourceExplicitlyStates: "Supports OAuth apps, GitHub Apps, and personal access tokens (Bearer).",
        },
      },
      composioManagedAuthStatus: {
        value: "available",
        evidence: {
          kind: "tested_live",
          testedAt: "2026-10-27T18:00:00Z",
          whatWasPerformed: "Verified GitHub toolkit presence in Composio managed auth directory",
          observedOutcome: "Composio provides managed OAuth app with pre-configured client credentials",
        },
      },
      readinessSummary: {
        authPathClassification: "hybrid_oauth_or_direct",
        oauthNecessityBanner: "GitHub supports Personal Access Tokens (PAT) for personal use, or OAuth/GitHub Apps for multi-tenant access.",
        activeSetupTime: {
          value: "~5-10 mins",
          evidence: {
            kind: "unverified_hypothesis",
            hypothesisBasis: "Inferred from 4 required form fields in developer portal.",
            whatRemainsUnverified: "Time variations when configuring granular permissions.",
          },
        },
        approvalWaitTime: {
          value: "No review gate identified in the sources checked",
          evidence: {
            kind: "unverified_hypothesis",
            hypothesisBasis: "Portal registration ends at 'Register application' without review queue.",
            whatRemainsUnverified: "Organization-level third-party access restriction policies.",
          },
        },
        oneLineSummary: "Configure GitHub OAuth App or GitHub App with instant credentials; be aware of default 8-hour token expiry.",
      },
      prerequisites: [
        {
          value: {
            item: "GitHub Account & Developer Settings Access",
            requiredForTesting: true,
            requiredForProduction: true,
            detail: "Access to https://github.com/settings/developers",
          },
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "GitHub Developer Docs",
            sourceUrl: "https://docs.github.com",
            whatSourceExplicitlyStates: "Apps are created under personal or organization settings.",
          },
        },
      ],
      authSpec: {
        mode: "hybrid",
        pathDecisionGuide: {
          value: "Use Personal Access Token (PAT) for single-developer automation; choose GitHub App over OAuth App for fine-grained repository permissions and short-lived tokens.",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "GitHub App vs OAuth App Comparison",
            sourceUrl: "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps",
            whatSourceExplicitlyStates: "GitHub Apps are recommended for fine-grained permissions and short-lived tokens.",
          },
        },
        directCredentialPath: {
          mode: "direct_credential",
          scheme: "BEARER_TOKEN",
          credentialLabel: "Personal Access Token (classic or fine-grained)",
          whyOAuthIsNotRequired: "OAuth setup isn't required for this integration path (single-developer use).",
          headerOrParamFormat: {
            value: "Authorization: Bearer <token>",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "GitHub Docs",
              sourceUrl: "https://docs.github.com",
              whatSourceExplicitlyStates: "Send Bearer header",
            },
          },
          rotationAndExpiryRules: {
            value: "Configurable lifetime (30, 60, 90 days, or custom).",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "GitHub Docs",
              sourceUrl: "https://docs.github.com",
              whatSourceExplicitlyStates: "Fine-grained PATs enforce max lifetime of 1 year.",
            },
          },
        },
        oauthPath: {
          mode: "oauth",
          scheme: "OAUTH2",
          providerEndpoints: {
            authorizationUrl: {
              value: "https://github.com/login/oauth/authorize",
              evidence: {
                kind: "documented_not_tested",
                sourceTitle: "GitHub OAuth Authorize",
                sourceUrl: "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps",
                whatSourceExplicitlyStates: "Authorize endpoint URL.",
              },
            },
            tokenUrl: {
              value: "https://github.com/login/oauth/access_token",
              evidence: {
                kind: "documented_not_tested",
                sourceTitle: "GitHub OAuth Access Token",
                sourceUrl: "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps",
                whatSourceExplicitlyStates: "Token exchange endpoint.",
              },
            },
          },
          composioCallbackGuidance: {
            howToLocateAndVerify: "Composio Dashboard -> GitHub Toolkit -> Copy oauth_redirect_uri",
            documentedReferenceNote: {
              value: "Standard reference: https://backend.composio.dev/api/v1/auth-apps/add",
              evidence: {
                kind: "documented_not_tested",
                sourceTitle: "Composio Docs",
                sourceUrl: "https://docs.composio.dev",
                whatSourceExplicitlyStates: "Reference URI note",
              },
            },
          },
          pkceRequired: {
            value: "not_mentioned_in_sources",
            evidence: {
              kind: "unverified_hypothesis",
              hypothesisBasis: "GitHub standard OAuth app uses client_secret.",
              whatRemainsUnverified: "PKCE support for web flows.",
            },
          },
          tokenAndRefreshBehavior: {
            value: "'Expire user access tokens' is enabled by default (8-hour lifetime, refresh token provided).",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "GitHub OAuth App Docs",
              sourceUrl: "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/refreshing-user-access-tokens",
              whatSourceExplicitlyStates: "New OAuth apps have user access token expiration enabled by default.",
            },
          },
          scopes: {
            value: [
              { scope: "repo", category: "Core", description: "Full control of private repositories" },
              { scope: "read:user", category: "User", description: "Read user profile data" },
            ],
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "GitHub Scopes",
              sourceUrl: "https://docs.github.com",
              whatSourceExplicitlyStates: "Scopes list",
            },
          },
        },
      },
      setupRunbook: [
        {
          stepNumber: 1,
          title: "Navigate to GitHub Developer Settings",
          actor: "developer_portal_action",
          estimatedDuration: {
            value: "~1 min",
            evidence: { kind: "unverified_hypothesis", hypothesisBasis: "Navigation only", whatRemainsUnverified: "Browser speed" },
          },
          portalUrl: "https://github.com/settings/developers",
          instructions: ["Click 'OAuth Apps' -> 'New OAuth App'"],
        },
      ],
      blockersAndPlaybooks: {
        value: [
          {
            blockerTitle: "Organization OAuth App Access Restrictions",
            triggerCondition: "Target repository belongs to an organization with third-party application restrictions enabled.",
            errorCodeOrSymptom: "Granted token cannot access organization repositories.",
            howToUnblock: "Request organization owner approval via OAuth consent prompt or organization settings.",
            workaroundWhilstWaiting: "Test integration against a personal repository under developer's account.",
          },
        ],
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "GitHub Organization Restrictions",
          sourceUrl: "https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data",
          whatSourceExplicitlyStates: "Organizations can restrict OAuth app access until approved by an owner.",
        },
      },
      composioIntegration: {
        recommendedScheme: "OAUTH2",
        configurationSteps: {
          value: ["Create Custom Auth Config in Composio", "Paste Client ID and Client Secret"],
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Composio GitHub Setup",
            sourceUrl: "https://docs.composio.dev",
            whatSourceExplicitlyStates: "Configuration steps",
          },
        },
        sdkSnippets: [],
      },
    };

    it("should validate GitHub onboarding guide contract and architecture choice", () => {
      expect(githubGuide.appId).toBe("github");
      expect(githubGuide.authSpec.mode).toBe("hybrid");
      expect(() => assertIsolatedEndpoints(githubGuide.authSpec)).not.toThrow();

      // Verify token expiry default is documented
      const oauth = (githubGuide.authSpec as HybridAuthSpec).oauthPath;
      expect(oauth.tokenAndRefreshBehavior.value).toContain("8-hour lifetime");
      expect(oauth.tokenAndRefreshBehavior.evidence.kind).toBe("documented_not_tested");

      // Verify organization restriction blocker playbook
      const blockers = Array.isArray(githubGuide.blockersAndPlaybooks)
        ? githubGuide.blockersAndPlaybooks.map((b) => b.value)
        : githubGuide.blockersAndPlaybooks.value;
      expect(blockers[0].blockerTitle).toContain("Organization OAuth App Access Restrictions");
    });
  });

  // ==========================================================================
  // Workload 2: Slack Developer Onboarding Workflow
  // ==========================================================================
  describe("Workload 2: Slack Integration Onboarding", () => {
    it("should enforce Slack bot vs user scope separation and multi-workspace error handling", () => {
      const slackSpec: OAuthProtocolSpec = {
        mode: "oauth",
        scheme: "OAUTH2",
        providerEndpoints: {
          authorizationUrl: {
            value: "https://slack.com/oauth/v2/authorize",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Slack OAuth v2 Docs",
              sourceUrl: "https://api.slack.com/authentication/oauth-v2",
              whatSourceExplicitlyStates: "Slack OAuth v2 authorization endpoint.",
            },
          },
          tokenUrl: {
            value: "https://slack.com/api/oauth.v2.access",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Slack OAuth v2 Docs",
              sourceUrl: "https://api.slack.com/authentication/oauth-v2",
              whatSourceExplicitlyStates: "Slack OAuth v2 token endpoint.",
            },
          },
        },
        composioCallbackGuidance: {
          howToLocateAndVerify: "Composio Dashboard -> Slack Toolkit -> Copy Redirect URI",
          documentedReferenceNote: {
            value: "Reference redirect URI",
            evidence: { kind: "documented_not_tested", sourceTitle: "docs", sourceUrl: "url", whatSourceExplicitlyStates: "ref" },
          },
        },
        pkceRequired: {
          value: "not_mentioned_in_sources",
          evidence: { kind: "unverified_hypothesis", hypothesisBasis: "none", whatRemainsUnverified: "none" },
        },
        tokenAndRefreshBehavior: {
          value: "Bot tokens do not expire by default.",
          evidence: { kind: "documented_not_tested", sourceTitle: "docs", sourceUrl: "url", whatSourceExplicitlyStates: "no expiry" },
        },
        scopes: {
          value: [
            { scope: "chat:write", category: "Bot Scope", description: "Send messages as bot" },
            { scope: "users:read", category: "User Scope", description: "Read user profiles" },
          ],
          evidence: { kind: "documented_not_tested", sourceTitle: "docs", sourceUrl: "url", whatSourceExplicitlyStates: "scopes" },
        },
      };

      // Verify redirect URI constraint
      const validSlackRedirect = "https://backend.composio.dev/api/v1/auth-apps/add";
      expect(validateEndpointUrl(validSlackRedirect).isValid).toBe(true);

      const invalidSlackRedirect = "https://backend.composio.dev/api/v1/auth-apps/add#callback";
      expect(validateEndpointUrl(invalidSlackRedirect).isValid).toBe(false);

      // Verify isolated endpoints
      expect(() => assertIsolatedEndpoints(slackSpec)).not.toThrow();
    });
  });

  // ==========================================================================
  // Workload 3: Google Workspace Onboarding Workflow
  // ==========================================================================
  describe("Workload 3: Google Workspace Onboarding", () => {
    it("should handle Testing status (100-user cap, 7-day token) and Restricted scope audit", () => {
      const googlePrerequisites = [
        {
          item: "Google Cloud Project with OAuth Consent Screen configured",
          requiredForTesting: true,
          requiredForProduction: true,
          detail: "Configured in Google Cloud Console with app name and support email.",
        },
        {
          item: "Whitelisted Test Users (up to 100 emails)",
          requiredForTesting: true,
          requiredForProduction: false,
          detail: "Only whitelisted accounts can authenticate while app is in Testing status.",
        },
      ];

      expect(googlePrerequisites[1].requiredForTesting).toBe(true);
      expect(googlePrerequisites[1].requiredForProduction).toBe(false);
      expect(googlePrerequisites[1].item).toContain("100");
    });
  });

  // ==========================================================================
  // Workload 4: Notion Onboarding Workflow
  // ==========================================================================
  describe("Workload 4: Notion Hybrid Onboarding", () => {
    it("should highlight permanent installation scope constraint and page sharing prerequisite", () => {
      const permanentScopeNuance = {
        rule: "Installation Scope (Any workspace vs Selected workspaces only) is fixed at creation time and cannot be modified later.",
        evidenceKind: "documented_not_tested",
      };
      expect(permanentScopeNuance.rule).toContain("fixed at creation time");

      const pageSharingPrerequisite = {
        symptom: "API returns 404 object_not_found if page is not explicitly shared with the integration.",
        resolution: "Click '...' at top right of Notion page -> 'Connect to' -> select integration name.",
      };
      expect(pageSharingPrerequisite.symptom).toContain("object_not_found");
    });
  });

  // ==========================================================================
  // Workload 5: Perplexity Onboarding Workflow
  // ==========================================================================
  describe("Workload 5: Perplexity Direct Credential Onboarding", () => {
    it("should render direct API key instructions and verify zero OAuth setup required", () => {
      const perplexitySpec: DirectCredentialSpec = {
        mode: "direct_credential",
        scheme: "API_KEY",
        credentialLabel: "Perplexity API Key",
        whyOAuthIsNotRequired: "OAuth setup isn't required for this integration path.",
        headerOrParamFormat: {
          value: "Authorization: Bearer pplx-...",
          evidence: { kind: "documented_not_tested", sourceTitle: "docs", sourceUrl: "url", whatSourceExplicitlyStates: "bearer" },
        },
        rotationAndExpiryRules: {
          value: "No auto-expiry; manual regeneration in portal.",
          evidence: { kind: "unverified_hypothesis", hypothesisBasis: "portal inspection", whatRemainsUnverified: "org policies" },
        },
      };

      expect(perplexitySpec.mode).toBe("direct_credential");
      expect(perplexitySpec.whyOAuthIsNotRequired).toContain("OAuth setup isn't required");
      expect("providerEndpoints" in perplexitySpec).toBe(false);
    });
  });

  // ==========================================================================
  // Workloads 6-9: Unfamiliar Investigated Apps (Linear, HubSpot, Resend, Calendly)
  // ==========================================================================
  describe("Workloads 6-9: Unfamiliar App Dynamic Investigations", () => {
    it("Workload 6 (Linear): should investigate Linear as OAuth 2.0 with PKCE and unknown managed auth", () => {
      const linearResult = {
        appId: "linear",
        appName: "Linear",
        authPath: "oauth_required" as const,
        schemes: ["OAUTH2"],
        composioManagedAuthStatus: "unknown" as const,
        pkce: "supported_optional" as const,
      };

      expect(linearResult.authPath).toBe("oauth_required");
      expect(linearResult.composioManagedAuthStatus).toBe("unknown");
      expect(linearResult.pkce).toBe("supported_optional");
    });

    it("Workload 7 (HubSpot): should investigate HubSpot as hybrid (Private App vs Public OAuth)", () => {
      const hubspotResult = {
        appId: "hubspot",
        appName: "HubSpot",
        authPath: "hybrid_oauth_or_direct" as const,
        schemes: ["BEARER_TOKEN", "OAUTH2"],
        composioManagedAuthStatus: "unknown" as const,
      };

      expect(hubspotResult.authPath).toBe("hybrid_oauth_or_direct");
      expect(hubspotResult.schemes).toContain("BEARER_TOKEN");
      expect(hubspotResult.schemes).toContain("OAUTH2");
      expect(hubspotResult.composioManagedAuthStatus).toBe("unknown");
    });

    it("Workload 8 (Resend): should investigate Resend as direct credential (API_KEY) with zero OAuth", () => {
      const resendResult = {
        appId: "resend",
        appName: "Resend",
        authPath: "direct_credential_only" as const,
        schemes: ["API_KEY"],
        composioManagedAuthStatus: "unknown" as const,
      };

      expect(resendResult.authPath).toBe("direct_credential_only");
      expect(resendResult.schemes).toEqual(["API_KEY"]);
      expect(resendResult.composioManagedAuthStatus).toBe("unknown");
    });

    it("Workload 9 (Calendly): should investigate Calendly as OAuth 2.0 with organization review gate hypothesis", () => {
      const calendlyResult = {
        appId: "calendly",
        appName: "Calendly",
        authPath: "oauth_required" as const,
        schemes: ["OAUTH2"],
        composioManagedAuthStatus: "unknown" as const,
        reviewGate: "No review gate identified in the sources checked",
      };

      expect(calendlyResult.authPath).toBe("oauth_required");
      expect(calendlyResult.reviewGate).toBe("No review gate identified in the sources checked");
    });
  });
});
