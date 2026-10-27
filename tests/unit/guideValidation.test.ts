import { describe, it, expect } from "vitest";
import {
  curatedGuides,
  GITHUB_GUIDE,
  SLACK_GUIDE,
  GOOGLE_WORKSPACE_GUIDE,
  NOTION_GUIDE,
  PERPLEXITY_GUIDE,
} from "../../src/data/curatedGuides";
import { StepActor, SetupStep } from "../../src/types/guide";

const VALID_ACTORS: StepActor[] = [
  "agent_prepared",
  "developer_portal_action",
  "provider_review_gate",
];

describe("Empirical Verification of Curated Guides Data Boundaries", () => {
  describe("Requirement 1: SetupStep Objects Validation for All 5 Guides", () => {
    it("confirms there are exactly 5 curated guides", () => {
      expect(curatedGuides).toHaveLength(5);
      const appIds = curatedGuides.map((g) => g.appId).sort();
      expect(appIds).toEqual([
        "github",
        "google_workspace",
        "notion",
        "perplexity",
        "slack",
      ]);
    });

    curatedGuides.forEach((guide) => {
      describe(`Guide: ${guide.appName} (${guide.appId})`, () => {
        it("has a non-empty setupRunbook array", () => {
          expect(Array.isArray(guide.setupRunbook)).toBe(true);
          expect(guide.setupRunbook.length).toBeGreaterThan(0);
        });

        it("ensures all SetupSteps have valid stepNumber, non-empty title, and valid actor", () => {
          guide.setupRunbook.forEach((step: SetupStep, index: number) => {
            // Validate stepNumber
            expect(typeof step.stepNumber).toBe("number");
            expect(Number.isInteger(step.stepNumber)).toBe(true);
            expect(step.stepNumber).toBeGreaterThan(0);
            expect(step.stepNumber).toBe(index + 1); // strictly sequential 1-based indexing

            // Validate title
            expect(typeof step.title).toBe("string");
            expect(step.title.trim().length).toBeGreaterThan(0);

            // Validate actor
            expect(VALID_ACTORS).toContain(step.actor);

            // Validate instructions
            expect(Array.isArray(step.instructions)).toBe(true);
            expect(step.instructions.length).toBeGreaterThan(0);
            step.instructions.forEach((instruction) => {
              expect(typeof instruction).toBe("string");
              expect(instruction.trim().length).toBeGreaterThan(0);
            });

            // Validate estimatedDuration
            expect(step.estimatedDuration).toBeDefined();
            expect(typeof step.estimatedDuration.value).toBe("string");
            expect(step.estimatedDuration.evidence).toBeDefined();
            expect([
              "tested_live",
              "documented_not_tested",
              "unverified_hypothesis",
            ]).toContain(step.estimatedDuration.evidence.kind);
          });
        });
      });
    });
  });

  describe("Requirement 2: Perplexity Guide (direct_credential_only)", () => {
    it("has authPathClassification direct_credential_only", () => {
      expect(PERPLEXITY_GUIDE.readinessSummary.authPathClassification).toBe(
        "direct_credential_only"
      );
    });

    it("has authSpec.mode === 'direct_credential'", () => {
      expect(PERPLEXITY_GUIDE.authSpec.mode).toBe("direct_credential");
    });

    it("ensures providerEndpoints property does not exist on authSpec", () => {
      expect("providerEndpoints" in PERPLEXITY_GUIDE.authSpec).toBe(false);
      expect((PERPLEXITY_GUIDE.authSpec as any).providerEndpoints).toBeUndefined();
    });

    it("specifies direct credential scheme and why OAuth is not required", () => {
      if (PERPLEXITY_GUIDE.authSpec.mode === "direct_credential") {
        expect(PERPLEXITY_GUIDE.authSpec.scheme).toBe("API_KEY");
        expect(PERPLEXITY_GUIDE.authSpec.credentialLabel).toBe("API Key (pplx-...)");
        expect(PERPLEXITY_GUIDE.authSpec.whyOAuthIsNotRequired).toContain(
          "OAuth setup isn't required for this integration path"
        );
        expect(PERPLEXITY_GUIDE.authSpec.headerOrParamFormat.value).toContain(
          "Authorization: Bearer"
        );
      }
    });
  });

  describe("Requirement 3: GitHub & Notion Guides (hybrid_oauth_or_direct)", () => {
    describe("GitHub Guide", () => {
      it("has authPathClassification hybrid_oauth_or_direct", () => {
        expect(GITHUB_GUIDE.readinessSummary.authPathClassification).toBe(
          "hybrid_oauth_or_direct"
        );
      });

      it("has authSpec.mode === 'hybrid'", () => {
        expect(GITHUB_GUIDE.authSpec.mode).toBe("hybrid");
      });

      it("has both directCredentialPath and oauthPath populated", () => {
        if (GITHUB_GUIDE.authSpec.mode === "hybrid") {
          expect(GITHUB_GUIDE.authSpec.directCredentialPath).toBeDefined();
          expect(GITHUB_GUIDE.authSpec.directCredentialPath.mode).toBe(
            "direct_credential"
          );
          expect(GITHUB_GUIDE.authSpec.directCredentialPath.scheme).toBe(
            "BEARER_TOKEN"
          );

          expect(GITHUB_GUIDE.authSpec.oauthPath).toBeDefined();
          expect(GITHUB_GUIDE.authSpec.oauthPath.mode).toBe("oauth");
          expect(GITHUB_GUIDE.authSpec.oauthPath.scheme).toBe("OAUTH2");
          expect(
            GITHUB_GUIDE.authSpec.oauthPath.providerEndpoints.authorizationUrl.value
          ).toBe("https://github.com/login/oauth/authorize");
          expect(
            GITHUB_GUIDE.authSpec.oauthPath.providerEndpoints.tokenUrl.value
          ).toBe("https://github.com/login/oauth/access_token");
        }
      });
    });

    describe("Notion Guide", () => {
      it("has authPathClassification hybrid_oauth_or_direct", () => {
        expect(NOTION_GUIDE.readinessSummary.authPathClassification).toBe(
          "hybrid_oauth_or_direct"
        );
      });

      it("has authSpec.mode === 'hybrid'", () => {
        expect(NOTION_GUIDE.authSpec.mode).toBe("hybrid");
      });

      it("has both directCredentialPath and oauthPath populated", () => {
        if (NOTION_GUIDE.authSpec.mode === "hybrid") {
          expect(NOTION_GUIDE.authSpec.directCredentialPath).toBeDefined();
          expect(NOTION_GUIDE.authSpec.directCredentialPath.mode).toBe(
            "direct_credential"
          );
          expect(NOTION_GUIDE.authSpec.directCredentialPath.scheme).toBe(
            "BEARER_TOKEN"
          );

          expect(NOTION_GUIDE.authSpec.oauthPath).toBeDefined();
          expect(NOTION_GUIDE.authSpec.oauthPath.mode).toBe("oauth");
          expect(NOTION_GUIDE.authSpec.oauthPath.scheme).toBe("OAUTH2");
          expect(
            NOTION_GUIDE.authSpec.oauthPath.providerEndpoints.authorizationUrl.value
          ).toBe("https://api.notion.com/v1/oauth/authorize");
          expect(
            NOTION_GUIDE.authSpec.oauthPath.providerEndpoints.tokenUrl.value
          ).toBe("https://api.notion.com/v1/oauth/token");
        }
      });
    });
  });

  describe("Requirement 4: Slack & Google Workspace Guides (oauth_required)", () => {
    describe("Slack Guide", () => {
      it("has authPathClassification oauth_required", () => {
        expect(SLACK_GUIDE.readinessSummary.authPathClassification).toBe(
          "oauth_required"
        );
      });

      it("has authSpec.mode === 'oauth'", () => {
        expect(SLACK_GUIDE.authSpec.mode).toBe("oauth");
      });

      it("has valid authorizationUrl and tokenUrl (HTTPS, non-empty, no '#')", () => {
        if (SLACK_GUIDE.authSpec.mode === "oauth") {
          const { authorizationUrl, tokenUrl } =
            SLACK_GUIDE.authSpec.providerEndpoints;

          expect(authorizationUrl).toBeDefined();
          expect(authorizationUrl.value).toBe(
            "https://slack.com/oauth/v2/authorize"
          );
          expect(authorizationUrl.value.startsWith("https://")).toBe(true);
          expect(authorizationUrl.value.includes("#")).toBe(false);

          expect(tokenUrl).toBeDefined();
          expect(tokenUrl.value).toBe("https://slack.com/api/oauth.v2.access");
          expect(tokenUrl.value.startsWith("https://")).toBe(true);
          expect(tokenUrl.value.includes("#")).toBe(false);
        }
      });
    });

    describe("Google Workspace Guide", () => {
      it("has authPathClassification oauth_required", () => {
        expect(GOOGLE_WORKSPACE_GUIDE.readinessSummary.authPathClassification).toBe(
          "oauth_required"
        );
      });

      it("has authSpec.mode === 'oauth'", () => {
        expect(GOOGLE_WORKSPACE_GUIDE.authSpec.mode).toBe("oauth");
      });

      it("has valid authorizationUrl and tokenUrl (HTTPS, non-empty, no '#')", () => {
        if (GOOGLE_WORKSPACE_GUIDE.authSpec.mode === "oauth") {
          const { authorizationUrl, tokenUrl } =
            GOOGLE_WORKSPACE_GUIDE.authSpec.providerEndpoints;

          expect(authorizationUrl).toBeDefined();
          expect(authorizationUrl.value).toBe(
            "https://accounts.google.com/o/oauth2/v2/auth"
          );
          expect(authorizationUrl.value.startsWith("https://")).toBe(true);
          expect(authorizationUrl.value.includes("#")).toBe(false);

          expect(tokenUrl).toBeDefined();
          expect(tokenUrl.value).toBe("https://oauth2.googleapis.com/token");
          expect(tokenUrl.value.startsWith("https://")).toBe(true);
          expect(tokenUrl.value.includes("#")).toBe(false);
        }
      });
    });
  });

  describe("Adversarial Stress Testing: Edge cases and invariants", () => {
    it("ensures no SetupStep across any guide has empty strings or malformed URLs", () => {
      for (const guide of curatedGuides) {
        for (const step of guide.setupRunbook) {
          expect(step.title.length).toBeGreaterThan(3);
          expect(step.instructions.length).toBeGreaterThan(0);
          if (step.portalUrl) {
            expect(step.portalUrl).toMatch(/^https:\/\//);
            expect(step.portalUrl).not.toContain("#");
          }
          if (step.copyableAssets) {
            for (const asset of step.copyableAssets) {
              expect(asset.label.trim().length).toBeGreaterThan(0);
              expect(asset.value.trim().length).toBeGreaterThan(0);
            }
          }
        }
      }
    });

    it("verifies providerEndpoints are absent on all directCredential paths", () => {
      // Perplexity
      expect("providerEndpoints" in PERPLEXITY_GUIDE.authSpec).toBe(false);

      // GitHub direct credential branch
      if (GITHUB_GUIDE.authSpec.mode === "hybrid") {
        expect("providerEndpoints" in GITHUB_GUIDE.authSpec.directCredentialPath).toBe(false);
      }

      // Notion direct credential branch
      if (NOTION_GUIDE.authSpec.mode === "hybrid") {
        expect("providerEndpoints" in NOTION_GUIDE.authSpec.directCredentialPath).toBe(false);
      }
    });

    it("verifies directCredentialPath does not exist on oauth_required guides", () => {
      expect("directCredentialPath" in SLACK_GUIDE.authSpec).toBe(false);
      expect("directCredentialPath" in GOOGLE_WORKSPACE_GUIDE.authSpec).toBe(false);
    });

    it("verifies full step inventory breakdown by actor across all 5 guides", () => {
      const actorCounts: Record<StepActor, number> = {
        agent_prepared: 0,
        developer_portal_action: 0,
        provider_review_gate: 0,
      };

      for (const guide of curatedGuides) {
        for (const step of guide.setupRunbook) {
          actorCounts[step.actor]++;
        }
      }

      // Ensure actor categories used in the runbook are valid
      expect(actorCounts.agent_prepared).toBeGreaterThan(0);
      expect(actorCounts.developer_portal_action).toBeGreaterThan(0);
      // All actors must be within the valid StepActor union
      for (const guide of curatedGuides) {
        for (const step of guide.setupRunbook) {
          expect(VALID_ACTORS).toContain(step.actor);
        }
      }

      // Verify specific expected step counts per guide
      expect(GITHUB_GUIDE.setupRunbook.length).toBe(5);
      expect(SLACK_GUIDE.setupRunbook.length).toBe(6);
      expect(GOOGLE_WORKSPACE_GUIDE.setupRunbook.length).toBe(6);
      expect(NOTION_GUIDE.setupRunbook.length).toBe(5);
      expect(PERPLEXITY_GUIDE.setupRunbook.length).toBe(4);
    });

    it("verifies providerEndpoints isolation from composio callback guidance", () => {
      const oauthGuides = [SLACK_GUIDE, GOOGLE_WORKSPACE_GUIDE];
      for (const guide of oauthGuides) {
        if (guide.authSpec.mode === "oauth") {
          const { providerEndpoints, composioCallbackGuidance } = guide.authSpec;
          expect(providerEndpoints.authorizationUrl.value).toBeDefined();
          expect(providerEndpoints.tokenUrl.value).toBeDefined();
          expect(composioCallbackGuidance.howToLocateAndVerify).toBeDefined();
          expect(composioCallbackGuidance.documentedReferenceNote).toBeDefined();
          // Verify provider endpoints do not contain composio.dev URLs
          expect(providerEndpoints.authorizationUrl.value).not.toContain("composio.dev");
          expect(providerEndpoints.tokenUrl.value).not.toContain("composio.dev");
        }
      }
    });
  });
});
