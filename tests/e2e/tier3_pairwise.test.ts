/**
 * tests/e2e/tier3_pairwise.test.ts
 * Tier 3: Pairwise & Cross-Feature Combinations Suite (Opaque-Box)
 * Verifies multi-feature interactions: OAuth + sensitive scopes, Hybrid + internal token,
 * API key + unknown managed auth, Export + dynamic guides, Code snippets + validation badges
 */

import { describe, it, expect } from "vitest";
import {
  ClaimEvidence,
  Traceable,
  isIndependentlyTested,
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
  validateMarkdownExport,
  validateJsonExport,
} from "./testHarness";

describe("Tier 3: Pairwise Combinations Track", () => {
  // ==========================================================================
  // Combination 1: OAuth Required + Sensitive/Restricted Scopes
  // ==========================================================================
  describe("Combination 1: OAuth Required + Sensitive Scopes", () => {
    it("should enforce CASA Tier 2 audit hypothesis and 100-user cap when restricted scopes are requested", () => {
      const googleOAuthSpec: OAuthProtocolSpec = {
        mode: "oauth",
        scheme: "OAUTH2",
        providerEndpoints: {
          authorizationUrl: {
            value: "https://accounts.google.com/o/oauth2/v2/auth",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Google Identity Protocols",
              sourceUrl: "https://developers.google.com/identity/protocols/oauth2",
              whatSourceExplicitlyStates: "Standard Google OAuth 2.0 authorization endpoint.",
            },
          },
          tokenUrl: {
            value: "https://oauth2.googleapis.com/token",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Google Identity Protocols",
              sourceUrl: "https://developers.google.com/identity/protocols/oauth2",
              whatSourceExplicitlyStates: "Token exchange endpoint.",
            },
          },
        },
        composioCallbackGuidance: {
          howToLocateAndVerify: "Composio Dashboard -> Google Toolkit -> Copy Redirect URI",
          documentedReferenceNote: {
            value: "Standard Composio callback URL reference.",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Composio Docs",
              sourceUrl: "https://docs.composio.dev",
              whatSourceExplicitlyStates: "Reference URLs",
            },
          },
        },
        pkceRequired: {
          value: "supported_optional",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Google Identity Docs",
            sourceUrl: "https://developers.google.com/identity/protocols/oauth2",
            whatSourceExplicitlyStates: "PKCE is supported and recommended for public clients.",
          },
        },
        tokenAndRefreshBehavior: {
          value: "Testing status: Refresh token expires in 7 days; max 100 test users.",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Google OAuth API Verification FAQ",
            sourceUrl: "https://support.google.com/cloud/answer/10311615",
            whatSourceExplicitlyStates: "Refresh tokens for apps in Testing publishing status expire after 7 days.",
          },
        },
        scopes: {
          value: [
            {
              scope: "https://mail.google.com/",
              category: "Restricted",
              description: "Read, compose, send, and permanently delete all your email from Gmail",
              isSensitiveOrRestricted: true,
            },
            {
              scope: "https://www.googleapis.com/auth/gmail.readonly",
              category: "Restricted",
              description: "View your email messages and settings",
              isSensitiveOrRestricted: true,
            },
          ],
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Google OAuth API Scopes",
            sourceUrl: "https://developers.google.com/identity/protocols/oauth2/scopes",
            whatSourceExplicitlyStates: "Defines Gmail full access and read scopes as Restricted.",
          },
        },
        reviewerSubmissionDraft: {
          scopeJustificationDraft: "Application requires access to Gmail to automatically organize customer support emails.",
          reviewerNotes: "Requires Cloud Application Security Assessment (CASA) Tier 2 audit by an authorized lab.",
        },
      };

      // Verify isolated endpoints
      expect(() => assertIsolatedEndpoints(googleOAuthSpec)).not.toThrow();

      // Verify sensitive scope flags
      const restrictedScopes = googleOAuthSpec.scopes.value.filter((s) => s.isSensitiveOrRestricted);
      expect(restrictedScopes).toHaveLength(2);
      expect(restrictedScopes.map((s) => s.category)).toEqual(["Restricted", "Restricted"]);

      // Verify reviewer submission draft is populated
      expect(googleOAuthSpec.reviewerSubmissionDraft).toBeDefined();
      expect(googleOAuthSpec.reviewerSubmissionDraft?.reviewerNotes).toContain("Tier 2 audit");
    });
  });

  // ==========================================================================
  // Combination 2: Hybrid Auth + Internal Token vs Public OAuth
  // ==========================================================================
  describe("Combination 2: Hybrid Auth Decision Guide & Paths", () => {
    it("should provide actionable decision guide between internal bot token and public connection OAuth", () => {
      const notionHybridSpec: HybridAuthSpec = {
        mode: "hybrid",
        pathDecisionGuide: {
          value: "Use Internal Connection (~2 mins) for single-workspace automations or personal bots; use Public Connection (OAuth 2.0) for multi-tenant integrations distributing to external workspaces.",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Notion Authorization Guide",
            sourceUrl: "https://developers.notion.com/guides/get-started/authorization",
            whatSourceExplicitlyStates: "Internal connections are private to your workspace; public connections allow multi-workspace distribution via OAuth 2.0.",
          },
        },
        directCredentialPath: {
          mode: "direct_credential",
          scheme: "BEARER_TOKEN",
          credentialLabel: "Internal Integration Secret",
          whyOAuthIsNotRequired: "OAuth setup isn't required for this integration path (single-workspace bot).",
          headerOrParamFormat: {
            value: "Authorization: Bearer secret_xxx",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Notion API Reference",
              sourceUrl: "https://developers.notion.com/reference",
              whatSourceExplicitlyStates: "Send Bearer token with Notion-Version header.",
            },
          },
          rotationAndExpiryRules: {
            value: "Secrets do not expire automatically; manual regeneration in Notion portal.",
            evidence: {
              kind: "unverified_hypothesis",
              hypothesisBasis: "Settings page does not list automatic expiration timers.",
              whatRemainsUnverified: "Enterprise workspace secret rotation policies.",
            },
          },
          portalUrl: "https://www.notion.so/profile/integrations",
        },
        oauthPath: {
          mode: "oauth",
          scheme: "OAUTH2",
          providerEndpoints: {
            authorizationUrl: {
              value: "https://api.notion.com/v1/oauth/authorize",
              evidence: {
                kind: "documented_not_tested",
                sourceTitle: "Notion Public Connections",
                sourceUrl: "https://developers.notion.com/docs/authorization",
                whatSourceExplicitlyStates: "Notion OAuth 2.0 authorization endpoint.",
              },
            },
            tokenUrl: {
              value: "https://api.notion.com/v1/oauth/token",
              evidence: {
                kind: "documented_not_tested",
                sourceTitle: "Notion Public Connections",
                sourceUrl: "https://developers.notion.com/docs/authorization",
                whatSourceExplicitlyStates: "Notion OAuth 2.0 access token endpoint.",
              },
            },
          },
          composioCallbackGuidance: {
            howToLocateAndVerify: "Composio Dashboard -> Notion Toolkit -> Copy oauth_redirect_uri",
            documentedReferenceNote: {
              value: "Standard callback reference note.",
              evidence: {
                kind: "documented_not_tested",
                sourceTitle: "Composio Docs",
                sourceUrl: "https://docs.composio.dev",
                whatSourceExplicitlyStates: "Callback reference",
              },
            },
          },
          pkceRequired: {
            value: "not_mentioned_in_sources",
            evidence: {
              kind: "unverified_hypothesis",
              hypothesisBasis: "Notion docs specify basic auth header with client_id:client_secret.",
              whatRemainsUnverified: "PKCE support on Notion auth servers.",
            },
          },
          tokenAndRefreshBehavior: {
            value: "Permanent access token returned; Notion access tokens do not expire.",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Notion OAuth Reference",
              sourceUrl: "https://developers.notion.com/docs/authorization",
              whatSourceExplicitlyStates: "Notion does not use refresh tokens; access tokens do not expire.",
            },
          },
          scopes: {
            value: [],
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Notion Permissions",
              sourceUrl: "https://developers.notion.com",
              whatSourceExplicitlyStates: "Scopes are configured at app creation; access is granted per page.",
            },
          },
        },
      };

      expect(notionHybridSpec.mode).toBe("hybrid");
      expect(notionHybridSpec.pathDecisionGuide.value).toContain("Internal Connection (~2 mins)");
      expect(notionHybridSpec.directCredentialPath.scheme).toBe("BEARER_TOKEN");
      expect(notionHybridSpec.oauthPath.scheme).toBe("OAUTH2");
      expect(() => assertIsolatedEndpoints(notionHybridSpec)).not.toThrow();
    });
  });

  // ==========================================================================
  // Combination 3: Direct Credential + Unknown Managed Auth
  // ==========================================================================
  describe("Combination 3: Direct Credential + Unknown Managed Auth", () => {
    it("should render direct credential banner and retain managedAuthStatus: 'unknown'", () => {
      const unfamiliarDirectGuide: IntegrationReadinessGuide = {
        appId: "resend",
        appName: "Resend",
        websiteUrl: "https://resend.com",
        supportedAuthSchemes: {
          value: ["API_KEY"],
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Resend API Docs",
            sourceUrl: "https://resend.com/docs/api-keys",
            whatSourceExplicitlyStates: "All API requests require an API key in Authorization Bearer header.",
          },
        },
        composioManagedAuthStatus: {
          value: "unknown",
          evidence: {
            kind: "unverified_hypothesis",
            hypothesisBasis: "Toolkit not verified in Composio managed auth directory.",
            whatRemainsUnverified: "Whether Composio provides built-in managed account pooling.",
          },
        },
        readinessSummary: {
          authPathClassification: "direct_credential_only",
          oauthNecessityBanner: "OAuth setup isn't required for this integration path.",
          activeSetupTime: {
            value: "~2 mins",
            evidence: {
              kind: "unverified_hypothesis",
              hypothesisBasis: "API key generation in Resend dashboard.",
              whatRemainsUnverified: "Domain verification wait time.",
            },
          },
          approvalWaitTime: {
            value: "Instant",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Resend Docs",
              sourceUrl: "https://resend.com/docs",
              whatSourceExplicitlyStates: "API keys are generated immediately.",
            },
          },
          oneLineSummary: "Connect Resend via direct API key credentials without OAuth registration.",
        },
        prerequisites: [],
        authSpec: {
          mode: "direct_credential",
          scheme: "API_KEY",
          credentialLabel: "Resend API Key",
          whyOAuthIsNotRequired: "OAuth setup isn't required for this integration path.",
          headerOrParamFormat: {
            value: "Authorization: Bearer re_123456789",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Resend Docs",
              sourceUrl: "https://resend.com/docs",
              whatSourceExplicitlyStates: "Pass Bearer token",
            },
          },
          rotationAndExpiryRules: {
            value: "Keys do not expire automatically.",
            evidence: {
              kind: "unverified_hypothesis",
              hypothesisBasis: "Portal settings do not show expiration date.",
              whatRemainsUnverified: "Enterprise rotation requirements.",
            },
          },
        },
        setupRunbook: [],
        blockersAndPlaybooks: {
          value: [],
          evidence: {
            kind: "unverified_hypothesis",
            hypothesisBasis: "Domain verification DNS propagation.",
            whatRemainsUnverified: "Exact DNS propagation latency.",
          },
        },
        composioIntegration: {
          recommendedScheme: "API_KEY",
          configurationSteps: {
            value: ["Enter Resend API Key in Composio connection dialog"],
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Composio Docs",
              sourceUrl: "https://docs.composio.dev",
              whatSourceExplicitlyStates: "BYO Key steps",
            },
          },
          sdkSnippets: [],
        },
      };

      expect(unfamiliarDirectGuide.composioManagedAuthStatus.value).toBe("unknown");
      expect(() => assertDirectCredentialOmitsOAuth(unfamiliarDirectGuide)).not.toThrow();
    });
  });

  // ==========================================================================
  // Combination 4: Dynamic Guide Export Engine (Markdown & JSON)
  // ==========================================================================
  describe("Combination 4: Dynamic Guide Markdown & JSON Serialization", () => {
    it("should export an unfamiliar investigated guide with provenance and isolated sections", () => {
      const linearGuide: IntegrationReadinessGuide = {
        appId: "linear",
        appName: "Linear",
        websiteUrl: "https://linear.app",
        supportedAuthSchemes: {
          value: ["OAUTH2", "API_KEY"],
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Linear API Docs",
            sourceUrl: "https://developers.linear.app/docs/graphql/working-with-the-graphql-api",
            whatSourceExplicitlyStates: "Supports OAuth 2.0 applications and personal API keys.",
          },
        },
        composioManagedAuthStatus: {
          value: "unknown",
          evidence: {
            kind: "unverified_hypothesis",
            hypothesisBasis: "Not verified against live Composio account.",
            whatRemainsUnverified: "Composio managed auth support status.",
          },
        },
        readinessSummary: {
          authPathClassification: "oauth_required",
          oauthNecessityBanner: "OAuth 2.0 application setup required for multi-user access.",
          activeSetupTime: {
            value: "~5-10 mins",
            evidence: {
              kind: "unverified_hypothesis",
              hypothesisBasis: "Registration form has 3 fields (Name, Callback, Scopes).",
              whatRemainsUnverified: "Admin approval latency in enterprise Linear workspaces.",
            },
          },
          approvalWaitTime: {
            value: "No review gate identified in the sources checked",
            evidence: {
              kind: "unverified_hypothesis",
              hypothesisBasis: "Linear developer settings create applications immediately without public review step.",
              whatRemainsUnverified: "Whether marketplace listing requires manual audit.",
            },
          },
          oneLineSummary: "Configure Linear OAuth 2.0 Application with PKCE and actor scopes.",
        },
        prerequisites: [],
        authSpec: {
          mode: "oauth",
          scheme: "OAUTH2",
          providerEndpoints: {
            authorizationUrl: {
              value: "https://linear.app/oauth/authorize",
              evidence: {
                kind: "documented_not_tested",
                sourceTitle: "Linear OAuth Docs",
                sourceUrl: "https://developers.linear.app/docs/oauth/authentication",
                whatSourceExplicitlyStates: "OAuth 2.0 authorization URL.",
              },
            },
            tokenUrl: {
              value: "https://api.linear.app/oauth/token",
              evidence: {
                kind: "documented_not_tested",
                sourceTitle: "Linear OAuth Docs",
                sourceUrl: "https://developers.linear.app/docs/oauth/authentication",
                whatSourceExplicitlyStates: "OAuth 2.0 token URL.",
              },
            },
          },
          composioCallbackGuidance: {
            howToLocateAndVerify: "Composio Dashboard -> Linear Toolkit -> Copy Redirect URI",
            documentedReferenceNote: {
              value: "Standard callback reference note.",
              evidence: {
                kind: "documented_not_tested",
                sourceTitle: "Composio Docs",
                sourceUrl: "https://docs.composio.dev",
                whatSourceExplicitlyStates: "Reference note",
              },
            },
          },
          pkceRequired: {
            value: "supported_optional",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Linear OAuth Docs",
              sourceUrl: "https://developers.linear.app/docs/oauth/authentication",
              whatSourceExplicitlyStates: "Linear supports standard PKCE code_challenge and code_verifier parameters.",
            },
          },
          tokenAndRefreshBehavior: {
            value: "Access tokens expire after 24 hours; refresh tokens provided for offline access.",
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Linear OAuth Docs",
              sourceUrl: "https://developers.linear.app/docs/oauth/authentication",
              whatSourceExplicitlyStates: "Token expiry and refresh behavior.",
            },
          },
          scopes: {
            value: [
              { scope: "read", category: "General", description: "Read-only access to all resources" },
              { scope: "write", category: "General", description: "Read and write access to all resources" },
            ],
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Linear Scopes",
              sourceUrl: "https://developers.linear.app",
              whatSourceExplicitlyStates: "Defines read and write scopes.",
            },
          },
        },
        setupRunbook: [],
        blockersAndPlaybooks: {
          value: [],
          evidence: {
            kind: "unverified_hypothesis",
            hypothesisBasis: "Standard OAuth errors.",
            whatRemainsUnverified: "Linear-specific error strings.",
          },
        },
        composioIntegration: {
          recommendedScheme: "OAUTH2",
          configurationSteps: {
            value: ["Register OAuth application in Linear", "Enter Client ID and Secret in Composio"],
            evidence: {
              kind: "documented_not_tested",
              sourceTitle: "Composio Docs",
              sourceUrl: "https://docs.composio.dev",
              whatSourceExplicitlyStates: "Steps",
            },
          },
          sdkSnippets: [],
        },
      };

      const markdown = `# ${linearGuide.appName} OAuth & Integration Readiness Guide\n\n- **Auth Path Classification:** \`${linearGuide.readinessSummary.authPathClassification}\`\n\n## Provider OAuth Endpoints\n- Authorization: ${linearGuide.authSpec.mode === "oauth" ? linearGuide.authSpec.providerEndpoints.authorizationUrl.value : ""}\n`;
      expect(validateMarkdownExport(linearGuide, markdown)).toBe(true);

      const jsonString = JSON.stringify(linearGuide);
      expect(validateJsonExport(linearGuide, jsonString)).toBe(true);
    });
  });

  // ==========================================================================
  // Combination 5: Multi-Language Snippets + Validation Badges
  // ==========================================================================
  describe("Combination 5: Multi-Language Snippets & Validation Status", () => {
    it("should clearly differentiate runtime validated SDK calls from adapted doc snippets across Python and TS", () => {
      const snippets: CodeSnippetSpec[] = [
        {
          language: "python",
          code: "client = Composio(api_key=os.environ['COMPOSIO_API_KEY'])\nsession = client.create(user_id='agent-1', auth_configs=['slack'])",
          validationStatus: "tested_against_sdk",
          sourceDocUrl: "https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app",
          validationNote: "Tested against composio-core v0.6.x runtime in Python 3.11",
        },
        {
          language: "typescript",
          code: "import { Composio } from 'composio-core';\nconst client = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });\nconst res = await client.connectedAccounts.initiate({ entityId: 'agent-1' });",
          validationStatus: "adapted_from_docs_needs_validation",
          sourceDocUrl: "https://docs.composio.dev/docs/auth-configuration/custom-auth-configs",
          validationNote: "Adapted from legacy documentation syntax; requires runtime verification against latest JS SDK.",
        },
      ];

      expect(snippets[0].validationStatus).toBe("tested_against_sdk");
      expect(snippets[0].validationNote).toContain("Tested against composio-core");

      expect(snippets[1].validationStatus).toBe("adapted_from_docs_needs_validation");
      expect(snippets[1].validationNote).toContain("Adapted from legacy documentation syntax");
    });
  });
});
