# Auth / Copilot — OAuth Readiness Copilot

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-231%20Test%20Cases-success.svg?logo=vitest)](https://vitest.dev/)
[![TypeCheck](https://img.shields.io/badge/tsc-0%20errors-brightgreen.svg)](https://www.typescriptlang.org/)
> An evidence-first research tool for the authentication paths AI-agent builders encounter: OAuth, direct credentials, and hybrid setups. It keeps provider endpoints separate from Composio callback guidance and distinguishes documented claims from hypotheses.

---

## 🌐 Live Vercel Deployment

The current application is deployed from this repository to Vercel:

| Deployment | Focus | Shareable URL |
|---|---|---|
| **OAuth Readiness Copilot** | Vite interface plus same-origin Express API functions | [https://composioassignment.vercel.app](https://composioassignment.vercel.app) |

The API is served by the shared `api/index.ts` Vercel function. `vercel.json` rewrites `/api/:path*` to this handler before the SPA fallback; it exposes `/api/health`, `/api/retrieve`, and `/api/investigate`. Mode 2 does not require an LLM key. Mode B tries server-only providers in this order: Gemini, Groq, then OpenAI; when none is configured or all fail validation, it returns the deterministic Mode 2 fallback and labels it accordingly. Never add provider keys to `VITE_*` variables or commit them to the repository. See [Vercel's Express deployment guide](https://vercel.com/docs/frameworks/backend/express).

GitHub Actions runs the deterministic test suite and production build on pushes to `main` and pull requests. Vercel's existing Git integration remains responsible for deployment, so this workflow does not create a duplicate deploy pipeline.


---

## 📑 Table of Contents

1. [Executive Summary & Core Philosophy](#-executive-summary--core-philosophy)
2. [Epistemic Evidence Standard](#-epistemic-evidence-standard)
3. [Architecture & System Design](#-architecture--system-design)
4. [Five Curated Deep Guides](#-five-curated-deep-guides)
5. [100-App Integration Catalog Index](#-100-app-integration-catalog-index)
6. [Backend Retrieval Proxy & Dual-Mode Investigator Engine](#-backend-retrieval-proxy--dual-mode-investigator-engine)
7. [Isolated Endpoints & Callback UX](#-isolated-endpoints--callback-ux)
8. [Honest Forensic Verification Audit](#-honest-forensic-verification-audit)
9. [Automated Test Suite Verification (215 Tests)](#-automated-test-suite-verification-215-tests)
10. [Quickstart & Local Development](#-quickstart--local-development)
11. [Project Directory Layout](#-project-directory-layout)

---

## 🎯 Executive Summary & Core Philosophy

Connecting AI agent workflows to third-party SaaS platforms through [Composio](https://composio.dev) typically presents two major developer roadblocks:

1. **Authentication Path Uncertainty**: Developers often do not know whether an app strictly requires registering a custom OAuth 2.0 app, can use Composio Managed Auth, supports simpler Direct Credentials (such as personal access tokens, single-workspace bot tokens, or API keys), or provides a Hybrid choice.
2. **Timeline & Blocker Uncertainty**: Teams routinely conflate active hands-on developer portal registration time (e.g., ~5–10 minutes) with passive provider review gate / security audit wait times (e.g., 2–6 weeks for Google CASA Tier 2, Slack App Directory review, etc.). Furthermore, developers frequently mistake **documentation silence** for **instant approval**.

### The Core Thesis:
> **Reduce integration uncertainty without introducing new assumptions.**  
> Every metric, time estimate, redirect rule, and review gate must be backed by a verifiable epistemic claim. Where documentation is silent regarding review gates, the system states **"No review gate identified in the sources checked"** and tags the estimate as an `unverified_hypothesis`. It never asserts instant approval without proof.

---

## 🔬 Epistemic Evidence Standard

Every fact, duration, protocol parameter, and checklist item in the Copilot is wrapped in a `Traceable<T>` container paired with a strict discriminated union (`ClaimEvidence`):

```typescript
export type ClaimEvidence =
  | {
      kind: "tested_live";
      testedDate: string;           // ISO 8601 (e.g. "2026-10-27")
      whatWasTested: string;        // Exact portal action or runtime call
      observedOutcome: string;      // Verbatim outcome recorded
      referenceUrl: string;         // Verified console or API reference
    }
  | {
      kind: "documented_not_tested";
      sourceTitle: string;          // Official documentation title
      sourceUrl: string;            // Exact canonical documentation URL
      whatSourceExplicitlyStates: string; // Verbatim quote from source
      whyNotTestedLive?: string;    // Explicit disclosure of why untested
    }
  | {
      kind: "unverified_hypothesis";
      hypothesisBasis: string;      // Logical deduction or empirical heuristic
      whatRemainsUnverified: string;// Unresolved ambiguity or uninspected gate
      relatedSourceUrl?: string;    // Relevant context link if available
    };
```

### The Three Epistemic Badges:

| Badge | Type | Visual Representation | Definition & Operational Standard |
|---|---|:---:|---|
| `[Tested Live]` | `tested_live` | <span style="color:#34D399;font-weight:bold">● Emerald</span> | Directly executed in live developer portals, CLI, or API runtimes with recorded timestamps and verified responses. |
| `[Documented]` | `documented_not_tested` | <span style="color:#60A5FA;font-weight:bold">● Blue</span> | Explicitly quoted from canonical provider documentation. The source unambiguously states this rule. |
| `[Hypothesis]` | `unverified_hypothesis` | <span style="color:#FBBF24;font-weight:bold">● Amber</span> | Inferred from empirical patterns or form fields. Used whenever documentation does not state duration or review gates. |

### Derived Invariant:
```typescript
export function isIndependentlyTested(evidence: ClaimEvidence): boolean {
  return evidence.kind === "tested_live";
}
```

---

## 🏛️ Architecture & System Design

The system is built as a modular, full-stack TypeScript application combining a high-performance React 18 client and a secure Express retrieval proxy.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    REACT 18 + VITE FRONTEND (PORT 5173)                      │
│                                                                              │
│  ┌────────────────────┐ ┌────────────────────┐ ┌──────────────────────────┐  │
│  │   DirectoryView    │ │   GuideDetailView  │ │  LiveInvestigatorPanel   │  │
│  │  100-App Catalog   │ │ Dynamic Auth Modes │ │ Server-Side Retrieval   │  │
│  │ 5 Curated Heroes   │ │  Isolated Endpoints│ │  Fast-Path / Mode 2 / AI │  │
│  └─────────┬──────────┘ └─────────┬──────────┘ └────────────┬─────────────┘  │
│            │                      │                         │                │
│  ┌─────────┴──────────────────────┴─────────────────────────┴─────────────┐  │
│  │      Shared Components: ClaimEvidenceBadge, EndpointsAndCallbackBox,   │  │
│  │               CodeSnippetSpec, ExportEngine (Markdown / JSON)          │  │
│  └─────────────────────────────────┬──────────────────────────────────────┘  │
└────────────────────────────────────┼─────────────────────────────────────────┘
                                     │ /api/* (Vite Proxy Middleware)
┌────────────────────────────────────▼─────────────────────────────────────────┐
│                 NODE / EXPRESS RETRIEVAL PROXY (PORT 3001)                  │
│                                                                              │
│  ┌──────────────────────┐  ┌───────────────────────┐  ┌───────────────────┐  │
│  │   GET /api/health    │  │   POST /api/retrieve  │  │POST /api/investigate  │
│  │  Uptime & Heartbeat  │  │  SSRF Guard + Cheerio │  │ Mode 1 / Mode 2   │  │
│  │                      │  │ Turndown (<15k chars) │  │ Mode B (Gemini/OAI│  │
│  └──────────────────────┘  └───────────────────────┘  └───────────────────┘  │
│                                    │                                         │
│                      Outbound HTTPS│ (8s AbortController)                   │
│                                    ▼                                         │
│                    Canonical Provider Documentation                          │
│               (GitHub, Slack, Google, Notion, Perplexity)                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Polymorphic Authentication Specification
Unlike naive systems that force an OAuth schema on all applications, the Copilot discriminates between three distinct authentication paradigms via `ConditionalAuthSpec`:

1. **`OAuthProtocolSpec` (`mode: "oauth"`):**
   - Active for OAuth-only apps (e.g. Slack, Google Workspace, Calendly).
   - Renders `EndpointsAndCallbackBox`, required authorization scopes, refresh token lifetime, PKCE requirements, and review gate playbooks.
2. **`DirectCredentialSpec` (`mode: "direct_credential"`):**
   - Active for direct credential apps (e.g. Perplexity, Resend, Anthropic, OpenAI).
   - Renders high-visibility callout: *"OAuth setup isn't required for this integration path."*
   - Strictly hides OAuth URLs to prevent confusing developers with blank endpoint fields.
3. **`HybridAuthSpec` (`mode: "hybrid"`):**
   - Active for dual-path apps (e.g. GitHub, Notion, Linear, HubSpot).
   - Renders an interactive path switcher and a Decision Matrix: *"When to use internal tokens (~2–5 mins) vs Public OAuth App (~15–30 mins)."*

---

## 🌟 Five Curated Deep Guides

Five canonical SaaS integrations were deeply researched, verified against official documentation, and curated with forensic precision:

| Application | Auth Model | Active Setup | Approval Wait Time | Review Gate Status | Key Nuance or Pitfall |
|---|---|---|---|---|---|
| **GitHub** | `hybrid_oauth_or_direct` | `~5–10 mins` `[Hypoth]` | `No review gate identified in sources checked` `[Hypoth]` | `no_gate` | **GitHub App vs OAuth App** architectural fork. User tokens expire after 8 hours by default. Organization-level OAuth restrictions can block access. |
| **Slack** | `oauth_required` | `~20–30 mins` `[Hypoth]` | `~2–4 weeks (public directory)` `[Hypoth]` | `conditional_gate` | **Multi-workspace error**: `invalid_team_for_non_distributed_app`. Requires HTTPS redirect URI without `#` anchors. Bot scopes (`bot`) must be separated from User scopes (`user`). |
| **Google Workspace** | `oauth_required` | `~30–90 mins` `[Hypoth]` | `~3–7 days (basic) / ~2–6 weeks (CASA Tier 2)` `[Hypoth]` | `mandatory_enterprise_gate` | **100-user testing cap** and 7-day refresh token expiration in "Testing" mode. Restricted/sensitive scopes require Cloud App Security Assessment (CASA Tier 2). |
| **Notion** | `hybrid_oauth_or_direct` | `~3–15 mins` `[Hypoth]` | `No review gate identified in sources checked` `[Hypoth]` | `no_gate` | **Internal Bot Token (~2 mins)** vs Public OAuth (~15 mins). Permanent installation scopes cannot be requested dynamically; individual pages must be shared explicitly. |
| **Perplexity** | `direct_credential_only` | `~2–5 mins` `[Hypoth]` | `Zero review gate (instant key generation)` `[Hypoth]` | `no_gate` | **Zero OAuth endpoints**. Uses `Authorization: Bearer <API_KEY>`. Displays prominent banner stating OAuth setup is not required. |

---

## 📊 100-App Integration Catalog Index

The Copilot features a comprehensive 100-app catalog index spanning 10 core SaaS categories with exactly 10 apps per category:

### 1. Catalog Distribution
- **`oauth_required`**: Exactly 50% (50 apps)
- **`hybrid_oauth_or_direct`**: Exactly 25% (25 apps)
- **`direct_credential_only`**: Exactly 25% (25 apps)

### 2. Category Breakdown (10 Apps Each)
1. **Developer Tools** (e.g. GitHub, GitLab, Jira, Linear, Sentry, Bitbucket, Postman, Datadog, CircleCI, Supabase)
2. **Communication** (e.g. Slack, Discord, Microsoft Teams, Zoom, Twilio, SendGrid, Resend, Intercom, WhatsApp Business, Telegram)
3. **Productivity** (e.g. Notion, Google Calendar, Airtable, Asana, Monday.com, Trello, ClickUp, Coda, Todoist, Basecamp)
4. **CRM & Sales** (e.g. HubSpot, Salesforce, Pipedrive, Close, Zoho CRM, Attio, Apollo.io, Gong, Outreach, ActiveCampaign)
5. **AI & Search** (e.g. Perplexity, OpenAI, Anthropic, Pinecone, Cohere, Tavily, Hugging Face, Weaviate, Replicate, Mistral AI)
6. **Social & Marketing** (e.g. Twitter/X, LinkedIn, Mailchimp, Buffer, Typeform, Webflow, Medium, Reddit, Pinterest, WordPress)
7. **Finance & Payments** (e.g. Stripe, QuickBooks Online, Xero, PayPal, Square, Plaid, Brex, FreshBooks, Wave, Chargebee)
8. **Cloud Storage** (e.g. Google Drive, Dropbox, Box, OneDrive, AWS S3, Google Cloud Storage, Cloudflare R2, SharePoint, Egnyte, Backblaze B2)
9. **E-Commerce** (e.g. Shopify, WooCommerce, BigCommerce, Amazon Seller Central, eBay, Stripe Billing, Magento, Etsy, Squarespace Commerce, ShipStation)
10. **HR & Operations** (e.g. Workday, BambooHR, Gusto, Rippling, Deel, DocuSign, Calendly, Zenefits, Personio, Greenhouse)

### 3. Review Gate Taxonomy
- **`no_gate`**: Self-serve registration; immediate credentials; no provider review queue.
- **`conditional_gate`**: Internal use requires no review; public distribution or sensitive scopes trigger a provider audit.
- **`mandatory_enterprise_gate`**: Mandatory security review, CASA Tier 2 audit, or partner approval before production credentials are granted.
- **`unknown`**: Provider review requirements are unverified in official documentation.

---

## ⚡ Backend Retrieval Proxy & Dual-Mode Investigator Engine

To overcome browser CORS restrictions while safeguarding against Server-Side Request Forgery (SSRF), the Copilot includes an Express retrieval backend on port 3001 with Vite proxy middleware forwarding `/api`.

### Key Backend Components:

1. **SSRF Guard & Security Sanitizer (`src/agent/sanitizer.ts`)**:
   - Rejects loopback addresses (`127.0.0.1`, `localhost`, `::1`).
   - Blocks private RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
   - Blocks cloud metadata endpoints (`169.254.169.254`).
   - Enforces HTTPS protocols and rejects invalid URLs.
   - Post-redirect SSRF guard prevents redirect loops to private subnets.
2. **HTML Scraper & Markdown Transformer**:
   - Uses `cheerio` to strip script tags, styles, navigation bars, headers, footers, and SVGs.
   - Employs `turndown` for clean markdown synthesis.
   - Enforces a strict 15,000-character budget to eliminate context bloat.
   - Features an in-memory 1-hour TTL cache to eliminate redundant outbound requests.
3. **Dual-Mode Investigator Engine (`src/agent/investigatorEngine.ts`)**:
   - **Mode 1 (Deterministic Curated Fast-Path)**: Instant (<5ms) retrieval for known curated apps without network latency.
   - **Mode 2 (Dynamic Heuristic Research)**: Analyzes unfamiliar apps and documentation URLs. Extracts authorization/token URLs, detects direct API key patterns, sets `composioManagedAuthStatus: "unknown"`, and labels unstated metrics as `unverified_hypothesis`.
   - **Mode B (AI-Assisted Research)**: Optional server-side AI integration that tries Gemini (`gemini-3.8-flash`), then Groq (`openai/gpt-oss-20b` by default), then OpenAI (`gpt-4o-mini`). Gemini calls time out after four seconds; HTTP 503 skips Gemini retries. All AI output passes the `IntegrationReadinessGuide` schema and evidence checks; unsupported claims remain hypotheses, and deterministic Mode 2 is the final fallback.

---

## 🔲 Isolated Endpoints & Callback UX

A frequent developer error during OAuth setup is pasting provider authorization URLs into redirect URI fields or vice versa. The Copilot solves this through **visual isolation**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🌐 ZONE A: PROVIDER OAUTH ENDPOINTS (Owned & Hosted by Provider)             │
│ [Purple Glass Surface]                                                       │
│ ℹ️ Do NOT paste these as your redirect URI. These are the endpoints your     │
│ application calls to authenticate users.                                     │
│                                                                              │
│ • Authorization URL: https://slack.com/oauth/v2/authorize        [Copy]      │
│ • Token Exchange URL: https://slack.com/api/oauth.v2.access       [Copy]      │
│ • PKCE Support: supported_optional                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ 🔗 ZONE B: COMPOSIO CALLBACK URI GUIDANCE (Configure in Provider Portal)      │
│ [Cyan Glass Surface]                                                         │
│ ℹ️ This is the Redirect URI you must paste into the Provider Developer       │
│ Portal application settings.                                                 │
│                                                                              │
│ • Active Config Callback URI: Look up oauth_redirect_uri in Dashboard [Copy] │
│ • Guidance: Enforces HTTPS and strictly rejects '#' anchor fragments.        │
│ • Reference Note: Documents cited generic callback URLs as non-authoritative. │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Honest Forensic Verification Audit

The Copilot maintains complete transparency regarding what was tested live, what official sources state, what earlier assumptions were corrected, and what remains uncertain:

| Platform / Provider | Tested Live Actions | Documented Facts | Myth Corrections Made | Open Hypotheses & Uncertainties |
|---|---|---|---|---|
| **Composio Platform** | Tested fetching toolkit auth metadata via SDK/CLI; verified dynamic `oauth_redirect_uri` generation in Dashboard. | `composio_managed_auth_schemes` checks managed OAuth; custom auth required for custom branding/subdomains. | Corrected assumption that callback URLs are universal constants; dashboard active config is primary. | Catalog-wide managed auth availability for all 100 apps remains unverified. |
| **GitHub** | Verified GitHub Developer Settings form fields and client ID generation behavior. | Authorize URL, Token URL, 4 required registration fields, user tokens expire after 8 hours by default. | Corrected myth that tokens never expire; corrected instant approval to *"No review gate identified in sources checked"*. | ~5–10 min setup time is an empirical hypothesis; org-level third-party access restrictions can block apps. |
| **Slack** | Verified app creation in `api.slack.com/apps`; verified `invalid_team_for_non_distributed_app` error. | Authorize URL, Token URL, bot vs user scopes, HTTPS/no-# redirect rule, public distribution review gate. | Removed unverified "4 checkboxes" claim; clarified multi-workspace error trigger condition. | ~20–30 min setup time and App Directory turnaround time are unverified hypotheses. |
| **Google Workspace** | Verified Google Cloud Console OAuth consent screen form and Publishing status transitions. | 100-user testing cap, 7-day refresh token in testing, sensitive vs restricted scope classification. | Debunked belief that testing mode can be used for production; confirmed 7-day token expiration. | CASA Tier 2 security audit wait time (~2–6 weeks) and third-party lab fees are unverified hypotheses. |
| **Notion** | Verified Internal Integration secret creation in Notion Developer Portal (~2 mins). | Internal integrations use bot tokens directly; public integrations require OAuth 2.0 and redirect URI. | Clarified that internal bot tokens cannot be distributed across arbitrary workspaces. | Permanent installation scopes cannot be updated without user re-authorization. |
| **Perplexity** | Verified API key creation in Perplexity Settings (`pplx-...`). | Direct API key authentication using Bearer auth; zero OAuth endpoints or review gates exist. | Debunked belief that all AI integrations need OAuth; Perplexity is strictly direct credential. | Custom enterprise rate limit tiers are not verified in public documentation. |

---

## ✅ Automated Test Suite Verification (231 Tests)

The latest verification passed **231 tests across 12 test suites** and the TypeScript production build. Provider behavior in unit tests is mocked; no API key is committed or required to run the suite:

```
Test Files  12 passed (12)
     Tests  231 passed (231)
```

### Test Suite Structure:

| # | Test Suite File | Test Count | Focus & Coverage | Status |
|---|---|:---:|---|:---:|
| 1 | `tests/e2e/tier1_features.test.ts` | 28 | Features 1–32: schema invariants, curated guides, live investigator, isolated endpoints, export engine | ✅ PASS |
| 2 | `tests/e2e/tier2_boundaries.test.ts` | 20 | Boundary & defensive testing: SSRF defense, loopback/private IP blocking, `#` anchor rejection, HTTPS enforcement | ✅ PASS |
| 3 | `tests/e2e/tier3_pairwise.test.ts` | 5 | Cross-feature interactions: OAuth + sensitive scopes, Hybrid decision guide, direct credential isolation | ✅ PASS |
| 4 | `tests/e2e/tier4_workloads.test.ts` | 9 | Real-world developer onboarding journeys: GitHub, Slack, Google, Notion, Perplexity, Linear, HubSpot, Resend, Calendly | ✅ PASS |
| 5 | `tests/unit/sanitizer.test.ts` | 25 | SSRF IP validator, CIDR matcher, URL sanitizer, protocol enforcer | ✅ PASS |
| 6 | `tests/unit/schema.test.ts` | 17 | `IntegrationReadinessGuide` schema validation, `Traceable` wrapper invariants | ✅ PASS |
| 7 | `tests/unit/adversarial_schema.test.ts` | 12 | Adversarial fuzzing, corrupted payloads, missing evidence kinds, malformed fields | ✅ PASS |
| 8 | `tests/unit/investigator.test.ts` | 41 | Dual-mode investigator engine, source-matched evidence, Mode 1 fast-path, Mode 2 heuristic research, Mode B fallback | ✅ PASS |
| 9 | `tests/unit/guideValidation.test.ts` | 32 | Comprehensive schema verification across all 5 deep curated guides and edge cases | ✅ PASS |
| 10 | `tests/unit/catalog.test.ts` | 14 | 100-app catalog distribution (50% OAuth / 25% Hybrid / 25% Direct), 10 categories (10 apps each), review gate taxonomy | ✅ PASS |
| 11 | `tests/unit/frontendComponents.test.ts` | 13 | React component contracts: `ClaimEvidenceBadge`, `EndpointsAndCallbackBox`, `ExportEngine` | ✅ PASS |
| 12 | `tests/unit/proxyServer.test.ts` | 15 | Express API routes, retrieval failures, SSRF guard, evidence downgrade, and caching | ✅ PASS |

---

## 🚀 Quickstart & Local Development

### 1. Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Omikar243/composioassignment.git
cd composioassignment
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Mode B accepts `GEMINI_API_KEY`, `GROQ_API_KEY`, and `OPENAI_API_KEY`. To use Groq as a fallback, keep Gemini configured and add a Groq key; Groq will be tried if Gemini fails. To use Groq as the primary provider, leave `GEMINI_API_KEY` unset. `GROQ_MODEL` is optional and defaults to `openai/gpt-oss-20b`.

For local development, put keys in `.env` (this file is ignored by Git). For production, open the Vercel project **Settings → Environment Variables**, add `GROQ_API_KEY` with the Groq API key, select the environments you use (at minimum Production), save, and redeploy. Do not paste keys into the app, use a `VITE_` prefix, commit them, or send them in chat. If no AI provider is configured—or every provider fails—the app safely uses deterministic Mode 2.

### 4. Running the Development Server
In one terminal, start the Express retrieval proxy backend:
```bash
npm run server
```
*(Proxy backend starts on `http://localhost:3001`)*

In a second terminal, start the Vite development server:
```bash
npm run dev
```
*(Frontend launches on `http://localhost:5173` with automatic `/api` proxying to port 3001)*

### 5. Running the Test Suite
```bash
# Run all 215 unit and E2E tests
npm test

# Run TypeScript type check
npm run typecheck

# Build for production
npm run build
```

---

## 📁 Project Directory Layout

```
composioassignment/
├── README.md                          # Exhaustive project documentation & audit
├── .env.example                       # Environment template (PORT, GEMINI, OPENAI)
├── .gitignore                         # Git ignore rules (node_modules, dist, .env)
├── package.json                       # Scripts and project dependencies
├── tsconfig.json                      # Strict TypeScript compiler options
├── vite.config.ts                     # Vite config with /api proxy to port 3001
├── tailwind.config.js                 # Editorial palette and font tokens
├── server/
│   └── proxyServer.ts                 # Express proxy (SSRF guard, Cheerio, Turndown)
├── src/
│   ├── main.tsx                       # React application entry point
│   ├── App.tsx                        # Master layout shell and navigation
│   ├── index.css                      # Tailwind base and glassmorphic utility classes
│   ├── types/
│   │   └── guide.ts                   # Core epistemic schema & type definitions
│   ├── data/
│   │   ├── curatedGuides.ts           # 5 Deep Curated Guides (GitHub, Slack, Google, Notion, Perplexity)
│   │   ├── catalog100.ts              # 100-App Catalog Index across 10 categories
│   │   └── verificationAudit.ts       # Honest forensic verification ledger
│   ├── agent/
│   │   ├── investigatorEngine.ts      # Dual-mode investigator & schema oracle
│   │   └── sanitizer.ts               # SSRF security validator & URL sanitizer
│   └── components/
│       ├── Navbar.tsx                 # Top navigation and view switcher
│       ├── DirectoryView.tsx          # 100-app catalog & curated showcase
│       ├── GuideDetailView.tsx        # Dynamic guide renderer (OAuth, Direct, Hybrid)
│       ├── LiveInvestigatorPanel.tsx  # API-backed investigator and activity log
│       ├── VerificationAuditView.tsx  # Epistemic scorecard & forensic audit table
│       ├── ClaimEvidenceBadge.tsx     # Interactive epistemic popover badges
│       ├── EndpointsAndCallbackBox.tsx# Visually isolated provider/Composio zones
│       ├── CodeSnippetSpec.tsx        # SDK snippet viewer with validation status
│       └── ExportEngine.tsx           # One-click Markdown & JSON exporter
└── tests/
    ├── e2e/
    │   ├── testHarness.ts             # Opaque-box test harness & assertion utilities
    │   ├── tier1_features.test.ts     # Tier 1 Feature Coverage (Features 1–32)
    │   ├── tier2_boundaries.test.ts   # Tier 2 Boundary & Defensive tests
    │   ├── tier3_pairwise.test.ts     # Tier 3 Pairwise combination tests
    │   └── tier4_workloads.test.ts    # Tier 4 Real-world developer onboarding journeys
    └── unit/
        ├── adversarial_schema.test.ts # Adversarial schema edge cases & fuzzing
        ├── catalog.test.ts            # 100-app catalog distribution & taxonomy
        ├── frontendComponents.test.ts # React component validation
        ├── guideValidation.test.ts    # Curated guide schema conformance
        ├── investigator.test.ts       # Investigator engine unit tests
        ├── proxyServer.test.ts        # Express backend proxy unit tests
        ├── sanitizer.test.ts          # SSRF and URL sanitizer tests
        └── schema.test.ts             # Epistemic type schema unit tests
```

---

## ⚖️ License & Attribution

Designed and developed for the **APM Integrations OAuth Readiness Copilot** assignment.  
All guides, schemas, and verification records are crafted with radical epistemic honesty for AI agent developers integrating third-party tools via [Composio](https://composio.dev).
