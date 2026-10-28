/**
 * tests/unit/adversarial_r1_r2_stress.test.ts
 *
 * Empirical Adversarial Stress Test Suite for Requirements R1 and R2:
 * 1. Override Isolation Stress Test (malicious schemes, malformed URLs, failing HTTP statuses across catalog/registry/unlisted apps)
 * 2. SSRF Protection Stress Test (all private IPv4/IPv6 ranges, CGNAT, loopback, cloud metadata, integer/hex IPs, and DNS rebinding)
 * 3. Domain Blacklist Evasion Stress Test (subdomains, casing mutations, path appendages, ports for all 38 disallowed domains + negative controls)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import dns from "node:dns/promises";
import { handleInvestigate } from "../../server/proxyServer";
import { validateSsrfTarget, validateSsrfTargetWithDns } from "../../src/agent/sanitizer";
import {
  DISALLOWED_DISCOVERY_DOMAINS,
  isDisallowedDiscoveryDomain,
} from "../../src/agent/searchDiscovery";
import { selectInvestigationSource } from "../../src/utils/investigationSource";

// Lightweight Express Mock Helper
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

describe("Adversarial Stress Test: Requirements R1 & R2", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Section 1: Override Isolation Stress Tests
  // ==========================================================================
  describe("1. Override Isolation Stress Test", () => {
    const maliciousProtocols = [
      { scheme: "ftp://", url: "ftp://attacker.com/credentials.txt" },
      { scheme: "file://", url: "file:///etc/passwd" },
      { scheme: "file:// (win)", url: "file:///C:/Windows/System32/drivers/etc/hosts" },
      { scheme: "gopher://", url: "gopher://gopher.floodgap.com/1/" },
      { scheme: "javascript:", url: "javascript:alert(document.cookie)" },
      { scheme: "data:", url: "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==" },
      { scheme: "blob:", url: "blob:https://example.com/uuid-blob-reference" },
      { scheme: "ws://", url: "ws://attacker.com/socket" },
      { scheme: "wss://", url: "wss://attacker.com/secure-socket" },
      { scheme: "ldap://", url: "ldap://attacker.com/cn=admin" },
      { scheme: "dict://", url: "dict://attacker.com/d:test" },
    ];

    maliciousProtocols.forEach(({ scheme, url }) => {
      it(`blocks malicious protocol override '${scheme}' with HTTP 400 and zero fall-through`, async () => {
        const { req, res, getStatus, getJson } = createMockReqRes({
          appName: "GitHub",
          userOverrideUrl: url,
          catalogBaseline: {
            authPath: "oauth_required",
            supportedAuthSchemes: ["OAUTH2"],
            authDocUrl: "https://docs.github.com/en/apps/oauth-apps",
          },
        });

        await handleInvestigate(req, res);

        expect(getStatus()).toBe(400);
        const data = getJson();
        expect(data.success).toBe(false);
        expect(data.retrievalStatus).toBe("failed");
        expect(data.selectedSource.sourceType).toBe("user_override");
        expect(data.selectedSource.isOverride).toBe(true);
        expect(data.authPathClassification).toBe("undetermined");
        expect(data.guide).toBeUndefined(); // Strictly NO fallback to GitHub curated guide
        expect(data.error).toBeDefined();
        expect(data.logs.some((l: string) => l.includes("[OVERRIDE] Isolated failure: fallback to catalog/registry is strictly prohibited"))).toBe(true);
      });
    });

    const malformedUrls = [
      "not-a-valid-url",
      "htp:/missing-t",
      "//missing-protocol.com",
      "https://",
      "http://",
      "://no-scheme",
      "https://[invalid-ipv6-bracket",
      "https://example.com:99999/invalid-port",
    ];

    malformedUrls.forEach((badUrl) => {
      it(`rejects malformed override URL '${badUrl}' with HTTP 400 and isolated failure`, async () => {
        const { req, res, getStatus, getJson } = createMockReqRes({
          appName: "Slack",
          userOverrideUrl: badUrl,
          catalogBaseline: {
            authPath: "oauth_required",
            supportedAuthSchemes: ["OAUTH2"],
            authDocUrl: "https://api.slack.com/authentication",
          },
        });

        await handleInvestigate(req, res);

        expect(getStatus()).toBe(400);
        const data = getJson();
        expect(data.success).toBe(false);
        expect(data.retrievalStatus).toBe("failed");
        expect(data.selectedSource.sourceType).toBe("user_override");
        expect(data.guide).toBeUndefined(); // Zero fallback to Slack curated guide
        expect(data.authPathClassification).toBe("undetermined");
      });
    });

    const catalogAppsToTest = [
      {
        name: "GitHub",
        catalogDoc: "https://docs.github.com/en/apps/oauth-apps",
        catalogBaseline: { authPath: "oauth_required" as const, supportedAuthSchemes: ["OAUTH2" as const] },
      },
      {
        name: "Supabase",
        catalogDoc: "https://supabase.com/docs/guides/getting-started/api-keys",
        catalogBaseline: { authPath: "direct_credential_only" as const, supportedAuthSchemes: ["API_KEY" as const] },
      },
      {
        name: "Slack",
        catalogDoc: "https://api.slack.com/authentication/oauth-v2",
        catalogBaseline: { authPath: "oauth_required" as const, supportedAuthSchemes: ["OAUTH2" as const] },
      },
      {
        name: "Linear",
        catalogDoc: "https://developers.linear.app/docs/oauth/authentication",
        catalogBaseline: { authPath: "oauth_required" as const, supportedAuthSchemes: ["OAUTH2" as const] },
      },
      {
        name: "UnlistedCustomApp",
        catalogDoc: undefined,
        catalogBaseline: undefined,
      },
    ];

    const failureScenarios = [
      {
        scenario: "HTTP 404 Not Found",
        expectedStatus: 404,
        mockResponse: () => ({
          ok: false,
          status: 404,
          statusText: "Not Found",
          headers: new Headers({ "content-type": "text/html" }),
          text: () => Promise.resolve("404 Custom Not Found"),
        }),
      },
      {
        scenario: "HTTP 500 Internal Server Error",
        expectedStatus: 500,
        mockResponse: () => ({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          headers: new Headers({ "content-type": "text/html" }),
          text: () => Promise.resolve("500 Server Error"),
        }),
      },
      {
        scenario: "HTTP 502 Bad Gateway",
        expectedStatus: 502,
        mockResponse: () => ({
          ok: false,
          status: 502,
          statusText: "Bad Gateway",
          headers: new Headers({ "content-type": "text/html" }),
          text: () => Promise.resolve("502 Bad Gateway"),
        }),
      },
      {
        scenario: "Timeout / Network Abort (504)",
        expectedStatus: 504,
        mockResponse: () => {
          const err = new Error("Request timed out");
          err.name = "AbortError";
          throw err;
        },
      },
      {
        scenario: "Network Connection Refused (502)",
        expectedStatus: 502,
        mockResponse: () => {
          throw new Error("connect ECONNREFUSED 198.51.100.1:443");
        },
      },
    ];

    catalogAppsToTest.forEach((app) => {
      failureScenarios.forEach(({ scenario, expectedStatus, mockResponse }) => {
        it(`app '${app.name}' under ${scenario} override never falls back to catalog/registry`, async () => {
          global.fetch = vi.fn().mockImplementation(mockResponse);

          const { req, res, getStatus, getJson } = createMockReqRes({
            appName: app.name,
            websiteUrl: `https://${app.name.toLowerCase()}.com`,
            userOverrideUrl: "https://my-custom-doc.example.com/broken-docs",
            catalogBaseline: app.catalogBaseline
              ? {
                  ...app.catalogBaseline,
                  authDocUrl: app.catalogDoc,
                }
              : undefined,
          });

          await handleInvestigate(req, res);

          expect(getStatus()).toBe(expectedStatus);
          const data = getJson();
          expect(data.success).toBe(false);
          expect(data.retrievalStatus).toBe("failed");
          expect(data.selectedSource.sourceType).toBe("user_override");
          expect(data.selectedSource.isOverride).toBe(true);
          expect(data.selectedSource.url).toBe("https://my-custom-doc.example.com/broken-docs");
          expect(data.appName).toBe(app.name);
          expect(data.authPathClassification).toBe("undetermined");
          // Zero fallback: guide MUST NOT exist
          expect(data.guide).toBeUndefined();
          expect(data.error).toBeDefined();
          expect(data.logs).toContain(
            "[OVERRIDE] Isolated failure: fallback to catalog/registry is strictly prohibited."
          );
        });
      });
    });

    it("verifies selectInvestigationSource sets isOverride=true strictly when userOverrideUrl is provided", () => {
      const result = selectInvestigationSource({
        userOverrideUrl: "https://custom.example.com/docs",
        catalogAuthDocUrl: "https://supabase.com/docs/guides/getting-started/api-keys",
        websiteUrl: "https://supabase.com",
      });

      expect(result.sourceType).toBe("user_override");
      expect(result.url).toBe("https://custom.example.com/docs");
      expect(result.isOverride).toBe(true);
      expect(result.notes).toContain("Fallback is strictly disabled");
    });

    it("blocks override that redirects to an internal IP (SSRF redirect hop)", async () => {
      // First hop returns 302 pointing to 169.254.169.254
      global.fetch = vi.fn().mockResolvedValue({
        status: 302,
        headers: new Headers({
          location: "http://169.254.169.254/latest/meta-data/",
        }),
      } as any);

      const { req, res, getStatus, getJson } = createMockReqRes({
        appName: "Slack",
        userOverrideUrl: "https://open-redirector.attacker.com/forward",
      });

      await handleInvestigate(req, res);

      expect(getStatus()).toBe(400);
      const data = getJson();
      expect(data.success).toBe(false);
      expect(data.retrievalStatus).toBe("failed");
      expect(data.error).toContain("Redirect target violated SSRF security guard");
      expect(data.guide).toBeUndefined(); // Zero fallback
    });

    it("blocks override that exceeds maximum allowed redirects (> 4 hops)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 302,
        headers: new Headers({
          location: "https://open-redirector.attacker.com/next-hop",
        }),
      } as any);

      const { req, res, getStatus, getJson } = createMockReqRes({
        appName: "Slack",
        userOverrideUrl: "https://open-redirector.attacker.com/hop1",
      });

      await handleInvestigate(req, res);

      expect(getStatus()).toBe(508);
      const data = getJson();
      expect(data.success).toBe(false);
      expect(data.retrievalStatus).toBe("failed");
      expect(data.error).toContain("Too many redirects");
    });

    it("rejects override target returning non-HTML binary content type (e.g. application/pdf)", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({
          "content-type": "application/pdf",
        }),
        text: () => Promise.resolve("%PDF-1.4 binary garbage"),
      } as any);

      const { req, res, getStatus, getJson } = createMockReqRes({
        appName: "Linear",
        userOverrideUrl: "https://example.com/spec.pdf",
      });

      await handleInvestigate(req, res);

      expect(getStatus()).toBe(400);
      const data = getJson();
      expect(data.success).toBe(false);
      expect(data.retrievalStatus).toBe("failed");
      expect(data.error).toContain("Invalid content type: 'application/pdf'");
      expect(data.guide).toBeUndefined();
    });

    it("ensures successful override on a catalog app (GitHub) executes dynamic research and never curated fast-path", async () => {
      const customDocs = `
      <main>
        <h1>Custom Internal GitHub Gateway</h1>
        <p>This service authenticates exclusively using static API keys passed in the X-Custom-Key header.</p>
        <pre><code class="language-bash">curl -H "X-Custom-Key: secret123" https://gateway.internal.example.com/api</code></pre>
      </main>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({
          "content-type": "text/html; charset=utf-8",
        }),
        text: () => Promise.resolve(customDocs),
      } as any);

      const { req, res, getStatus, getJson } = createMockReqRes({
        appName: "GitHub",
        userOverrideUrl: "https://gateway.example.com/docs",
      });

      await handleInvestigate(req, res);

      expect(getStatus()).toBe(200);
      const data = getJson();
      expect(data.success).toBe(true);
      expect(data.retrievalStatus).toBe("success");
      expect(data.selectedSource.sourceType).toBe("user_override");
      expect(data.modeUsed).toBe("heuristic_research"); // Strictly NOT "curated_fast_path"
      expect(data.guide).toBeDefined();
    });
  });

  // ==========================================================================
  // Section 2: SSRF Protection Stress Tests
  // ==========================================================================
  describe("2. SSRF Protection Stress Test", () => {
    const privateIpTargets = [
      // 10.0.0.0/8
      { url: "http://10.0.0.1", label: "10.0.0.1 (low boundary)" },
      { url: "https://10.255.255.255", label: "10.255.255.255 (high boundary)" },
      { url: "http://10.123.45.67:8080/path", label: "10.x with port and path" },

      // 172.16.0.0/12
      { url: "http://172.16.0.0", label: "172.16.0.0 (low boundary)" },
      { url: "http://172.16.0.1", label: "172.16.0.1" },
      { url: "https://172.31.255.255", label: "172.31.255.255 (high boundary)" },
      { url: "http://172.24.100.50:3000", label: "172.24.x internal" },

      // 192.168.0.0/16
      { url: "http://192.168.0.0", label: "192.168.0.0 (low boundary)" },
      { url: "http://192.168.1.1", label: "192.168.1.1 (router)" },
      { url: "https://192.168.255.255", label: "192.168.255.255 (high boundary)" },

      // 127.0.0.0/8 Loopback
      { url: "http://127.0.0.1", label: "127.0.0.1 loopback" },
      { url: "http://127.0.0.2", label: "127.0.0.2 loopback" },
      { url: "https://127.255.255.255", label: "127.255.255.255 loopback boundary" },
      { url: "http://localhost", label: "localhost hostname" },
      { url: "http://localhost:3001/api/health", label: "localhost port" },

      // 0.0.0.0/8
      { url: "http://0.0.0.0", label: "0.0.0.0 current network" },
      { url: "http://0.0.0.1", label: "0.0.0.1 /8 network" },
      { url: "http://0.255.255.255", label: "0.255.255.255 /8 high" },

      // 169.254.0.0/16 Link-Local & Cloud Metadata
      { url: "http://169.254.169.254/latest/meta-data/", label: "AWS/OpenStack metadata" },
      { url: "http://169.254.169.254/computeMetadata/v1/", label: "GCP metadata" },
      { url: "http://metadata.google.internal", label: "GCP metadata hostname" },
      { url: "http://100.100.100.200", label: "Alibaba metadata IP" },
      { url: "http://169.254.1.1", label: "Link-local address" },

      // 100.64.0.0/10 Carrier-Grade NAT
      { url: "http://100.64.0.0", label: "100.64.0.0 (CGNAT low boundary)" },
      { url: "http://100.64.0.1", label: "100.64.0.1 (CGNAT)" },
      { url: "http://100.127.255.255", label: "100.127.255.255 (CGNAT high boundary)" },
      { url: "http://100.100.50.25", label: "100.100.x (CGNAT interior)" },

      // IPv6 Loopback
      { url: "http://[::1]", label: "IPv6 loopback [::1]" },
      { url: "http://[::]", label: "IPv6 unspecified [::]" },
      { url: "http://[0:0:0:0:0:0:0:1]", label: "IPv6 expanded loopback" },
      { url: "http://[0:0:0:0:0:0:0:0]", label: "IPv6 expanded unspecified" },

      // IPv6 Unique Local (fc00::/7)
      { url: "http://[fc00::1]", label: "IPv6 ULA fc00::1" },
      { url: "http://[fd00::1]", label: "IPv6 ULA fd00::1" },
      { url: "http://[fd12:3456:789a:bcde::1]", label: "IPv6 ULA custom prefix" },

      // IPv6 Link-Local (fe80::/10)
      { url: "http://[fe80::1]", label: "IPv6 link-local fe80::1" },
      { url: "http://[fe80::200:5efe:10.0.0.1]", label: "IPv6 ISATAP link-local" },
      { url: "http://[fe90::1]", label: "IPv6 link-local range fe90::" },
      { url: "http://[fea0::1]", label: "IPv6 link-local range fea0::" },
      { url: "http://[feb0::1]", label: "IPv6 link-local range feb0::" },

      // IPv4-mapped IPv6
      { url: "http://[::ffff:127.0.0.1]", label: "IPv4-mapped 127.0.0.1" },
      { url: "http://[::ffff:10.0.0.1]", label: "IPv4-mapped 10.0.0.1" },
      { url: "http://[::ffff:192.168.1.1]", label: "IPv4-mapped 192.168.1.1" },
      { url: "http://[::ffff:172.16.0.1]", label: "IPv4-mapped 172.16.0.1" },
      { url: "http://[::ffff:169.254.169.254]", label: "IPv4-mapped cloud metadata" },
      { url: "http://[::ffff:100.64.0.1]", label: "IPv4-mapped CGNAT" },

      // Integer-encoded IPs
      { url: "http://2130706433", label: "Integer 2130706433 (127.0.0.1)" },
      { url: "http://167772160", label: "Integer 167772160 (10.0.0.0)" },
      { url: "http://167772161", label: "Integer 167772161 (10.0.0.1)" },
      { url: "http://184549375", label: "Integer 184549375 (10.255.255.255)" },
    ];

    privateIpTargets.forEach(({ url, label }) => {
      it(`validateSsrfTarget blocks private IP target: ${label} (${url})`, () => {
        const result = validateSsrfTarget(url);
        expect(result.isValid).toBe(false);
        expect(result.allowed).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    const publicAllowedTargets = [
      { url: "https://docs.github.com", label: "Public HTTPS GitHub" },
      { url: "https://supabase.com/docs", label: "Public HTTPS Supabase" },
      { url: "https://api.slack.com", label: "Public HTTPS Slack" },
      { url: "http://172.15.255.255", label: "172.15.255.255 (public boundary below 172.16)" },
      { url: "http://172.32.0.1", label: "172.32.0.1 (public boundary above 172.31)" },
      { url: "http://100.63.255.255", label: "100.63.255.255 (public boundary below CGNAT)" },
      { url: "http://100.128.0.1", label: "100.128.0.1 (public boundary above CGNAT)" },
      { url: "http://8.8.8.8", label: "Google Public DNS 8.8.8.8" },
      { url: "https://1.1.1.1", label: "Cloudflare Public DNS 1.1.1.1" },
    ];

    publicAllowedTargets.forEach(({ url, label }) => {
      it(`validateSsrfTarget permits legitimate public IP / domain: ${label} (${url})`, () => {
        const result = validateSsrfTarget(url);
        expect(result.isValid).toBe(true);
        expect(result.allowed).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    describe("validateSsrfTargetWithDns (Async DNS Resolution & Rebinding)", () => {
      it("blocks public hostname that resolves to private IP 127.0.0.1", async () => {
        vi.spyOn(dns, "lookup").mockResolvedValue([
          { address: "127.0.0.1", family: 4 },
        ] as any);

        const result = await validateSsrfTargetWithDns("https://rebind-test.attacker.com");
        expect(result.isValid).toBe(false);
        expect(result.allowed).toBe(false);
        expect(result.error).toContain("DNS resolution for host 'rebind-test.attacker.com' resolved to blocked IP 127.0.0.1");
      });

      it("blocks public hostname that resolves to private IP 10.0.0.5", async () => {
        vi.spyOn(dns, "lookup").mockResolvedValue([
          { address: "10.0.0.5", family: 4 },
        ] as any);

        const result = await validateSsrfTargetWithDns("https://internal-portal.corp.net");
        expect(result.isValid).toBe(false);
        expect(result.allowed).toBe(false);
        expect(result.error).toContain("10.0.0.5");
      });

      it("blocks dual-homed host when one of multiple A records resolves to private IP", async () => {
        vi.spyOn(dns, "lookup").mockResolvedValue([
          { address: "93.184.216.34", family: 4 }, // public example.com
          { address: "192.168.1.100", family: 4 }, // private LAN
        ] as any);

        const result = await validateSsrfTargetWithDns("https://dual-homed.example.com");
        expect(result.isValid).toBe(false);
        expect(result.allowed).toBe(false);
        expect(result.error).toContain("192.168.1.100");
      });

      it("permits public hostname that resolves to public IP addresses (e.g. 93.184.216.34)", async () => {
        vi.spyOn(dns, "lookup").mockResolvedValue([
          { address: "93.184.216.34", family: 4 },
        ] as any);

        const result = await validateSsrfTargetWithDns("https://example.com");
        expect(result.isValid).toBe(true);
        expect(result.allowed).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });
  });

  // ==========================================================================
  // Section 3: Domain Blacklist Evasion Stress Tests
  // ==========================================================================
  describe("3. Domain Blacklist Evasion Stress Test", () => {
    it("verifies the blacklist includes all 38 aggregator, forum, and directory domains", () => {
      expect(DISALLOWED_DISCOVERY_DOMAINS.length).toBeGreaterThanOrEqual(38);
      const expectedDomains = [
        "g2.com", "capterra.com", "producthunt.com", "alternativeto.net",
        "trustradius.com", "softwareadvice.com", "getapp.com", "crunchbase.com",
        "zoominfo.com", "pitchbook.com", "wikipedia.org", "wikibooks.org",
        "wikidata.org", "slant.co", "saasworthy.com", "sourceforge.net",
        "reddit.com", "stackoverflow.com", "stackexchange.com", "quora.com",
        "news.ycombinator.com", "medium.com", "dev.to", "twitter.com",
        "x.com", "facebook.com", "linkedin.com", "youtube.com",
        "instagram.com", "tiktok.com", "pinterest.com", "npmjs.com",
        "pypi.org", "crates.io", "packagist.org", "rubygems.org",
        "composio.dev", "composio.com",
      ];
      expectedDomains.forEach((domain) => {
        expect(DISALLOWED_DISCOVERY_DOMAINS).toContain(domain);
      });
    });

    // Test evasion vectors across every single blacklisted domain
    DISALLOWED_DISCOVERY_DOMAINS.forEach((domain) => {
      describe(`Blacklist Evasion Protection for '${domain}'`, () => {
        it(`blocks exact domain: https://${domain}/`, () => {
          expect(isDisallowedDiscoveryDomain(`https://${domain}/`)).toBe(true);
        });

        it(`blocks www subdomain: https://www.${domain}/products`, () => {
          expect(isDisallowedDiscoveryDomain(`https://www.${domain}/products`)).toBe(true);
        });

        it(`blocks arbitrary nested subdomains: https://api.staging.docs.${domain}/api/v1`, () => {
          expect(isDisallowedDiscoveryDomain(`https://api.staging.docs.${domain}/api/v1`)).toBe(true);
        });

        it(`blocks uppercase / mixed casing: https://${domain.toUpperCase()}/`, () => {
          expect(isDisallowedDiscoveryDomain(`https://${domain.toUpperCase()}/`)).toBe(true);
        });

        it(`blocks alternating casing with subdomains: https://SuB.WwW.${domain.toLowerCase()}/`, () => {
          expect(isDisallowedDiscoveryDomain(`https://SuB.WwW.${domain.toLowerCase()}/`)).toBe(true);
        });

        it(`blocks path and query parameter additions: https://${domain}/search?q=oauth2&sort=desc#anchor`, () => {
          expect(isDisallowedDiscoveryDomain(`https://${domain}/search?q=oauth2&sort=desc#anchor`)).toBe(true);
        });

        it(`blocks custom non-standard port: https://${domain}:8443/reviews`, () => {
          expect(isDisallowedDiscoveryDomain(`https://${domain}:8443/reviews`)).toBe(true);
        });

        it(`blocks credentials in URL: https://admin:secret@${domain}/private`, () => {
          expect(isDisallowedDiscoveryDomain(`https://admin:secret@${domain}/private`)).toBe(true);
        });
      });
    });

    describe("Negative Controls: Legitimate Provider Domains Allowed", () => {
      const allowedDomains = [
        "https://github.com",
        "https://docs.github.com/en/apps",
        "https://supabase.com",
        "https://supabase.com/docs/guides/getting-started/api-keys",
        "https://api.slack.com/authentication",
        "https://developers.linear.app/docs",
        "https://developer.spotify.com/documentation/web-api",
        "https://postmarkapp.com/developer",
        "https://developers.strava.com",
        "https://www.deepl.com/docs-api",
        "https://gitlab.com/api",
        "https://developers.hubspot.com",
        "https://developer.atlassian.com",
        // Distinct domains that happen to contain the blacklist word as a substring
        "https://myg2community.com",
        "https://notreddit.com",
        "https://faketwitter.org",
        "https://ourdev.today",
        "https://developer-x.com",
        "https://anti-medium.io",
      ];

      allowedDomains.forEach((url) => {
        it(`permits valid documentation or non-blacklisted domain: ${url}`, () => {
          expect(isDisallowedDiscoveryDomain(url)).toBe(false);
        });
      });
    });
  });
});
