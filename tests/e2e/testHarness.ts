/**
 * tests/e2e/testHarness.ts
 * Opaque-Box E2E Test Runner and Assertion Engine
 * Authoritative Oracle derived from ORIGINAL_REQUEST.md and PROJECT.md
 */

import {
  ClaimEvidence,
  Traceable,
  isIndependentlyTested,
  ConcreteAuthScheme,
  AuthPathClassification,
  ManagedAuthAvailability,
  ConditionalAuthSpec,
  OAuthProtocolSpec,
  DirectCredentialSpec,
  HybridAuthSpec,
  CodeSnippetSpec,
  IntegrationReadinessGuide,
} from "../../src/types/guide";

// ============================================================================
// 1. Epistemic Assertion Engine
// ============================================================================

export class EpistemicAssertionError extends Error {
  constructor(message: string) {
    super(`[EpistemicAssertionError] ${message}`);
    this.name = "EpistemicAssertionError";
  }
}

/**
 * Asserts that a traceable value possesses valid ClaimEvidence matching the expected kind.
 */
export function assertClaimEvidence<T>(
  traceable: Traceable<T>,
  expectedKind?: "tested_live" | "documented_not_tested" | "unverified_hypothesis"
): void {
  if (!traceable || typeof traceable !== "object" || !("evidence" in traceable)) {
    throw new EpistemicAssertionError("Object is not a valid Traceable<T> item: missing 'evidence'");
  }

  const { evidence } = traceable;
  if (!evidence || !evidence.kind) {
    throw new EpistemicAssertionError("ClaimEvidence is missing required 'kind' discriminator");
  }

  if (expectedKind && evidence.kind !== expectedKind) {
    throw new EpistemicAssertionError(
      `Evidence kind mismatch: expected '${expectedKind}', received '${evidence.kind}'`
    );
  }

  // Kind-specific structural guarantees
  if (evidence.kind === "tested_live") {
    if (!evidence.testedAt || !evidence.whatWasPerformed || !evidence.observedOutcome) {
      throw new EpistemicAssertionError(
        "tested_live evidence must define 'testedAt', 'whatWasPerformed', and 'observedOutcome'"
      );
    }
    if (!isIndependentlyTested(evidence)) {
      throw new EpistemicAssertionError("isIndependentlyTested(tested_live) must evaluate to true");
    }
  } else if (evidence.kind === "documented_not_tested") {
    if (!evidence.sourceTitle || !evidence.sourceUrl || !evidence.whatSourceExplicitlyStates) {
      throw new EpistemicAssertionError(
        "documented_not_tested evidence must define 'sourceTitle', 'sourceUrl', and 'whatSourceExplicitlyStates'"
      );
    }
    if (isIndependentlyTested(evidence)) {
      throw new EpistemicAssertionError("isIndependentlyTested(documented_not_tested) must evaluate to false");
    }
  } else if (evidence.kind === "unverified_hypothesis") {
    if (!evidence.hypothesisBasis || !evidence.whatRemainsUnverified) {
      throw new EpistemicAssertionError(
        "unverified_hypothesis evidence must define 'hypothesisBasis' and 'whatRemainsUnverified'"
      );
    }
    if (isIndependentlyTested(evidence)) {
      throw new EpistemicAssertionError("isIndependentlyTested(unverified_hypothesis) must evaluate to false");
    }
  } else {
    throw new EpistemicAssertionError(`Unrecognized ClaimEvidence kind: ${(evidence as any).kind}`);
  }
}

// ============================================================================
// 2. Polymorphic Auth & Endpoint Isolation Assertions
// ============================================================================

/**
 * Asserts that provider OAuth endpoints and Composio callback guidance are strictly decoupled.
 */
export function assertIsolatedEndpoints(authSpec: ConditionalAuthSpec): void {
  if (authSpec.mode === "oauth") {
    const { providerEndpoints, composioCallbackGuidance } = authSpec;
    if (!providerEndpoints || !providerEndpoints.authorizationUrl || !providerEndpoints.tokenUrl) {
      throw new EpistemicAssertionError("OAuth spec must declare providerEndpoints with authorizationUrl and tokenUrl");
    }
    assertClaimEvidence(providerEndpoints.authorizationUrl);
    assertClaimEvidence(providerEndpoints.tokenUrl);

    if (!composioCallbackGuidance || !composioCallbackGuidance.howToLocateAndVerify) {
      throw new EpistemicAssertionError("OAuth spec must provide composioCallbackGuidance with howToLocateAndVerify");
    }

    // Ensure provider authorizationUrl and tokenUrl do NOT contain the word 'composio'
    const authUrl = providerEndpoints.authorizationUrl.value.toLowerCase();
    const tokenUrl = providerEndpoints.tokenUrl.value.toLowerCase();
    if (authUrl.includes("composio.dev") || tokenUrl.includes("composio.dev")) {
      throw new EpistemicAssertionError(
        "Provider OAuth endpoints must be owned by the provider and never point to Composio URLs"
      );
    }
  } else if (authSpec.mode === "hybrid") {
    assertIsolatedEndpoints(authSpec.oauthPath);
  } else if (authSpec.mode === "direct_credential") {
    // Must NOT contain any providerEndpoints or callback guidance
    if ("providerEndpoints" in authSpec || "composioCallbackGuidance" in authSpec) {
      throw new EpistemicAssertionError(
        "DirectCredentialSpec must not contain providerEndpoints or composioCallbackGuidance"
      );
    }
  }
}

/**
 * Asserts that Direct Credential guides completely omit OAuth fields and display the required banner.
 */
export function assertDirectCredentialOmitsOAuth(guide: IntegrationReadinessGuide): void {
  if (guide.readinessSummary.authPathClassification !== "direct_credential_only") {
    throw new EpistemicAssertionError("Guide is not classified as direct_credential_only");
  }

  if (guide.authSpec.mode !== "direct_credential") {
    throw new EpistemicAssertionError("Guide authSpec mode must be 'direct_credential'");
  }

  const spec = guide.authSpec as DirectCredentialSpec;
  if (!spec.whyOAuthIsNotRequired || !spec.whyOAuthIsNotRequired.includes("OAuth setup isn't required")) {
    throw new EpistemicAssertionError(
      "DirectCredentialSpec must explicitly state 'OAuth setup isn't required for this integration path'"
    );
  }

  if (!guide.readinessSummary.oauthNecessityBanner.includes("OAuth setup isn't required")) {
    throw new EpistemicAssertionError(
      "readinessSummary.oauthNecessityBanner must state 'OAuth setup isn't required for this integration path'"
    );
  }

  if ("providerEndpoints" in guide.authSpec || "composioCallbackGuidance" in guide.authSpec) {
    throw new EpistemicAssertionError("DirectCredential guide illegally leaked OAuth endpoint fields");
  }
}

// ============================================================================
// 3. URL Sanitization & SSRF Defense Assertions
// ============================================================================

export interface SanitizationResult {
  isValid: boolean;
  sanitizedUrl?: string;
  rejectionReason?: string;
}

/**
 * Validates that an endpoint or redirect URL adheres to strict security constraints:
 * - Must use HTTPS (except localhost in development test environments)
 * - Must NOT contain '#' anchor/fragment
 * - Must not be empty or whitespace
 */
export function validateEndpointUrl(url: string, allowHttpForLocal = false): SanitizationResult {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return { isValid: false, rejectionReason: "URL cannot be empty" };
  }

  const trimmed = url.trim();

  if (!trimmed.startsWith("https://") && !trimmed.startsWith("http://")) {
    return { isValid: false, rejectionReason: "URL must begin with https://" };
  }

  // Rejection of anchor fragment
  if (trimmed.includes("#")) {
    return {
      isValid: false,
      rejectionReason: "URL cannot contain '#' anchor fragment (violates OAuth spec and Slack requirements)",
    };
  }

  try {
    const parsed = new URL(trimmed);

    if (!parsed.hostname || parsed.hostname.trim() === "") {
      return { isValid: false, rejectionReason: "URL must contain a valid host" };
    }

    if (parsed.protocol !== "https:") {
      if (allowHttpForLocal && parsed.protocol === "http:" && parsed.hostname === "localhost") {
        return { isValid: true, sanitizedUrl: parsed.toString() };
      }
      return {
        isValid: false,
        rejectionReason: `Protocol '${parsed.protocol}' rejected. Only HTTPS is permitted for secure OAuth endpoints.`,
      };
    }

    return { isValid: true, sanitizedUrl: parsed.toString() };
  } catch (err: any) {
    return { isValid: false, rejectionReason: `Invalid URL format: ${err.message}` };
  }
}

/**
 * Validates SSRF protection rules for server-side proxy doc retrieval.
 * Blocks private IP ranges, loopback, link-local, AWS/GCP metadata endpoints, and non-standard protocols.
 */
export function validateSsrfTarget(targetUrl: string): { allowed: boolean; reason?: string } {
  if (!targetUrl || typeof targetUrl !== "string") {
    return { allowed: false, reason: "Target URL cannot be empty" };
  }

  try {
    const parsed = new URL(targetUrl.trim());

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { allowed: false, reason: `Disallowed protocol: ${parsed.protocol}` };
    }

    const rawHost = parsed.hostname.toLowerCase();
    const host = rawHost.replace(/^\[|\]$/g, "");

    // Loopback & Localhost
    if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "0.0.0.0") {
      return { allowed: false, reason: "Access to loopback/localhost is blocked (SSRF guard)" };
    }

    // Link-local & Cloud Metadata (e.g. AWS 169.254.169.254)
    if (host === "169.254.169.254" || host.startsWith("169.254.")) {
      return { allowed: false, reason: "Access to cloud instance metadata service is blocked (SSRF guard)" };
    }

    // RFC 1918 Private IPv4 Addresses
    const ipMatch = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipMatch) {
      const b1 = parseInt(ipMatch[1], 10);
      const b2 = parseInt(ipMatch[2], 10);

      // 10.0.0.0/8
      if (b1 === 10) return { allowed: false, reason: "Access to private IP range 10.0.0.0/8 is blocked (SSRF guard)" };

      // 172.16.0.0/12 (172.16.x - 172.31.x)
      if (b1 === 172 && b2 >= 16 && b2 <= 31) {
        return { allowed: false, reason: "Access to private IP range 172.16.0.0/12 is blocked (SSRF guard)" };
      }

      // 192.168.0.0/16
      if (b1 === 192 && b2 === 168) {
        return { allowed: false, reason: "Access to private IP range 192.168.0.0/16 is blocked (SSRF guard)" };
      }

      // 100.64.0.0/10 (Carrier-grade NAT)
      if (b1 === 100 && b2 >= 64 && b2 <= 127) {
        return { allowed: false, reason: "Access to carrier-grade NAT range is blocked (SSRF guard)" };
      }
    }

    return { allowed: true };
  } catch (err: any) {
    return { allowed: false, reason: `Malformed URL: ${err.message}` };
  }
}

// ============================================================================
// 4. Export Verification Helpers
// ============================================================================

export function validateMarkdownExport(guide: IntegrationReadinessGuide, markdown: string): boolean {
  if (!markdown || typeof markdown !== "string") return false;

  // Must include Title
  if (!markdown.includes(`# ${guide.appName} OAuth & Integration Readiness Guide`)) {
    return false;
  }

  // Must include Auth Classification
  if (!markdown.includes(`Auth Path Classification:** \`${guide.readinessSummary.authPathClassification}\``)) {
    return false;
  }

  // If Direct Credential, must include banner and must NOT include OAuth Endpoints section
  if (guide.readinessSummary.authPathClassification === "direct_credential_only") {
    if (!markdown.includes("OAuth setup isn't required for this integration path")) return false;
    if (markdown.includes("## Provider OAuth Endpoints")) return false;
  }

  // If OAuth or Hybrid, must include Provider Endpoints section
  if (guide.authSpec.mode === "oauth" || guide.authSpec.mode === "hybrid") {
    if (!markdown.includes("Provider OAuth Endpoints")) return false;
  }

  return true;
}

export function validateJsonExport(guide: IntegrationReadinessGuide, jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed.appId === guide.appId && parsed.appName === guide.appName;
  } catch {
    return false;
  }
}

// ============================================================================
// 5. Authoritative Guide Verification Oracle
// ============================================================================

export interface AuthoritativeSpecOracle {
  appId: string;
  appName: string;
  authPath: AuthPathClassification;
  expectedSchemes: ConcreteAuthScheme[];
  primaryNuance: string;
}

export const AUTHORITATIVE_ORACLES: Record<string, AuthoritativeSpecOracle> = {
  github: {
    appId: "github",
    appName: "GitHub",
    authPath: "hybrid_oauth_or_direct",
    expectedSchemes: ["OAUTH2", "BEARER_TOKEN"],
    primaryNuance: "GitHub App vs OAuth App architecture choice; default 8-hour token expiry",
  },
  slack: {
    appId: "slack",
    appName: "Slack",
    authPath: "oauth_required",
    expectedSchemes: ["OAUTH2"],
    primaryNuance: "Multi-workspace distribution error; bot vs user scope separation; HTTPS and no '#' anchor",
  },
  google: {
    appId: "google",
    appName: "Google Workspace",
    authPath: "oauth_required",
    expectedSchemes: ["OAUTH2"],
    primaryNuance: "100-user testing cap; 7-day refresh token in testing; CASA Tier 2 security audit hypothesis",
  },
  notion: {
    appId: "notion",
    appName: "Notion",
    authPath: "hybrid_oauth_or_direct",
    expectedSchemes: ["BEARER_TOKEN", "OAUTH2"],
    primaryNuance: "Internal bot token (~2 mins) vs public OAuth; permanent installation scope; page sharing prerequisite",
  },
  perplexity: {
    appId: "perplexity",
    appName: "Perplexity",
    authPath: "direct_credential_only",
    expectedSchemes: ["API_KEY"],
    primaryNuance: "OAuth setup isn't required; direct API key integration; zero OAuth endpoints",
  },
};
