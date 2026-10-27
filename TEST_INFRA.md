# TEST_INFRA.md — APM Integrations OAuth Readiness Copilot Test Infrastructure Specification

**Author:** teamwork_test_writer_e2e  
**Scope:** End-to-End (E2E) Test Track (Tiers 1–4)  
**Standard:** Opaque-Box, Requirements-Driven Validation  
**Date:** 2026-10-27T20:15:00Z  

---

## 1. Test Philosophy

The APM Integrations OAuth Readiness Copilot is built on a foundational promise: **reducing developer uncertainty without introducing new assumptions**. Consequently, the test suite must enforce this promise with absolute rigor.

### 1.1 Opaque-Box & Requirement-Driven Architecture
- **Zero Reliance on Implementation Internals**: Tests treat modules and servers as black boxes, validating observable behavior through public contracts, APIs, typed interfaces, and CLI commands derived strictly from `ORIGINAL_REQUEST.md` and `PROJECT.md`.
- **Authoritative Oracles**: Expected outputs are derived directly from official OAuth platform specifications (GitHub, Slack, Google, Notion, Perplexity) and Composio authentication architectures, not reverse-engineered from application code.
- **Progressive Testability & Isolation**: Each test case is self-contained, sets up its own fixtures, avoids execution order coupling, and cleans up state after execution.

### 1.2 Epistemic Invariants
- **Non-Equivalence of Silence and Proof**: If documentation does not state a review gate or setup duration, tests verify that the system yields `unverified_hypothesis` (e.g. *"No review gate identified in the sources checked"*), failing immediately if an unverified claim is labeled `tested_live` or `documented_not_tested`.
- **Discriminated Evidence Purity**: Tests assert that `isIndependentlyTested(evidence)` is strictly equivalent to `evidence.kind === "tested_live"` without contradictory flags.
- **Polymorphic Auth Isolation**: Direct credential integrations (e.g. Perplexity) MUST NOT expose or populate OAuth authorization endpoints or callback URIs. Hybrid integrations MUST cleanly expose both paths with a decision guide.
- **Endpoint vs. Callback Decoupling**: Tests verify that Provider OAuth Endpoints (`authorizationUrl`, `tokenUrl`) are kept structurally and visually separate from Composio Redirect URI guidance to eliminate copy-paste vulnerabilities.

---

## 2. Feature Inventory Mapping

Every feature defined in `PROJECT.md` is mapped to its test coverage tier and test location:

| # | Feature Name | Description | Test Tier | Target Test File |
|---|--------------|-------------|-----------|------------------|
| 1 | Discriminated ClaimEvidence Union | 3-way mutually exclusive evidence tagging | Tier 1 | `tests/e2e/tier1_features.test.ts` |
| 2 | Traceable<T> Wrapper | Provenance metadata attachment on all values | Tier 1 | `tests/e2e/tier1_features.test.ts` |
| 3 | Separated Auth Path & Schemes | Classification vs concrete auth schemes | Tier 1 | `tests/e2e/tier1_features.test.ts` |
| 4 | Polymorphic ConditionalAuthSpec | Mode-specific specs (OAuth, Direct, Hybrid) | Tier 1 | `tests/e2e/tier1_features.test.ts` |
| 5 | Isolated Endpoint Interfaces | Decoupled provider endpoints & Composio guidance | Tier 1 | `tests/e2e/tier1_features.test.ts` |
| 6 | Curated GitHub Guide | Architecture choice, instant client ID, token expiry | Tier 1, 4 | `tests/e2e/tier1_features.test.ts`, `tests/e2e/tier4_workloads.test.ts` |
| 7 | Curated Slack Guide | Bot vs user scopes, multi-workspace error, HTTPS | Tier 1, 4 | `tests/e2e/tier1_features.test.ts`, `tests/e2e/tier4_workloads.test.ts` |
| 8 | Curated Google Workspace Guide | Scope tiering, 100-user cap, CASA Tier 2 hypothesis | Tier 1, 4 | `tests/e2e/tier1_features.test.ts`, `tests/e2e/tier4_workloads.test.ts` |
| 9 | Curated Notion Guide | Internal bot token vs Public OAuth, permanent scope | Tier 1, 4 | `tests/e2e/tier1_features.test.ts`, `tests/e2e/tier4_workloads.test.ts` |
| 10 | Curated Perplexity Guide | Direct API key integration, zero OAuth endpoints | Tier 1, 4 | `tests/e2e/tier1_features.test.ts`, `tests/e2e/tier4_workloads.test.ts` |
| 11 | Backend Retrieval Proxy Server | Express proxy on port 3001 with `/api/*` endpoints | Tier 1, 2 | `tests/e2e/tier1_features.test.ts`, `tests/e2e/tier2_boundaries.test.ts` |
| 12 | Vite Proxy Middleware Integration | Local development `/api` routing proxy | Tier 1 | `tests/e2e/tier1_features.test.ts` |
| 13 | SSRF & Security Validation | Loopback, private IP, non-HTTPS rejection | Tier 2 | `tests/e2e/tier2_boundaries.test.ts` |
| 14 | HTML Scraper & Markdown Parser | Cheerio tag stripping & Turndown markdown conversion | Tier 1, 2 | `tests/e2e/tier1_features.test.ts`, `tests/e2e/tier2_boundaries.test.ts` |
| 15 | Mode 1 Curated Fast-Path Triage | Instant resolution (<5ms) for curated apps | Tier 1, 4 | `tests/e2e/tier1_features.test.ts`, `tests/e2e/tier4_workloads.test.ts` |
| 16 | Mode 2 Dynamic Investigator Engine | Unfamiliar app triage, doc extraction, unknown state | Tier 1, 4 | `tests/e2e/tier1_features.test.ts`, `tests/e2e/tier4_workloads.test.ts` |
| 17 | Endpoint URL Sanitizer | Validates HTTPS and rejects `#` fragment anchors | Tier 2 | `tests/e2e/tier2_boundaries.test.ts` |
| 18 | 100-App Catalog Index Dataset | 10 categories, 50/25/25 distribution, 4 review gates | Tier 1 | `tests/e2e/tier1_features.test.ts` |
| 19 | Verification Audit Dataset | Forensic audit logs: tested live, documented, myths | Tier 1 | `tests/e2e/tier1_features.test.ts` |
| 20 | Schema & Taxonomy Unit Tests | Cross-module contract and invariant validation | Tier 1 | `tests/e2e/tier1_features.test.ts` |
| 21 | Modern Glassmorphism Design System | Dark canvas `#090D16`, frosted cards, tokens | Tier 1 | `tests/e2e/tier1_features.test.ts` |
| 22 | Directory View Component | Hero cards, catalog search, filters | Tier 1 | `tests/e2e/tier1_features.test.ts` |
| 23 | Guide Detail View Component | Adaptive layout for OAuth, Direct, and Hybrid | Tier 1, 3 | `tests/e2e/tier1_features.test.ts`, `tests/e2e/tier3_pairwise.test.ts` |
| 24 | ClaimEvidenceBadge & Popover | Interactive popover rendering provenance | Tier 1 | `tests/e2e/tier1_features.test.ts` |
| 25 | EndpointsAndCallbackBox Component | Two isolated visual zones preventing copy-paste error | Tier 1, 2 | `tests/e2e/tier1_features.test.ts`, `tests/e2e/tier2_boundaries.test.ts` |
| 26 | CodeSnippetSpec with Status Badge | Runtime tested vs adapted documentation badges | Tier 1, 3 | `tests/e2e/tier1_features.test.ts`, `tests/e2e/tier3_pairwise.test.ts` |
| 27 | Live Investigator View with Terminal | Real-time terminal progress stream and logs | Tier 1, 4 | `tests/e2e/tier1_features.test.ts`, `tests/e2e/tier4_workloads.test.ts` |
| 28 | Verification Audit View Component | Multi-tab forensic audit matrix | Tier 1 | `tests/e2e/tier1_features.test.ts` |
| 29 | Export Engine (Markdown & JSON) | One-click shareable markdown and JSON export | Tier 1, 4 | `tests/e2e/tier1_features.test.ts`, `tests/e2e/tier4_workloads.test.ts` |
| 30 | Manus MCP Live Webapp Generation | Autonomous live deployment with shareable URL | Tier 1 | `tests/e2e/tier1_features.test.ts` |
| 31 | GitHub Repository Synchronization | Commit and sync verification for target repo | Tier 1 | `tests/e2e/tier1_features.test.ts` |
| 32 | Opaque-Box E2E Test Suite | 4-Tier test execution engine | Tiers 1-4 | `tests/e2e/*` |
| 33 | Adversarial Coverage Hardening | Tier 5 security, fuzzing, and attack vectors | Tier 5 | `tests/e2e/` (future) |

---

## 3. Test Architecture

### 3.1 Test Execution Commands
The project standard test runner is **Vitest** configured for ESM and TypeScript:
```bash
# Run complete E2E test suite
npx vitest run tests/e2e

# Run individual tiers
npx vitest run tests/e2e/tier1_features.test.ts
npx vitest run tests/e2e/tier2_boundaries.test.ts
npx vitest run tests/e2e/tier3_pairwise.test.ts
npx vitest run tests/e2e/tier4_workloads.test.ts

# Run with verbose output and coverage
npx vitest run tests/e2e --reporter=verbose
```

### 3.2 Opaque-Box Test Harness (`tests/e2e/testHarness.ts`)
The harness provides:
1. **Assertion Engine**:
   - `assertClaimEvidence(claim, expectedKind)`: Verifies discriminated union completeness (checks kind-specific properties like `whatWasPerformed`, `sourceUrl`, or `hypothesisBasis`).
   - `assertIsolatedEndpoints(authSpec)`: Verifies that Provider OAuth endpoints and Composio callback guidance are separate and do not cross-contaminate.
   - `assertDirectCredentialOmitsOAuth(guide)`: Validates that non-OAuth paths have zero OAuth endpoint fields.
   - `assertSanitizedUrl(url)`: Validates HTTPS protocol and absence of URL fragments (`#`).
2. **Mock Server & HTTP Fixtures**:
   - In-memory mock server providing realistic HTML and JSON payloads for external developer documentation sites (Slack, Linear, GitHub, Resend, HubSpot, Calendly) allowing tests to run reliably offline or in CI/CD without external network flakiness.
3. **Investigation Runner**:
   - Executes live triage and investigation functions directly or via mock HTTP calls, capturing timing, logs, and generated guides.

---

## 4. 4-Tier Test Methodology

### Tier 1: Feature Coverage (>=5 test cases per feature category)
Validates primary behavior (happy path) for all 32 features defined in `PROJECT.md`:
- **Evidence & Types**: `tested_live`, `documented_not_tested`, `unverified_hypothesis` discrimination, `Traceable<T>`, `isIndependentlyTested`.
- **Auth Models & Specs**: `oauth_required`, `hybrid_oauth_or_direct`, `direct_credential_only`, concrete scheme arrays.
- **5 Curated Guides**: Complete schema conformity, required fields, playbooks, and runbooks for GitHub, Slack, Google, Notion, Perplexity.
- **Backend Proxy & Engine**: Health checks, mode 1 instant triage (<5ms), mode 2 dynamic fallback, Cheerio scraping, Turndown markdown conversion.
- **100-App Catalog & Audit Matrix**: 100 entries, 10 categories, 50% OAuth / 25% Hybrid / 25% Direct, 4 review gate levels (`no_gate`, `conditional_gate`, `mandatory_enterprise_gate`, `unknown`), verification audit logs.
- **Export & UI Specifications**: Export markdown generation, JSON serialization, glassmorphism tokens, and isolated box layouts.

### Tier 2: Boundary & Corner Cases (>=5 test cases per category)
Exercises edge cases, input anomalies, and defensive constraints:
- **Empty & Malformed Inputs**: Empty app names, whitespace-only queries, invalid URLs, non-HTTP protocols (`javascript:`, `file:`, `ftp:`).
- **URL & Redirect URI Boundaries**: Rejection of `#` anchor fragments (e.g. `https://example.com/oauth#token`), IPv4 loopback (`127.0.0.1`), IPv6 loopback (`::1`), link-local metadata addresses (`169.254.169.254`), non-standard ports.
- **Scraping Limits & Timeouts**: Extremely large HTML bodies (>5MB) truncated to 15,000 markdown characters, slow upstream servers exceeding 8s timeout, malformed HTML without standard headers.
- **Unverified Hypothesis Triggers**: Silent documentation without stated setup times triggering `unverified_hypothesis`, unverified review gates triggering *"No review gate identified in the sources checked"*.
- **Composio Managed Auth Unknown State**: Unknown apps defaulting to `composioManagedAuthStatus: "unknown"` rather than guessing.

### Tier 3: Pairwise & Cross-Feature Combinations
Tests interactions between orthogonal features:
- **OAuth Mode + Sensitive/Restricted Scopes**: Combining `oauth_required` with Google Workspace restricted scopes, verifying CASA Tier 2 audit hypothesis attachment, 100-user testing cap, and unapproved scope playbooks.
- **Hybrid Auth + Internal Bot Tokens**: Combining `hybrid_oauth_or_direct` with Notion internal connection, verifying zero-OAuth runbook for single workspace and OAuth runbook for public connection.
- **Direct Credential + Unknown Managed Auth**: Combining `direct_credential_only` with `composioManagedAuthStatus: "unknown"`, verifying banner *"OAuth setup isn't required for this integration path"* while maintaining unknown managed status.
- **Export Engine + Dynamic Live Guide**: Generating Markdown and JSON from an unfamiliar investigated guide (e.g. Linear, Calendly) with provenance popovers and audit logs intact.
- **SDK Code Snippets + Validation Badges**: Combining runtime tested snippets with adapted snippets across Python and TypeScript, ensuring appropriate warning badges.

### Tier 4: Real-World Scenarios & Workloads
Simulates complete end-to-end developer onboarding workflows across 9 representative platforms:
1. **GitHub Onboarding**: Developer evaluates OAuth App vs. GitHub App, reviews default 8-hour token expiry, inspects instant client ID, handles org-level third-party access restrictions.
2. **Slack Onboarding**: Developer registers multi-tenant bot, configures HTTPS redirect URI without `#`, separates bot `scope` from user `user_scope`, handles `invalid_team_for_non_distributed_app`.
3. **Google Workspace Onboarding**: Developer sets up Gmail/Drive automation, navigates Testing status (100 users, 7-day token expiry), reviews CASA Tier 2 assessment costs and audit timeline.
4. **Notion Onboarding**: Developer compares 2-minute internal connection vs. public OAuth, discovers permanent installation scope constraint, notes page-sharing prerequisite (`object_not_found`).
5. **Perplexity Onboarding**: Developer connects search agent via API key, verifies zero OAuth endpoints, reviews header format `Authorization: Bearer <key>`, confirms lack of review gates.
6. **Linear Dynamic Investigation**: Live investigator investigates Linear, identifies OAuth 2.0 with PKCE support, extracts authorization and token endpoints, sets managed auth to unknown.
7. **HubSpot Dynamic Investigation**: Live investigator classifies HubSpot as hybrid (Private Apps vs Public OAuth), extracts endpoints and scopes, highlights portal permissions.
8. **Resend Dynamic Investigation**: Live investigator classifies Resend as direct credential (`API_KEY`), omits OAuth endpoints, sets clear rotation rules.
9. **Calendly Dynamic Investigation**: Live investigator evaluates Calendly OAuth 2.0 flow, identifies organization review requirements, flags unknown review gate timeline as hypothesis.

---

## 5. Verification Gate & Invalidation Conditions

The test suite will be deemed complete and valid when:
1. All test files compile under `tsc --noEmit` without type errors.
2. `npx vitest run tests/e2e` executes all 4 tiers with 100% pass rate.
3. Every test strictly exercises public interfaces and contracts defined in `PROJECT.md`.
4. Any regression in epistemic claim discrimination, endpoint isolation, or URL sanitization immediately causes test failures.
