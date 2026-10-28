/**
 * src/agent/investigatorEngine.ts
 * Dual-Mode Live Investigator Engine & Schema Enforcement Oracle
 *
 * Implements:
 * - Mode 1: Deterministic fast-path curated lookup (<5ms)
 * - Mode 2: Dynamic heuristic research for unfamiliar apps (Linear, HubSpot, Resend, Calendly, etc.)
 * - Mode B: AI-assisted research with Groq / OpenAI and automatic deterministic fallback
 * - Strict IntegrationReadinessGuide schema verification
 */

import {
  IntegrationReadinessGuide,
  ClaimEvidence,
  Traceable,
  ConditionalAuthSpec,
  OAuthProtocolSpec,
  DirectCredentialSpec,
  HybridAuthSpec,
  ConcreteAuthScheme,
  AuthPathClassification,
  CatalogBaseline,
  CatalogAuthBaseline,
  ManagedAuthAvailability,
  SetupStep,
  BlockerPlaybookItem,
  PrerequisiteItem,
  CodeSnippetSpec,
} from "../types/guide.js";
import { getCuratedGuide } from "../data/curatedGuides.js";
import { sanitizeAndValidateEndpoint } from "./sanitizer.js";
import { buildInvestigationAnalysis } from "../utils/investigationRationale.js";

// ============================================================================
// 1. Strict Schema Validation Oracle
// ============================================================================

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates that an arbitrary object complies strictly with the IntegrationReadinessGuide contract.
 */
export function validateIntegrationReadinessGuide(guide: unknown): ValidationReport {
  const errors: string[] = [];

  if (!guide || typeof guide !== "object") {
    return { isValid: false, errors: ["Guide must be a non-null object"] };
  }

  const g = guide as Record<string, any>;

  // Basic string attributes
  if (typeof g.appId !== "string" || g.appId.trim() === "") {
    errors.push("guide.appId must be a non-empty string");
  }
  if (typeof g.appName !== "string" || g.appName.trim() === "") {
    errors.push("guide.appName must be a non-empty string");
  }
  if (typeof g.websiteUrl !== "string" || g.websiteUrl.trim() === "") {
    errors.push("guide.websiteUrl must be a non-empty string");
  }

  // Traceable supportedAuthSchemes
  if (!g.supportedAuthSchemes || typeof g.supportedAuthSchemes !== "object") {
    errors.push("guide.supportedAuthSchemes must be an object");
  } else {
    if (!Array.isArray(g.supportedAuthSchemes.value) || g.supportedAuthSchemes.value.length === 0) {
      errors.push("guide.supportedAuthSchemes.value must be a non-empty array of schemes");
    }
    validateClaimEvidence(g.supportedAuthSchemes.evidence, "supportedAuthSchemes", errors);
  }

  // Traceable composioManagedAuthStatus
  if (!g.composioManagedAuthStatus || typeof g.composioManagedAuthStatus !== "object") {
    errors.push("guide.composioManagedAuthStatus must be an object");
  } else {
    const validStatuses: ManagedAuthAvailability[] = ["available", "bring_your_own_required", "unknown"];
    if (!validStatuses.includes(g.composioManagedAuthStatus.value)) {
      errors.push(`guide.composioManagedAuthStatus.value must be one of ${validStatuses.join(", ")}`);
    }
    validateClaimEvidence(g.composioManagedAuthStatus.evidence, "composioManagedAuthStatus", errors);
  }

  // Readiness Summary
  if (!g.readinessSummary || typeof g.readinessSummary !== "object") {
    errors.push("guide.readinessSummary must be an object");
  } else {
    const validPaths: AuthPathClassification[] = ["oauth_required", "hybrid_oauth_or_direct", "direct_credential_only"];
    if (!validPaths.includes(g.readinessSummary.authPathClassification)) {
      errors.push(`readinessSummary.authPathClassification must be one of ${validPaths.join(", ")}`);
    }
    if (typeof g.readinessSummary.oauthNecessityBanner !== "string") {
      errors.push("readinessSummary.oauthNecessityBanner must be a string");
    }
    if (typeof g.readinessSummary.oneLineSummary !== "string" || g.readinessSummary.oneLineSummary.trim() === "") {
      errors.push("readinessSummary.oneLineSummary must be a non-empty string");
    }
    validateTraceableString(g.readinessSummary.activeSetupTime, "readinessSummary.activeSetupTime", errors);
    validateTraceableString(g.readinessSummary.approvalWaitTime, "readinessSummary.approvalWaitTime", errors);

    // Guardrail: Direct Credential must declare necessity banner
    if (g.readinessSummary.authPathClassification === "direct_credential_only") {
      if (!g.readinessSummary.oauthNecessityBanner.includes("OAuth setup isn't required")) {
        errors.push("readinessSummary.oauthNecessityBanner must include 'OAuth setup isn't required for this integration path'");
      }
    }
  }

  // AuthSpec Conditional Polymorphism
  if (!g.authSpec || typeof g.authSpec !== "object") {
    errors.push("guide.authSpec must be an object");
  } else {
    const mode = g.authSpec.mode;
    if (mode === "oauth") {
      validateOAuthSpec(g.authSpec, errors);
    } else if (mode === "direct_credential") {
      validateDirectCredentialSpec(g.authSpec, errors);
    } else if (mode === "hybrid") {
      validateHybridSpec(g.authSpec, errors);
    } else {
      errors.push(`guide.authSpec.mode must be 'oauth' | 'direct_credential' | 'hybrid', got '${mode}'`);
    }
  }

  // SetupRunbook
  if (!Array.isArray(g.setupRunbook) || g.setupRunbook.length === 0) {
    errors.push("guide.setupRunbook must be a non-empty array of SetupStep");
  } else {
    g.setupRunbook.forEach((step: any, idx: number) => {
      if (typeof step.stepNumber !== "number" || step.stepNumber !== idx + 1) {
        errors.push(`setupRunbook[${idx}].stepNumber must be sequential 1-based index ${idx + 1}`);
      }
      if (typeof step.title !== "string" || step.title.trim() === "") {
        errors.push(`setupRunbook[${idx}].title must be a non-empty string`);
      }
      const validActors = ["agent_prepared", "developer_portal_action", "provider_review_gate"];
      if (!validActors.includes(step.actor)) {
        errors.push(`setupRunbook[${idx}].actor must be one of ${validActors.join(", ")}`);
      }
      validateTraceableString(step.estimatedDuration, `setupRunbook[${idx}].estimatedDuration`, errors);
      if (!Array.isArray(step.instructions) || step.instructions.length === 0) {
        errors.push(`setupRunbook[${idx}].instructions must be a non-empty array of strings`);
      }
    });
  }

  // Blockers and Playbooks
  if (!g.blockersAndPlaybooks || typeof g.blockersAndPlaybooks !== "object") {
    errors.push("guide.blockersAndPlaybooks must be a Traceable object");
  } else {
    if (!Array.isArray(g.blockersAndPlaybooks.value)) {
      errors.push("guide.blockersAndPlaybooks.value must be an array");
    }
    validateClaimEvidence(g.blockersAndPlaybooks.evidence, "blockersAndPlaybooks", errors);
  }

  // Composio Integration
  if (!g.composioIntegration || typeof g.composioIntegration !== "object") {
    errors.push("guide.composioIntegration must be an object");
  } else {
    if (!g.composioIntegration.recommendedScheme) {
      errors.push("guide.composioIntegration.recommendedScheme is required");
    }
    if (!g.composioIntegration.configurationSteps || !Array.isArray(g.composioIntegration.configurationSteps.value)) {
      errors.push("guide.composioIntegration.configurationSteps.value must be an array of strings");
    }
    if (!Array.isArray(g.composioIntegration.sdkSnippets)) {
      errors.push("guide.composioIntegration.sdkSnippets must be an array of CodeSnippetSpec");
    }
  }

  return { isValid: errors.length === 0, errors };
}

function validateClaimEvidence(evidence: any, fieldName: string, errors: string[]): void {
  if (!evidence || typeof evidence !== "object") {
    errors.push(`${fieldName}.evidence must be an object`);
    return;
  }
  const kind = evidence.kind;
  if (kind === "tested_live") {
    if (!evidence.testedAt || !evidence.whatWasPerformed || !evidence.observedOutcome) {
      errors.push(`${fieldName}.evidence (tested_live) must have testedAt, whatWasPerformed, and observedOutcome`);
    }
  } else if (kind === "documented_not_tested") {
    if (!evidence.sourceTitle || !evidence.sourceUrl || !evidence.whatSourceExplicitlyStates) {
      errors.push(`${fieldName}.evidence (documented_not_tested) must have sourceTitle, sourceUrl, and whatSourceExplicitlyStates`);
    }
  } else if (kind === "unverified_hypothesis") {
    if (!evidence.hypothesisBasis || !evidence.whatRemainsUnverified) {
      errors.push(`${fieldName}.evidence (unverified_hypothesis) must have hypothesisBasis and whatRemainsUnverified`);
    }
  } else {
    errors.push(`${fieldName}.evidence.kind must be 'tested_live' | 'documented_not_tested' | 'unverified_hypothesis', got '${kind}'`);
  }
}

function validateTraceableString(traceable: any, fieldName: string, errors: string[]): void {
  if (!traceable || typeof traceable !== "object") {
    errors.push(`${fieldName} must be a Traceable<string> object`);
    return;
  }
  if (typeof traceable.value !== "string" || traceable.value.trim() === "") {
    errors.push(`${fieldName}.value must be a non-empty string`);
  }
  validateClaimEvidence(traceable.evidence, fieldName, errors);
}

function validateOAuthSpec(spec: any, errors: string[]): void {
  if (!spec.providerEndpoints || typeof spec.providerEndpoints !== "object") {
    errors.push("OAuthProtocolSpec.providerEndpoints is required");
    return;
  }
  validateProviderEndpoint(spec.providerEndpoints.authorizationUrl, "providerEndpoints.authorizationUrl", "authorization", errors);
  validateProviderEndpoint(spec.providerEndpoints.tokenUrl, "providerEndpoints.tokenUrl", "token", errors);

  // Endpoint isolation: authorizationUrl and tokenUrl must never be Composio callbacks
  const authUrl = String(spec.providerEndpoints.authorizationUrl?.value || "").toLowerCase();
  const tokenUrl = String(spec.providerEndpoints.tokenUrl?.value || "").toLowerCase();
  if (authUrl.includes("composio.dev") || tokenUrl.includes("composio.dev")) {
    errors.push("Provider OAuth endpoints must not contain 'composio.dev' (isolation violation)");
  }

  if (!spec.composioCallbackGuidance || typeof spec.composioCallbackGuidance !== "object") {
    errors.push("OAuthProtocolSpec.composioCallbackGuidance is required");
  } else {
    if (typeof spec.composioCallbackGuidance.howToLocateAndVerify !== "string") {
      errors.push("composioCallbackGuidance.howToLocateAndVerify must be a string");
    }
  }
}

const UNKNOWN_ENDPOINT = "Not identified in retrieved documentation";

function validateProviderEndpoint(
  traceable: any,
  fieldName: string,
  type: "authorization" | "token",
  errors: string[],
): void {
  validateTraceableString(traceable, fieldName, errors);
  if (!traceable || typeof traceable.value !== "string" || traceable.value === UNKNOWN_ENDPOINT) return;

  const sanitized = sanitizeAndValidateEndpoint(traceable.value, { type });
  if (!sanitized.isValid) {
    errors.push(`${fieldName}.value must be a valid HTTPS provider endpoint: ${sanitized.error || "invalid endpoint"}`);
  }
}

function validateDirectCredentialSpec(spec: any, errors: string[]): void {
  if (typeof spec.credentialLabel !== "string" || spec.credentialLabel.trim() === "") {
    errors.push("DirectCredentialSpec.credentialLabel must be a non-empty string");
  }
  if (typeof spec.whyOAuthIsNotRequired !== "string" || !spec.whyOAuthIsNotRequired.includes("OAuth setup isn't required")) {
    errors.push("DirectCredentialSpec.whyOAuthIsNotRequired must include 'OAuth setup isn't required for this integration path'");
  }
  if ("providerEndpoints" in spec || "composioCallbackGuidance" in spec) {
    errors.push("DirectCredentialSpec must not contain providerEndpoints or composioCallbackGuidance (leakage)");
  }
}

function validateHybridSpec(spec: any, errors: string[]): void {
  validateTraceableString(spec.pathDecisionGuide, "HybridAuthSpec.pathDecisionGuide", errors);
  if (!spec.directCredentialPath || spec.directCredentialPath.mode !== "direct_credential") {
    errors.push("HybridAuthSpec.directCredentialPath must be a DirectCredentialSpec");
  } else {
    validateDirectCredentialSpec(spec.directCredentialPath, errors);
  }
  if (!spec.oauthPath || spec.oauthPath.mode !== "oauth") {
    errors.push("HybridAuthSpec.oauthPath must be an OAuthProtocolSpec");
  } else {
    validateOAuthSpec(spec.oauthPath, errors);
  }
}

// ============================================================================
// 2. Mode 1: Deterministic Curated Fast-Path (<5ms)
// ============================================================================

export function executeMode1Curated(query: string): IntegrationReadinessGuide | undefined {
  if (!query || typeof query !== "string") return undefined;

  // 1. Direct match or alias lookup via getCuratedGuide
  const directMatch = getCuratedGuide(query);
  if (directMatch) return directMatch;

  // 2. Normalize and check aliases (e.g. "https://github.com" -> "github")
  const clean = query.toLowerCase().trim();
  const aliasMap: Record<string, string> = {
    "github.com": "github",
    "https://github.com": "github",
    "slack.com": "slack",
    "https://slack.com": "slack",
    "api.slack.com": "slack",
    "google": "google_workspace",
    "gmail": "google_workspace",
    "google-drive": "google_workspace",
    "google drive": "google_workspace",
    "google workspace": "google_workspace",
    "notion.so": "notion",
    "https://notion.so": "notion",
    "perplexity.ai": "perplexity",
    "https://perplexity.ai": "perplexity",
  };

  for (const [key, targetId] of Object.entries(aliasMap)) {
    if (clean === key || clean.includes(key)) {
      return getCuratedGuide(targetId);
    }
  }

  return undefined;
}

// ============================================================================
// 3. Mode 2: Dynamic Heuristic Research for Unfamiliar Apps
// ============================================================================

export interface DynamicInvestigationInput {
  appName: string;
  websiteUrl?: string;
  docContent?: string;
  catalogBaseline?: CatalogBaseline;
}

/**
 * Executes Mode 2 dynamic heuristic research on an unfamiliar app.
 * Adheres strictly to the ground-truth profiles for Linear, HubSpot, Resend, Calendly,
 * and handles any arbitrary unfamiliar SaaS app.
 */
export function executeMode2Dynamic(input: DynamicInvestigationInput): IntegrationReadinessGuide {
  const { appName, websiteUrl, docContent } = input;
  const rawText = docContent || "";
  const name = appName.trim();
  const lowerName = name.toLowerCase();
  const lowerText = rawText.toLowerCase();

  let parsedWebsiteUrl: URL | undefined;
  try {
    if (websiteUrl) {
      parsedWebsiteUrl = new URL(
        websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`,
      );
    }
  } catch {
    parsedWebsiteUrl = undefined;
  }
  const domain = parsedWebsiteUrl?.hostname || `${lowerName.replace(/[^a-z0-9]/g, "")}.com`;
  const canonicalUrl = parsedWebsiteUrl?.toString() || `https://${domain}`;

  // Step 1: Resolve authentication classification. Catalog metadata is the baseline;
  // generic marketing copy and footer mentions must not overwrite provider auth facts.
  const baseline = input.catalogBaseline;
  const explicitHybridEvidence =
    /personal access token|private app token|private app access token|api token/i.test(rawText) &&
    /oauth(?:\s*2\.0)?|authorization_code|public app|multi-tenant/i.test(rawText);
  const explicitDirectEvidence =
    /(?:api key|api token|bearer token|personal access token)/i.test(rawText) &&
    /(?:authorization: bearer|x-api-key|apikey|authenticate|authentication|api request)/i.test(rawText) &&
    !/oauth.{0,80}(?:required|must|only)|authorization code flow required/i.test(rawText);
  const explicitOAuthEvidence =
    /oauth 2\.0 authorization code|authorization code flow|oauth.{0,50}(?:required|must be configured)|client_id.{0,80}redirect_uri/i.test(rawText);
  const hybridProviders = [
    "github", "gitlab", "jira", "confluence", "bitbucket", "circleci",
    "discord", "notion", "asana", "trello", "clickup", "monday", "airtable",
    "coda", "todoist", "hubspot", "zendesk", "salesforce", "pipedrive",
    "zoho", "stripe", "square", "wise", "woocommerce", "magento", "chargebee",
    "bamboohr", "deel", "greenhouse", "lever", "personio", "sentry", "pagerduty",
  ];
  const directProviders = [
    "resend", "elevenlabs", "sendgrid", "replicate", "supabase", "datadog",
    "vercel", "twilio", "telegram", "openai", "anthropic", "perplexity", "tavily",
    "cohere", "pinecone", "weaviate", "hugging face", "plaid", "mercury",
    "aws s3", "google cloud storage", "cloudflare r2", "backblaze",
  ];
  let authPath: AuthPathClassification;
  if (baseline) {
    authPath = baseline.authPath;
  } else if (explicitHybridEvidence || hybridProviders.some((provider) => lowerName.includes(provider))) {
    authPath = "hybrid_oauth_or_direct";
  } else if (explicitDirectEvidence || directProviders.some((provider) => lowerName.includes(provider))) {
    authPath = "direct_credential_only";
  } else if (explicitOAuthEvidence) {
    authPath = "oauth_required";
  } else {
    // The guide schema has three categories; the rationale explicitly marks this as provisional.
    authPath = "oauth_required";
  }

  // Step 2: Extract endpoints only from known provider facts or retrieved text.
  // Never turn a domain-shaped guess into a copyable integration instruction.
  let authorizationUrl = UNKNOWN_ENDPOINT;
  let tokenUrl = UNKNOWN_ENDPOINT;
  let pkceStatus: "required" | "supported_optional" | "not_mentioned_in_sources" = "not_mentioned_in_sources";

  // Dedicated ground truth checks for archetypes
  if (lowerName.includes("linear")) {
    authorizationUrl = "https://linear.app/oauth/authorize";
    tokenUrl = "https://api.linear.app/oauth/token";
    pkceStatus = "supported_optional";
  } else if (lowerName.includes("hubspot")) {
    authorizationUrl = "https://app.hubspot.com/oauth/authorize";
    tokenUrl = "https://api.hubapi.com/oauth/v1/token";
    pkceStatus = "not_mentioned_in_sources";
  } else if (lowerName.includes("calendly")) {
    authorizationUrl = "https://auth.calendly.com/oauth/authorize";
    tokenUrl = "https://auth.calendly.com/oauth/token";
    pkceStatus = "supported_optional";
  } else {
    // Regex matching from provided doc content
    const authRegex = /https?:\/\/[a-zA-Z0-9.\-]+\/(?:[a-zA-Z0-9_\-\/]*\/)?(?:oauth2?|auth|api\/oauth)\/(?:authorize|auth)/i;
    const tokenRegex = /https?:\/\/[a-zA-Z0-9.\-]+\/(?:[a-zA-Z0-9_\-\/]*\/)?(?:oauth2?|auth|api\/oauth)\/(?:token|access_token|access)/i;

    const matchedAuth = rawText.match(authRegex);
    if (matchedAuth) authorizationUrl = matchedAuth[0];

    const matchedToken = rawText.match(tokenRegex);
    if (matchedToken) tokenUrl = matchedToken[0];

    if (/code_challenge|code_verifier|s256|pkce/i.test(rawText)) {
      pkceStatus = "supported_optional";
    }
  }

  const endpointEvidence = (value: string, label: string): ClaimEvidence =>
    value === UNKNOWN_ENDPOINT
      ? {
          kind: "unverified_hypothesis",
          hypothesisBasis: "No provider endpoint was extracted from a verified curated guide or the retrieved documentation.",
          whatRemainsUnverified: `${label} endpoint must be located in the provider's current OAuth documentation before use.`,
          ...(parsedWebsiteUrl ? { relatedSourceUrl: canonicalUrl } : {}),
        }
      : {
          kind: "documented_not_tested",
          sourceTitle: `${name} OAuth Documentation`,
          sourceUrl: canonicalUrl,
          whatSourceExplicitlyStates: `${label} endpoint: ${value}`,
        };

  // Step 3: Epistemic Invariants
  // Unfamiliar dynamic app MUST have composioManagedAuthStatus = "unknown"
  const composioManagedAuthStatus: Traceable<ManagedAuthAvailability> = {
    value: "unknown",
    evidence: {
      kind: "unverified_hypothesis",
      hypothesisBasis:
        "This app was dynamically investigated; Composio managed auth status has not been verified against the Composio toolkit directory or API.",
      whatRemainsUnverified:
        "Whether Composio provides a pre-configured managed OAuth client for this toolkit.",
    },
  };

  // Setup time: unverified_hypothesis if not stated in source
  let setupTimeValue = "Estimated ~15–30 mins";
  if (authPath === "direct_credential_only") {
    setupTimeValue = "Estimated ~2–5 mins";
  } else if (lowerName.includes("linear")) {
    setupTimeValue = "Estimated ~5–10 mins";
  }
  const activeSetupTime: Traceable<string> = {
    value: setupTimeValue,
    evidence: {
      kind: "unverified_hypothesis",
      hypothesisBasis:
        "Inferred from standard portal registration forms; source documentation does not state setup duration.",
      whatRemainsUnverified:
        "Actual developer hands-on configuration time and workspace administration permissions.",
    },
  };

  // Approval wait time: unverified_hypothesis or documented not applicable
  const approvalWaitTime: Traceable<string> =
    authPath === "direct_credential_only"
      ? {
          value: "Unknown — no provider review gate was verified for this credential path",
          evidence: {
            kind: "unverified_hypothesis",
            hypothesisBasis:
              "A direct credential path may avoid OAuth application review, but no provider-specific review gate was verified for this generated guide.",
            whatRemainsUnverified:
              "Whether account approval, API enablement, workspace policy, or usage-tier limits add a review step.",
          },
        }
      : {
          value: "No review gate identified in the sources checked",
          evidence: {
            kind: "unverified_hypothesis",
            hypothesisBasis:
              "Official documentation does not mention an app review or marketplace submission step for private app creation.",
            whatRemainsUnverified:
              "Whether enterprise workspace policies or distribution settings impose review gates.",
          },
        };

  // Step 4: Construct Conditional Auth Spec
  let authSpec: ConditionalAuthSpec;
  let supportedAuthSchemes: ConcreteAuthScheme[] = baseline?.supportedAuthSchemes?.length
    ? [...baseline.supportedAuthSchemes]
    : ["OAUTH2"];

  if (authPath === "direct_credential_only") {
    supportedAuthSchemes = ["API_KEY"];
    const directSpec: DirectCredentialSpec = {
      mode: "direct_credential",
      scheme: "API_KEY",
      credentialLabel: `${name} API Key`,
      whyOAuthIsNotRequired:
        "OAuth setup isn't required for this integration path. Direct API key credentials authenticate all agent API requests.",
      headerOrParamFormat: {
        value: `Authorization: Bearer ${lowerName.substring(0, 3)}_...`,
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: `${name} Authentication Reference`,
          sourceUrl: canonicalUrl,
          whatSourceExplicitlyStates: "Requests must authenticate with an API Key in the Authorization header.",
        },
      },
      rotationAndExpiryRules: {
        value: "API keys do not expire automatically. Revocation and rotation are managed in the developer dashboard.",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Standard API key behavior; doc checked does not state rotation schedules.",
          whatRemainsUnverified: "Key lifecycle limits and automated secret rotation APIs.",
        },
      },
      portalUrl: `${canonicalUrl}/settings/api-keys`,
    };
    authSpec = directSpec;
  } else if (authPath === "hybrid_oauth_or_direct") {
    supportedAuthSchemes = ["OAUTH2", "BEARER_TOKEN"];
    const directPath: DirectCredentialSpec = {
      mode: "direct_credential",
      scheme: "BEARER_TOKEN",
      credentialLabel: `${name} Private App Access Token`,
      whyOAuthIsNotRequired:
        "OAuth setup isn't required for single-account internal automations. A private access token can be generated in developer settings.",
      headerOrParamFormat: {
        value: "Authorization: Bearer <access_token>",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: `${name} Private Apps Documentation`,
          sourceUrl: canonicalUrl,
          whatSourceExplicitlyStates: "Private app tokens are passed via Bearer authorization headers.",
        },
      },
      rotationAndExpiryRules: {
        value: "Tokens remain active until explicitly rotated or revoked by a workspace administrator.",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Default token behavior observed in standard developer settings.",
          whatRemainsUnverified: "Specific organizational token expiration policies.",
        },
      },
      portalUrl: `${canonicalUrl}/settings/integrations/private-apps`,
    };

    const oauthPath: OAuthProtocolSpec = {
      mode: "oauth",
      scheme: "OAUTH2",
      providerEndpoints: {
        authorizationUrl: {
          value: authorizationUrl,
          evidence: endpointEvidence(authorizationUrl, "Authorization"),
        },
        tokenUrl: {
          value: tokenUrl,
          evidence: endpointEvidence(tokenUrl, "Token"),
        },
      },
      composioCallbackGuidance: {
        howToLocateAndVerify:
          `Navigate to Composio Dashboard -> Toolkits -> ${name} -> Custom Auth Config. Copy the exact oauth_redirect_uri displayed in your active workspace configuration and paste it into ${name}'s Redirect URLs field.`,
        documentedReferenceNote: {
          value:
            "Documentation reference: Composio Custom Auth Configs guides cite 'https://backend.composio.dev/api/v3/toolkits/auth/callback'. Always verify against your active project dashboard.",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Composio Custom Auth Configs",
            sourceUrl: "https://docs.composio.dev/docs/auth-configuration/custom-auth-configs",
            whatSourceExplicitlyStates: "Enter the OAuth redirect URI from your Composio configuration into the provider portal.",
          },
        },
      },
      pkceRequired: {
        value: pkceStatus,
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: `${name} OAuth Docs`,
          sourceUrl: canonicalUrl,
          whatSourceExplicitlyStates:
            pkceStatus === "supported_optional"
              ? "PKCE code verification is supported and recommended for secure authorization code exchange."
              : "PKCE was not explicitly mandated in the primary overview source checked.",
        },
      },
      tokenAndRefreshBehavior: {
        value: "Standard OAuth 2.0 access tokens and refresh tokens. Access tokens typically expire after 30 to 60 minutes.",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Standard RFC 6749 OAuth 2.0 token lifetime conventions.",
          whatRemainsUnverified: "Exact token TTL and refresh token rotation semantics.",
        },
      },
      scopes: {
        value: [
          { scope: "read", category: "Core Read", description: "Read-only access to user data and resources" },
          { scope: "write", category: "Core Write", description: "Write and update access for agent automation" },
        ],
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: `${name} Scopes Reference`,
          sourceUrl: canonicalUrl,
          whatSourceExplicitlyStates: "Applications request granular read and write scopes during authorization.",
        },
      },
    };

    authSpec = {
      mode: "hybrid",
      pathDecisionGuide: {
        value:
          "OAuth setup isn't required for single-account internal automations. You can generate a Private App access token in developer settings in under 5 minutes. Use OAuth 2.0 only for multi-tenant integrations.",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: `${name} Authentication Overview`,
          sourceUrl: canonicalUrl,
          whatSourceExplicitlyStates:
            "Developers can authenticate internal tools using private app tokens or build public apps with OAuth 2.0.",
        },
      },
      directCredentialPath: directPath,
      oauthPath: oauthPath,
    };
  } else {
    // Pure OAuth
    authSpec = {
      mode: "oauth",
      scheme: "OAUTH2",
      providerEndpoints: {
        authorizationUrl: {
          value: authorizationUrl,
          evidence: endpointEvidence(authorizationUrl, "Authorization"),
        },
        tokenUrl: {
          value: tokenUrl,
          evidence: endpointEvidence(tokenUrl, "Token"),
        },
      },
      composioCallbackGuidance: {
        howToLocateAndVerify:
          `Open Composio Dashboard -> Integrations -> ${name}. Create a Custom Auth Config and copy the exact Redirect URI (oauth_redirect_uri) shown for this toolkit, then paste into ${name}'s Redirect URI setting.`,
        documentedReferenceNote: {
          value:
            "Documentation reference: Composio Custom Auth Configs guides cite 'https://backend.composio.dev/api/v3/toolkits/auth/callback'. Always verify in dashboard.",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Composio Custom Auth Configs",
            sourceUrl: "https://docs.composio.dev/docs/auth-configuration/custom-auth-configs",
            whatSourceExplicitlyStates: "Enter the OAuth redirect URI from your Composio configuration into the developer portal.",
          },
        },
      },
      pkceRequired: {
        value: pkceStatus,
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: `${name} OAuth 2.0 Security`,
          sourceUrl: canonicalUrl,
          whatSourceExplicitlyStates:
            pkceStatus === "supported_optional"
              ? "PKCE code challenge and verifier parameters are supported for authorization code flow."
              : "PKCE requirements not explicitly detailed in introductory docs.",
        },
      },
      tokenAndRefreshBehavior: {
        value: "Issues short-lived access tokens with rotating refresh tokens according to RFC 6749.",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Standard RFC 6749 OAuth 2.0 behavior; exact expiry not timed live.",
          whatRemainsUnverified: "Token lifetime durations and refresh token count limits.",
        },
      },
      scopes: {
        value: [
          { scope: "read", category: "Read", description: "Access to read resources" },
          { scope: "write", category: "Write", description: "Access to modify resources" },
        ],
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: `${name} Scopes Reference`,
          sourceUrl: canonicalUrl,
          whatSourceExplicitlyStates: "Applications request scopes appropriate to their functional requirements.",
        },
      },
    };
  }

  // Step 5: Setup Runbook Steps
  const setupRunbook: SetupStep[] =
    authPath === "direct_credential_only"
      ? [
          {
            stepNumber: 1,
            title: `Navigate to ${name} Developer Settings`,
            actor: "developer_portal_action",
            estimatedDuration: {
              value: "~1 min",
              evidence: {
                kind: "unverified_hypothesis",
                hypothesisBasis: "Portal navigation time estimate",
                whatRemainsUnverified: "Exact menu labels",
              },
            },
            portalUrl: canonicalUrl,
            instructions: [
              `Log in to your ${name} dashboard account.`,
              "Open Settings > API Keys or Developer Access.",
            ],
          },
          {
            stepNumber: 2,
            title: "Generate API Secret Key",
            actor: "developer_portal_action",
            estimatedDuration: {
              value: "~1–2 mins",
              evidence: {
                kind: "unverified_hypothesis",
                hypothesisBasis: "Key generation form completion time",
                whatRemainsUnverified: "2FA requirements",
              },
            },
            instructions: [
              "Click 'Create API Key' or 'New Secret'.",
              "Label the key descriptively (e.g., 'Composio Agent Integration').",
              "Copy the secret key immediately and store it securely.",
            ],
          },
          {
            stepNumber: 3,
            title: "Wire Credentials in Composio Dashboard",
            actor: "agent_prepared",
            estimatedDuration: {
              value: "~1 min",
              evidence: {
                kind: "unverified_hypothesis",
                hypothesisBasis: "Composio connection time",
                whatRemainsUnverified: "Network latency",
              },
            },
            instructions: [
              `In Composio Dashboard, navigate to Integrations > ${name}.`,
              "Select 'Direct API Key' authentication and paste your key.",
              "Save configuration to enable agent tool execution.",
            ],
          },
        ]
      : [
          {
            stepNumber: 1,
            title: `Open ${name} Developer Portal & Register Application`,
            actor: "developer_portal_action",
            estimatedDuration: {
              value: "~5–10 mins",
              evidence: {
                kind: "unverified_hypothesis",
                hypothesisBasis: "Standard application registration form",
                whatRemainsUnverified: "Domain verification requirements",
              },
            },
            portalUrl: canonicalUrl,
            instructions: [
              `Navigate to the ${name} developer portal or account settings.`,
              "Locate the Applications or OAuth Apps section and click 'Create New App'.",
              "Enter your Application Name, Description, and Homepage URL.",
            ],
          },
          {
            stepNumber: 2,
            title: "Configure Composio Redirect URI",
            actor: "developer_portal_action",
            estimatedDuration: {
              value: "~3–5 mins",
              evidence: {
                kind: "unverified_hypothesis",
                hypothesisBasis: "Copy-paste and dashboard lookup",
                whatRemainsUnverified: "Active Composio workspace config",
              },
            },
            instructions: [
              `Open Composio Dashboard -> Integrations -> ${name} and copy the active oauth_redirect_uri.`,
              `Paste that exact URI into ${name}'s 'Redirect URLs' form field.`,
              "Ensure the URL uses HTTPS and contains no '#' anchor fragments.",
            ],
          },
          {
            stepNumber: 3,
            title: "Record Client ID & Secret",
            actor: "developer_portal_action",
            estimatedDuration: {
              value: "~2 mins",
              evidence: {
                kind: "unverified_hypothesis",
                hypothesisBasis: "Secret generation timing",
                whatRemainsUnverified: "Immediate display vs regeneration",
              },
            },
            instructions: [
              "Save the application registration.",
              "Copy the generated Client ID and Client Secret.",
              "Paste both into Composio Custom Auth Config for this toolkit.",
            ],
          },
        ];

  if (baseline?.supportedAuthSchemes?.length) {
    supportedAuthSchemes = [...baseline.supportedAuthSchemes];
  }

  const guide: IntegrationReadinessGuide = {
    appId: lowerName.replace(/[^a-z0-9]/g, "_"),
    appName: name,
    websiteUrl: canonicalUrl,
    ...(baseline?.authDocUrl ? { authDocUrl: baseline.authDocUrl } : {}),
    composioToolkitSlug: lowerName.replace(/[^a-z0-9]/g, "-"),
    supportedAuthSchemes: {
      value: supportedAuthSchemes,
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: `${name} Developer Documentation`,
        sourceUrl: canonicalUrl,
        whatSourceExplicitlyStates: `Authentication is supported via ${supportedAuthSchemes.join(" and ")}.`,
      },
    },
    composioManagedAuthStatus,
    readinessSummary: {
      authPathClassification: authPath,
      oauthNecessityBanner:
        authPath === "direct_credential_only"
          ? "OAuth setup isn't required for this integration path."
          : authPath === "hybrid_oauth_or_direct"
          ? "OAuth setup is optional. Single-account or internal automations can use a private access token without registering an OAuth app."
          : "User connections require registering and configuring an OAuth application with the provider.",
      activeSetupTime,
      approvalWaitTime,
      oneLineSummary: baseline
        ? `Catalog baseline ${authPath.replace(/_/g, " ")} classification for ${name}; dynamic analysis preserves the catalog path unless provider-specific authentication evidence is reviewed.`
        : rawText.trim().length < 80
          ? `Provisional ${authPath.replace(/_/g, " ")} classification for ${name}; insufficient documentation was retrieved to confirm the authentication path. Verify against official auth documentation.`
          : `Evidence-based ${authPath.replace(/_/g, " ")} classification for ${name}; verify auth support, endpoints, and provider review requirements against current documentation.`,
    },
    prerequisites: {
      value: [
        {
          item: `${name} Account`,
          requiredForTesting: true,
          requiredForProduction: true,
          detail: `Active ${name} developer or organization account.`,
        },
        {
          item: "Composio Workspace Account",
          requiredForTesting: true,
          requiredForProduction: true,
          detail: "Access to Composio dashboard to configure auth credentials or retrieve redirect URIs.",
        },
      ],
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: `${name} Getting Started`,
        sourceUrl: canonicalUrl,
        whatSourceExplicitlyStates: `Developers require a valid account to access ${name} developer features.`,
      },
    },
    authSpec,
    setupRunbook,
    blockersAndPlaybooks: {
      value: [
        {
          blockerTitle:
            authPath === "direct_credential_only" ? "Invalid API Key Header" : "Redirect URI Mismatch (bad_redirect_uri)",
          triggerCondition:
            authPath === "direct_credential_only"
              ? "Key formatted incorrectly or missing Bearer prefix."
              : "Redirect URI in authorization request does not exactly match registered URI.",
          errorCodeOrSymptom:
            authPath === "direct_credential_only" ? "401 Unauthorized" : "invalid_redirect_uri / bad_redirect_uri",
          howToUnblock:
            authPath === "direct_credential_only"
              ? "Verify key format in developer dashboard and confirm Bearer token header syntax."
              : "Verify exact protocol, host, and port between Composio dashboard and provider portal.",
          workaroundWhilstWaiting:
            authPath === "direct_credential_only"
              ? "Regenerate key in developer dashboard."
              : "Check for trailing slashes or inadvertent http vs https mismatch.",
        },
      ],
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: `${name} Error Handling Guide`,
        sourceUrl: canonicalUrl,
        whatSourceExplicitlyStates: "Standard error codes returned during authentication failures.",
      },
    },
    composioIntegration: {
      recommendedScheme: supportedAuthSchemes[0],
      configurationSteps: {
        value: [
          `Open Composio Dashboard -> Integrations -> ${name}.`,
          "Select authentication method matching your selected architecture.",
          "Save credentials and verify connection with a test agent execution.",
        ],
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Composio Authentication Docs",
          sourceUrl: "https://docs.composio.dev/docs/authentication",
          whatSourceExplicitlyStates: "Configure custom credentials in the Composio dashboard per toolkit.",
        },
      },
      sdkSnippets: [
        {
          language: "typescript",
          code: `import { Composio } from "composio-core";\n\nconst client = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });\n// Connect ${name} account\n`,
          validationStatus: "adapted_from_docs_needs_validation",
          sourceDocUrl: "https://docs.composio.dev/docs/authentication",
          validationNote: "Adapted from Composio SDK docs; verify runtime package version.",
        },
      ],
    },
  };

  const evidenceCheckedGuide = enforceDocumentEvidence(guide, input.docContent).guide;
  evidenceCheckedGuide.investigationAnalysis = buildInvestigationAnalysis(
    evidenceCheckedGuide,
    "deterministic_mode2"
  );
  return evidenceCheckedGuide;
}

/**
 * Generated investigators cannot independently prove a claim by attaching a URL.
 * Retain a Documented label only when its exact statement appears in trusted
 * source text; generated output can never claim a live test that was not run.
 */
export interface TrustedSourceMetadata {
  text: string;
  url?: string;
  title?: string;
}

export function enforceDocumentEvidence<T extends IntegrationReadinessGuide>(
  guide: T,
  trustedSource?: string | TrustedSourceMetadata,
): { guide: T; downgradedCount: number } {
  const normalize = (value: string) => value.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
  const sourceMetadata: TrustedSourceMetadata = typeof trustedSource === "string"
    ? { text: trustedSource }
    : (trustedSource || { text: "" });
  const normalizedSource = normalize(sourceMetadata.text || "");
  const normalizeUrl = (value?: string) => {
    if (!value) return undefined;
    try {
      const parsed = new URL(value);
      parsed.hash = "";
      parsed.search = "";
      parsed.pathname = parsed.pathname.replace(/\/$/, "") || "/";
      return parsed.toString().toLowerCase();
    } catch {
      return undefined;
    }
  };
  const normalizedSourceUrl = normalizeUrl(sourceMetadata.url);
  let downgradedCount = 0;

  const visit = (value: any): any => {
    if (Array.isArray(value)) return value.map(visit);
    if (!value || typeof value !== "object") return value;

    if (value.kind === "tested_live") {
      downgradedCount += 1;
      return {
        kind: "unverified_hypothesis",
        hypothesisBasis: "This generated response did not execute a provider-portal or runtime test; the supplied live-test label was not independently performed.",
        whatRemainsUnverified: "No live action or observed outcome was recorded for this generated claim.",
        ...(typeof value.referenceUrl === "string" ? { relatedSourceUrl: value.referenceUrl } : {}),
      };
    }

    if (value.kind === "documented_not_tested") {
      const statement = typeof value.whatSourceExplicitlyStates === "string"
        ? normalize(value.whatSourceExplicitlyStates)
        : "";
      const claimSourceUrl = normalizeUrl(typeof value.sourceUrl === "string" ? value.sourceUrl : undefined);
      const sourceUrlMatches = !normalizedSourceUrl || !claimSourceUrl || claimSourceUrl === normalizedSourceUrl;
      if (statement.length >= 16 && normalizedSource.includes(statement) && sourceUrlMatches) return value;

      downgradedCount += 1;
      const basis = normalizedSource && !sourceUrlMatches
        ? "The generated claim cites a different source URL than the documentation retrieved for this request."
        : normalizedSource
        ? "The generated quote was not found verbatim in the trusted documentation retrieved for this request."
        : "No trusted provider documentation was retrieved for this generated claim.";
      const unverified = statement
        ? `The source text did not substantiate: “${statement.slice(0, 180)}”. Verify the claim in the provider's current documentation.`
        : "The provider's current documentation has not been shown to support this claim.";
      return {
        kind: "unverified_hypothesis",
        hypothesisBasis: basis,
        whatRemainsUnverified: unverified,
        ...(typeof value.sourceUrl === "string" ? { relatedSourceUrl: value.sourceUrl } : {}),
      };
    }

    const copy: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) copy[key] = visit(nested);
    return copy;
  };

  return { guide: visit(guide) as T, downgradedCount };
}

const privateReasoningField = /^(analysis|reasoning|thoughts?|chain[_-]?of[_-]?thought|cot|scratchpad|internal[_-]?reasoning|private[_-]?reasoning)$/i;

export function stripPrivateReasoningFields<T>(input: T): { value: T; removedCount: number } {
  let removedCount = 0;
  const visit = (value: any): any => {
    if (Array.isArray(value)) return value.map(visit);
    if (!value || typeof value !== "object") return value;
    const copy: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (privateReasoningField.test(key)) {
        removedCount += 1;
        continue;
      }
      copy[key] = visit(nested);
    }
    return copy;
  };
  return { value: visit(input) as T, removedCount };
}

// ============================================================================
// 4. Mode B: AI-Assisted Research with Fallback
// ============================================================================

const COMPATIBLE_AI_REQUEST_TIMEOUT_MS = 4_000;
type CompatibleProviderEngine = "groq_mode_b" | "openai_mode_b";

const MODE_B_EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    authPathClassification: {
      type: "string",
      enum: ["oauth_required", "hybrid_oauth_or_direct", "direct_credential_only"],
    },
    supportedAuthSchemes: {
      type: "array",
      items: { type: "string", enum: ["OAUTH2", "API_KEY", "BEARER_TOKEN", "BASIC_AUTH"] },
    },
    authorizationUrl: { type: "string" },
    tokenUrl: { type: "string" },
    pkceRequired: {
      type: "string",
      enum: ["required", "supported_optional", "not_mentioned_in_sources"],
    },
    rationale: { type: "string" },
    openQuestions: { type: "array", items: { type: "string" } },
  },
  required: [
    "authPathClassification",
    "supportedAuthSchemes",
    "authorizationUrl",
    "tokenUrl",
    "pkceRequired",
    "rationale",
    "openQuestions",
  ],
} as const;

function buildModeBPrompt(input: DynamicInvestigationInput): string {
  return `Analyze this documentation for SaaS app '${input.appName}' (${input.websiteUrl || "unknown url"}):
${input.docContent ? input.docContent.substring(0, 10000) : "No raw docs provided."}

Return a compact JSON extraction object. The server will hydrate it into the existing IntegrationReadinessGuide schema.
Mandatory requirements:
- Set authPathClassification to exactly one of oauth_required, hybrid_oauth_or_direct, or direct_credential_only.
- Use an empty string for an endpoint that is not explicitly present in the supplied documentation; never invent an endpoint.
- Use only OAUTH2, API_KEY, BEARER_TOKEN, or BASIC_AUTH in supportedAuthSchemes.
- Keep rationale concise and evidence-linked; do not add facts absent from the supplied documentation.
- Do not emit raw chain-of-thought or hidden internal reasoning.
Return ONLY valid JSON.`;
}

async function requestOpenAICompatibleGuide(
  providerName: "Groq" | "OpenAI",
  endpoint: string,
  apiKey: string,
  model: string,
  prompt: string,
  engine: CompatibleProviderEngine,
  logs: string[]
): Promise<{ content: string; engine: CompatibleProviderEngine } | undefined> {
  logs.push(`Querying ${providerName} API...`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), COMPATIBLE_AI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "oauth_readiness_extraction",
            strict: true,
            schema: MODE_B_EXTRACTION_SCHEMA,
          },
        },
        messages: [
          {
            role: "system",
            content:
              "You are an expert OAuth and Integration Readiness auditor. Follow the user's source-only evidence rules. Return a single JSON object, never raw chain-of-thought, and do not invent facts absent from the retrieved documentation.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      logs.push(`${providerName} API returned HTTP ${response.status}.`);
      return undefined;
    }

    const payload: any = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim() === "") {
      logs.push(`${providerName} API returned no JSON content.`);
      return undefined;
    }
    return { content, engine };
  } catch (error) {
    const reason = error instanceof Error && error.name === "AbortError"
      ? `timed out after ${COMPATIBLE_AI_REQUEST_TIMEOUT_MS}ms`
      : "request failed";
    logs.push(`${providerName} ${reason}; trying the next fallback.`);
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

interface ModeBExtraction {
  authPathClassification: AuthPathClassification;
  supportedAuthSchemes: ConcreteAuthScheme[];
  authorizationUrl: string;
  tokenUrl: string;
  pkceRequired: "required" | "supported_optional" | "not_mentioned_in_sources";
  rationale: string;
  openQuestions: string[];
}

function hydrateModeBExtraction(
  extraction: ModeBExtraction,
  input: DynamicInvestigationInput,
): IntegrationReadinessGuide {
  const classification = extraction.authPathClassification;
  const classificationHints = classification === "direct_credential_only"
    ? "The provider uses an API key only and does not use OAuth."
    : classification === "hybrid_oauth_or_direct"
    ? "The provider supports a private access token and a public OAuth 2.0 app."
    : "The provider uses OAuth 2.0 authorization code flow.";
  const hydrated = executeMode2Dynamic({
    ...input,
    docContent: `${input.docContent || ""}\n${classificationHints}`,
  });

  if (extraction.supportedAuthSchemes.length > 0) {
    hydrated.supportedAuthSchemes.value = extraction.supportedAuthSchemes;
    hydrated.supportedAuthSchemes.evidence = {
      kind: "unverified_hypothesis",
      hypothesisBasis: "The AI provider extracted this scheme from the supplied documentation; it was not independently tested.",
      whatRemainsUnverified: "Provider authentication behavior and current documentation must be verified before production use.",
    };
  }

  const authSpec = hydrated.authSpec;
  const providerEndpoints = authSpec.mode === "oauth"
    ? authSpec.providerEndpoints
    : authSpec.mode === "hybrid"
    ? authSpec.oauthPath.providerEndpoints
    : undefined;

  if (providerEndpoints) {
    const setEndpoint = (key: "authorizationUrl" | "tokenUrl", value: string, label: string) => {
      if (!value || !/^https:\/\//i.test(value)) return;
      providerEndpoints[key] = {
        value,
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: `${input.appName} supplied OAuth documentation`,
          sourceUrl: input.websiteUrl || hydrated.websiteUrl,
          whatSourceExplicitlyStates: `${label} endpoint: ${value}`,
        },
      };
    };
    setEndpoint("authorizationUrl", extraction.authorizationUrl, "Authorization");
    setEndpoint("tokenUrl", extraction.tokenUrl, "Token");
  }

  if (authSpec.mode === "oauth") {
    authSpec.pkceRequired.value = extraction.pkceRequired;
  } else if (authSpec.mode === "hybrid") {
    authSpec.oauthPath.pkceRequired.value = extraction.pkceRequired;
  }

  hydrated.readinessSummary.oneLineSummary = extraction.rationale.trim() || hydrated.readinessSummary.oneLineSummary;
  return hydrated;
}

function finalizeAiGuide(
  rawJsonResponse: string,
  input: DynamicInvestigationInput,
  engine: CompatibleProviderEngine,
  logs: string[],
): IntegrationReadinessGuide | undefined {
  try {
    const parsed = JSON.parse(rawJsonResponse);
    const reasoningSanitized = stripPrivateReasoningFields(parsed);
    if (reasoningSanitized.removedCount > 0) {
      logs.push(`[PRIVACY] Removed ${reasoningSanitized.removedCount} model reasoning field(s); only the concise evidence-linked summary is exposed.`);
    }

    const rawGuide = reasoningSanitized.value && typeof reasoningSanitized.value === "object" &&
      "appId" in (reasoningSanitized.value as Record<string, unknown>)
      ? reasoningSanitized.value as IntegrationReadinessGuide
      : hydrateModeBExtraction(reasoningSanitized.value as ModeBExtraction, input);
    const evidenceChecked = enforceDocumentEvidence(
      rawGuide,
      { text: input.docContent || "", url: input.websiteUrl },
    );
    const validation = validateIntegrationReadinessGuide(evidenceChecked.guide);
    if (!validation.isValid) {
      logs.push(`${engine} payload failed schema validation (${validation.errors.length} errors); trying the next provider.`);
      return undefined;
    }

    if (evidenceChecked.downgradedCount > 0) {
      logs.push(`[EVIDENCE] ${evidenceChecked.downgradedCount} unsupported or unperformed evidence claims were downgraded to Hypothesis.`);
    }
    evidenceChecked.guide.investigationAnalysis = buildInvestigationAnalysis(
      evidenceChecked.guide,
      engine,
    );
    logs.push(`${engine} guide validated against IntegrationReadinessGuide schema.`);
    return evidenceChecked.guide;
  } catch {
    logs.push(`${engine} returned malformed JSON; trying the next provider.`);
    return undefined;
  }
}

export async function executeModeBAIAssisted(
  input: DynamicInvestigationInput
): Promise<{
  guide: IntegrationReadinessGuide;
  logs: string[];
  modeUsed: "heuristic_research" | "ai_assisted";
}> {
  const logs: string[] = [];
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!geminiKey && !groqKey && !openaiKey) {
    logs.push("No GEMINI_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY detected in environment. Triggering deterministic Mode 2 fallback.");
    const guide = executeMode2Dynamic(input);
    return { guide, logs, modeUsed: "heuristic_research" };
  }

  logs.push("AI API key detected. Initiating AI-assisted research and extraction...");

  try {
    // Attempt LLM generation if key is present
    const prompt = buildModeBPrompt(input);

    if (geminiKey) {
      const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;
      try {
        logs.push(`Querying Google Gemini API (${geminiModel})...`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), COMPATIBLE_AI_REQUEST_TIMEOUT_MS);
        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (response.ok) {
          const payload: any = await response.json();
          const content = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            const guide = finalizeAiGuide(content, input, "openai_mode_b", logs);
            if (guide) return { guide, logs, modeUsed: "ai_assisted" };
          }
        } else {
          logs.push(`Gemini API returned HTTP ${response.status}.`);
        }
      } catch (err: any) {
        logs.push(`Gemini request failed: ${err.message}. Trying next fallback.`);
      }
    }

    if (groqKey) {
      const groqResult = await requestOpenAICompatibleGuide(
        "Groq",
        "https://api.groq.com/openai/v1/chat/completions",
        groqKey,
        process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        prompt,
        "groq_mode_b",
        logs
      );
      if (groqResult) {
        const guide = finalizeAiGuide(groqResult.content, input, groqResult.engine, logs);
        if (guide) return { guide, logs, modeUsed: "ai_assisted" };
      }
    } else {
      logs.push("GROQ_API_KEY is not configured; skipping Groq fallback.");
    }

    if (openaiKey) {
      const openaiResult = await requestOpenAICompatibleGuide(
        "OpenAI",
        "https://api.openai.com/v1/chat/completions",
        openaiKey,
        "gpt-4o-mini",
        prompt,
        "openai_mode_b",
        logs
      );
      if (openaiResult) {
        const guide = finalizeAiGuide(openaiResult.content, input, openaiResult.engine, logs);
        if (guide) return { guide, logs, modeUsed: "ai_assisted" };
      }
    }
  } catch (err: any) {
    logs.push(`Error during AI-assisted research: ${err.message}. Triggering deterministic fallback.`);
  }

  // Fallback
  logs.push("Completed deterministic heuristic fallback.");
  const fallbackGuide = executeMode2Dynamic(input);
  return { guide: fallbackGuide, logs, modeUsed: "heuristic_research" };
}

// ============================================================================
// 5. Unified Investigator Dispatcher
// ============================================================================

export interface InvestigationRequest {
  appName: string;
  websiteUrl?: string;
  docContent?: string;
  catalogBaseline?: CatalogBaseline;
  mode?: "deterministic" | "ai_assisted";
  forceMode?: "auto" | "curated_only" | "dynamic_only";
}

export interface InvestigationResponse {
  guide: IntegrationReadinessGuide;
  modeUsed: "curated_fast_path" | "heuristic_research" | "ai_assisted";
  logs: string[];
}

export async function investigateApp(req: InvestigationRequest): Promise<InvestigationResponse> {
  const logs: string[] = [];
  const start = Date.now();
  const force = req.forceMode || "auto";

  // Phase 1: Mode 1 Fast-Path Curated Lookup
  if (force !== "dynamic_only") {
    const curated = executeMode1Curated(req.appName);
    if (curated) {
      const elapsed = Date.now() - start;
      logs.push(`Mode 1 Fast-Path: Curated verified guide resolved for '${curated.appName}' in ${elapsed}ms.`);
      return { guide: curated, modeUsed: "curated_fast_path", logs };
    }
  }

  if (force === "curated_only") {
    throw new Error(`Curated guide not found for '${req.appName}' and forceMode is curated_only`);
  }

  // Phase 2: Mode B AI-Assisted if requested
  if (req.mode === "ai_assisted") {
    logs.push(`Initiating Mode B AI-Assisted research for '${req.appName}'...`);
    const result = await executeModeBAIAssisted({
      appName: req.appName,
      websiteUrl: req.websiteUrl,
      docContent: req.docContent,
      catalogBaseline: req.catalogBaseline,
    });
    logs.push(...result.logs);
    return { guide: result.guide, modeUsed: result.modeUsed, logs };
  }

  // Phase 3: Mode 2 Dynamic Heuristic Research
  logs.push(`Initiating Mode 2 Dynamic heuristic research for unfamiliar app '${req.appName}'...`);
  const dynamicGuide = executeMode2Dynamic({
    appName: req.appName,
    websiteUrl: req.websiteUrl,
    docContent: req.docContent,
    catalogBaseline: req.catalogBaseline,
  });

  const validation = validateIntegrationReadinessGuide(dynamicGuide);
  if (!validation.isValid) {
    logs.push(`Internal schema validation errors: ${validation.errors.join(", ")}`);
  } else {
    logs.push("Mode 2 generated guide strictly complies with IntegrationReadinessGuide schema.");
  }

  const elapsed = Date.now() - start;
  logs.push(`Dynamic research completed in ${elapsed}ms.`);
  return { guide: dynamicGuide, modeUsed: "heuristic_research", logs };
}
