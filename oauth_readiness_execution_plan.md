# APM Integrations Take-Home: Detailed Architecture & Execution Plan

## 1. Product Thesis: Reducing Integration Uncertainty Without Introducing New Assumptions

AI agent developers using [Composio Authentication](https://docs.composio.dev/docs/authentication) face two layers of uncertainty when connecting user accounts to external apps:

1. **Authentication Path Uncertainty**: Does the integration actually require registering an OAuth app, or does it use an API key, Bearer token, or single-workspace bot token where OAuth setup isn't required at all? When OAuth *is* supported, can the developer use [Composio Managed OAuth Apps](https://docs.composio.dev/toolkits/managed-auth), or does their production use case trigger [Custom Auth Configs](https://docs.composio.dev/docs/auth-configuration/custom-auth-configs) ([Managed vs Custom Auth](https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app))?

2. **Timeline & Blocker Uncertainty**: When custom OAuth registration is needed, how much **active setup time** (hands-on portal configuration) is required versus **passive approval wait time** (provider review queues or security audits)—and which numbers are backed by evidence versus guesswork?

Because the product's entire purpose is to **reduce integration uncertainty**, the system itself must never introduce new uncertainty through overconfident timeline claims, conflating silence in documentation with proof, hardcoding callback URLs, or forcing non-OAuth apps into an OAuth template.

### Four Core Design Guardrails

1. **Strict Precision on What "Documented" Means**: Every individual claim or estimate uses a single discriminated evidence type (`ClaimEvidence`) with three mutually exclusive states:

   * **`tested_live`**: We actually performed the action in the developer portal or API runtime and recorded the result.

   * **`documented_not_tested`**: An official source we read *explicitly* states the claim. Silence is not documentation: if an official doc describes 4 form fields to create an OAuth app but does not state how long setup takes, a "\~5 minute" estimate is **not** documented—it is an `unverified_hypothesis`. Likewise, if the pages checked do not mention an approval process, the guide states *"No review gate identified in the sources checked"* (`unverified_hypothesis` for zero wait) rather than claiming *"Instant"* as a documented fact unless an official source explicitly states no approval is required.

   * **`unverified_hypothesis`**: An estimate or inference not explicitly established by the official evidence checked and not tested live.

2. **Auth-Path Triage Separated from Concrete Auth Schemes**: The model separates the high-level **integration path classification** (`oauth_required` | `hybrid_oauth_or_direct` | `direct_credential_only`) from the concrete **authentication schemes** (`OAUTH2`, `API_KEY`, `BEARER_TOKEN`, `BASIC_AUTH`), and allows an explicit `"unknown"` state when Composio managed-auth support has not been verified (`"available" | "bring_your_own_required" | "unknown"`).

3. **Clear Separation of Provider Endpoints, Active Composio Callback URI, and SDK Validation Status**: Provider-owned OAuth endpoints (`authorizationUrl`, `tokenUrl`) are displayed separately from the Composio callback URI. For the callback URI, the guide prefers the exact `oauth_redirect_uri` retrieved from an active configuration; when unavailable, it tells the developer exactly where to find and verify it in the Composio dashboard, keeping documented URLs strictly as reference notes. Similarly, SDK code snippets explicitly distinguish code tested against the current SDK from snippets adapted from documentation that still need runtime validation.

4. **Focused, Priority-Tiered Scope for a 6–8 Hour Budget**: A polished end-to-end workflow with three genuinely useful, claim-traceable guides (GitHub, Slack, Google), two auth-model expansion guides (Notion hybrid + an API-key integration), and a reliable live investigator beats six shallow guides and an unverified 100-app catalog.

## 2. Prioritized Scope for a 6–8 Hour Build: Depth Over Shallow Breadth

To deliver a working, high-trust product within 6–8 hours, the scope is divided into three priority tiers:

| 

| **Priority Tier** | **Target Apps / Features** | **Why This Scope Matters** | **Status in 6–8 Hour Budget** | 
| **P0: Core Must-Ship Slice** | **3 Deep OAuth Guides**: **GitHub**, **Slack**, and **Google (Gmail/Drive)** + **End-to-End Live Investigator** + **Claim-Level Evidence UI** | Covers three distinct OAuth setup challenges: (1) OAuth App vs. GitHub App architecture choice, (2) multi-workspace distribution errors and bot/user scope separation, and (3) scope-tiered consent screen configuration. | **Mandatory Core (Hours 1–4.5)** | 
| **P1: Auth-Model Expansion** | **Notion** (Hybrid Auth) + **Perplexity or Tavily** (API-Key-Only) | Proves the schema and UI handle non-OAuth and hybrid paths cleanly, displaying *"OAuth setup isn't required for this integration path"* when appropriate. | **Secondary Target (Hours 4.5–6)** | 
| **P2: Stretch Goals** | **Salesforce** (Enterprise Connected App) + **100-App Catalog Index** | Demonstrates enterprise propagation nuances and directory-scale taxonomy, attempted only after P0 and P1 are complete and verified. | **Stretch Goal Only (If Time Permits)** | 

### Sample App Matrix (Enforcing Strict Epistemic Precision on Setup Time vs. Approval Wait)

Notice how setup durations and absence of documented review gates are classified strictly as `unverified_hypothesis` unless an official page explicitly states the timing or rule:

| **Priority & App** | **Primary Official Source Checked** | **Integration Auth Path & Concrete Schemes** | **Active Setup Time (Epistemic Status)** | **Approval Wait / Review Gate (Epistemic Status)** | **Key Nuance Established by Official Docs (documented_not_tested)** | 
| **P0: GitHub** | [Creating an OAuth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) | Path: `hybrid_oauth_or_direct`  Schemes: `OAUTH2`, `BEARER_TOKEN` (PAT) | **Estimated \~5–10 mins** (`unverified_hypothesis` — inferred from 4 required fields in docs; duration not stated in source and not timed live) | **No review gate identified in the sources checked** (`unverified_hypothesis` for zero wait — registration page ends at *Click Register application* with no review step mentioned, but org-level approval rules were not tested live) | Docs explicitly advise considering a **GitHub App** instead of an **OAuth App** for fine-grained permissions and short-lived tokens; `Expire user access tokens` is enabled by default. | 
| **P0: Slack** | [Slack OAuth v2 Flow](https://api.slack.com/authentication/oauth-v2) | Path: `oauth_required`  Schemes: `OAUTH2` | **Estimated \~20–30 mins** (`unverified_hypothesis` — inferred from scope + redirect URL steps; not timed live) | **No review gate identified for single-workspace install; multi-workspace distribution and Marketplace review require approval** (`documented_not_tested` that `unapproved_scope` and `invalid_team_for_non_distributed_app` block unapproved/undistributed installs; exact review turnaround time is an `unverified_hypothesis`) | Undistributed apps fail on external workspaces with `invalid_team_for_non_distributed_app`. Redirect URLs must use HTTPS, cannot contain `#` anchors, and must match between `/oauth/v2/authorize` and `oauth.v2.access` or fail with `bad_redirect_uri`. | 
| **P0: Google (Gmail / Drive)** | [Using OAuth 2.0 to Access Google APIs](https://developers.google.com/identity/protocols/oauth2) | Path: `oauth_required`  Schemes: `OAUTH2` | **Estimated \~30–90 mins** (`unverified_hypothesis` — duration not stated in docs and not timed live) | **Review wait time not established in the overview doc checked** (`unverified_hypothesis` — sensitive/restricted scope verification timelines require checking Google Auth Platform verification docs or live console testing) | Requires creating a `Web application` OAuth client in Google API Console, requesting incremental/least-privilege scopes, and handling refresh token limits per client-user combination. | 
| **P1: Notion** | [Notion Public Connections](https://developers.notion.com/guides/get-started/public-connections) & [Internal Connections](https://developers.notion.com/guides/get-started/internal-connections) | Path: `hybrid_oauth_or_direct`  Schemes: `BEARER_TOKEN` (Internal/PAT), `OAUTH2` (Public) | **Estimated \~3–5 mins** (Internal) vs. **\~15 mins** (Public OAuth) (`unverified_hypothesis` — not stated in docs or timed live) | **No review gate identified for standard Public Connection creation; Marketplace listing managed separately** (`documented_not_tested` that client ID/secret are retrieved in the Configuration tab after creation; Marketplace review duration is an `unverified_hypothesis`) | **OAuth setup isn't required** for single-workspace automations (use an Internal Connection) or personal scripts (use a PAT). For Public Connections, **Installation scope** (`Any workspace` vs. `Selected workspaces only`) is fixed at creation time and **cannot be changed afterward**. | 
| **P1: Perplexity / Tavily** | [Composio Custom Auth Configs](https://docs.composio.dev/docs/auth-configuration/custom-auth-configs) | Path: `direct_credential_only`  Schemes: `API_KEY` | **Estimated \~2–5 mins** (`unverified_hypothesis` — key generation not timed live) | **Not Applicable — No OAuth app or provider review exists** (`documented_not_tested` — uses direct API key credentials) | Explicitly cited in Composio docs as toolkits without managed auth where developers supply their own credentials instead of using a managed OAuth app. | 
| **P2 (Stretch): Salesforce** | [Salesforce Connected Apps OAuth](https://developer.salesforce.com/docs/platform/api-rest/guide/intro-oauth-and-connected-apps.html) | Path: `oauth_required`  Schemes: `OAUTH2` | **Estimated \~45–90 mins** (`unverified_hypothesis`) | **Unverified Hypothesis** (Propagation delay and AppExchange review timelines not established in the intro doc checked) | Establishes that REST API OAuth requires configuring an External Client App or Connected App in Salesforce Setup. | 

## 3. Robust TypeScript Schema: Discriminated Evidence, Separated Auth Concepts, and Explicit Unknown States

The schema incorporates all three TypeScript modeling improvements:

1. **Single Discriminated `ClaimEvidence` Type**: Eliminates the redundant `independentlyTested` boolean so a claim can never be in a contradictory state. Whether a claim was independently tested is derived directly from `evidence.kind === "tested_live"`.

2. **Separated Auth-Path Classification vs. Concrete Auth Schemes**: `authPathClassification` (`"oauth_required" | "hybrid_oauth_or_direct" | "direct_credential_only"`) describes the developer's integration path, while `supportedAuthSchemes` lists only concrete schemes (`"OAUTH2" | "OAUTH1" | "API_KEY" | "BEARER_TOKEN" | "BASIC_AUTH"`).

3. **Explicit `"unknown"` State for Managed Auth Support**: `composioManagedAuthStatus` uses `Traceable<"available" | "bring_your_own_required" | "unknown">` so the live investigator can honestly report `"unknown"` when it hasn't queried the Composio API or verified the toolkit page.

```
// 1. Single Discriminated Evidence Union (Prevents contradictory test states)
export type ClaimEvidence =
  | {
      kind: "tested_live";
      testedAt: string;                 // ISO timestamp or date of live check
      whatWasPerformed: string;         // Exact portal or API action executed
      observedOutcome: string;          // Exact result or timing observed
      referenceUrl?: string;
    }
  | {
      kind: "documented_not_tested";
      sourceTitle: string;
      sourceUrl: string;
      whatSourceExplicitlyStates: string; // Must be explicitly supported by the source, never inferred from silence
      whyNotTestedLive?: string;
    }
  | {
      kind: "unverified_hypothesis";
      hypothesisBasis: string;          // e.g., "Estimated from 4 required form fields; official docs do not state setup duration."
      whatRemainsUnverified: string;    // e.g., "Actual portal completion time and organization-level approval rules."
      relatedSourceUrl?: string;
    };

export interface Traceable<T> {
  value: T;
  evidence: ClaimEvidence;
}

// Helper: derive whether a claim was independently tested without redundant boolean fields
export const isIndependentlyTested = (e: ClaimEvidence): boolean => e.kind === "tested_live";

// 2. Concrete Authentication Schemes vs. Integration Auth-Path Classification
export type ConcreteAuthScheme = "OAUTH2" | "OAUTH1" | "API_KEY" | "BEARER_TOKEN" | "BASIC_AUTH";

export type AuthPathClassification =
  | "oauth_required"             // User connections require registering/configuring an OAuth app
  | "hybrid_oauth_or_direct"     // Supports OAuth for multi-tenant/public use, but simpler token/key works when OAuth isn't needed
  | "direct_credential_only";    // Uses API key, Bearer token, or Basic Auth; OAuth setup isn't required

// 3. Explicit "unknown" state for Composio Managed Auth availability
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

// Provider's own OAuth endpoints (strictly separated from Composio callback URI)
export interface ProviderOAuthEndpoints {
  authorizationUrl: Traceable<string>; // e.g., https://slack.com/oauth/v2/authorize
  tokenUrl: Traceable<string>;         // e.g., https://slack.com/api/oauth.v2.access
  additionalEndpoints?: Traceable<Record<string, string>>;
}

// Simplified, non-confusing Composio Callback URI representation
export interface ComposioCallbackGuidance {
  activeConfigCallbackUri?: Traceable<string>; // Populated ONLY when retrieved from an active Composio Auth Config
  howToLocateAndVerify: string;                // Clear instruction: where to find oauth_redirect_uri in the Composio Dashboard/API
  documentedReferenceNote: Traceable<string>;  // Secondary reference note citing the v3/v1 URLs in Custom Auth Configs docs without claiming they apply to every toolkit
}

// Branch 1: Used when OAuth is required or selected
export interface OAuthProtocolSpec {
  mode: "oauth";
  scheme: "OAUTH2" | "OAUTH1";
  providerEndpoints: ProviderOAuthEndpoints;
  composioCallbackGuidance: ComposioCallbackGuidance;
  pkceRequired: Traceable<"required" | "supported_optional" | "not_mentioned_in_sources">;
  tokenAndRefreshBehavior: Traceable<string>;
  scopes: Traceable<{
    scope: string;
    category: string;
    description: string;
  }[]>;
  reviewerSubmissionDraft?: {
    scopeJustificationDraft: string;
    reviewerNotes: string;
  };
}

// Branch 2: Used when OAuth setup is NOT required
export interface DirectCredentialSpec {
  mode: "direct_credential";
  scheme: "API_KEY" | "BEARER_TOKEN" | "BASIC_AUTH";
  credentialLabel: string;             // e.g., "Secret API Key", "Internal Connection Token", "Personal Access Token"
  whyOAuthIsNotRequired: string;       // "OAuth setup isn't required for this integration path..."
  headerOrParamFormat: Traceable<string>;
  rotationAndExpiryRules: Traceable<string>;
}

// Branch 3: Used when an app supports both a direct credential path and an OAuth path
export interface HybridAuthSpec {
  mode: "hybrid";
  pathDecisionGuide: Traceable<string>;
  directCredentialPath: DirectCredentialSpec;
  oauthPath: OAuthProtocolSpec;
}

export type ConditionalAuthSpec = OAuthProtocolSpec | DirectCredentialSpec | HybridAuthSpec;

// SDK Snippet with explicit validation status
export interface CodeSnippetSpec {
  language: "python" | "typescript";
  code: string;
  validationStatus: "tested_against_sdk" | "adapted_from_docs_needs_validation";
  sourceDocUrl: string;
  validationNote: string;              // e.g., "Adapted from Managed vs Custom Auth session example; verify package version before production use."
}

export interface IntegrationReadinessGuide {
  appId: string;
  appName: string;
  websiteUrl: string;
  composioToolkitSlug?: string;
  supportedAuthSchemes: Traceable<ConcreteAuthScheme[]>;
  composioManagedAuthStatus: Traceable<ManagedAuthAvailability>; // Supports "unknown"

  // 1. Readiness & Timeline Summary (Every metric individually traceable)
  readinessSummary: {
    authPathClassification: AuthPathClassification;
    oauthNecessityBanner: string;      // e.g., "OAuth setup isn't required for this integration path."
    activeSetupTime: Traceable<string>;
    approvalWaitTime: Traceable<string>;
    oneLineSummary: string;
  };

  // 2. Traceable Prerequisites
  prerequisites: Traceable<{
    item: string;
    requiredForTesting: boolean;
    requiredForProduction: boolean;
    detail: string;
  }>[];

  // 3. Conditional Technical Specification
  authSpec: ConditionalAuthSpec;

  // 4. Step-by-Step Runbook (Agent vs. Human Handoff)
  setupRunbook: SetupStep[];

  // 5. Traceable Blockers & Playbooks
  blockersAndPlaybooks: Traceable<{
    blockerTitle: string;
    triggerCondition: string;
    errorCodeOrSymptom?: string;
    howToUnblock: string;
    workaroundWhilstWaiting: string;
  }>[];

  // 6. Composio Wiring Guide & Validated/Flagged Snippets
  composioIntegration: {
    recommendedScheme: ConcreteAuthScheme;
    configurationSteps: Traceable<string[]>;
    sdkSnippets: CodeSnippetSpec[];
  };
}

```

## 4. Preventing Callback URI & SDK Snippet Confusion

To make sure the guide never misleads a developer into configuring the wrong redirect URI or running unvalidated SDK calls, the UI presents three distinct panels:

| **Panel** | **What the UI Displays** | **How It Avoids Creating New Uncertainty** | 
| **1. Provider OAuth Endpoints** | Displays the provider's own `authorizationUrl` (e.g., `https://slack.com/oauth/v2/authorize`) and `tokenUrl` (`https://slack.com/api/oauth.v2.access`) with a direct link to the provider's official OAuth doc ([Slack OAuth v2](https://api.slack.com/authentication/oauth-v2)). | Clearly labeled **"Provider Endpoints (Owned by Slack/GitHub/etc.)"** so developers never paste them into the Redirect URI box. | 
| **2. Composio Callback URI** | • **If retrieved from an active config**: Shows the exact `oauth_redirect_uri` value (`tested_live`).  • **If not retrieved from a live config**: Instructs the developer to open **Composio Dashboard → Create Auth Config → Select Toolkit** and copy the exact `Redirect URI` (`oauth_redirect_uri`) displayed for that toolkit. | Documented URLs from [Custom Auth Configs](https://docs.composio.dev/docs/auth-configuration/custom-auth-configs) (`.../api/v3/toolkits/auth/callback` and legacy `.../api/v1/auth-apps/add`) are shown only in a collapsible *"Reference Note from Composio Docs"* rather than presented as the guaranteed callback for every toolkit. | 
| **3. Composio SDK Snippets** | Displays a badge on every code snippet: either **`[Tested in Runtime]`** or **`[Adapted from Docs — Needs Runtime Validation]`**. | Explicitly notes the difference between the session-based `composio.create(user_id=..., auth_configs=...)` syntax in [Managed vs Custom Auth](https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app) and the legacy `composio.connected_accounts.initiate(...)` syntax in [Custom Auth Configs](https://docs.composio.dev/docs/auth-configuration/custom-auth-configs). | 

## 5. Streamlined End-to-End Live Investigator & Three Validation Test Cases

Instead of an over-engineered multi-agent pipeline, the live investigator is designed to reliably complete **one end-to-end workflow**:

1. **Accept an unfamiliar app name or URL** from the user.

2. **Identify its likely authentication model** (`oauth_required`, `hybrid_oauth_or_direct`, or `direct_credential_only`) and set `composioManagedAuthStatus` (using `"unknown"` if Composio catalog support cannot be verified from retrieved sources).

3. **Retrieve and cite relevant official documentation** from the provider's developer site.

4. **Generate a structured, actionable guide** conforming to `IntegrationReadinessGuide`, omitting OAuth endpoint fields when `mode === "direct_credential"`.

5. **Flag unsupported claims and export the result**:

   * Any setup duration or review wait time not explicitly stated in the retrieved official pages is flagged as `unverified_hypothesis` (e.g., *"No review gate identified in the sources checked"* rather than *"Instant"*).

   * Provide a one-click **Export as Shareable Markdown / JSON** button.

### Live Investigator Validation Plan (3 Archetypes + 1 Unfamiliar Final Test)

During build verification, we will test the live investigator against three distinct authentication models, culminating in a live run on an unfamiliar app not in our curated set:

| **Test Case** | **Target App Type** | **Example Test Input** | **What the Test Must Verify** | 
| **Test Case 1: OAuth App** | Strict OAuth 2.0 integration | `Linear` or `Dropbox` | Extracts documented authorization/token endpoints with source URLs, separates them from the Composio callback verification step, and marks unstated setup/review durations as `unverified_hypothesis`. | 
| **Test Case 2: Hybrid-Auth App** | Supports both direct token and OAuth 2.0 | `HubSpot` or `Airtable` | Populates `HybridAuthSpec`, explaining when a developer can use a Private App token / Personal Access Token (*"OAuth setup isn't required for single-account/internal use"*) versus when public OAuth is needed. | 
| **Test Case 3: API-Key App** | Direct API key / Bearer token only | `Resend` or `ElevenLabs` | Sets `authPathClassification = "direct_credential_only"`, renders **"OAuth setup isn't required for this integration path"**, and requires zero OAuth URLs. | 
| **Final Acceptance Test** | **Unfamiliar App (Not in curated data)** | Any arbitrary SaaS app chosen live (e.g., `Calendly`, `Todoist`, `ClickUp`, or evaluator's choice) | Proves the investigator dynamically searches, cites real docs, sets `composioManagedAuthStatus: "unknown"` when unverified, and flags unsupported claims honestly. | 

## 6. Honest Verification Audit: What We Have Actually Checked vs. What Remains Unverified

Requirement #2 asks us to: *"Check a sample of the guidance against real sources or setup attempts. Show what you learned, corrected, or could not verify."*

The table below records **only what we have actually checked so far** (by reading the official documentation pages listed) and strictly applies our three evidence categories (`tested_live`, `documented_not_tested`, `unverified_hypothesis`). Zero planned portal tests are reported as completed.

| **Provider / Platform** | **Official Pages Actually Consulted** | **Explicitly Established by Source (documented_not_tested)** | **Corrections Made to Our Earlier Plan Assumptions** | **What Remains an unverified_hypothesis (Not Established by Sources Checked & Not Tested Live)** | 
| **Composio Platform** | 1\. [Managed OAuth Apps](https://docs.composio.dev/toolkits/managed-auth)  2\. [Managed vs Custom Auth](https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app)  3\. [Custom Auth Configs](https://docs.composio.dev/docs/auth-configuration/custom-auth-configs) | • `composio_managed_auth_schemes` (Python) / `composioManagedAuthSchemes` (TS) checks whether Composio manages an OAuth method for a toolkit.  • Custom auth is used for branding, custom scopes, dedicated quotas, <15-min polling, custom subdomains, or unmanaged toolkits (e.g., PostHog, Tavily, Perplexity).  • Docs show two redirect URI strings (`.../api/v3/toolkits/auth/callback` and legacy default `.../api/v1/auth-apps/add`) and state the app's redirect URI must match `oauth_redirect_uri` in the Composio auth config. | **Stopped Hardcoding Callback & Unvalidated SDK Code**: Made `oauth_redirect_uri` verification in the user's active config the primary instruction, demoted the `v3`/`v1` URLs to reference notes, and flagged SDK snippets as `adapted_from_docs_needs_validation` until run in a live environment. | • Which specific toolkits in the catalog currently support managed auth (`"unknown"` until each toolkit page or API is queried).  • Live runtime execution of the Python/TypeScript SDK snippets. | 
| **GitHub (P0)** | [Creating an OAuth App - GitHub Docs](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) | • Navigation: `Settings > Developer settings > OAuth apps > New OAuth App`.  • Form fields: `Application name`, `Homepage URL`, optional `Application description`, `Authorization callback URL` (up to 10 allowed).  • `Expire user access tokens` is enabled by default.  • Docs recommend considering a **GitHub App** over an **OAuth App** for fine-grained permissions and short-lived tokens. | **Corrected Token Expiry & Setup/Wait Claims**: (1) Fixed our false earlier claim that GitHub OAuth tokens never expire. (2) Reclassified the `"~5 min"` setup time from documented to `unverified_hypothesis` (the doc does not state how long setup takes). (3) Changed approval wait from `"Instant (documented)"` to *"No review gate identified in the sources checked"* (`unverified_hypothesis` for zero wait). | • Exact authorize/token URLs (which live on the companion *Authorizing OAuth apps* page, not the creation page we read).  • Hands-on setup time (`~5–10 mins`) and organization-level OAuth app approval rules. | 
| **Slack (P0)** | [Installing via OAuth authorization code flow - Slack Docs](https://api.slack.com/authentication/oauth-v2) | • Authorize URL: `https://slack.com/oauth/v2/authorize` (GovSlack: `https://slack-gov.com/oauth/v2/authorize`; user-centric MCP flow: `https://slack.com/oauth/v2_user/authorize`).  • Token exchange URL: `https://slack.com/api/oauth.v2.access` (temporary `code` expires after 10 minutes).  • Bot scopes use `scope=`, user scopes use `user_scope=`.  • Redirect URLs must use HTTPS and cannot contain `#`.  • Documented error codes: `bad_redirect_uri`, `invalid_scope`, `invalid_team_for_non_distributed_app`, `scope_not_allowed_on_enterprise`, `unapproved_scope`. | **Removed Unverified Distribution UI Claims**: Dropped claims about "4 checkboxes" in the Manage Distribution UI (not present on this page) and grounded the blocker guidance in the documented `invalid_team_for_non_distributed_app` and `unapproved_scope` error codes. | • Exact UI steps inside the `Manage Distribution` portal screen.  • Hands-on setup time (`~20–30 mins`) and Slack Marketplace review duration. | 
| **Google (P0)** | [Using OAuth 2.0 to Access Google APIs](https://developers.google.com/identity/protocols/oauth2) | • Requires obtaining OAuth 2.0 client credentials in the Google API Console (`Web application` type for server-side web apps).  • Supports incremental authorization and refresh tokens.  • States that limits apply to the number of refresh tokens issued per client-user combination and per user across all clients. | **Demoted Unverified Google Review Rules to Hypotheses**: The overview page we read does not contain the 100-user Testing cap, 7-day testing refresh token expiry, or CASA Tier 2 audit rules (and `support.google.com/cloud/answer/7454865` blocked automated browsing). Those claims remain `unverified_hypothesis` until verified from an accessible official Google Auth Platform doc or live console check. | • Exact authorization/token URLs (located on the *Web Server Applications* sub-page).  • Official verification tier rules, setup time (`~30–90 mins`), and Google review wait times. | 
| **Notion (P1)** | [Public Connections - Notion Docs](https://developers.notion.com/guides/get-started/public-connections) | • Three auth models: **Personal access tokens (PATs)**, **Internal connections** (single-workspace bot token), and **Public connections** (multi-workspace OAuth 2.0).  • Creation path: `Developer portal > Build > Public connections > Create new connection`.  • Fields: Connection name, development workspace, Redirect URI(s), Installation scope (`Any workspace` vs. `Selected workspaces only`), and capabilities.  • **Installation scope is set once at creation time and cannot be changed afterward.**  • Marketplace listing details are managed separately under `Listings`. | **Corrected Privacy/ToS Creation Myth & Wait Claim**: Removed the false claim that Privacy Policy/ToS URLs are required to create a Public Connection. Changed approval wait to *"No review gate identified for standard Public Connection creation; Marketplace listing managed separately"*. | • Exact authorization and token URLs (located on the companion `/guides/get-started/authorization` page).  • Hands-on setup duration (`~3–5 mins` vs. `~15 mins`) and Marketplace listing review wait time. | 

## 7. Streamlined Repository Structure

```
oauth-readiness-copilot/
├── README.md                          # Setup instructions, product thesis, honest verification log, & limitations
├── .env.example                       # API key placeholders (zero secrets in repo)
├── package.json
├── src/
│   ├── types/
│   │   └── guide.ts                   # IntegrationReadinessGuide, discriminated ClaimEvidence, & ConditionalAuthSpec
│   ├── data/
│   │   └── curatedGuides.ts           # P0 (GitHub, Slack, Google) + P1 (Notion Hybrid, Perplexity API-Key)
│   ├── agent/
│   │   ├── investigatorAgent.ts       # 5-step end-to-end live investigator (triage -> retrieve -> cite -> generate -> flag/export)
│   │   └── prompts.ts                 # Enforces strict documented vs. hypothesis rules & "unknown" managed-auth state
│   ├── components/
│   │   ├── DirectoryView.tsx          # Guide cards showing Auth Path, Setup Time, Review Gate status, & Evidence badges
│   │   ├── GuideDetailView.tsx        # Renders OAuth, Hybrid, or Direct Credential guide based on authSpec.mode
│   │   ├── ClaimEvidenceBadge.tsx     # Interactive badge on every claim: [Tested Live] | [Documented] | [Hypothesis]
│   │   ├── EndpointsAndCallbackBox.tsx# Separates Provider Endpoints from Composio Callback verification instructions
│   │   └── LiveInvestigatorPanel.tsx  # End-to-end unfamiliar app investigator + Markdown/JSON export
│   └── App.tsx

```

## 8. Revised 6–8 Hour Execution Roadmap

| **Hour Block** | **Priority Focus** | **Concrete Tasks** | **Exit Criteria** | 
| **Hour 1** | **P0: Robust TypeScript Schema** | Implement `IntegrationReadinessGuide` with the single discriminated `ClaimEvidence` union, separated `AuthPathClassification` vs. `ConcreteAuthScheme`, and `"unknown"` support on `composioManagedAuthStatus`. | TypeScript model prevents contradictory test states, allows `"unknown"` managed-auth status, and makes OAuth URLs conditional on `mode`. | 
| **Hours 2–3** | **P0: Three Deep, Honest OAuth Guides (GitHub, Slack, Google)** | Browse the companion official endpoint pages for GitHub, Slack, and Google (e.g., GitHub *Authorizing OAuth apps*, Google *Web Server Applications*); populate `curatedGuides.ts` where every claim has an accurate `ClaimEvidence` record (`documented_not_tested` only when explicitly stated; `unverified_hypothesis` for unstated durations/waits). | GitHub, Slack, and Google guides are genuinely useful, separate provider endpoints from Composio callback verification, and never claim silence in docs proves an "Instant" wait. | 
| **Hours 3–4.5** | **P0: End-to-End Live Investigator & Core UI** | Build the 5-step live investigator (accept input -> identify auth model -> retrieve & cite official docs -> generate guide -> flag unsupported claims & export Markdown) and the adaptive Guide Detail View. | User can explore the 3 core guides, inspect claim-level evidence popovers, and export any guide as shareable Markdown. | 
| **Hours 4.5–6** | **P1: Hybrid (Notion), API-Key (Perplexity), & Live Investigator Validation** | Add the curated Notion (`hybrid`) and Perplexity (`direct_credential`) guides; test the live investigator against all 3 test cases (OAuth app, hybrid-auth app, API-key app) plus 1 genuinely unfamiliar app. | Investigator accurately outputs *"OAuth setup isn't required for this integration path"* for API-key apps and handles an unfamiliar app end-to-end without hardcoded fallbacks. | 
| **Hours 6–7** | **Verification Audit Tab, README & Deployment** | Build the interactive **Verification Audit** view showing exactly what we checked, what we corrected, and what remains unverified; deploy and write the README. | Working link + clean repository + honest README ready for submission (P2 stretch goals attempted only if time remains). | 
