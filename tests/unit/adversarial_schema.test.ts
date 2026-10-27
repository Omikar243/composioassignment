import { describe, it, expect } from "vitest";
import {
  ClaimEvidence,
  isIndependentlyTested,
  ConditionalAuthSpec,
  OAuthProtocolSpec,
  DirectCredentialSpec,
  HybridAuthSpec,
  IntegrationReadinessGuide,
} from "../../src/types/guide";
import {
  getCuratedGuide,
  CURATED_GUIDES,
  GITHUB_GUIDE,
  SLACK_GUIDE,
  GOOGLE_WORKSPACE_GUIDE,
  NOTION_GUIDE,
  PERPLEXITY_GUIDE,
} from "../../src/data/curatedGuides";

describe("Adversarial Stress Test: Type Discrimination and Compiler Invariants", () => {
  it("verifies TypeScript compiler statically forbids invalid or contradictory ClaimEvidence discriminants", () => {
    // 1. Tested live valid form
    const validLive: ClaimEvidence = {
      kind: "tested_live",
      testedAt: "2026-10-27T20:00:00Z",
      whatWasPerformed: "Executed API call",
      observedOutcome: "HTTP 200 OK",
    };
    expect(validLive.kind).toBe("tested_live");

    // 2. Reject unknown kind
    // @ts-expect-error - 'fabricated_kind' is not assignable to ClaimEvidence
    const invalidKind: ClaimEvidence = { kind: "fabricated_kind" };
    expect(invalidKind.kind).toBe("fabricated_kind");

    // 3. Reject tested_live missing mandatory observedOutcome
    // @ts-expect-error - Property 'observedOutcome' is missing in type
    const missingOutcome: ClaimEvidence = {
      kind: "tested_live",
      testedAt: "2026-10-27T20:00:00Z",
      whatWasPerformed: "Executed API call",
    };
    expect(missingOutcome.kind).toBe("tested_live");

    // 4. Reject documented_not_tested missing sourceUrl and whatSourceExplicitlyStates
    // @ts-expect-error - Properties 'sourceUrl' and 'whatSourceExplicitlyStates' are missing
    const missingDocFields: ClaimEvidence = {
      kind: "documented_not_tested",
      sourceTitle: "Some Doc",
    };
    expect(missingDocFields.kind).toBe("documented_not_tested");

    // 5. Reject unverified_hypothesis missing whatRemainsUnverified
    // @ts-expect-error - Property 'whatRemainsUnverified' is missing
    const missingHypothesisFields: ClaimEvidence = {
      kind: "unverified_hypothesis",
      hypothesisBasis: "Guessed from form",
    };
    expect(missingHypothesisFields.kind).toBe("unverified_hypothesis");
  });

  it("verifies TypeScript compiler statically forbids contradictory auth spec modes", () => {
    // Direct credential spec should NOT allow providerEndpoints
    const invalidDirectSpec: DirectCredentialSpec = {
      mode: "direct_credential",
      scheme: "API_KEY",
      credentialLabel: "API Key",
      whyOAuthIsNotRequired: "OAuth setup isn't required",
      headerOrParamFormat: {
        value: "Authorization: Bearer <key>",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Docs",
          sourceUrl: "https://example.com",
          whatSourceExplicitlyStates: "Use header",
        },
      },
      rotationAndExpiryRules: {
        value: "Never expires",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Docs",
          sourceUrl: "https://example.com",
          whatSourceExplicitlyStates: "No expiry",
        },
      },
      // @ts-expect-error - Object literal may only specify known properties, and 'providerEndpoints' does not exist in DirectCredentialSpec
      providerEndpoints: {
        authorizationUrl: {
          value: "https://example.com/oauth",
          evidence: { kind: "unverified_hypothesis", hypothesisBasis: "none", whatRemainsUnverified: "all" },
        },
      },
    };
    expect(invalidDirectSpec.mode).toBe("direct_credential");
  });
});

describe("Adversarial Stress Test: isIndependentlyTested Type Guard", () => {
  it("strictly evaluates tested_live as true", () => {
    const live: ClaimEvidence = {
      kind: "tested_live",
      testedAt: "2026-10-27T20:00:00Z",
      whatWasPerformed: "Created OAuth client in Google Console",
      observedOutcome: "100-user testing cap immediately enforced",
    };
    expect(isIndependentlyTested(live)).toBe(true);
  });

  it("strictly evaluates documented_not_tested as false", () => {
    const documented: ClaimEvidence = {
      kind: "documented_not_tested",
      sourceTitle: "Slack API Docs",
      sourceUrl: "https://api.slack.com",
      whatSourceExplicitlyStates: "Redirect URL must not contain URL fragments (#)",
    };
    expect(isIndependentlyTested(documented)).toBe(false);
  });

  it("strictly evaluates unverified_hypothesis as false", () => {
    const hypothesis: ClaimEvidence = {
      kind: "unverified_hypothesis",
      hypothesisBasis: "Estimated from form complexity",
      whatRemainsUnverified: "Actual review turnaround time",
    };
    expect(isIndependentlyTested(hypothesis)).toBe(false);
  });

  it("strictly rejects malformed runtime evidence objects without throwing", () => {
    // Malformed casing
    expect(isIndependentlyTested({ kind: "TESTED_LIVE" } as unknown as ClaimEvidence)).toBe(false);
    expect(isIndependentlyTested({ kind: "tested_live " } as unknown as ClaimEvidence)).toBe(false);
    expect(isIndependentlyTested({ kind: "unknown" } as unknown as ClaimEvidence)).toBe(false);
    expect(isIndependentlyTested({} as unknown as ClaimEvidence)).toBe(false);
  });

  it("demonstrates lack of null-safety when null/undefined is passed at runtime", () => {
    // Documenting empirical behavior: isIndependentlyTested(null) crashes with TypeError
    expect(() => isIndependentlyTested(null as unknown as ClaimEvidence)).toThrow(TypeError);
    expect(() => isIndependentlyTested(undefined as unknown as ClaimEvidence)).toThrow(TypeError);
  });
});

describe("Adversarial Stress Test: getCuratedGuide Lookup, Invariants, and Integrity", () => {
  it("handles case-insensitivity, leading/trailing whitespace, and alias formatting", () => {
    // Case insensitivity
    expect(getCuratedGuide("github")).toBe(GITHUB_GUIDE);
    expect(getCuratedGuide("GitHub")).toBe(GITHUB_GUIDE);
    expect(getCuratedGuide("GITHUB")).toBe(GITHUB_GUIDE);
    expect(getCuratedGuide("gItHuB")).toBe(GITHUB_GUIDE);

    // Whitespace trimming
    expect(getCuratedGuide("  github  ")).toBe(GITHUB_GUIDE);
    expect(getCuratedGuide("\tslack\n")).toBe(SLACK_GUIDE);

    // Hyphen and underscore aliases
    expect(getCuratedGuide("google_workspace")).toBe(GOOGLE_WORKSPACE_GUIDE);
    expect(getCuratedGuide("google-workspace")).toBe(GOOGLE_WORKSPACE_GUIDE);
    expect(getCuratedGuide("GOOGLE-WORKSPACE")).toBe(GOOGLE_WORKSPACE_GUIDE);
    expect(getCuratedGuide("GOOGLE_WORKSPACE")).toBe(GOOGLE_WORKSPACE_GUIDE);
  });

  it("returns undefined for benign nonexistent IDs", () => {
    expect(getCuratedGuide("")).toBeUndefined();
    expect(getCuratedGuide("   ")).toBeUndefined();
    expect(getCuratedGuide("salesforce")).toBeUndefined();
    expect(getCuratedGuide("unknown_app")).toBeUndefined();
    expect(getCuratedGuide("google")).toBeUndefined(); // Partial name without workspace
  });

  it("verifies prototype collision immunity on Object prototype keys ('constructor', '__proto__', etc.)", () => {
    // When queried with JavaScript Object prototype properties, getCuratedGuide guards lookup
    // with hasOwnProperty check so prototype properties are never returned as guides.
    const constructorResult = getCuratedGuide("constructor");
    const protoResult = getCuratedGuide("__proto__");
    const toStringResult = getCuratedGuide("toString");
    const valueOfResult = getCuratedGuide("valueOf");
    const hasOwnResult = getCuratedGuide("hasOwnProperty");

    expect(constructorResult).toBeUndefined();
    expect(protoResult).toBeUndefined();
    expect(toStringResult).toBeUndefined();
    expect(valueOfResult).toBeUndefined();
    expect(hasOwnResult).toBeUndefined();
  });

  it("verifies guide immutability and reference integrity via deepFreeze", () => {
    // Verifies that getCuratedGuide returns deeply frozen objects and underlying singletons are immutable
    const guide1 = getCuratedGuide("github");
    expect(guide1).toBeDefined();

    // Check that the returned guide and its nested structures are deeply frozen
    expect(Object.isFrozen(guide1)).toBe(true);
    expect(Object.isFrozen(guide1?.readinessSummary)).toBe(true);
    expect(Object.isFrozen(guide1?.setupRunbook)).toBe(true);
    expect(Object.isFrozen(guide1?.setupRunbook[0])).toBe(true);
    expect(Object.isFrozen(GITHUB_GUIDE)).toBe(true);

    // Verify mutating the returned reference throws and does not corrupt the guide
    if (guide1) {
      expect(() => {
        (guide1 as any).appName = "TAMPERED_APP_NAME";
      }).toThrow();
      expect(GITHUB_GUIDE.appName).toBe("GitHub");
    }
  });


  it("verifies all 5 curated guides retain schema integrity and complete metadata", () => {
    const guides = [GITHUB_GUIDE, SLACK_GUIDE, GOOGLE_WORKSPACE_GUIDE, NOTION_GUIDE, PERPLEXITY_GUIDE];

    for (const guide of guides) {
      expect(guide.appId).toBeDefined();
      expect(guide.appName).toBeDefined();
      expect(guide.websiteUrl).toBeDefined();
      expect(guide.supportedAuthSchemes.value.length).toBeGreaterThan(0);
      expect(guide.supportedAuthSchemes.evidence).toBeDefined();
      expect(guide.composioManagedAuthStatus.value).toBeDefined();
      expect(guide.readinessSummary.authPathClassification).toBeDefined();
      expect(guide.readinessSummary.oauthNecessityBanner).toBeDefined();
      expect(guide.readinessSummary.activeSetupTime.evidence.kind).toBeDefined();
      expect(guide.readinessSummary.approvalWaitTime.evidence.kind).toBeDefined();
      expect(guide.setupRunbook.length).toBeGreaterThan(0);
      expect(guide.blockersAndPlaybooks.value.length).toBeGreaterThan(0);
      expect(guide.composioIntegration.sdkSnippets.length).toBeGreaterThan(0);

      // Verify that activeSetupTime and approvalWaitTime strictly adhere to ClaimEvidence
      const setupKind = guide.readinessSummary.activeSetupTime.evidence.kind;
      expect(["tested_live", "documented_not_tested", "unverified_hypothesis"]).toContain(setupKind);

      const approvalKind = guide.readinessSummary.approvalWaitTime.evidence.kind;
      expect(["tested_live", "documented_not_tested", "unverified_hypothesis"]).toContain(approvalKind);
    }
  });
});
