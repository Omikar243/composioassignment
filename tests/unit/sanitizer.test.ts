import { describe, it, expect } from "vitest";
import {
  validateSsrfTarget,
  sanitizeAndValidateEndpoint,
} from "../../src/agent/sanitizer";

describe("Milestone 2: Security Sanitizer & SSRF Guard Suite", () => {
  describe("validateSsrfTarget: Ingress SSRF Protection", () => {
    describe("Empty and Malformed Target Handling", () => {
      it("rejects empty, null, or whitespace-only targets", () => {
        expect(validateSsrfTarget("").isValid).toBe(false);
        expect(validateSsrfTarget("   ").isValid).toBe(false);
        expect(validateSsrfTarget(null as any).isValid).toBe(false);
        expect(validateSsrfTarget(undefined as any).isValid).toBe(false);
      });

      it("rejects malformed non-URL strings", () => {
        const result = validateSsrfTarget("not-a-valid-url");
        expect(result.isValid).toBe(false);
        expect(result.allowed).toBe(false);
        expect(result.error).toContain("Malformed URL");
      });

      it("rejects non-HTTP/HTTPS protocols", () => {
        const protocols = [
          "file:///etc/passwd",
          "ftp://files.example.com/dump",
          "gopher://127.0.0.1:70",
          "javascript:alert(1)",
          "data:text/html,<h1>Pwn</h1>",
          "ssh://git@github.com",
        ];

        protocols.forEach((url) => {
          const res = validateSsrfTarget(url);
          expect(res.isValid).toBe(false);
          expect(res.allowed).toBe(false);
          expect(res.error).toMatch(/Disallowed protocol/i);
        });
      });
    });

    describe("Loopback and Localhost Defenses", () => {
      it("blocks localhost domain name across ports", () => {
        const targets = [
          "http://localhost",
          "https://localhost:8080/metrics",
          "http://localhost:3000/internal",
        ];
        targets.forEach((url) => {
          const res = validateSsrfTarget(url);
          expect(res.isValid).toBe(false);
          expect(res.allowed).toBe(false);
          expect(res.error).toContain("loopback/localhost is blocked");
        });
      });

      it("blocks 127.0.0.0/8 loopback range and 0.0.0.0", () => {
        const targets = [
          "http://127.0.0.1",
          "http://127.0.0.1:8080/admin",
          "http://127.0.1.1",
          "http://127.100.200.1",
          "http://0.0.0.0",
        ];
        targets.forEach((url) => {
          const res = validateSsrfTarget(url);
          expect(res.isValid).toBe(false);
          expect(res.allowed).toBe(false);
        });
      });

      it("blocks IPv6 loopback variants", () => {
        const targets = [
          "http://[::1]/",
          "https://[::1]:8443/status",
          "http://[0:0:0:0:0:0:0:1]/",
        ];
        targets.forEach((url) => {
          const res = validateSsrfTarget(url);
          expect(res.isValid).toBe(false);
          expect(res.allowed).toBe(false);
        });
      });
    });

    describe("Cloud Metadata and Link-Local Service Defenses", () => {
      it("blocks AWS/GCP/Azure link-local metadata address 169.254.169.254", () => {
        const targets = [
          "http://169.254.169.254/latest/meta-data/",
          "http://169.254.169.254/computeMetadata/v1/",
          "http://169.254.1.1/",
        ];
        targets.forEach((url) => {
          const res = validateSsrfTarget(url);
          expect(res.isValid).toBe(false);
          expect(res.allowed).toBe(false);
          expect(res.error).toContain("metadata service is blocked");
        });
      });

      it("blocks internal cloud metadata hostnames", () => {
        const targets = [
          "http://metadata.google.internal/computeMetadata/v1/",
          "http://100.100.100.200/latest/meta-data/",
        ];
        targets.forEach((url) => {
          const res = validateSsrfTarget(url);
          expect(res.isValid).toBe(false);
          expect(res.allowed).toBe(false);
        });
      });
    });

    describe("RFC 1918 Private IPv4 Network Defenses", () => {
      it("blocks 10.0.0.0/8 private class A networks", () => {
        const targets = [
          "http://10.0.0.1",
          "http://10.10.10.10/admin",
          "http://10.255.255.255/internal",
        ];
        targets.forEach((url) => {
          const res = validateSsrfTarget(url);
          expect(res.isValid).toBe(false);
          expect(res.allowed).toBe(false);
          expect(res.error).toContain("10.0.0.0/8");
        });
      });

      it("blocks 172.16.0.0/12 private class B networks (172.16 - 172.31)", () => {
        const blocked = [
          "http://172.16.0.1",
          "http://172.20.10.5",
          "http://172.31.255.254",
        ];
        blocked.forEach((url) => {
          const res = validateSsrfTarget(url);
          expect(res.isValid).toBe(false);
          expect(res.allowed).toBe(false);
          expect(res.error).toContain("172.16.0.0/12");
        });

        // 172.15 and 172.32 are public IPs
        expect(validateSsrfTarget("https://172.15.0.1").isValid).toBe(true);
        expect(validateSsrfTarget("https://172.32.0.1").isValid).toBe(true);
      });

      it("blocks 192.168.0.0/16 private class C networks", () => {
        const targets = [
          "http://192.168.0.1",
          "http://192.168.1.1:8080/router",
          "http://192.168.254.254",
        ];
        targets.forEach((url) => {
          const res = validateSsrfTarget(url);
          expect(res.isValid).toBe(false);
          expect(res.allowed).toBe(false);
          expect(res.error).toContain("192.168.0.0/16");
        });
      });

      it("blocks Carrier-grade NAT (100.64.0.0/10)", () => {
        const targets = [
          "http://100.64.0.1",
          "http://100.100.50.25",
          "http://100.127.255.254",
        ];
        targets.forEach((url) => {
          const res = validateSsrfTarget(url);
          expect(res.isValid).toBe(false);
          expect(res.allowed).toBe(false);
          expect(res.error).toContain("carrier-grade NAT");
        });
      });
    });

    describe("IPv6 Private / Link-Local Defenses", () => {
      it("blocks fe80:: link-local and fc00::/fd00:: unique local addresses", () => {
        const targets = [
          "http://[fe80::1]/",
          "http://[fc00::1]/",
          "http://[fd12:3456:789a::1]/",
        ];
        targets.forEach((url) => {
          const res = validateSsrfTarget(url);
          expect(res.isValid).toBe(false);
          expect(res.allowed).toBe(false);
        });
      });

      it("blocks IPv4-mapped IPv6 loopback and private representations", () => {
        const targets = [
          "http://[::ffff:127.0.0.1]/",
          "http://[::ffff:10.0.0.1]/",
          "http://[::ffff:192.168.1.1]/",
          "http://[::ffff:169.254.169.254]/",
        ];
        targets.forEach((url) => {
          const res = validateSsrfTarget(url);
          expect(res.isValid).toBe(false);
          expect(res.allowed).toBe(false);
        });
      });
    });

    describe("Integer/Decimal Representation Bypass Defenses", () => {
      it("blocks decimal integer IP representation of 127.0.0.1 (2130706433)", () => {
        const res = validateSsrfTarget("http://2130706433/");
        expect(res.isValid).toBe(false);
        expect(res.allowed).toBe(false);
      });

      it("blocks decimal integer IP representation of 10.0.0.1", () => {
        const res = validateSsrfTarget("http://167772161/");
        expect(res.isValid).toBe(false);
        expect(res.allowed).toBe(false);
      });
    });

    describe("Public Documentation Whitelisting", () => {
      it("permits legitimate public documentation endpoints", () => {
        const publicDocs = [
          "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps",
          "https://api.slack.com/authentication/oauth-v2",
          "https://developers.google.com/identity/protocols/oauth2",
          "https://developers.notion.com/guides/get-started/public-connections",
          "https://linear.app/docs/oauth-authentication",
          "https://developers.hubspot.com/docs/api/working-with-oauth",
          "https://resend.com/docs/api-reference/introduction",
          "https://developer.calendly.com/api-docs/oauth-2-0",
        ];

        publicDocs.forEach((url) => {
          const res = validateSsrfTarget(url);
          expect(res.isValid).toBe(true);
          expect(res.allowed).toBe(true);
          expect(res.error).toBeUndefined();
        });
      });
    });
  });

  describe("sanitizeAndValidateEndpoint: URL Normalization & RFC Compliance", () => {
    describe("Empty and Whitespace Handling", () => {
      it("rejects empty or whitespace strings", () => {
        expect(sanitizeAndValidateEndpoint("").isValid).toBe(false);
        expect(sanitizeAndValidateEndpoint("    ").isValid).toBe(false);
        expect(sanitizeAndValidateEndpoint(null as any).isValid).toBe(false);
      });

      it("normalizes and strips leading, trailing, and zero-width spaces", () => {
        const raw = "\u200B  https://linear.app/oauth/authorize \uFEFF ";
        const result = sanitizeAndValidateEndpoint(raw);
        expect(result.isValid).toBe(true);
        expect(result.sanitizedUrl).toBe("https://linear.app/oauth/authorize");
      });
    });

    describe("RFC 6749 Section 3.1.2: Fragment Anchor Rejection", () => {
      it("rejects URLs containing '#' anchor fragments", () => {
        const invalidUrls = [
          "https://app.example.com/oauth/callback#token=xyz",
          "https://slack.com/oauth/v2/authorize#section",
          "https://myagent.io/redirect#code=123",
        ];

        invalidUrls.forEach((url) => {
          const res = sanitizeAndValidateEndpoint(url);
          expect(res.isValid).toBe(false);
          expect(res.error).toMatch(/fragment|#/i);
        });
      });
    });

    describe("HTTPS Enforcement & Localhost Exception", () => {
      it("rejects plain HTTP endpoints for production URLs", () => {
        const httpEndpoints = [
          "http://slack.com/oauth/v2/authorize",
          "http://api.linear.app/oauth/token",
          "http://myagent.ai/callback",
        ];

        httpEndpoints.forEach((url) => {
          const res = sanitizeAndValidateEndpoint(url);
          expect(res.isValid).toBe(false);
          expect(res.error).toMatch(/Protocol must be HTTPS/i);
        });
      });

      it("allows HTTP on localhost when explicitly permitted for development testing", () => {
        const local = "http://localhost:3000/api/auth/callback";
        const disallowRes = sanitizeAndValidateEndpoint(local, { allowHttpForLocal: false });
        expect(disallowRes.isValid).toBe(false);

        const allowRes = sanitizeAndValidateEndpoint(local, { allowHttpForLocal: true, type: "redirect_uri" });
        expect(allowRes.isValid).toBe(true);
        expect(allowRes.sanitizedUrl).toBe("http://localhost:3000/api/auth/callback");
        expect(allowRes.warnings).toHaveLength(1);
      });
    });

    describe("Inversion Protection: Composio Callback Leak Guard", () => {
      it("detects and rejects pasting Composio callback URL into provider authorization endpoint", () => {
        const composioUrl = "https://backend.composio.dev/api/v3/toolkits/auth/callback";
        const res = sanitizeAndValidateEndpoint(composioUrl, { type: "authorization" });
        expect(res.isValid).toBe(false);
        expect(res.error).toContain("Composio callback/redirect URL was detected in a provider endpoint field");
      });

      it("detects and rejects pasting Composio callback URL into provider token endpoint", () => {
        const composioUrl = "https://backend.composio.dev/api/v1/auth-apps/add";
        const res = sanitizeAndValidateEndpoint(composioUrl, { type: "token" });
        expect(res.isValid).toBe(false);
        expect(res.error).toContain("Composio callback/redirect URL was detected in a provider endpoint field");
      });

      it("permits valid external provider endpoints", () => {
        const validPairs = [
          { url: "https://linear.app/oauth/authorize", type: "authorization" as const },
          { url: "https://api.linear.app/oauth/token", type: "token" as const },
          { url: "https://slack.com/oauth/v2/authorize", type: "authorization" as const },
          { url: "https://slack.com/api/oauth.v2.access", type: "token" as const },
        ];

        validPairs.forEach(({ url, type }) => {
          const res = sanitizeAndValidateEndpoint(url, { type });
          expect(res.isValid).toBe(true);
          expect(res.sanitizedUrl).toBe(url);
          expect(res.error).toBeUndefined();
        });
      });
    });
  });
});
