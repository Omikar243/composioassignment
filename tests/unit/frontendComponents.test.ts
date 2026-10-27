import { describe, it, expect } from "vitest";
import { generateGuideMarkdown } from "../../src/components/ExportEngine";
import { resolveProviderDocumentationUrl } from "../../src/utils/providerDocumentation";
import { buildInvestigationAnalysis } from "../../src/utils/investigationRationale";
import {
  curatedGuides,
  GITHUB_GUIDE,
  SLACK_GUIDE,
  GOOGLE_WORKSPACE_GUIDE,
  NOTION_GUIDE,
  PERPLEXITY_GUIDE,
} from "../../src/data/curatedGuides";
import { CATALOG_100_APPS, getCatalogStats } from "../../src/data/catalog100";
import { VERIFICATION_AUDIT_DATA } from "../../src/data/verificationAudit";

describe("Milestone 4: Frontend Components & Export Engine Unit Tests", () => {
  describe("ExportEngine - generateGuideMarkdown", () => {
    it("generates non-empty, well-structured Markdown for all 5 curated guides", () => {
      curatedGuides.forEach((guide) => {
        const md = generateGuideMarkdown(guide);
        expect(typeof md).toBe("string");
        expect(md.length).toBeGreaterThan(500);
        expect(md).toContain(`# ${guide.appName}`);
        expect(md).toContain("## 1. Executive Readiness & Timeline Summary");
        expect(md).toContain("## 2. Prerequisites Checklist");
        expect(md).toContain("## 3. Technical Authentication Specification");
        expect(md).toContain("## 4. Step-by-Step Setup Runbook");
        expect(md).toContain("## 5. Blockers & Troubleshooting Playbooks");
        expect(md).toContain("## 6. Composio SDK Wiring & Code Snippets");
      });
    });

    it("verifies direct_credential_only guide (Perplexity) has zero OAuth endpoints in markdown", () => {
      const md = generateGuideMarkdown(PERPLEXITY_GUIDE);
      expect(md).toContain("Direct Credential Specification (Zero OAuth Endpoints)");
      expect(md).toContain("OAuth setup isn't required for this integration path.");
      expect(md).not.toContain("Zone A: Provider-Owned OAuth Endpoints");
      expect(md).not.toContain("Authorization URL:");
    });

    it("verifies oauth_required guide (Slack) contains strictly isolated zones in markdown", () => {
      const md = generateGuideMarkdown(SLACK_GUIDE);
      expect(md).toContain("Zone A: Provider-Owned OAuth Endpoints");
      expect(md).toContain("Zone B: Composio Callback Guidance");
      expect(md).toContain("https://slack.com/oauth/v2/authorize");
      expect(md).toContain("https://slack.com/api/oauth.v2.access");
      expect(md).toContain("How to Locate in Composio");
    });

    it("verifies hybrid guide (GitHub) includes both direct token and OAuth sections", () => {
      const md = generateGuideMarkdown(GITHUB_GUIDE);
      expect(md).toContain("Hybrid Auth Specification");
      expect(md).toContain("Option 1: Direct Token Path");
      expect(md).toContain("Option 2: Public OAuth 2.0 Path");
    });

    it("verifies epistemic evidence provenance tagging in generated markdown", () => {
      const md = generateGuideMarkdown(GOOGLE_WORKSPACE_GUIDE);
      expect(md).toMatch(/`\[(Tested Live|Documented|Hypothesis): .*\]`/);
    });

    it("renders documented source titles as inline Markdown links", () => {
      const md = generateGuideMarkdown(GITHUB_GUIDE);
      expect(md).toContain(
        "[Documented: GitHub REST API Authentication](<https://docs.github.com/"
      );
    });
  });

  describe("Provider Documentation destination", () => {
    it("prefers a provider documentation source over the provider homepage", () => {
      const url = resolveProviderDocumentationUrl(GITHUB_GUIDE);
      expect(new URL(url).hostname).toBe("docs.github.com");
    });

    it("uses a documentation URL retained in generated hypothesis evidence", () => {
      const generatedGuide = {
        websiteUrl: "https://provider.example",
        summary: {
          evidence: {
            kind: "unverified_hypothesis",
            hypothesisBasis: "The claim was not established from retrieved text.",
            whatRemainsUnverified: "Verify in provider documentation.",
            relatedSourceUrl: "https://provider.example/docs/oauth",
          },
        },
      };
      expect(resolveProviderDocumentationUrl(generatedGuide)).toBe(
        "https://provider.example/docs/oauth"
      );
    });

    it("falls back to the main provider website when no provider docs source exists", () => {
      const generatedGuide = {
        websiteUrl: "https://provider.example",
        summary: {
          evidence: {
            kind: "unverified_hypothesis",
            hypothesisBasis: "No provider docs were found.",
            whatRemainsUnverified: "Consult the provider website.",
            relatedSourceUrl: "https://docs.composio.dev/docs/authentication",
          },
        },
      };
      expect(resolveProviderDocumentationUrl(generatedGuide)).toBe(
        "https://provider.example"
      );
    });
  });

  describe("Evidence-linked investigation rationale", () => {
    it("derives a decision summary, detailed findings, evidence counts, and open questions", () => {
      const analysis = buildInvestigationAnalysis(GITHUB_GUIDE, "gemini_mode_b");
      expect(analysis.engine).toBe("gemini_mode_b");
      expect(analysis.decision).toBe(GITHUB_GUIDE.readinessSummary.authPathClassification);
      expect(analysis.decisionSummary).toBe(GITHUB_GUIDE.readinessSummary.oneLineSummary);
      expect(analysis.findings.length).toBeGreaterThan(0);
      expect(analysis.openQuestions.length).toBeGreaterThan(0);
      expect(
        analysis.evidenceCounts.testedLive +
          analysis.evidenceCounts.documented +
          analysis.evidenceCounts.hypothesis
      ).toBe(analysis.findings.length);
    });

    it("exports the rationale as a labeled synthesis with source-backed findings and unresolved items", () => {
      const guide = {
        ...GITHUB_GUIDE,
        investigationAnalysis: buildInvestigationAnalysis(GITHUB_GUIDE, "gemini_mode_b"),
      };
      const markdown = generateGuideMarkdown(guide);
      expect(markdown).toContain("## Decision Rationale & Evidence Ledger");
      expect(markdown).toContain("not source evidence or private chain-of-thought");
      expect(markdown).toContain("### Detailed findings");
      expect(markdown).toContain("### Still to verify");
    });
  });

  describe("Directory & Catalog Statistics Integration", () => {
    it("computes accurate catalog stats for 100 apps", () => {
      const stats = getCatalogStats(CATALOG_100_APPS);
      expect(stats.totalApps).toBe(100);
      expect(stats.byAuthPath.oauth_required).toBe(50);
      expect(stats.byAuthPath.hybrid_oauth_or_direct).toBe(25);
      expect(stats.byAuthPath.direct_credential_only).toBe(25);
      expect(Object.keys(stats.byCategory)).toHaveLength(10);
      Object.values(stats.byCategory).forEach((count) => {
        expect(count).toBe(10);
      });
    });
  });

  describe("Verification Audit Integrity Verification", () => {
    it("ensures all 6 platforms are represented in audit data with verified sources", () => {
      expect(VERIFICATION_AUDIT_DATA.length).toBe(6);
      VERIFICATION_AUDIT_DATA.forEach((record) => {
        expect(record.sourcesChecked.length).toBeGreaterThan(0);
        expect(record.sourcesChecked.every((s) => s.url.startsWith("https://"))).toBe(true);
        expect(record.documentedFacts.length).toBeGreaterThan(0);
      });
    });
  });
});
