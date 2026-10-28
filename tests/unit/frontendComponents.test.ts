import React from "react";
import * as cheerio from "cheerio";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect, vi } from "vitest";
import { Navbar, type NavbarProps } from "../../src/components/Navbar";
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
      const analysis = buildInvestigationAnalysis(GITHUB_GUIDE, "groq_mode_b");
      expect(analysis.engine).toBe("groq_mode_b");
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
        investigationAnalysis: buildInvestigationAnalysis(GITHUB_GUIDE, "groq_mode_b"),
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
      expect(stats.byAuthPath.oauth_required).toBe(44);
      expect(stats.byAuthPath.hybrid_oauth_or_direct).toBe(31);
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

function findElement(node: any, predicate: (el: any) => boolean): any {
  if (!node || typeof node !== "object") return null;
  if (predicate(node)) return node;
  const children = node.props && node.props.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findElement(child, predicate);
      if (found) return found;
    }
  } else if (children) {
    return findElement(children, predicate);
  }
  return null;
}

function getTextContent(node: any): string {
  if (!node) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getTextContent).join(" ");
  if (node.props?.children) return getTextContent(node.props.children);
  return "";
}

function findButton(tree: any, textOrClass: string): any {
  return findElement(tree, (el: any) => {
    if (el.type !== "button" && el.type !== "a") return false;
    const cls = el.props?.className || "";
    if (cls.includes(textOrClass)) return true;
    const text = getTextContent(el);
    if (text.includes(textOrClass)) return true;
    const ariaLabel = el.props?.["aria-label"] || "";
    if (ariaLabel.includes(textOrClass)) return true;
    return false;
  });
}

describe("R4: Navbar Active States, Guide Navigation, and Action Distinction", () => {
  function renderNavbar(props: NavbarProps) {
    const html = renderToStaticMarkup(React.createElement(Navbar, props));
    return cheerio.load(html);
  }

  describe("R1: Navigation Tab Highlighting and Active State", () => {
    it("does not highlight Integration Directory tab as active when currentView is guide_detail", () => {
      const $ = renderNavbar({
        currentView: "guide_detail",
        onSelectView: () => {},
        hasActiveGuide: true,
        activeGuideName: "GitHub",
      });
      const dirTab = $("nav.nav-links button").filter((_, el) =>
        $(el).text().includes("Integration Directory")
      );
      expect(dirTab.length).toBe(1);
      expect(dirTab.hasClass("is-active")).toBe(false);
      expect(dirTab.attr("aria-current")).toBeUndefined();
    });

    it("highlights Integration Directory tab as active when currentView is directory", () => {
      const $ = renderNavbar({
        currentView: "directory",
        onSelectView: () => {},
      });
      const dirTab = $("nav.nav-links button").filter((_, el) =>
        $(el).text().includes("Integration Directory")
      );
      expect(dirTab.length).toBe(1);
      expect(dirTab.hasClass("is-active")).toBe(true);
      expect(dirTab.attr("aria-current")).toBe("page");
    });

    it("highlights active guide navigation item as active when currentView is guide_detail", () => {
      const $ = renderNavbar({
        currentView: "guide_detail",
        onSelectView: () => {},
        hasActiveGuide: true,
        activeGuideName: "GitHub",
      });
      const guideItem = $("nav.nav-links .nav-guide-link");
      expect(guideItem.length).toBe(1);
      expect(guideItem.hasClass("is-active")).toBe(true);
      expect(guideItem.attr("aria-current")).toBe("page");
      expect(guideItem.text()).toContain("GitHub");
    });
  });

  describe("R2: Active Guide Navigation and Presentation", () => {
    it("renders active guide navigation item when on directory view and hasActiveGuide is true", () => {
      const $ = renderNavbar({
        currentView: "directory",
        onSelectView: () => {},
        hasActiveGuide: true,
        activeGuideName: "Slack",
      });
      const guideItem = $("nav.nav-links .nav-guide-link");
      expect(guideItem.length).toBe(1);
      expect(guideItem.text()).toContain("Slack");
      expect(guideItem.hasClass("is-active")).toBe(false);
      expect(guideItem.attr("aria-current")).toBeUndefined();
    });

    it("renders active guide navigation item when on investigator view and hasActiveGuide is true", () => {
      const $ = renderNavbar({
        currentView: "investigator",
        onSelectView: () => {},
        hasActiveGuide: true,
        activeGuideName: "Perplexity",
      });
      const guideItem = $("nav.nav-links .nav-guide-link");
      expect(guideItem.length).toBe(1);
      expect(guideItem.text()).toContain("Perplexity");
      expect(guideItem.hasClass("is-active")).toBe(false);
      expect(guideItem.attr("aria-current")).toBeUndefined();
    });

    it("renders active guide navigation item when on audit view and hasActiveGuide is true", () => {
      const $ = renderNavbar({
        currentView: "audit",
        onSelectView: () => {},
        hasActiveGuide: true,
        activeGuideName: "Notion",
      });
      const guideItem = $("nav.nav-links .nav-guide-link");
      expect(guideItem.length).toBe(1);
      expect(guideItem.text()).toContain("Notion");
      expect(guideItem.hasClass("is-active")).toBe(false);
      expect(guideItem.attr("aria-current")).toBeUndefined();
    });

    it("does not render guide navigation item when hasActiveGuide is false", () => {
      const $ = renderNavbar({
        currentView: "directory",
        onSelectView: () => {},
        hasActiveGuide: false,
      });
      const guideItem = $("nav.nav-links .nav-guide-link");
      expect(guideItem.length).toBe(0);
    });

    it("does not render guide navigation item on guide_detail when hasActiveGuide is false", () => {
      const $ = renderNavbar({
        currentView: "guide_detail",
        onSelectView: () => {},
        hasActiveGuide: false,
      });
      const guideItem = $("nav.nav-links .nav-guide-link");
      expect(guideItem.length).toBe(0);
    });

    it("navigates to guide_detail when active guide item is clicked from directory view", () => {
      const onSelectView = vi.fn();
      const tree = Navbar({
        currentView: "directory",
        onSelectView,
        hasActiveGuide: true,
        activeGuideName: "Slack",
      });
      const guideBtn = findButton(tree, "nav-guide-link");
      expect(guideBtn).toBeDefined();
      guideBtn.props.onClick();
      expect(onSelectView).toHaveBeenCalledTimes(1);
      expect(onSelectView).toHaveBeenCalledWith("guide_detail");
    });

    it("navigates to guide_detail when active guide item is clicked from investigator view", () => {
      const onSelectView = vi.fn();
      const tree = Navbar({
        currentView: "investigator",
        onSelectView,
        hasActiveGuide: true,
        activeGuideName: "Slack",
      });
      const guideBtn = findButton(tree, "nav-guide-link");
      expect(guideBtn).toBeDefined();
      guideBtn.props.onClick();
      expect(onSelectView).toHaveBeenCalledTimes(1);
      expect(onSelectView).toHaveBeenCalledWith("guide_detail");
    });

    it("navigates to guide_detail when active guide item is clicked from audit view", () => {
      const onSelectView = vi.fn();
      const tree = Navbar({
        currentView: "audit",
        onSelectView,
        hasActiveGuide: true,
        activeGuideName: "Slack",
      });
      const guideBtn = findButton(tree, "nav-guide-link");
      expect(guideBtn).toBeDefined();
      guideBtn.props.onClick();
      expect(onSelectView).toHaveBeenCalledTimes(1);
      expect(onSelectView).toHaveBeenCalledWith("guide_detail");
    });

    it("maintains active state styling and calls onSelectView('guide_detail') when clicked on guide_detail", () => {
      const onSelectView = vi.fn();
      const tree = Navbar({
        currentView: "guide_detail",
        onSelectView,
        hasActiveGuide: true,
        activeGuideName: "GitHub",
      });
      const guideBtn = findButton(tree, "nav-guide-link");
      expect(guideBtn).toBeDefined();
      expect(guideBtn.props.className).toContain("is-active");
      expect(guideBtn.props["aria-current"]).toBe("page");

      guideBtn.props.onClick();
      expect(onSelectView).toHaveBeenCalledTimes(1);
      expect(onSelectView).toHaveBeenCalledWith("guide_detail");
    });
  });

  describe("R3: External Repository Link Distinction", () => {
    it("renders external GitHub repository link in .navbar-actions with functional attributes", () => {
      const $ = renderNavbar({
        currentView: "guide_detail",
        onSelectView: () => {},
        hasActiveGuide: true,
        activeGuideName: "GitHub",
      });
      const githubLink = $(".navbar-actions a.github-link");
      expect(githubLink.length).toBe(1);
      expect(githubLink.attr("href")).toBe("https://github.com/Omikar243/composioassignment");
      expect(githubLink.attr("target")).toBe("_blank");
      expect(githubLink.attr("rel")).toBe("noopener noreferrer");
      expect(githubLink.attr("aria-label")).toBe("View the source repository on GitHub");
    });

    it("ensures GitHub link in .navbar-actions is visually and structurally distinct from guide navigation elements", () => {
      const $ = renderNavbar({
        currentView: "guide_detail",
        onSelectView: () => {},
        hasActiveGuide: true,
        activeGuideName: "GitHub",
      });
      const actionsLink = $(".navbar-actions .github-link");
      expect(actionsLink.is("a")).toBe(true);
      expect(actionsLink.hasClass("nav-guide-link")).toBe(false);
      expect(actionsLink.hasClass("nav-link")).toBe(false);

      const guideBtn = $("nav.nav-links .nav-guide-link");
      expect(guideBtn.is("button")).toBe(true);
      expect(guideBtn.hasClass("github-link")).toBe(false);
      expect(guideBtn.parents(".navbar-actions").length).toBe(0);
      expect(actionsLink.parents("nav.nav-links").length).toBe(0);
    });
  });

  describe("Navigation Routing Integrity & Regression Guard", () => {
    it("navigates to directory when brand mark button is clicked", () => {
      const onSelectView = vi.fn();
      const tree = Navbar({
        currentView: "guide_detail",
        onSelectView,
        hasActiveGuide: true,
        activeGuideName: "GitHub",
      });
      const brandBtn = findButton(tree, "brand-link");
      expect(brandBtn).toBeDefined();
      brandBtn.props.onClick();
      expect(onSelectView).toHaveBeenCalledWith("directory");
    });

    it("navigates to directory when Integration Directory tab is clicked", () => {
      const onSelectView = vi.fn();
      const tree = Navbar({
        currentView: "guide_detail",
        onSelectView,
        hasActiveGuide: true,
        activeGuideName: "GitHub",
      });
      const dirBtn = findButton(tree, "Integration Directory");
      expect(dirBtn).toBeDefined();
      dirBtn.props.onClick();
      expect(onSelectView).toHaveBeenCalledWith("directory");
    });

    it("navigates to investigator when Research tab is clicked", () => {
      const onSelectView = vi.fn();
      const tree = Navbar({
        currentView: "directory",
        onSelectView,
      });
      const researchBtn = findButton(tree, "Research");
      expect(researchBtn).toBeDefined();
      researchBtn.props.onClick();
      expect(onSelectView).toHaveBeenCalledWith("investigator");
    });

    it("navigates to audit when Evidence Log tab is clicked", () => {
      const onSelectView = vi.fn();
      const tree = Navbar({
        currentView: "directory",
        onSelectView,
      });
      const auditBtn = findButton(tree, "Evidence Log");
      expect(auditBtn).toBeDefined();
      auditBtn.props.onClick();
      expect(onSelectView).toHaveBeenCalledWith("audit");
    });
  });
});
