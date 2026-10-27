import { describe, it, expect, vi } from "vitest";
import {
  handleHealth,
  handleRetrieve,
  handleInvestigate,
  fetchAndCleanDoc,
} from "../../server/proxyServer";

function createMockReqRes(options: { body?: any; query?: any; method?: string; url?: string } = {}) {
  let statusCode = 200;
  let sentJson: any = null;
  const req = {
    body: options.body || {},
    query: options.query || {},
    method: options.method || "GET",
    url: options.url || "/",
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

describe("Milestone 2: Server Retrieval Proxy Suite", () => {
  describe("GET /api/health", () => {
    it("returns status ok and valid ISO timestamp", () => {
      const { req, res, getStatus, getJson } = createMockReqRes();
      handleHealth(req, res);

      expect(getStatus()).toBe(200);
      const data = getJson();
      expect(data.status).toBe("ok");
      expect(typeof data.timestamp).toBe("string");
      expect(new Date(data.timestamp).getTime()).not.toBeNaN();
    });
  });

  describe("POST /api/retrieve", () => {
    it("rejects request when url parameter is missing", async () => {
      const { req, res, getStatus, getJson } = createMockReqRes({ body: {} });
      await handleRetrieve(req, res);

      expect(getStatus()).toBe(400);
      const data = getJson();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Missing or invalid 'url'");
    });

    it("blocks SSRF loopback requests (127.0.0.1)", async () => {
      const { req, res, getStatus, getJson } = createMockReqRes({
        body: { url: "http://127.0.0.1:8080/secret" },
      });
      await handleRetrieve(req, res);

      expect(getStatus()).toBe(400);
      const data = getJson();
      expect(data.success).toBe(false);
      expect(data.error).toContain("loopback/localhost is blocked");
    });

    it("blocks SSRF cloud metadata requests (169.254.169.254)", async () => {
      const { req, res, getStatus, getJson } = createMockReqRes({
        body: { url: "http://169.254.169.254/latest/meta-data/" },
      });
      await handleRetrieve(req, res);

      expect(getStatus()).toBe(400);
      const data = getJson();
      expect(data.success).toBe(false);
      expect(data.error).toContain("metadata service is blocked");
    });

    it("blocks SSRF private RFC 1918 range (10.0.0.1)", async () => {
      const { req, res, getStatus, getJson } = createMockReqRes({
        body: { url: "http://10.0.0.1/admin" },
      });
      await handleRetrieve(req, res);

      expect(getStatus()).toBe(400);
      const data = getJson();
      expect(data.success).toBe(false);
      expect(data.error).toContain("10.0.0.0/8");
    });
  });

  describe("HTML Sanitization, Cheerio Stripping & 15,000 Budget in fetchAndCleanDoc", () => {
    it("strips scripts, styles, nav, and converts clean content to Markdown", async () => {
      const originalFetch = global.fetch;
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Acme Developer Docs</title>
            <style>body { color: red; }</style>
            <script>alert("evil");</script>
          </head>
          <body>
            <nav><a href="/home">Home</a></nav>
            <header>Site Header</header>
            <main>
              <h1>OAuth 2.0 Integration</h1>
              <p>Authorize at <code>https://acme.com/oauth/authorize</code>.</p>
              <p>Token endpoint: <code>https://acme.com/oauth/token</code>.</p>
            </main>
            <footer>Copyright 2026</footer>
          </body>
        </html>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        url: "https://acme.com/docs",
        headers: new Headers({ "content-type": "text/html" }),
        text: async () => mockHtml,
      } as any);

      try {
        const result = await fetchAndCleanDoc("https://acme.com/docs");
        expect(result.success).toBe(true);
        expect(result.title).toBe("Acme Developer Docs");
        expect(result.markdown).toContain("# OAuth 2.0 Integration");
        expect(result.markdown).toContain("https://acme.com/oauth/authorize");
        // Verify scripts, styles, nav, and footer were stripped
        expect(result.markdown).not.toContain("alert");
        expect(result.markdown).not.toContain("Site Header");
        expect(result.markdown).not.toContain("Copyright 2026");
      } finally {
        global.fetch = originalFetch;
      }
    });

    it("enforces 15,000 character budget on oversized content", async () => {
      const originalFetch = global.fetch;
      const massiveText = "A".repeat(20000);
      const mockHtml = `<html><body><main><p>${massiveText}</p></main></body></html>`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        url: "https://acme.com/oversized-docs",
        headers: new Headers({ "content-type": "text/html" }),
        text: async () => mockHtml,
      } as any);

      try {
        const result = await fetchAndCleanDoc("https://acme.com/oversized-docs");
        expect(result.success).toBe(true);
        expect(result.characterCount).toBeLessThan(15100);
        expect(result.markdown).toContain("[Content truncated to 15,000 character budget...]");
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe("POST /api/investigate", () => {
    it("returns 400 when appName is missing", async () => {
      const { req, res, getStatus, getJson } = createMockReqRes({ body: {} });
      await handleInvestigate(req, res);

      expect(getStatus()).toBe(400);
      const data = getJson();
      expect(data.success).toBe(false);
      expect(data.error).toContain("Missing or invalid 'appName'");
    });

    it("Mode 1: Resolves curated GitHub guide via fast-path", async () => {
      const { req, res, getStatus, getJson } = createMockReqRes({
        body: { appName: "GitHub" },
      });
      await handleInvestigate(req, res);

      expect(getStatus()).toBe(200);
      const data = getJson();
      expect(data.success).toBe(true);
      expect(data.modeUsed).toBe("curated_fast_path");
      expect(data.guide.appId).toBe("github");
      expect(data.guide.readinessSummary.authPathClassification).toBe("hybrid_oauth_or_direct");
    });

    it("Mode 1: Resolves curated Slack guide via fast-path", async () => {
      const { req, res, getStatus, getJson } = createMockReqRes({
        body: { appName: "Slack" },
      });
      await handleInvestigate(req, res);

      expect(getStatus()).toBe(200);
      const data = getJson();
      expect(data.success).toBe(true);
      expect(data.modeUsed).toBe("curated_fast_path");
      expect(data.guide.appId).toBe("slack");
      expect(data.guide.readinessSummary.authPathClassification).toBe("oauth_required");
    });

    it("Mode 2: Resolves unfamiliar Linear app dynamically with unknown Composio status", async () => {
      const { req, res, getStatus, getJson } = createMockReqRes({
        body: {
          appName: "Linear",
          websiteUrl: "https://linear.app",
        },
      });
      await handleInvestigate(req, res);

      expect(getStatus()).toBe(200);
      const data = getJson();
      expect(data.success).toBe(true);
      expect(data.modeUsed).toBe("heuristic_research");
      expect(data.guide.appName).toBe("Linear");
      expect(data.guide.composioManagedAuthStatus.value).toBe("unknown");
      expect(data.guide.readinessSummary.authPathClassification).toBe("oauth_required");
      expect(data.guide.authSpec.providerEndpoints.authorizationUrl.value).toBe("https://linear.app/oauth/authorize");
    });

    it("Mode 2: Resolves unfamiliar Resend app as direct_credential_only", async () => {
      const { req, res, getStatus, getJson } = createMockReqRes({
        body: {
          appName: "Resend",
          websiteUrl: "https://resend.com",
        },
      });
      await handleInvestigate(req, res);

      expect(getStatus()).toBe(200);
      const data = getJson();
      expect(data.success).toBe(true);
      expect(data.modeUsed).toBe("heuristic_research");
      expect(data.guide.appName).toBe("Resend");
      expect(data.guide.readinessSummary.authPathClassification).toBe("direct_credential_only");
      expect(data.guide.readinessSummary.oauthNecessityBanner).toContain("OAuth setup isn't required");
      expect(data.guide.authSpec.providerEndpoints).toBeUndefined();
    });

    it("Mode 2: Resolves unfamiliar HubSpot app as hybrid_oauth_or_direct", async () => {
      const { req, res, getStatus, getJson } = createMockReqRes({
        body: {
          appName: "HubSpot",
          websiteUrl: "https://hubspot.com",
        },
      });
      await handleInvestigate(req, res);

      expect(getStatus()).toBe(200);
      const data = getJson();
      expect(data.success).toBe(true);
      expect(data.modeUsed).toBe("heuristic_research");
      expect(data.guide.readinessSummary.authPathClassification).toBe("hybrid_oauth_or_direct");
      expect(data.guide.authSpec.mode).toBe("hybrid");
    });

    it("Mode 2: Resolves unfamiliar Calendly app as oauth_required", async () => {
      const { req, res, getStatus, getJson } = createMockReqRes({
        body: {
          appName: "Calendly",
          websiteUrl: "https://developer.calendly.com",
        },
      });
      await handleInvestigate(req, res);

      expect(getStatus()).toBe(200);
      const data = getJson();
      expect(data.success).toBe(true);
      expect(data.modeUsed).toBe("heuristic_research");
      expect(data.guide.appName).toBe("Calendly");
      expect(data.guide.readinessSummary.authPathClassification).toBe("oauth_required");
      expect(data.guide.authSpec.providerEndpoints.authorizationUrl.value).toBe("https://auth.calendly.com/oauth/authorize");
    });
  });
});
