/**
 * src/agent/sanitizer.ts
 * Security sanitizer and SSRF defense engine for Composio OAuth Readiness Copilot
 */

export interface SsrfValidationResult {
  isValid: boolean;
  allowed: boolean; // Backwards-compatible alias for testHarness
  error?: string;
  reason?: string;  // Backwards-compatible alias for testHarness
}

export interface SanitizedEndpointResult {
  isValid: boolean;
  sanitizedUrl: string;
  error?: string;
  warnings?: string[];
  errors?: string[];
}

/**
 * Validates whether a target URL is safe for server-side HTTP retrieval (SSRF protection).
 * Blocks internal/private IPs (127.0.0.1, 10.x, 172.16-31.x, 192.168.x, 169.254.169.254 cloud metadata, localhost, ::1).
 */
export function validateSsrfTarget(url: string): SsrfValidationResult {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return {
      isValid: false,
      allowed: false,
      error: "Target URL cannot be empty",
      reason: "Target URL cannot be empty",
    };
  }

  const trimmed = url.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch (err: any) {
    return {
      isValid: false,
      allowed: false,
      error: `Malformed URL: ${err.message}`,
      reason: `Malformed URL: ${err.message}`,
    };
  }

  // 1. Protocol check: strictly http or https
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    const msg = `Disallowed protocol: '${parsed.protocol}'. Only HTTP and HTTPS are permitted.`;
    return { isValid: false, allowed: false, error: msg, reason: msg };
  }

  const rawHost = parsed.hostname.toLowerCase();
  // Strip IPv6 brackets if present (e.g. [::1] -> ::1)
  const host = rawHost.replace(/^\[|\]$/g, "");

  // 2. Localhost and Loopback addresses
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("127.") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "::" ||
    host === "0:0:0:0:0:0:0:1" ||
    host === "0:0:0:0:0:0:0:0"
  ) {
    const msg = "Access to loopback/localhost is blocked (SSRF guard)";
    return { isValid: false, allowed: false, error: msg, reason: msg };
  }

  // 3. Link-local and Cloud Metadata Services (AWS, GCP, Azure, Alibaba)
  if (
    host === "169.254.169.254" ||
    host.startsWith("169.254.") ||
    host === "metadata.google.internal" ||
    host === "100.100.100.200"
  ) {
    const msg = "Access to cloud instance metadata service is blocked (SSRF guard)";
    return { isValid: false, allowed: false, error: msg, reason: msg };
  }

  // 4. IPv6 Private and Link-local ranges (fc00::/7, fe80::/10, ::ffff: mapped)
  if (
    host.startsWith("fe80:") ||
    host.startsWith("fe8") ||
    host.startsWith("fe9") ||
    host.startsWith("fea") ||
    host.startsWith("feb") ||
    host.startsWith("fc") ||
    host.startsWith("fd")
  ) {
    const msg = "Access to private or local IPv6 range is blocked (SSRF guard)";
    return { isValid: false, allowed: false, error: msg, reason: msg };
  }

  // IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (host.includes("ffff:")) {
    const afterFfff = host.substring(host.lastIndexOf("ffff:") + 5);
    let b1 = -1;
    let b2 = -1;
    if (afterFfff.includes(".")) {
      const parts = afterFfff.split(".").map((p) => parseInt(p, 10));
      b1 = parts[0];
      b2 = parts[1];
    } else if (afterFfff.includes(":")) {
      const hexParts = afterFfff.split(":");
      if (hexParts.length === 2) {
        const high = parseInt(hexParts[0], 16);
        const low = parseInt(hexParts[1], 16);
        b1 = (high >> 8) & 0xff;
        b2 = high & 0xff;
      }
    }

    if (b1 === 127 || b1 === 10 || (b1 === 172 && b2 >= 16 && b2 <= 31) || (b1 === 192 && b2 === 168) || (b1 === 169 && b2 === 254) || (b1 === 100 && b2 >= 64 && b2 <= 127) || b1 === 0) {
      const msg = "Access to private or loopback IPv4-mapped IPv6 range is blocked (SSRF guard)";
      return { isValid: false, allowed: false, error: msg, reason: msg };
    }
  }

  // 5. RFC 1918 Private IPv4 Ranges & Carrier-grade NAT
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const b1 = parseInt(ipv4Match[1], 10);
    const b2 = parseInt(ipv4Match[2], 10);
    const b3 = parseInt(ipv4Match[3], 10);
    const b4 = parseInt(ipv4Match[4], 10);

    // Validate byte ranges 0-255
    if (b1 > 255 || b2 > 255 || b3 > 255 || b4 > 255) {
      const msg = "Invalid IPv4 address format";
      return { isValid: false, allowed: false, error: msg, reason: msg };
    }

    // 10.0.0.0/8
    if (b1 === 10) {
      const msg = "Access to private IP range 10.0.0.0/8 is blocked (SSRF guard)";
      return { isValid: false, allowed: false, error: msg, reason: msg };
    }

    // 172.16.0.0/12 (172.16.0.0 – 172.31.255.255)
    if (b1 === 172 && b2 >= 16 && b2 <= 31) {
      const msg = "Access to private IP range 172.16.0.0/12 is blocked (SSRF guard)";
      return { isValid: false, allowed: false, error: msg, reason: msg };
    }

    // 192.168.0.0/16
    if (b1 === 192 && b2 === 168) {
      const msg = "Access to private IP range 192.168.0.0/16 is blocked (SSRF guard)";
      return { isValid: false, allowed: false, error: msg, reason: msg };
    }

    // 100.64.0.0/10 (Carrier-grade NAT)
    if (b1 === 100 && b2 >= 64 && b2 <= 127) {
      const msg = "Access to carrier-grade NAT range is blocked (SSRF guard)";
      return { isValid: false, allowed: false, error: msg, reason: msg };
    }

    // 127.0.0.0/8 Loopback
    if (b1 === 127) {
      const msg = "Access to loopback range 127.0.0.0/8 is blocked (SSRF guard)";
      return { isValid: false, allowed: false, error: msg, reason: msg };
    }

    // 0.0.0.0/8
    if (b1 === 0) {
      const msg = "Access to 0.0.0.0/8 is blocked (SSRF guard)";
      return { isValid: false, allowed: false, error: msg, reason: msg };
    }
  }

  // Also check decimal/octal representation bypass attempts (e.g. 2130706433 = 127.0.0.1)
  if (/^\d+$/.test(host)) {
    const intVal = parseInt(host, 10);
    // 127.0.0.1 is 2130706433
    if (intVal >= 2130706432 && intVal <= 2147483647) {
      const msg = "Access to loopback IP in integer representation is blocked (SSRF guard)";
      return { isValid: false, allowed: false, error: msg, reason: msg };
    }
    // 10.0.0.0/8 is 167772160 to 184549375
    if (intVal >= 167772160 && intVal <= 184549375) {
      const msg = "Access to private IP in integer representation is blocked (SSRF guard)";
      return { isValid: false, allowed: false, error: msg, reason: msg };
    }
  }

  return { isValid: true, allowed: true };
}

/**
 * Sanitizes and validates an endpoint or redirect URL:
 * - Enforces HTTPS (except localhost if explicitly enabled for local development)
 * - Rejects '#' anchor fragments (RFC 6749 Section 3.1.2)
 * - Normalizes whitespace and zero-width characters
 * - Guards against pasting Composio callbacks into provider endpoint fields
 */
export function sanitizeAndValidateEndpoint(
  url: string,
  options?: {
    allowHttpForLocal?: boolean;
    type?: "authorization" | "token" | "redirect_uri";
  }
): SanitizedEndpointResult {
  const result: SanitizedEndpointResult = {
    isValid: true,
    sanitizedUrl: "",
    warnings: [],
    errors: [],
  };

  if (!url || typeof url !== "string" || url.trim() === "") {
    result.isValid = false;
    result.error = "Endpoint URL cannot be empty";
    result.errors?.push("Endpoint URL cannot be empty");
    return result;
  }

  // 1. Normalize whitespace and strip invisible / zero-width characters
  const clean = url.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");

  // 2. Reject '#' fragment anchors immediately
  if (clean.includes("#")) {
    const errorMsg =
      "URL cannot contain '#' anchor fragment (violates OAuth 2.0 RFC 6749 Section 3.1.2 and Slack specifications)";
    result.isValid = false;
    result.error = errorMsg;
    result.errors?.push(errorMsg);
    return result;
  }

  // 3. Parse URL safely
  let parsed: URL;
  try {
    parsed = new URL(clean);
  } catch (err: any) {
    const errorMsg = `Invalid URL format: ${err.message}`;
    result.isValid = false;
    result.error = errorMsg;
    result.errors?.push(errorMsg);
    return result;
  }

  // 4. Enforce HTTPS
  const allowHttpForLocal = options?.allowHttpForLocal ?? false;
  if (parsed.protocol !== "https:") {
    if (allowHttpForLocal && parsed.protocol === "http:" && parsed.hostname === "localhost") {
      result.warnings?.push("Localhost HTTP redirect URI permitted for local testing only.");
    } else {
      const errorMsg =
        `Protocol '${parsed.protocol}' rejected. Protocol must be HTTPS. Unencrypted HTTP is prohibited by OAuth 2.0 specifications.`;
      result.isValid = false;
      result.error = errorMsg;
      result.errors?.push(errorMsg);
      return result;
    }
  }

  // 5. Hostname check
  if (!parsed.hostname || parsed.hostname.trim() === "") {
    const errorMsg = "URL must contain a valid host";
    result.isValid = false;
    result.error = errorMsg;
    result.errors?.push(errorMsg);
    return result;
  }

  // 6. Inversion protection: detect pasting Composio callback into provider authorization/token fields
  const type = options?.type;
  if (
    (type === "authorization" || type === "token") &&
    (parsed.hostname.includes("composio.dev") || parsed.pathname.includes("/auth/callback"))
  ) {
    const errorMsg =
      "Composio callback/redirect URL was detected in a provider endpoint field. Do not paste Composio URLs here.";
    result.isValid = false;
    result.error = errorMsg;
    result.errors?.push(errorMsg);
    return result;
  }

  result.sanitizedUrl = parsed.toString();
  return result;
}

import dns from "node:dns/promises";

export interface SsrfWithDnsOptions {
  skipDnsInTest?: boolean;
}

/**
 * Validates whether a target URL is safe for server-side HTTP retrieval with async DNS resolution.
 * Detects DNS rebinding attacks that resolve public hostnames to internal private IP ranges.
 */
export async function validateSsrfTargetWithDns(
  url: string,
  options?: SsrfWithDnsOptions
): Promise<SsrfValidationResult> {
  const staticCheck = validateSsrfTarget(url);
  if (!staticCheck.isValid || !staticCheck.allowed) {
    return staticCheck;
  }

  if (options?.skipDnsInTest && process.env.NODE_ENV === "test") {
    return staticCheck;
  }

  try {
    const parsed = new URL(url.trim());
    const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

    const addresses = await dns.lookup(hostname, { all: true });
    for (const record of addresses) {
      const ipCheck = validateSsrfTarget(`http://${record.address}`);
      if (!ipCheck.isValid || !ipCheck.allowed) {
        const errorMsg = `DNS resolution for host '${hostname}' resolved to blocked IP ${record.address} (SSRF guard)`;
        return {
          isValid: false,
          allowed: false,
          error: errorMsg,
          reason: errorMsg,
        };
      }
    }
  } catch (err: any) {
    if (err.code !== "ENOTFOUND") {
      const errorMsg = `DNS lookup failed for host: ${err.message}`;
      return {
        isValid: false,
        allowed: false,
        error: errorMsg,
        reason: errorMsg,
      };
    }
  }

  return { isValid: true, allowed: true };
}
