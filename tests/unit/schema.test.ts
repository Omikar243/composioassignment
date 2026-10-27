import { describe, it, expect } from "vitest";
import {
  isIndependentlyTested,
  ClaimEvidence,
} from "../../src/types/guide";
import {
  curatedGuides,
  CURATED_GUIDES,
  getCuratedGuide,
  GITHUB_GUIDE,
  SLACK_GUIDE,
  GOOGLE_WORKSPACE_GUIDE,
  NOTION_GUIDE,
  PERPLEXITY_GUIDE,
} from "../../src/data/curatedGuides";

describe("ClaimEvidence and isIndependentlyTested", () => {
  it("correctly identifies tested_live as independently tested", () => {
    const liveEvidence: ClaimEvidence = {
      kind: "tested_live",
      testedAt: "2026-10-27T20:00:00Z",
      whatWasPerformed: "Registered OAuth App in developer portal",
      observedOutcome: "Received Client ID instantly",
    };
    expect(isIndependentlyTested(liveEvidence)).toBe(true);
  });

  it("correctly identifies documented_not_tested as not independently tested", () => {
    const docEvidence: ClaimEvidence = {
      kind: "documented_not_tested",
      sourceTitle: "Official Docs",
      sourceUrl: "https://example.com/docs",
      whatSourceExplicitlyStates: "Redirect URIs must use HTTPS",
    };
    expect(isIndependentlyTested(docEvidence)).toBe(false);
  });

  it("correctly identifies unverified_hypothesis as not independently tested", () => {
    const hypEvidence: ClaimEvidence = {
      kind: "unverified_hypothesis",
      hypothesisBasis: "Estimated from form complexity",
      whatRemainsUnverified: "Actual user completion time",
    };
    expect(isIndependentlyTested(hypEvidence)).toBe(false);
  });
});

describe("Curated Guides Invariants", () => {
  it("contains exactly 5 curated guides in the canonical list", () => {
    expect(curatedGuides).toHaveLength(5);
    expect(Object.keys(CURATED_GUIDES).length).toBeGreaterThanOrEqual(5);
  });

  it("provides fast lookup via getCuratedGuide with case and alias support", () => {
    expect(getCuratedGuide("github")).toBe(GITHUB_GUIDE);
    expect(getCuratedGuide("GITHUB")).toBe(GITHUB_GUIDE);
    expect(getCuratedGuide("slack")).toBe(SLACK_GUIDE);
    expect(getCuratedGuide("google_workspace")).toBe(GOOGLE_WORKSPACE_GUIDE);
    expect(getCuratedGuide("google-workspace")).toBe(GOOGLE_WORKSPACE_GUIDE);
    expect(getCuratedGuide("notion")).toBe(NOTION_GUIDE);
    expect(getCuratedGuide("perplexity")).toBe(PERPLEXITY_GUIDE);
    expect(getCuratedGuide("nonexistent")).toBeUndefined();
  });

  it("enforces that all curated guides have valid non-empty fields", () => {
    for (const guide of curatedGuides) {
      expect(guide.appId).toBeTruthy();
      expect(guide.appName).toBeTruthy();
      expect(guide.websiteUrl).toMatch(/^https?:\/\//);
      expect(guide.readinessSummary.authPathClassification).toBeTruthy();
      expect(guide.readinessSummary.oauthNecessityBanner).toBeTruthy();
      expect(guide.readinessSummary.activeSetupTime.value).toBeTruthy();
      expect(guide.readinessSummary.activeSetupTime.evidence.kind).toBeTruthy();
      expect(guide.readinessSummary.approvalWaitTime.value).toBeTruthy();
      expect(guide.readinessSummary.approvalWaitTime.evidence.kind).toBeTruthy();
      expect(guide.setupRunbook.length).toBeGreaterThan(0);
      expect(guide.blockersAndPlaybooks.value.length).toBeGreaterThan(0);
      expect(guide.composioIntegration.sdkSnippets.length).toBeGreaterThan(0);
    }
  });

  describe("GitHub Guide Specifics", () => {
    it("is classified as hybrid_oauth_or_direct with both direct and oauth specs", () => {
      expect(GITHUB_GUIDE.readinessSummary.authPathClassification).toBe("hybrid_oauth_or_direct");
      expect(GITHUB_GUIDE.authSpec.mode).toBe("hybrid");
      if (GITHUB_GUIDE.authSpec.mode === "hybrid") {
        expect(GITHUB_GUIDE.authSpec.directCredentialPath.scheme).toBe("BEARER_TOKEN");
        expect(GITHUB_GUIDE.authSpec.oauthPath.scheme).toBe("OAUTH2");
        expect(GITHUB_GUIDE.authSpec.oauthPath.providerEndpoints.authorizationUrl.value).toBe(
          "https://github.com/login/oauth/authorize"
        );
        expect(GITHUB_GUIDE.authSpec.oauthPath.tokenAndRefreshBehavior.value).toContain(
          "8-hour lifetime"
        );
      }
    });

    it("labels setup duration as unverified_hypothesis", () => {
      expect(GITHUB_GUIDE.readinessSummary.activeSetupTime.evidence.kind).toBe("unverified_hypothesis");
    });
  });

  describe("Slack Guide Specifics", () => {
    it("is classified as oauth_required with no '#' fragments in endpoints", () => {
      expect(SLACK_GUIDE.readinessSummary.authPathClassification).toBe("oauth_required");
      expect(SLACK_GUIDE.authSpec.mode).toBe("oauth");
      if (SLACK_GUIDE.authSpec.mode === "oauth") {
        expect(SLACK_GUIDE.authSpec.providerEndpoints.authorizationUrl.value).not.toContain("#");
        expect(SLACK_GUIDE.authSpec.providerEndpoints.authorizationUrl.value).toMatch(/^https:\/\//);
      }
    });

    it("includes multi-workspace invalid_team_for_non_distributed_app blocker", () => {
      const blockers = SLACK_GUIDE.blockersAndPlaybooks.value;
      const distBlocker = blockers.find((b) =>
        b.blockerTitle.includes("invalid_team_for_non_distributed_app")
      );
      expect(distBlocker).toBeDefined();
    });
  });

  describe("Google Workspace Guide Specifics", () => {
    it("categorizes scopes into non-sensitive, sensitive, and restricted", () => {
      expect(GOOGLE_WORKSPACE_GUIDE.readinessSummary.authPathClassification).toBe("oauth_required");
      if (GOOGLE_WORKSPACE_GUIDE.authSpec.mode === "oauth") {
        const scopes = GOOGLE_WORKSPACE_GUIDE.authSpec.scopes.value;
        const categories = scopes.map((s) => s.category);
        expect(categories).toContain("Non-Sensitive");
        expect(categories).toContain("Sensitive");
        expect(categories).toContain("Restricted");
      }
    });

    it("documents 100-user testing cap and CASA Tier 2 audit hypothesis", () => {
      const blockers = GOOGLE_WORKSPACE_GUIDE.blockersAndPlaybooks.value;
      const casaBlocker = blockers.find((b) => b.blockerTitle.includes("CASA"));
      expect(casaBlocker).toBeDefined();
      const testUserBlocker = blockers.find((b) => b.blockerTitle.includes("403"));
      expect(testUserBlocker).toBeDefined();
    });
  });

  describe("Notion Guide Specifics", () => {
    it("is classified as hybrid with internal connection and public connection paths", () => {
      expect(NOTION_GUIDE.readinessSummary.authPathClassification).toBe("hybrid_oauth_or_direct");
      expect(NOTION_GUIDE.authSpec.mode).toBe("hybrid");
    });

    it("warns about permanent installation scope lock-in", () => {
      const step2 = NOTION_GUIDE.setupRunbook.find((s) => s.stepNumber === 2);
      expect(step2?.commonPitfall?.value).toContain("PERMANENT at creation time");
    });

    it("includes object_not_found (404) page sharing blocker", () => {
      const blockers = NOTION_GUIDE.blockersAndPlaybooks.value;
      const notFoundBlocker = blockers.find((b) => b.blockerTitle.includes("object_not_found"));
      expect(notFoundBlocker).toBeDefined();
    });
  });

  describe("Perplexity Guide Specifics", () => {
    it("is classified as direct_credential_only with zero oauth endpoints", () => {
      expect(PERPLEXITY_GUIDE.readinessSummary.authPathClassification).toBe("direct_credential_only");
      expect(PERPLEXITY_GUIDE.authSpec.mode).toBe("direct_credential");
      expect(PERPLEXITY_GUIDE.readinessSummary.oauthNecessityBanner).toContain(
        "OAuth setup isn't required for this integration path"
      );
      expect(PERPLEXITY_GUIDE.composioManagedAuthStatus.value).toBe("bring_your_own_required");
    });

    it("does not expose providerEndpoints property on direct_credential mode", () => {
      const spec = PERPLEXITY_GUIDE.authSpec;
      expect("providerEndpoints" in spec).toBe(false);
    });
  });
});
