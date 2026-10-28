import { describe, expect, it } from "vitest";
import { executeMode2Dynamic } from "../../src/agent/investigatorEngine";
import { CATALOG_100_APPS } from "../../src/data/catalog100";
import type { CatalogAuthBaseline } from "../../src/types/guide";

const baselineFor = (app: (typeof CATALOG_100_APPS)[number]): CatalogAuthBaseline => ({
  authPath: app.authPath,
  supportedAuthSchemes: [...app.supportedAuthSchemes],
  authDocUrl: app.authDocUrl,
});

describe("100-app catalog and investigator authentication consistency", () => {
  it("has official authentication documentation URLs for all 100 catalog entries", () => {
    expect(CATALOG_100_APPS).toHaveLength(100);
    for (const app of CATALOG_100_APPS) {
      expect(app.authDocUrl, `${app.name} must have an auth documentation URL`).toMatch(/^https:\/\//);
    }
  });

  it("keeps Supabase Direct Key Only in the catalog and deterministic investigator", () => {
    const supabase = CATALOG_100_APPS.find((app) => app.id === "supabase");
    expect(supabase).toBeDefined();
    expect(supabase?.authPath).toBe("direct_credential_only");
    expect(supabase?.authDocUrl).toBe("https://supabase.com/docs/guides/getting-started/api-keys");

    const result = executeMode2Dynamic({
      appName: "Supabase",
      websiteUrl: supabase?.authDocUrl,
      docContent: "",
      catalogBaseline: baselineFor(supabase!),
    });
    expect(result.readinessSummary.authPathClassification).toBe("direct_credential_only");
    expect(result.supportedAuthSchemes.value).toContain("API_KEY");
  });

  it.each(["hubspot", "gitlab"] as const)("recognizes %s as hybrid in catalog and investigator", (id) => {
    const app = CATALOG_100_APPS.find((entry) => entry.id === id);
    expect(app).toBeDefined();
    expect(app?.authPath).toBe("hybrid_oauth_or_direct");

    const result = executeMode2Dynamic({
      appName: app!.name,
      websiteUrl: app!.authDocUrl || app!.websiteUrl,
      docContent: "",
      catalogBaseline: baselineFor(app!),
    });
    expect(result.readinessSummary.authPathClassification).toBe("hybrid_oauth_or_direct");
    expect(result.supportedAuthSchemes.value).toEqual(app!.supportedAuthSchemes);
  });

  it.each(["jira", "circleci", "zendesk", "sentry", "pagerduty"] as const)(
    "keeps the documented token-plus-OAuth path for %s",
    (id) => {
      const app = CATALOG_100_APPS.find((entry) => entry.id === id);
      expect(app).toBeDefined();
      expect(app?.authPath).toBe("hybrid_oauth_or_direct");
      const result = executeMode2Dynamic({
        appName: app!.name,
        websiteUrl: app!.authDocUrl || app!.websiteUrl,
        docContent: "",
        catalogBaseline: baselineFor(app!),
      });
      expect(result.readinessSummary.authPathClassification).toBe(app!.authPath);
    },
  );

  it("preserves the baseline when documentation is empty or uninformative", () => {
    for (const app of CATALOG_100_APPS) {
      const result = executeMode2Dynamic({
        appName: app.name,
        websiteUrl: app.authDocUrl || app.websiteUrl,
        docContent: "Home | Products | Pricing | Sign in | OAuth",
        catalogBaseline: baselineFor(app),
      });
      expect(
        result.readinessSummary.authPathClassification,
        `${app.name} must not contradict its catalog baseline without explicit provider evidence`,
      ).toBe(app.authPath);
      expect(result.supportedAuthSchemes.value).toEqual(app.supportedAuthSchemes);
    }
  });

  it("does not silently claim evidence-based OAuth when an unknown app has no useful documentation", () => {
    const result = executeMode2Dynamic({
      appName: "Unlisted Example Provider",
      websiteUrl: "https://example.com",
      docContent: "",
    });
    expect(result.readinessSummary.oneLineSummary.toLowerCase()).toContain("insufficient documentation");
  });

  it("has zero deterministic mismatches across all 100 catalog baselines", () => {
    const mismatches: string[] = [];
    for (const app of CATALOG_100_APPS) {
      const result = executeMode2Dynamic({
        appName: app.name,
        websiteUrl: app.authDocUrl || app.websiteUrl,
        docContent: "",
        catalogBaseline: baselineFor(app),
      });
      if (result.readinessSummary.authPathClassification !== app.authPath) {
        mismatches.push(
          `${app.name}: catalog=${app.authPath}, investigator=${result.readinessSummary.authPathClassification}`,
        );
      }
    }
    expect(mismatches, mismatches.join("\n")).toEqual([]);
  });
});
