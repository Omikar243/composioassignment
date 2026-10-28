/**
 * tests/unit/catalog.test.ts
 * Comprehensive Unit Tests for 100-App Catalog and Verification Audit Records
 */

import { describe, it, expect } from "vitest";
import {
  CATALOG_100_APPS,
  CatalogApp,
  CatalogCategory,
  ReviewGateStatus,
  SetupDifficulty,
  searchCatalog,
  filterCatalog,
  getCatalogStats,
} from "../../src/data/catalog100";
import {
  VERIFICATION_AUDIT_DATA,
  VerificationAuditRecord,
  getAuditRecords,
  getAuditByPlatform,
} from "../../src/data/verificationAudit";
import { isIndependentlyTested } from "../../src/types/guide";

describe("100-App AI Agent Catalog Directory (catalog100.ts)", () => {
  describe("Volume & Category Partitioning", () => {
    it("contains exactly 100 apps in the catalog", () => {
      expect(CATALOG_100_APPS).toHaveLength(100);
    });

    it("has unique app IDs across all 100 entries", () => {
      const ids = CATALOG_100_APPS.map((app) => app.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100);
    });

    it("partitions exactly across 10 distinct categories with exactly 10 apps each", () => {
      const EXPECTED_CATEGORIES: CatalogCategory[] = [
        "Developer Tools",
        "Communication",
        "Productivity",
        "CRM & Sales",
        "AI & Search",
        "Social & Marketing",
        "Finance & Payments",
        "Cloud Storage",
        "E-Commerce",
        "HR & Operations",
      ];

      const countsByCategory = CATALOG_100_APPS.reduce<Record<string, number>>(
        (acc, app) => {
          acc[app.category] = (acc[app.category] || 0) + 1;
          return acc;
        },
        {}
      );

      expect(Object.keys(countsByCategory).sort()).toEqual(
        [...EXPECTED_CATEGORIES].sort()
      );

      for (const cat of EXPECTED_CATEGORIES) {
        expect(
          countsByCategory[cat],
          `Expected 10 apps in category '${cat}', found ${countsByCategory[cat]}`
        ).toBe(10);
      }
    });

    it("includes all 10 required apps for each of the 10 domains", () => {
      const domainApps: Record<CatalogCategory, string[]> = {
        "Developer Tools": [
          "GitHub",
          "GitLab",
          "Jira",
          "Linear",
          "Sentry",
          "Datadog",
          "Bitbucket",
          "CircleCI",
          "Vercel",
          "Supabase",
        ],
        Communication: [
          "Slack",
          "Discord",
          "Microsoft Teams",
          "Zoom",
          "Twilio",
          "SendGrid",
          "Telegram",
          "WhatsApp Business",
          "Intercom",
          "PagerDuty",
        ],
        Productivity: [
          "Notion",
          "Google Workspace",
          "Microsoft 365",
          "Asana",
          "Trello",
          "ClickUp",
          "Monday.com",
          "Airtable",
          "Coda",
          "Todoist",
        ],
        "CRM & Sales": [
          "Salesforce",
          "HubSpot",
          "Zendesk",
          "Freshdesk",
          "Pipedrive",
          "Zoho CRM",
          "Close",
          "Salesloft",
          "Apollo",
          "Outreach",
        ],
        "AI & Search": [
          "OpenAI",
          "Anthropic",
          "Perplexity",
          "Tavily",
          "Cohere",
          "Pinecone",
          "Weaviate",
          "ElevenLabs",
          "Replicate",
          "Hugging Face",
        ],
        "Social & Marketing": [
          "X/Twitter",
          "LinkedIn",
          "YouTube",
          "Facebook/Meta",
          "Instagram",
          "Mailchimp",
          "Buffer",
          "Hootsuite",
          "Reddit",
          "TikTok",
        ],
        "Finance & Payments": [
          "Stripe",
          "PayPal",
          "QuickBooks",
          "Xero",
          "Plaid",
          "Square",
          "Brex",
          "Ramp",
          "Mercury",
          "Wise",
        ],
        "Cloud Storage": [
          "Google Drive",
          "Dropbox",
          "Box",
          "OneDrive",
          "AWS S3",
          "Google Cloud Storage",
          "Cloudflare R2",
          "SharePoint",
          "Egnyte",
          "Backblaze",
        ],
        "E-Commerce": [
          "Shopify",
          "WooCommerce",
          "BigCommerce",
          "Magento",
          "Amazon Seller Central",
          "eBay",
          "Etsy",
          "Stripe Billing",
          "Chargebee",
          "Square Online",
        ],
        "HR & Operations": [
          "BambooHR",
          "Workday",
          "Gusto",
          "Rippling",
          "Deel",
          "Greenhouse",
          "Lever",
          "Personio",
          "ADP",
          "Justworks",
        ],
      };

      for (const [category, appNames] of Object.entries(domainApps)) {
        const appsInCat = CATALOG_100_APPS.filter(
          (a) => a.category === category
        ).map((a) => a.name);

        for (const name of appNames) {
          expect(
            appsInCat,
            `Category '${category}' missing app '${name}'`
          ).toContain(name);
        }
      }
    });
  });

  describe("Auth Path Distribution Contract", () => {
    it("keeps every auth path represented and matches reconciled catalog counts", () => {
      const oauthApps = CATALOG_100_APPS.filter(
        (a) => a.authPath === "oauth_required"
      );
      const hybridApps = CATALOG_100_APPS.filter(
        (a) => a.authPath === "hybrid_oauth_or_direct"
      );
      const directApps = CATALOG_100_APPS.filter(
        (a) => a.authPath === "direct_credential_only"
      );

      expect(oauthApps).toHaveLength(44);
      expect(hybridApps).toHaveLength(31);
      expect(directApps).toHaveLength(25);

      expect(oauthApps.length / CATALOG_100_APPS.length).toBe(0.44);
      expect(hybridApps.length / CATALOG_100_APPS.length).toBe(0.31);
      expect(directApps.length / CATALOG_100_APPS.length).toBe(0.25);
    });
  });

  describe("Taxonomy & Field Invariants for Every App", () => {
    const VALID_REVIEW_GATES: ReviewGateStatus[] = [
      "no_gate",
      "conditional_gate",
      "mandatory_enterprise_gate",
      "unknown",
    ];

    const VALID_DIFFICULTIES: SetupDifficulty[] = ["easy", "medium", "hard"];

    it("verifies non-empty required fields and valid taxonomies across all 100 apps", () => {
      for (const app of CATALOG_100_APPS) {
        // ID & Name
        expect(app.id.trim().length, `App with empty id`).toBeGreaterThan(0);
        expect(app.appId.trim().length, `App ${app.id} empty appId`).toBeGreaterThan(0);
        expect(app.id).toBe(app.appId);

        expect(app.name.trim().length, `App ${app.id} empty name`).toBeGreaterThan(0);
        expect(app.appName.trim().length, `App ${app.id} empty appName`).toBeGreaterThan(0);
        expect(app.name).toBe(app.appName);

        // Category
        expect(app.category.trim().length, `App ${app.id} empty category`).toBeGreaterThan(0);

        // Auth Path
        expect(
          ["oauth_required", "hybrid_oauth_or_direct", "direct_credential_only"]
        ).toContain(app.authPath);
        expect(app.authPath).toBe(app.authPathClassification);

        // Review Gate
        expect(VALID_REVIEW_GATES).toContain(app.reviewGate);
        expect(app.reviewGate).toBe(app.reviewGateStatus);

        // Difficulty
        expect(VALID_DIFFICULTIES).toContain(app.difficulty);
        expect(app.difficulty).toBe(app.setupDifficulty);

        // Website URL
        expect(app.websiteUrl.startsWith("https://") || app.websiteUrl.startsWith("http://")).toBe(true);

        // Schemes & Managed Auth
        expect(app.supportedAuthSchemes.length).toBeGreaterThan(0);
        expect(["available", "bring_your_own_required", "unknown"]).toContain(
          app.composioManagedAuthStatus
        );

        // Nuance
        expect(app.keyNuanceOrPitfall.trim().length).toBeGreaterThan(0);
      }
    });

    it("verifies epistemic evidence labeling on setup time and approval wait estimates", () => {
      for (const app of CATALOG_100_APPS) {
        // Setup Time Estimate
        expect(app.setupTimeEstimate).toBeDefined();
        expect(typeof app.setupTimeEstimate.value).toBe("string");
        expect(app.setupTimeEstimate.value.length).toBeGreaterThan(0);
        expect(app.setupTimeEstimate.evidence).toBeDefined();
        expect(
          ["tested_live", "documented_not_tested", "unverified_hypothesis"]
        ).toContain(app.setupTimeEstimate.evidence.kind);

        // Approval Wait Estimate
        expect(app.approvalWaitEstimate).toBeDefined();
        expect(typeof app.approvalWaitEstimate.value).toBe("string");
        expect(app.approvalWaitEstimate.value.length).toBeGreaterThan(0);
        expect(app.approvalWaitEstimate.evidence).toBeDefined();
        expect(
          ["tested_live", "documented_not_tested", "unverified_hypothesis"]
        ).toContain(app.approvalWaitEstimate.evidence.kind);

        // Truth in testing: if kind === tested_live, isIndependentlyTested is true, else false
        if (app.setupTimeEstimate.evidence.kind === "tested_live") {
          expect(isIndependentlyTested(app.setupTimeEstimate.evidence)).toBe(true);
        } else {
          expect(isIndependentlyTested(app.setupTimeEstimate.evidence)).toBe(false);
        }
      }
    });

    it("verifies exactly 5 curated apps match the P0/P1 deep guide set", () => {
      const curatedApps = CATALOG_100_APPS.filter((a) => a.hasCuratedDeepGuide);
      expect(curatedApps).toHaveLength(5);
      const curatedIds = curatedApps.map((a) => a.id).sort();
      expect(curatedIds).toEqual([
        "github",
        "google_workspace",
        "notion",
        "perplexity",
        "slack",
      ]);
    });
  });

  describe("Filter and Search Helper Functions", () => {
    it("searchCatalog filters correctly by name, id, category, and nuance", () => {
      // Name search
      const githubResults = searchCatalog("GitHub");
      expect(githubResults.length).toBeGreaterThanOrEqual(1);
      expect(githubResults.some((a) => a.id === "github")).toBe(true);

      // ID search
      const slackResults = searchCatalog("slack");
      expect(slackResults.some((a) => a.id === "slack")).toBe(true);

      // Category search
      const devToolResults = searchCatalog("Developer Tools");
      expect(devToolResults.length).toBe(10);

      // Nuance search
      const pkceResults = searchCatalog("PKCE");
      expect(pkceResults.length).toBeGreaterThan(0);

      // Empty or whitespace returns all
      expect(searchCatalog("")).toHaveLength(100);
      expect(searchCatalog("   ")).toHaveLength(100);

      // Non-matching query returns empty
      expect(searchCatalog("XYZNonExistentIntegration999")).toHaveLength(0);
    });

    it("filterCatalog filters by single and combined dimensions", () => {
      // Category filter
      const commApps = filterCatalog({ category: "Communication" });
      expect(commApps).toHaveLength(10);
      expect(commApps.every((a) => a.category === "Communication")).toBe(true);

      // Auth path filter
      const directApps = filterCatalog({ authPath: "direct_credential_only" });
      expect(directApps).toHaveLength(25);
      expect(directApps.every((a) => a.authPath === "direct_credential_only")).toBe(true);

      // Review gate filter
      const noGateApps = filterCatalog({ reviewGate: "no_gate" });
      expect(noGateApps).toHaveLength(48);
      expect(noGateApps.every((a) => a.reviewGate === "no_gate")).toBe(true);

      const conditionalApps = filterCatalog({ reviewGate: "conditional_gate" });
      expect(conditionalApps).toHaveLength(32);
      expect(conditionalApps.every((a) => a.reviewGate === "conditional_gate")).toBe(true);

      const mandatoryApps = filterCatalog({ reviewGate: "mandatory_enterprise_gate" });
      expect(mandatoryApps).toHaveLength(15);
      expect(mandatoryApps.every((a) => a.reviewGate === "mandatory_enterprise_gate")).toBe(true);

      const unknownApps = filterCatalog({ reviewGate: "unknown" });
      expect(unknownApps).toHaveLength(5);
      expect(unknownApps.every((a) => a.reviewGate === "unknown")).toBe(true);

      // Difficulty filter
      const hardApps = filterCatalog({ difficulty: "hard" });
      expect(hardApps.length).toBeGreaterThan(0);
      expect(hardApps.every((a) => a.difficulty === "hard")).toBe(true);

      // Curated filter
      const curatedOnly = filterCatalog({ hasCuratedGuide: true });
      expect(curatedOnly).toHaveLength(5);

      // Combined filters
      const devHybridEasy = filterCatalog({
        category: "Developer Tools",
        authPath: "hybrid_oauth_or_direct",
        difficulty: "easy",
      });
      expect(devHybridEasy.length).toBeGreaterThan(0);
      expect(devHybridEasy.every((a) => a.category === "Developer Tools" && a.authPath === "hybrid_oauth_or_direct" && a.difficulty === "easy")).toBe(true);

      // Filter with search query
      const searchAndCat = filterCatalog({
        category: "AI & Search",
        searchQuery: "Perplexity",
      });
      expect(searchAndCat).toHaveLength(1);
      expect(searchAndCat[0].id).toBe("perplexity");
    });

    it("getCatalogStats returns exact statistical distributions", () => {
      const stats = getCatalogStats();

      expect(stats.totalApps).toBe(100);
      expect(stats.curatedGuideCount).toBe(5);

      // Category breakdown
      for (const [cat, count] of Object.entries(stats.byCategory)) {
        expect(count, `Category ${cat} count mismatch`).toBe(10);
      }

      // Auth path breakdown
      expect(stats.byAuthPath.oauth_required).toBe(44);
      expect(stats.byAuthPath.hybrid_oauth_or_direct).toBe(31);
      expect(stats.byAuthPath.direct_credential_only).toBe(25);

      // Review gate breakdown
      expect(stats.byReviewGate.no_gate).toBe(48);
      expect(stats.byReviewGate.conditional_gate).toBe(32);
      expect(stats.byReviewGate.mandatory_enterprise_gate).toBe(15);
      expect(stats.byReviewGate.unknown).toBe(5);

      const totalGates =
        stats.byReviewGate.no_gate +
        stats.byReviewGate.conditional_gate +
        stats.byReviewGate.mandatory_enterprise_gate +
        stats.byReviewGate.unknown;
      expect(totalGates).toBe(100);

      // Difficulty breakdown
      const totalDifficulty =
        stats.byDifficulty.easy + stats.byDifficulty.medium + stats.byDifficulty.hard;
      expect(totalDifficulty).toBe(100);
    });
  });
});

describe("Verification Audit Records (verificationAudit.ts)", () => {
  it("contains complete records covering all 6 key platforms", () => {
    const records = getAuditRecords();
    expect(records.length).toBeGreaterThanOrEqual(6);

    const platformIds = records.map((r) => r.platformId);
    expect(platformIds).toContain("composio_platform");
    expect(platformIds).toContain("github");
    expect(platformIds).toContain("slack");
    expect(platformIds).toContain("google_workspace");
    expect(platformIds).toContain("notion");
    expect(platformIds).toContain("perplexity");
  });

  it("verifies every platform record contains all 4 audit categories with non-empty contents", () => {
    for (const record of VERIFICATION_AUDIT_DATA) {
      // Platform identity
      expect(record.id.trim().length).toBeGreaterThan(0);
      expect(record.providerOrPlatform.trim().length).toBeGreaterThan(0);

      // 1. Tested Live Section
      expect(Array.isArray(record.testedLive)).toBe(true);
      expect(record.testedLive.length).toBeGreaterThan(0);
      for (const action of record.testedLive) {
        expect(action.action.trim().length).toBeGreaterThan(0);
        expect(action.outcome.trim().length).toBeGreaterThan(0);
        expect(action.timestamp.trim().length).toBeGreaterThan(0);
      }
      expect(record.testedLiveActions.length).toBeGreaterThan(0);

      // 2. Documented Facts Section
      expect(Array.isArray(record.documentedFacts)).toBe(true);
      expect(record.documentedFacts.length).toBeGreaterThan(0);
      for (const fact of record.documentedFacts) {
        expect(fact.trim().length).toBeGreaterThan(0);
      }

      // 3. Corrections Made Section
      expect(Array.isArray(record.correctionsMade)).toBe(true);
      expect(record.correctionsMade.length).toBeGreaterThan(0);
      for (const correction of record.correctionsMade) {
        expect(correction.priorBelief.trim().length).toBeGreaterThan(0);
        expect(correction.correctedFact.trim().length).toBeGreaterThan(0);
        expect(correction.evidence.trim().length).toBeGreaterThan(0);
      }
      expect(record.mythCorrections.length).toBeGreaterThan(0);

      // 4. Open Uncertainties Section
      expect(Array.isArray(record.openUncertainties)).toBe(true);
      expect(record.openUncertainties.length).toBeGreaterThan(0);
      for (const uncertainty of record.openUncertainties) {
        expect(uncertainty.trim().length).toBeGreaterThan(0);
      }
      expect(record.openHypothesesAndUncertainties.length).toBeGreaterThan(0);

      // Sources checked
      expect(record.sourcesChecked.length).toBeGreaterThan(0);
      for (const source of record.sourcesChecked) {
        expect(source.title.trim().length).toBeGreaterThan(0);
        expect(source.url.startsWith("https://") || source.url.startsWith("http://")).toBe(true);
      }
    }
  });

  it("getAuditByPlatform provides robust case-insensitive lookup by id, name, and aliases", () => {
    // Exact ID
    expect(getAuditByPlatform("github")?.platformId).toBe("github");
    expect(getAuditByPlatform("slack")?.platformId).toBe("slack");

    // Case-insensitive
    expect(getAuditByPlatform("GITHUB")?.platformId).toBe("github");
    expect(getAuditByPlatform("Slack")?.platformId).toBe("slack");

    // Aliases
    expect(getAuditByPlatform("composio")?.platformId).toBe("composio_platform");
    expect(getAuditByPlatform("google")?.platformId).toBe("google_workspace");
    expect(getAuditByPlatform("google workspace")?.platformId).toBe("google_workspace");
    expect(getAuditByPlatform("gmail")?.platformId).toBe("google_workspace");
    expect(getAuditByPlatform("notion")?.platformId).toBe("notion");
    expect(getAuditByPlatform("perplexity")?.platformId).toBe("perplexity");

    // Unknown returns undefined
    expect(getAuditByPlatform("non_existent_platform")).toBeUndefined();
  });
});
