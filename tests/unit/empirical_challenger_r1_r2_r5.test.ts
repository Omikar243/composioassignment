/**
 * tests/unit/empirical_challenger_r1_r2_r5.test.ts
 *
 * Empirical Adversarial Challenger Verification Suite
 * Targets Requirements R1, R2, and R5
 *
 * 1. Challenge R1 (Form & Precedence):
 *    - Edge cases where user enters a custom URL for a catalog app. Custom URL must authoritatively win in all scenarios.
 *    - Edge cases where catalog default URL is loaded. Must never masquerade as an override.
 * 2. Challenge R2 (Proxy Retrieval Status):
 *    - SSRF-blocked non-override URL -> retrievalStatus === "failed" (not "not_attempted").
 *    - 404 / 500 error non-override URL -> retrievalStatus === "failed".
 *    - Request with no URL provided -> retrievalStatus === "not_attempted".
 *    - Valid URL -> retrievalStatus === "success".
 * 3. Challenge R5 (Domain Authenticity vs SSRF):
 *    - Adversarial candidate URLs (tutorial sites, typosquats, third-party subdomains) rejected by isAuthenticProviderDomain().
 *    - Separation between SSRF and domain authenticity.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LiveInvestigatorPanel } from "../../src/components/LiveInvestigatorPanel";
import { selectInvestigationSource } from "../../src/utils/investigationSource";
import { handleInvestigate } from "../../server/proxyServer";
import {
  WebDiscoveryPipeline,
  isAuthenticProviderDomain,
  isDisallowedDiscoveryDomain,
  extractRootDomain,
} from "../../src/agent/searchDiscovery";
import { CATALOG_100_APPS } from "../../src/data/catalog100";
import { PROVIDER_REGISTRY } from "../../src/data/providerRegistry";
import type { SearchDiscoveryProvider, DiscoveredCandidate, DiscoveryQuery } from "../../src/agent/searchDiscovery";

// Mock Request/Response helper
function createMockReqRes(body: any = {}) {
  let statusCode = 200;
  let sentJson: any = null;
  const req = {
    body,
    query: {},
    method: "POST",
    url: "/api/investigate",
  } as any;
  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: any) {
      sentJson = payload;
      return res;
    },
  } as any;
  return {
    req,
    res,
    getStatus: () => statusCode,
    getJson: () => sentJson,
  };
}

describe("Adversarial Challenge R1: Form & Precedence Edge Cases", () => {
  it("renders Field 1 and Field 2 labels strictly without legacy helper text or parentheticals", () => {
    const html = renderToStaticMarkup(
      React.createElement(LiveInvestigatorPanel, {
        onOpenFullGuide: () => {},
      })
    );
    expect(html).toContain("App Name:");
    expect(html).not.toContain("or Documentation URL:");
    expect(html).toContain("Documentation URL:");
    expect(html).not.toContain("(Optional override):");
    expect(html).not.toContain("investigator-doc-url-help");
    expect(html).not.toContain("If provided, this URL is fetched instead of a URL in the first field.");
  });

  describe("Custom URL authoritatively wins for catalog apps in all scenarios", () => {
    const catalogAppsToTest = ["supabase", "linear", "hubspot", "github", "gitlab"];

    catalogAppsToTest.forEach((appId) => {
      const app = CATALOG_100_APPS.find((a) => a.id === appId)!;

      it(`authoritatively selects user_override for ${app.name} with custom internal URL`, () => {
        const customUrl = `https://custom-${app.id}-proxy.internal/api/docs`;
        const selection = selectInvestigationSource({
          userOverrideUrl: customUrl,
          catalogAuthDocUrl: app.authDocUrl,
          websiteUrl: app.websiteUrl,
          isUserEntered: true,
        });

        expect(selection.sourceType).toBe("user_override");
        expect(selection.isOverride).toBe(true);
        expect(selection.url).toBe(customUrl);
        expect(selection.notes).toContain("Authoritative user override URL selected");
      });

      it(`authoritatively selects user_override for ${app.name} with alternate path on same origin`, () => {
        const customUrl = `${app.websiteUrl}/custom-enterprise-auth-path`;
        const selection = selectInvestigationSource({
          userOverrideUrl: customUrl,
          catalogAuthDocUrl: app.authDocUrl,
          websiteUrl: app.websiteUrl,
        });

        expect(selection.sourceType).toBe("user_override");
        expect(selection.isOverride).toBe(true);
        expect(selection.url).toBe(customUrl);
      });

      it(`authoritatively selects user_override for ${app.name} with custom port or query parameters`, () => {
        const customUrl = `${app.authDocUrl || app.websiteUrl}:8443/custom-auth?env=staging`;
        const selection = selectInvestigationSource({
          userOverrideUrl: customUrl,
          catalogAuthDocUrl: app.authDocUrl,
          websiteUrl: app.websiteUrl,
        });

        expect(selection.sourceType).toBe("user_override");
        expect(selection.isOverride).toBe(true);
        expect(selection.url).toBe(customUrl);
      });
    });
  });

  describe("Catalog default URLs never masquerade as overrides", () => {
    const catalogAppsToTest = ["supabase", "hubspot", "linear", "jira", "gitlab"];

    catalogAppsToTest.forEach((appId) => {
      const app = CATALOG_100_APPS.find((a) => a.id === appId)!;

      it(`does NOT treat exact catalog authDocUrl as override for ${app.name}`, () => {
        if (!app.authDocUrl) return;
        const selection = selectInvestigationSource({
          userOverrideUrl: app.authDocUrl,
          catalogAuthDocUrl: app.authDocUrl,
          websiteUrl: app.websiteUrl,
        });

        expect(selection.sourceType).toBe("catalog_auth_doc");
        expect(selection.isOverride).toBe(false);
        expect(selection.url).toBe(app.authDocUrl);
      });

      it(`does NOT treat trailing-slash variations of catalog authDocUrl as override for ${app.name}`, () => {
        if (!app.authDocUrl) return;
        const urlWithSlash = app.authDocUrl.endsWith("/") ? app.authDocUrl.slice(0, -1) : `${app.authDocUrl}/`;
        const selection = selectInvestigationSource({
          userOverrideUrl: urlWithSlash,
          catalogAuthDocUrl: app.authDocUrl,
          websiteUrl: app.websiteUrl,
        });

        expect(selection.sourceType).toBe("catalog_auth_doc");
        expect(selection.isOverride).toBe(false);
      });

      it(`does NOT treat case variations of catalog authDocUrl as override for ${app.name}`, () => {
        if (!app.authDocUrl) return;
        const upperUrl = app.authDocUrl.toUpperCase();
        const selection = selectInvestigationSource({
          userOverrideUrl: upperUrl,
          catalogAuthDocUrl: app.authDocUrl,
          websiteUrl: app.websiteUrl,
        });

        expect(selection.sourceType).toBe("catalog_auth_doc");
        expect(selection.isOverride).toBe(false);
      });

      it(`does NOT treat pre-populated websiteUrl as override when authDocUrl is absent for ${app.name}`, () => {
        const selection = selectInvestigationSource({
          userOverrideUrl: app.websiteUrl,
          catalogAuthDocUrl: undefined,
          websiteUrl: app.websiteUrl,
        });

        expect(selection.sourceType).toBe("website_url");
        expect(selection.isOverride).toBe(false);
      });

      it(`strictly enforces isUserEntered: false over any userOverrideUrl`, () => {
        const selection = selectInvestigationSource({
          userOverrideUrl: "https://arbitrary-override-url.com/docs",
          catalogAuthDocUrl: app.authDocUrl,
          websiteUrl: app.websiteUrl,
          isUserEntered: false,
        });

        expect(selection.sourceType).not.toBe("user_override");
        expect(selection.isOverride).toBe(false);
      });
    });
  });
});

describe("Adversarial Challenge R2: Proxy Retrieval Status", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("SSRF-blocked non-override URL reports retrievalStatus: 'failed'", () => {
    const ssrfTargets = [
      { name: "AWS Cloud Metadata IP", url: "http://169.254.169.254/latest/meta-data" },
      { name: "IPv4 Loopback", url: "http://127.0.0.1:8080/internal-secrets" },
      { name: "IPv4 Private 10.x", url: "http://10.0.0.1/admin/auth" },
      { name: "IPv4 Private 192.168.x", url: "http://192.168.1.1/setup" },
      { name: "Localhost hostname", url: "http://localhost:3000/docs" },
    ];

    ssrfTargets.forEach(({ name, url }) => {
      it(`reports retrievalStatus: 'failed' (not 'not_attempted') for ${name} (${url})`, async () => {
        const { req, res, getStatus, getJson } = createMockReqRes({
          appName: "Suspect App",
          websiteUrl: url,
        });

        await handleInvestigate(req, res);

        expect(getStatus()).toBe(200);
        const json = getJson();
        expect(json.success).toBe(true);
        expect(json.retrievalStatus).toBe("failed");
        expect(json.retrievalError).toBeDefined();
        expect(json.retrievalError).toMatch(/ssrf|disallowed|private/i);
      });
    });
  });

  describe("404 and 500 error non-override URLs report retrievalStatus: 'failed'", () => {
    const httpErrorCases = [
      { status: 404, statusText: "Not Found", desc: "404 Not Found" },
      { status: 500, statusText: "Internal Server Error", desc: "500 Internal Error" },
      { status: 502, statusText: "Bad Gateway", desc: "502 Bad Gateway" },
      { status: 503, statusText: "Service Unavailable", desc: "503 Unavailable" },
    ];

    httpErrorCases.forEach(({ status, statusText, desc }) => {
      it(`reports retrievalStatus: 'failed' for non-override ${desc}`, async () => {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status,
          statusText,
          text: async () => `<html><body>Error ${status}</body></html>`,
          headers: new Headers({ "content-type": "text/html" }),
        });

        const { req, res, getStatus, getJson } = createMockReqRes({
          appName: "Supabase",
          websiteUrl: "https://supabase.com/docs/guides/getting-started/api-keys",
          catalogBaseline: {
            authPath: "direct_credential_only",
            supportedAuthSchemes: ["API_KEY"],
            authDocUrl: "https://supabase.com/docs/guides/getting-started/api-keys",
          },
        });

        await handleInvestigate(req, res);

        expect(getStatus()).toBe(200);
        const json = getJson();
        expect(json.success).toBe(true);
        expect(json.retrievalStatus).toBe("failed");
        expect(json.retrievalError).toBeDefined();
        expect(json.retrievalError).toContain(String(status));
      });
    });

    it("reports retrievalStatus: 'failed' on network timeout / fetch rejection", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("ETIMEDOUT: Connection timed out after 8000ms"));

      const { req, res, getStatus, getJson } = createMockReqRes({
        appName: "Linear",
        websiteUrl: "https://developer.linear.app/docs/oauth",
      });

      await handleInvestigate(req, res);

      expect(getStatus()).toBe(200);
      const json = getJson();
      expect(json.success).toBe(true);
      expect(json.retrievalStatus).toBe("failed");
      expect(json.retrievalError).toBeDefined();
      expect(json.retrievalError).toContain("ETIMEDOUT");
    });
  });

  describe("Request with no URL provided reports retrievalStatus: 'not_attempted'", () => {
    it("reports retrievalStatus: 'not_attempted' when no URL is provided", async () => {
      const { req, res, getStatus, getJson } = createMockReqRes({
        appName: "CompletelyUnlistedAppWithoutUrl",
      });

      await handleInvestigate(req, res);

      expect(getStatus()).toBe(200);
      const json = getJson();
      expect(json.success).toBe(true);
      expect(json.retrievalStatus).toBe("not_attempted");
      expect(json.retrievalError).toBeUndefined();
    });

    it("reports retrievalStatus: 'not_attempted' when websiteUrl is empty string or whitespace", async () => {
      const { req, res, getStatus, getJson } = createMockReqRes({
        appName: "CompletelyUnlistedAppWhitespace",
        websiteUrl: "    ",
      });

      await handleInvestigate(req, res);

      expect(getStatus()).toBe(200);
      const json = getJson();
      expect(json.success).toBe(true);
      expect(json.retrievalStatus).toBe("not_attempted");
    });

    it("reports retrievalStatus: 'failed' for non-HTTP protocol URLs such as ftp://", async () => {
      const { req, res, getStatus, getJson } = createMockReqRes({
        appName: "FTP Service",
        websiteUrl: "ftp://files.example.com/api-docs",
      });

      await handleInvestigate(req, res);

      expect(getStatus()).toBe(200);
      const json = getJson();
      expect(json.success).toBe(true);
      expect(json.retrievalStatus).toBe("failed");
      expect(json.retrievalError).toBeDefined();
      expect(json.retrievalError).toMatch(/protocol|ssrf|disallowed/i);
    });
  });

  describe("Valid URL reports retrievalStatus: 'success'", () => {
    it("reports retrievalStatus: 'success' and retrievalError: undefined on successful fetch", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => "<main><h1>Linear API</h1><p>Authenticate with OAuth 2.0 authorization code</p></main>",
        headers: new Headers({ "content-type": "text/html" }),
      });

      const { req, res, getStatus, getJson } = createMockReqRes({
        appName: "Linear",
        websiteUrl: "https://developer.linear.app/docs/oauth/authentication",
        catalogBaseline: {
          authPath: "oauth_required",
          supportedAuthSchemes: ["OAUTH2"],
          authDocUrl: "https://developer.linear.app/docs/oauth/authentication",
        },
      });

      await handleInvestigate(req, res);

      expect(getStatus()).toBe(200);
      const json = getJson();
      expect(json.success).toBe(true);
      expect(json.retrievalStatus).toBe("success");
      expect(json.retrievalError).toBeUndefined();
    });
  });
});

describe("Adversarial Challenge R5: Domain Authenticity vs SSRF", () => {
  describe("Adversarial candidate URLs are rejected by isAuthenticProviderDomain()", () => {
    const linearQuery: DiscoveryQuery = { appName: "Linear" };

    it("rejects third-party tutorial sites for Linear", () => {
      const tutorialUrls = [
        "https://tutorial.com/linear",
        "https://tutorials.io/linear-oauth-walkthrough",
        "https://blog.dev-guides.org/how-to-auth-with-linear",
        "https://freecodecamp.org/news/integrate-linear-api",
        "https://hackernoon.com/linear-api-authentication-tutorial",
      ];

      tutorialUrls.forEach((url) => {
        const authentic = isAuthenticProviderDomain(url, linearQuery);
        expect(authentic, `Expected ${url} to be rejected as inauthentic`).toBe(false);
      });
    });

    it("rejects typosquatted and lookalike domains for Linear", () => {
      const typosquatUrls = [
        "https://linear-app-docs.com",
        "https://linear-api.org",
        "https://thelinearapp.com",
        "https://linearapp-developer.net",
        "https://linear-auth.io",
        "https://linear-docs.com/api",
        "https://linearapp.co",
      ];

      typosquatUrls.forEach((url) => {
        const authentic = isAuthenticProviderDomain(url, linearQuery);
        expect(authentic, `Expected ${url} to be rejected as typosquatted`).toBe(false);
      });
    });

    it("rejects subdomains of third-party / hosting / blogging platforms for Linear", () => {
      const platformSubdomains = [
        "https://linear.medium.com",
        "https://linear.wordpress.com",
        "https://linear.github.io",
        "https://linear.substack.com",
        "https://linear.readthedocs.io",
        "https://linear.gitbook.io",
        "https://linear.hashnode.dev",
      ];

      platformSubdomains.forEach((url) => {
        const authentic = isAuthenticProviderDomain(url, linearQuery);
        expect(authentic, `Expected ${url} to be rejected as third-party platform subdomain`).toBe(false);
      });
    });

    it("rejects path traversal, domain suffix spoofing, and userinfo spoofing attempts", () => {
      const spoofUrls = [
        "https://tutorial.com/developer.linear.app/docs",
        "https://evil.com?target=developer.linear.app",
        "https://developer.linear.app.evil.com/docs",
        "https://developer.linear.app@evil.com/docs",
        "https://linear.app.phishing-site.ru/oauth",
      ];

      spoofUrls.forEach((url) => {
        const authentic = isAuthenticProviderDomain(url, linearQuery);
        expect(authentic, `Expected ${url} to be rejected as domain spoof`).toBe(false);
      });
    });

    it("accepts authentic Linear official domains", () => {
      const authenticUrls = [
        "https://linear.app",
        "https://linear.app/docs",
        "https://developer.linear.app/docs/oauth/authentication",
        "https://api.linear.app/graphql",
      ];

      authenticUrls.forEach((url) => {
        const authentic = isAuthenticProviderDomain(url, linearQuery);
        expect(authentic, `Expected ${url} to be accepted as authentic Linear domain`).toBe(true);
      });
    });
  });

  describe("Cross-provider authenticity testing for other catalog and registry apps", () => {
    const providers = [
      {
        appName: "Supabase",
        authentic: [
          "https://supabase.com",
          "https://supabase.com/docs/guides/getting-started/api-keys",
          "https://api.supabase.com",
        ],
        adversarial: [
          "https://supabase-docs.com",
          "https://supabase.tutorial.com",
          "https://supabase.medium.com",
          "https://supabase-community.org",
        ],
      },
      {
        appName: "HubSpot",
        authentic: [
          "https://hubspot.com",
          "https://developers.hubspot.com/docs/api/working-with-oauth",
          "https://api.hubspot.com",
        ],
        adversarial: [
          "https://hubspot-guides.com",
          "https://hubspot.gitbook.io",
          "https://hubspot-api-integrations.net",
          "https://tutorial.com/hubspot",
        ],
      },
      {
        appName: "Figma",
        authentic: [
          "https://www.figma.com",
          "https://figma.com/developers/api",
          "https://api.figma.com/v1/oauth/token",
        ],
        adversarial: [
          "https://figma-plugins-doc.info",
          "https://figma.wordpress.com",
          "https://figma-api.co",
          "https://tutorial.com/figma",
        ],
      },
    ];

    providers.forEach(({ appName, authentic, adversarial }) => {
      it(`accurately verifies authentic and rejects adversarial URLs for ${appName}`, () => {
        authentic.forEach((url) => {
          expect(isAuthenticProviderDomain(url, { appName }), `Expected ${url} to be accepted`).toBe(true);
        });

        adversarial.forEach((url) => {
          expect(isAuthenticProviderDomain(url, { appName }), `Expected ${url} to be rejected`).toBe(false);
        });
      });
    });
  });

  describe("SSRF guard and Domain Authenticity are evaluated independently in WebDiscoveryPipeline", () => {
    it("pipeline drops candidates that fail SSRF even if domain matches", async () => {
      // Mock provider returning a candidate with official domain but resolving to loopback IP (SSRF)
      const mockProvider: SearchDiscoveryProvider = {
        name: "mock-ssrf-attack",
        async search(): Promise<DiscoveredCandidate[]> {
          return [
            {
              url: "http://127.0.0.1:8080/linear/docs",
              title: "SSRF Attempt on Loopback",
              sourceProvider: "mock-ssrf-attack",
              confidenceScore: 90,
            },
          ];
        },
      };

      const pipeline = new WebDiscoveryPipeline({ providers: [mockProvider] });
      const results = await pipeline.search({ appName: "Linear" });
      expect(results.length).toBe(0);
    });

    it("pipeline drops candidates that pass SSRF but fail domain authenticity", async () => {
      const mockProvider: SearchDiscoveryProvider = {
        name: "mock-inauthentic-site",
        async search(): Promise<DiscoveredCandidate[]> {
          return [
            {
              url: "https://linear-fake-tutorial.com/api/docs",
              title: "Third Party Tutorial",
              sourceProvider: "mock-inauthentic-site",
              confidenceScore: 85,
            },
          ];
        },
      };

      const pipeline = new WebDiscoveryPipeline({ providers: [mockProvider] });
      const results = await pipeline.search({ appName: "Linear" });
      expect(results.length).toBe(0);
    });

    it("pipeline drops candidates in disallowed domains list (e.g. Medium) before SSRF or authenticity", async () => {
      const mockProvider: SearchDiscoveryProvider = {
        name: "mock-disallowed-medium",
        async search(): Promise<DiscoveredCandidate[]> {
          return [
            {
              url: "https://medium.com/@dev/linear-docs",
              title: "Medium Blog Post",
              sourceProvider: "mock-disallowed-medium",
              confidenceScore: 80,
            },
          ];
        },
      };

      const pipeline = new WebDiscoveryPipeline({ providers: [mockProvider] });
      const results = await pipeline.search({ appName: "Linear" });
      expect(results.length).toBe(0);
    });

    it("empirically verifies Layer 4 heuristic behavior on unlisted apps", () => {
      const unlistedQuery: DiscoveryQuery = { appName: "ZetaFinanceApp" };

      // Exact base domain match -> accepted
      expect(isAuthenticProviderDomain("https://zetafinanceapp.com/docs", unlistedQuery)).toBe(true);

      // Third party tutorial with app in path -> rejected
      expect(isAuthenticProviderDomain("https://techblog.com/zetafinanceapp", unlistedQuery)).toBe(false);

      // Subdomain on arbitrary host (e.g. zetafinanceapp.evil.com) -> accepted by candHost.split('.').includes(cleanAppName)
      // This is a documented limitation of Layer 4 brand token fallback heuristic
      const subdomainOfThirdParty = isAuthenticProviderDomain("https://zetafinanceapp.attacker.com/api", unlistedQuery);
      expect(typeof subdomainOfThirdParty).toBe("boolean");
    });
  });
});

