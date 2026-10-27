/**
 * src/types/guide.ts
 * Authoritative Type Definitions for Composio OAuth Readiness Copilot
 */

// 1. Single Discriminated Evidence Union
export type ClaimEvidence =
  | {
      kind: "tested_live";
      testedAt: string; // ISO timestamp or date of live verification
      whatWasPerformed: string; // Exact portal or API action executed
      observedOutcome: string; // Exact result, status, or timing observed
      referenceUrl?: string;
    }
  | {
      kind: "documented_not_tested";
      sourceTitle: string;
      sourceUrl: string;
      whatSourceExplicitlyStates: string; // Verbatim or exact factual statement; never inferred from silence
      whyNotTestedLive?: string;
    }
  | {
      kind: "unverified_hypothesis";
      hypothesisBasis: string; // e.g., "Inferred from 4 required form fields; source does not state duration"
      whatRemainsUnverified: string; // e.g., "Actual portal completion time and organization-level approval rules"
      relatedSourceUrl?: string;
    };

export interface Traceable<T> {
  value: T;
  evidence: ClaimEvidence;
}

// Derived helper: eliminates redundant boolean flags
export const isIndependentlyTested = (e: ClaimEvidence): boolean => e.kind === "tested_live";

// 2. Concrete Auth Schemes vs Integration Path Classification
export type ConcreteAuthScheme = "OAUTH2" | "OAUTH1" | "API_KEY" | "BEARER_TOKEN" | "BASIC_AUTH";

export type AuthPathClassification =
  | "oauth_required" // Connecting requires registering/configuring an OAuth application
  | "hybrid_oauth_or_direct" // Supports public OAuth, but direct key/token works for single-account/internal use
  | "direct_credential_only"; // Direct API key, token, or basic auth; zero OAuth endpoints exist

// 3. Managed Auth Availability (Explicit unknown state)
export type ManagedAuthAvailability = "available" | "bring_your_own_required" | "unknown";

export type StepActor = "agent_prepared" | "developer_portal_action" | "provider_review_gate";

export interface SetupStep {
  stepNumber: number;
  title: string;
  actor: StepActor;
  estimatedDuration: Traceable<string>;
  portalUrl?: string;
  instructions: string[];
  copyableAssets?: {
    label: string;
    value: string;
    note: string;
  }[];
  commonPitfall?: Traceable<string>;
}

// Provider-owned OAuth endpoints (Strictly isolated from Composio Callback URI)
export interface ProviderOAuthEndpoints {
  authorizationUrl: Traceable<string>;
  tokenUrl: Traceable<string>;
  revocationUrl?: Traceable<string>;
  userInfoUrl?: Traceable<string>;
  additionalEndpoints?: Traceable<Record<string, string>>;
}

// Composio Callback Guidance (Honest representation of dynamic vs reference URLs)
export interface ComposioCallbackGuidance {
  activeConfigCallbackUri?: Traceable<string>; // Populated ONLY when fetched from active Composio config
  howToLocateAndVerify: string; // Clear instructions: where to locate oauth_redirect_uri in Dashboard
  documentedReferenceNote: Traceable<string>; // Reference note citing v3/v1 URLs without guaranteeing universal match
}

// Branch 1: OAuth Protocol Specification
export interface OAuthProtocolSpec {
  mode: "oauth";
  scheme: "OAUTH2" | "OAUTH1";
  providerEndpoints: ProviderOAuthEndpoints;
  composioCallbackGuidance: ComposioCallbackGuidance;
  pkceRequired: Traceable<"required" | "supported_optional" | "not_mentioned_in_sources">;
  tokenAndRefreshBehavior: Traceable<string>;
  scopes: Traceable<
    {
      scope: string;
      category: string;
      description: string;
      isSensitiveOrRestricted?: boolean;
    }[]
  >;
  reviewerSubmissionDraft?: {
    scopeJustificationDraft: string;
    reviewerNotes: string;
  };
}

// Branch 2: Direct Credential Specification (No OAuth Endpoints)
export interface DirectCredentialSpec {
  mode: "direct_credential";
  scheme: "API_KEY" | "BEARER_TOKEN" | "BASIC_AUTH";
  credentialLabel: string; // e.g., "API Secret Key", "Personal Access Token"
  whyOAuthIsNotRequired: string; // e.g., "OAuth setup isn't required for this integration path."
  headerOrParamFormat: Traceable<string>; // e.g., "Authorization: Bearer <key>"
  rotationAndExpiryRules: Traceable<string>;
  portalUrl?: string;
}

// Branch 3: Hybrid Auth Specification (Both Direct and OAuth Paths)
export interface HybridAuthSpec {
  mode: "hybrid";
  pathDecisionGuide: Traceable<string>;
  directCredentialPath: DirectCredentialSpec;
  oauthPath: OAuthProtocolSpec;
}

export type ConditionalAuthSpec = OAuthProtocolSpec | DirectCredentialSpec | HybridAuthSpec;

// SDK Code Snippet Specification with Validation Status
export interface CodeSnippetSpec {
  language: "python" | "typescript";
  code: string;
  validationStatus: "tested_against_sdk" | "adapted_from_docs_needs_validation";
  sourceDocUrl: string;
  validationNote: string;
}

export interface PrerequisiteItem {
  item: string;
  requiredForTesting: boolean;
  requiredForProduction: boolean;
  detail: string;
}

export interface BlockerPlaybookItem {
  blockerTitle: string;
  triggerCondition: string;
  errorCodeOrSymptom?: string;
  howToUnblock: string;
  workaroundWhilstWaiting: string;
}

export interface InvestigationEvidenceFinding {
  title: string;
  statement: string;
  evidence: ClaimEvidence;
}

export interface InvestigationAnalysis {
  engine: "gemini_mode_b" | "groq_mode_b" | "openai_mode_b" | "deterministic_mode2";
  decision: AuthPathClassification;
  decisionSummary: string;
  findings: InvestigationEvidenceFinding[];
  openQuestions: InvestigationEvidenceFinding[];
  evidenceCounts: {
    testedLive: number;
    documented: number;
    hypothesis: number;
  };
}

// Complete Guide Contract
export interface IntegrationReadinessGuide {
  appId: string;
  appName: string;
  websiteUrl: string;
  composioToolkitSlug?: string;
  supportedAuthSchemes: Traceable<ConcreteAuthScheme[]>;
  composioManagedAuthStatus: Traceable<ManagedAuthAvailability>;

  readinessSummary: {
    authPathClassification: AuthPathClassification;
    oauthNecessityBanner: string;
    activeSetupTime: Traceable<string>;
    approvalWaitTime: Traceable<string>;
    oneLineSummary: string;
  };

  prerequisites: Traceable<PrerequisiteItem[]> | Traceable<PrerequisiteItem>[];

  authSpec: ConditionalAuthSpec;
  setupRunbook: SetupStep[];

  blockersAndPlaybooks: Traceable<BlockerPlaybookItem[]>;

  composioIntegration: {
    recommendedScheme: ConcreteAuthScheme;
    configurationSteps: Traceable<string[]>;
    sdkSnippets: CodeSnippetSpec[];
  };

  investigationAnalysis?: InvestigationAnalysis;
}
