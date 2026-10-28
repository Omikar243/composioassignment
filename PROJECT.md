# Project: APM Integrations OAuth Readiness Copilot

## Architecture
The system reduces developer and agent builder uncertainty when connecting user accounts to external apps via Composio by providing:
1. **Strict Epistemic Evidence Engine**: Every metric and timeline claim is individually tagged with a discriminated union (`tested_live`, `documented_not_tested`, `unverified_hypothesis`). Silence in docs is never conflated with instant approval.
2. **Polymorphic Auth Architecture**: Cleanly separates high-level integration path triage (`oauth_required`, `hybrid_oauth_or_direct`, `direct_credential_only`) from concrete auth schemes (`OAUTH2`, `API_KEY`, `BEARER_TOKEN`, `BASIC_AUTH`), displaying *"OAuth setup isn't required for this integration path"* for non-OAuth paths.
3. **Backend Retrieval Proxy**: Node/Express server on port 3001 with Vite middleware proxy (`/api`) eliminating browser CORS errors, protecting against SSRF, stripping HTML bloat via Cheerio, and budgeting Markdown via Turndown (<15k chars).
4. **Dual-Mode Live Investigator**: Mode 1 instant curated resolution (<5ms) + Mode 2 dynamic research for unfamiliar apps (extracting endpoints, setting `composioManagedAuthStatus: "unknown"`, marking unstated times as `unverified_hypothesis`).
5. **Isolated Endpoints & Callback UX**: Physical visual separation of provider-owned endpoints from Composio redirect URI verification instructions to prevent copy-paste errors.
6. **100-App Catalog Index & Verification Audit**: 10 categories, 50/25/25 distribution, 4 review gate levels, plus an honest audit matrix showing what was tested, documented, and corrected.
7. **Manus MCP Live Webapp & GitHub Sync**: Autonomous live webapp generation via Manus MCP (`create_task`) with public shareable URL, plus atomic GitHub sync to `https://github.com/Omikar243/composioassignment`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Discriminated ClaimEvidence Union | Types `tested_live`, `documented_not_tested`, `unverified_hypothesis` with derived `isIndependentlyTested` | M1 | execution_plan §3 |
| 2 | Traceable<T> Wrapper | Generic wrapper attaching evidence provenance to every value | M1 | execution_plan §3 |
| 3 | Separated Auth Path & Schemes | `AuthPathClassification` vs `ConcreteAuthScheme`, `ManagedAuthAvailability` (`"unknown"` support) | M1 | execution_plan §3 |
| 4 | Polymorphic ConditionalAuthSpec | `OAuthProtocolSpec`, `DirectCredentialSpec`, `HybridAuthSpec` eliminating unused OAuth fields | M1 | execution_plan §3 |
| 5 | Isolated Endpoint Interfaces | `ProviderOAuthEndpoints` strictly decoupled from `ComposioCallbackGuidance` | M1 | execution_plan §3 |
| 6 | Curated GitHub Guide | `hybrid_oauth_or_direct`, OAuth App vs GitHub App architecture, instant client ID, token expiry default | M1 | execution_plan §2, §6 |
| 7 | Curated Slack Guide | `oauth_required`, multi-workspace distribution errors, HTTPS & no '#' anchor redirect URI, bot/user scopes | M1 | execution_plan §2, §6 |
| 8 | Curated Google Workspace Guide | `oauth_required`, sensitive/restricted scopes, 100-user testing cap, CASA Tier 2 security audit hypotheses | M1 | execution_plan §2, §6 |
| 9 | Curated Notion Guide | `hybrid_oauth_or_direct`, internal bot token ~2 min vs public OAuth 2.0, permanent installation scope | M1 | execution_plan §2, §6 |
| 10 | Curated Perplexity Guide | `direct_credential_only`, API key integration, rendering "OAuth setup isn't required", zero OAuth endpoints | M1 | execution_plan §2, §6 |
| 11 | Backend Retrieval Proxy Server | Express server on port 3001 (`/api/retrieve`, `/api/investigate`, `/api/health`) bypassing browser CORS | M2 | survey 2 |
| 12 | Vite Proxy Middleware Integration | Vite proxy configuration forwarding `/api` to Express backend seamlessly | M2 | survey 2 |
| 13 | SSRF & Security Validation | Rejects internal/loopback IPs, enforces HTTPS protocols, 8s timeout | M2 | survey 2 |
| 14 | HTML Scraper & Markdown Parser | Cheerio stripping of scripts/styles/nav, Turndown semantic markdown conversion capped at 15k chars | M2 | survey 2 |
| 15 | Mode 1 Curated Fast-Path Triage | Instant resolution (<5ms) for GitHub, Slack, Google, Notion, Perplexity | M2 | survey 2 |
| 16 | Mode 2 Dynamic Investigator Engine | Dynamic search/fetch for unfamiliar apps, endpoint extraction, setting managed auth to `"unknown"` | M2 | survey 2 |
| 17 | Endpoint URL Sanitizer | Validates HTTPS and rejects `#` fragment anchors | M2 | survey 2 |
| 18 | 100-App Catalog Index Dataset | 100 apps across 10 categories, 50% OAuth, 25% Hybrid, 25% Direct Credential, 4 review gate levels | M3 | survey 1 |
| 19 | Verification Audit Dataset | Forensic audit logs: tested live actions, documented facts, myth corrections, open uncertainties | M3 | survey 1 |
| 20 | Schema & Taxonomy Unit Tests | Comprehensive automated unit test suite verifying schema invariants, catalog taxonomy, and guides | M3 | survey 1, ORIGINAL_REQUEST |
| 21 | Modern Glassmorphism Design System | Dark canvas `#090D16`, frosted slate containers, high-contrast typography, Tailwind CSS | M4 | survey 3 |
| 22 | Directory View Component | Hero section, 5 curated spotlight cards, 100-app catalog search/filter grid | M4 | survey 3 |
| 23 | Guide Detail View Component | Dynamic rendering: OAuth flow, Direct Credential banner, or Hybrid switcher | M4 | survey 3 |
| 24 | ClaimEvidenceBadge & Popover | Interactive popovers rendering verbatim evidence, tested date, source URL, or hypothesis rationale | M4 | survey 3 |
| 25 | EndpointsAndCallbackBox Component | Two visually isolated zones: Zone A (Provider Endpoints) and Zone B (Composio Redirect URI) | M4 | survey 3 |
| 26 | CodeSnippetSpec with Status Badge | Displays code with `[Tested in Runtime]` or `[Adapted from Docs — Needs Validation]` badge | M4 | survey 3 |
| 27 | Live Investigator View with Terminal | Real-time terminal progress stream, progress bar, claim badges, unfamiliar app research UI | M4 | survey 3 |
| 28 | Verification Audit View Component | Interactive tab detailing what was tested live, what official sources state, corrections, open items | M4 | survey 3 |
| 29 | Export Engine (Markdown & JSON) | One-click export of any guide as shareable structured Markdown or JSON | M4 | survey 3 |
| 30 | Manus MCP Live Webapp Generation | Autonomous task delegation via `manus-mcp` (`create_task`, quality mode, shareable link) | M4 | survey 3, ORIGINAL_REQUEST |
| 31 | GitHub Repository Synchronization | Atomic push of all source code, assets, and configs to `https://github.com/Omikar243/composioassignment` | M5 | survey 3, ORIGINAL_REQUEST |
| 32 | Opaque-Box E2E Test Suite (Tiers 1-4) | Requirements-driven test suite validating all 32 features, boundaries, combinations, and workloads | M6 / E2E Track | ORIGINAL_REQUEST |
| 33 | Adversarial Coverage Hardening (Tier 5) | White-box adversarial edge testing, security validation, and fuzzing | M6 | Project Pattern |
| 34 | Mode B: AI-Assisted Research Engine | Server-side Groq/OpenAI route classifying retrieved docs, extracting structured claims, and validating strictly against IntegrationReadinessGuide schema | M2 | user_directive |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Typed Evidence Schema & 5 Curated Guides | `src/types/guide.ts`, `src/data/curatedGuides.ts` | none | DONE |
| M2 | Backend Retrieval Proxy & Investigator Engine | `server/proxyServer.ts`, `src/agent/investigatorEngine.ts`, `src/agent/sanitizer.ts`, Vite proxy | M1 | DONE |
| M3 | 100-App Catalog Index, Verification Audit & Unit Tests | `src/data/catalog100.ts`, `src/data/verificationAudit.ts`, `tests/unit/` | M1 | DONE |
| M4 | Frontend UI & Live Experience + Manus MCP Generation | `src/components/`, `src/App.tsx`, Manus MCP `create_task` live webapp | M1, M2, M3 | DONE |
| M5 | GitHub Repository Synchronization | Git/MCP sync to `https://github.com/Omikar243/composioassignment` | M1, M2, M3, M4 | DONE |
| M6 | Final Milestone: Pass 100% E2E Tests (Tiers 1-4) & Adversarial Hardening (Tier 5) | E2E validation, bug fixes, Tier 5 adversarial tests | M1-M5, TEST_READY.md | DONE |

## Interface Contracts
### M1 ↔ M2, M3, M4
- `IntegrationReadinessGuide`: Top-level guide entity containing `appId`, `appName`, `websiteUrl`, `supportedAuthSchemes: Traceable<ConcreteAuthScheme[]>`, `composioManagedAuthStatus: Traceable<ManagedAuthAvailability>`, `readinessSummary`, `prerequisites`, `authSpec: ConditionalAuthSpec`, `setupRunbook`, `blockersAndPlaybooks`, and `composioIntegration`.
- `ClaimEvidence`: Discriminated union `{ kind: "tested_live" } | { kind: "documented_not_tested" } | { kind: "unverified_hypothesis" }`.
- `Traceable<T>`: `{ value: T; evidence: ClaimEvidence; }`.
- `ConditionalAuthSpec`: Discriminator `mode: "oauth" | "direct_credential" | "hybrid"`.

### M2 (Backend Proxy) ↔ M4 (Frontend)
- `POST /api/retrieve`: Request `{ url: string }` → Response `{ url: string, title: string, markdown: string, charCount: number, error?: string }`.
- `POST /api/investigate`: Request `{ appName: string, websiteUrl?: string }` → Response `{ guide: IntegrationReadinessGuide, logs: string[] }`.
- `GET /api/health`: Response `{ status: "ok", timestamp: string }`.

## Code Layout
```
c:\Users\omika\Downloads\ComposioAssignment\
├── README.md                          # Architecture, epistemic principles, setup, verification audit, Manus links
├── .env.example                       # Environment template
├── package.json                       # Scripts, dependencies (React 18, Vite, Express, Cheerio, Turndown, Tailwind, Lucide)
├── tsconfig.json                      # Strict TypeScript compiler options
├── tsconfig.node.json                 # Node TS config for server/vite
├── vite.config.ts                     # Vite config with React plugin and /api proxy to localhost:3001
├── tailwind.config.js                 # Dark glassmorphism color palette and tokens
├── postcss.config.js                  # Tailwind/Autoprefixer postcss config
├── server/
│   └── proxyServer.ts                 # Express proxy server on port 3001 with SSRF guards & Cheerio/Turndown
├── src/
│   ├── types/
│   │   └── guide.ts                   # Discriminated ClaimEvidence, Traceable<T>, ConditionalAuthSpec, IntegrationReadinessGuide
│   ├── data/
│   │   ├── curatedGuides.ts           # 5 deep guides (GitHub, Slack, Google, Notion, Perplexity)
│   │   ├── catalog100.ts              # 100-app catalog directory index across 10 categories
│   │   └── verificationAudit.ts       # Honest verification audit records (tested live, documented, corrected, open)
│   ├── agent/
│   │   ├── investigatorEngine.ts      # Dual-mode live investigator (Mode 1 curated fast-path, Mode 2 dynamic research)
│   │   ├── sanitizer.ts               # URL and endpoint sanitization (HTTPS, no '#' anchors)
│   │   └── prompts.ts                 # Epistemic guidelines and research templates
│   ├── components/
│   │   ├── Navbar.tsx                 # Navigation bar with view switcher, active status, and GitHub link
│   │   ├── DirectoryView.tsx          # 100-app directory search/filters and 5 curated guide heroes
│   │   ├── GuideDetailView.tsx        # Dynamic guide view adapting to oauth / direct_credential / hybrid
│   │   ├── ClaimEvidenceBadge.tsx     # Epistemic badge with interactive provenance popover
│   │   ├── EndpointsAndCallbackBox.tsx# 2-zone isolated box separating Provider Endpoints from Composio Callback
│   │   ├── CodeSnippetSpec.tsx        # Code snippet viewer with [Tested in Runtime] / [Adapted] badges
│   │   ├── LiveInvestigatorPanel.tsx  # Unfamiliar app research input, terminal progress stream, live output
│   │   ├── VerificationAuditView.tsx  # Interactive audit matrix with filterable evidence tabs
│   │   └── ExportEngine.tsx           # Shareable Markdown and JSON export generator
│   ├── App.tsx                        # Main application layout, view state management
│   ├── main.tsx                       # React DOM entrypoint
│   └── index.css                      # Tailwind base and glassmorphism utility classes
└── tests/
    ├── unit/
    │   ├── schema.test.ts             # Schema validation and type invariant unit tests
    │   ├── catalog.test.ts            # 100-app catalog distribution and review gate unit tests
    │   └── sanitizer.test.ts          # Endpoint sanitizer unit tests
    └── e2e/
        ├── testHarness.ts             # Opaque-box E2E test runner
        ├── tier1_features.test.ts     # Tier 1 Feature Coverage tests
        ├── tier2_boundaries.test.ts   # Tier 2 Boundary & Corner cases
        ├── tier3_pairwise.test.ts     # Tier 3 Cross-Feature combinations
        └── tier4_workloads.test.ts    # Tier 4 Real-World scenarios
```
