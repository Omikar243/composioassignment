import { describe, it, expect, beforeAll, vi } from "vitest";
import {
  executeMode1Curated,
  executeMode2Dynamic,
  executeModeBAIAssisted,
  investigateApp,
  stripPrivateReasoningFields,
  validateIntegrationReadinessGuide,
} from "../../src/agent/investigatorEngine";
import {
  OAuthProtocolSpec,
  DirectCredentialSpec,
  HybridAuthSpec,
  IntegrationReadinessGuide,
} from "../../src/types/guide";
import {
  assertClaimEvidence,
  assertIsolatedEndpoints,
  assertDirectCredentialOmitsOAuth,
} from "../e2e/testHarness";
import { resolveDocumentationSourceUrl } from "../../src/utils/investigationInput";

describe("Milestone 2: Investigator Engine & Unfamiliar App Research Suite", () => {
  describe("Investigator documentation URL selection", () => {
    it("prefers a non-empty override over a URL in the primary input", () => {
      expect(
        resolveDocumentationSourceUrl(
          "https://developers.openai.com/api/docs/quickstart",
          " https://platform.openai.com/docs/api-reference/authentication "
        )
      ).toBe("https://platform.openai.com/docs/api-reference/authentication");
    });

    it("uses the URL-first input when no override is provided", () => {
      expect(
        resolveDocumentationSourceUrl(" https://developers.openai.com/api/docs/quickstart ", "  ")
      ).toBe("https://developers.openai.com/api/docs/quickstart");
    });

    it("does not invent a source URL for a plain app-name query without an override", () => {
      expect(resolveDocumentationSourceUrl("OpenAI", "")).toBeUndefined();
    });
  });

  describe("Mode 1: Deterministic Curated Fast-Path (<5ms)", () => {
    it("resolves canonical curated apps instantly with <5ms latency", () => {
      const known = [
        { query: "github", expectedId: "github", expectedPath: "hybrid_oauth_or_direct" },
        { query: "slack", expectedId: "slack", expectedPath: "oauth_required" },
        { query: "google_workspace", expectedId: "google_workspace", expectedPath: "oauth_required" },
        { query: "notion", expectedId: "notion", expectedPath: "hybrid_oauth_or_direct" },
        { query: "perplexity", expectedId: "perplexity", expectedPath: "direct_credential_only" },
      ];

      known.forEach(({ query, expectedId, expectedPath }) => {
        const start = performance.now();
        const guide = executeMode1Curated(query);
        const elapsed = performance.now() - start;

        expect(guide).toBeDefined();
        expect(guide!.appId).toBe(expectedId);
        expect(guide!.readinessSummary.authPathClassification).toBe(expectedPath);
        expect(elapsed).toBeLessThan(5); // <5ms benchmark requirement
      });
    });

    it("resolves domain aliases and common query variants", () => {
      const aliases = [
        { query: "https://github.com", expectedId: "github" },
        { query: "api.slack.com", expectedId: "slack" },
        { query: "Google Workspace", expectedId: "google_workspace" },
        { query: "gmail", expectedId: "google_workspace" },
        { query: "https://notion.so", expectedId: "notion" },
        { query: "https://perplexity.ai", expectedId: "perplexity" },
      ];

      aliases.forEach(({ query, expectedId }) => {
        const guide = executeMode1Curated(query);
        expect(guide).toBeDefined();
        expect(guide!.appId).toBe(expectedId);
      });
    });

    it("returns undefined for unfamiliar / unknown apps in Mode 1", () => {
      expect(executeMode1Curated("Linear")).toBeUndefined();
      expect(executeMode1Curated("HubSpot")).toBeUndefined();
      expect(executeMode1Curated("Resend")).toBeUndefined();
      expect(executeMode1Curated("Calendly")).toBeUndefined();
      expect(executeMode1Curated("UnknownSaaS123")).toBeUndefined();
    });
  });

  describe("Mode 2: Dynamic Heuristic Research for 4 Target Archetypes", () => {
    describe("Archetype 1: Strict OAuth App (Linear)", () => {
      let guide: IntegrationReadinessGuide;

      beforeAll(() => {
        guide = executeMode2Dynamic({
          appName: "Linear",
          websiteUrl: "https://linear.app",
        });
      });

      it("classifies Linear as oauth_required with OAUTH2 scheme", () => {
        expect(guide.readinessSummary.authPathClassification).toBe("oauth_required");
        expect(guide.supportedAuthSchemes.value).toEqual(["OAUTH2"]);
        expect(guide.authSpec.mode).toBe("oauth");
      });

      it("extracts exact documented Linear authorization and token endpoints", () => {
        const spec = guide.authSpec as OAuthProtocolSpec;
        expect(spec.providerEndpoints.authorizationUrl.value).toBe("https://linear.app/oauth/authorize");
        expect(spec.providerEndpoints.tokenUrl.value).toBe("https://api.linear.app/oauth/token");
        expect(spec.pkceRequired.value).toBe("supported_optional");
      });

      it("enforces unknown composioManagedAuthStatus with unverified_hypothesis evidence", () => {
        expect(guide.composioManagedAuthStatus.value).toBe("unknown");
        expect(guide.composioManagedAuthStatus.evidence.kind).toBe("unverified_hypothesis");
        assertClaimEvidence(guide.composioManagedAuthStatus, "unverified_hypothesis");
      });

      it("marks unstated active setup and approval wait times as unverified_hypothesis", () => {
        expect(guide.readinessSummary.activeSetupTime.evidence.kind).toBe("unverified_hypothesis");
        expect(guide.readinessSummary.approvalWaitTime.value).toBe("No review gate identified in the sources checked");
        expect(guide.readinessSummary.approvalWaitTime.evidence.kind).toBe("unverified_hypothesis");
      });

      it("attaches a deterministic decision summary, evidence findings, and unresolved questions", () => {
        expect(guide.investigationAnalysis?.engine).toBe("deterministic_mode2");
        expect(guide.investigationAnalysis?.decision).toBe("oauth_required");
        expect(guide.investigationAnalysis?.findings.length).toBeGreaterThan(0);
        expect(guide.investigationAnalysis?.openQuestions.length).toBeGreaterThan(0);
      });

      it("passes strict isolated endpoints assertion and schema validation", () => {
        assertIsolatedEndpoints(guide.authSpec);
        const report = validateIntegrationReadinessGuide(guide);
        expect(report.isValid).toBe(true);
        expect(report.errors).toHaveLength(0);
      });
    });

    describe("Archetype 2: Hybrid Auth App (HubSpot)", () => {
      let guide: IntegrationReadinessGuide;

      beforeAll(() => {
        guide = executeMode2Dynamic({
          appName: "HubSpot",
          websiteUrl: "https://hubspot.com",
        });
      });

      it("classifies HubSpot as hybrid_oauth_or_direct with OAUTH2 and BEARER_TOKEN", () => {
        expect(guide.readinessSummary.authPathClassification).toBe("hybrid_oauth_or_direct");
        expect(guide.supportedAuthSchemes.value).toEqual(["OAUTH2", "BEARER_TOKEN"]);
        expect(guide.authSpec.mode).toBe("hybrid");
      });

      it("populates both direct credential and OAuth paths in HybridAuthSpec", () => {
        const spec = guide.authSpec as HybridAuthSpec;
        expect(spec.pathDecisionGuide.value).toContain("OAuth setup isn't required for single-account");
        expect(spec.directCredentialPath.mode).toBe("direct_credential");
        expect(spec.directCredentialPath.credentialLabel).toContain("Private App");

        expect(spec.oauthPath.mode).toBe("oauth");
        expect(spec.oauthPath.providerEndpoints.authorizationUrl.value).toBe("https://app.hubspot.com/oauth/authorize");
        expect(spec.oauthPath.providerEndpoints.tokenUrl.value).toBe("https://api.hubapi.com/oauth/v1/token");
      });

      it("strictly isolates provider endpoints from Composio redirect instructions", () => {
        assertIsolatedEndpoints(guide.authSpec);
      });

      it("conforms strictly to IntegrationReadinessGuide schema", () => {
        const report = validateIntegrationReadinessGuide(guide);
        expect(report.isValid).toBe(true);
        expect(report.errors).toHaveLength(0);
      });
    });

    describe("Archetype 3: Direct Credential App (Resend)", () => {
      let guide: IntegrationReadinessGuide;

      beforeAll(() => {
        guide = executeMode2Dynamic({
          appName: "Resend",
          websiteUrl: "https://resend.com",
        });
      });

      it("classifies Resend as direct_credential_only with API_KEY scheme", () => {
        expect(guide.readinessSummary.authPathClassification).toBe("direct_credential_only");
        expect(guide.supportedAuthSchemes.value).toEqual(["API_KEY"]);
        expect(guide.authSpec.mode).toBe("direct_credential");
      });

      it("renders the mandatory 'OAuth setup isn't required for this integration path' banner", () => {
        expect(guide.readinessSummary.oauthNecessityBanner).toContain(
          "OAuth setup isn't required for this integration path"
        );
        const spec = guide.authSpec as DirectCredentialSpec;
        expect(spec.whyOAuthIsNotRequired).toContain(
          "OAuth setup isn't required for this integration path"
        );
      });

      it("ensures zero OAuth endpoints are leaked in DirectCredentialSpec", () => {
        assertDirectCredentialOmitsOAuth(guide);
      });

      it("keeps unverified direct-credential review gates explicitly unknown", () => {
        expect(guide.readinessSummary.approvalWaitTime.value).toContain("Unknown");
        expect(guide.readinessSummary.approvalWaitTime.evidence.kind).toBe("unverified_hypothesis");
      });

      it("conforms strictly to IntegrationReadinessGuide schema", () => {
        const report = validateIntegrationReadinessGuide(guide);
        expect(report.isValid).toBe(true);
        expect(report.errors).toHaveLength(0);
      });
    });

    describe("Archetype 4: Unfamiliar SaaS Dynamic App (Calendly)", () => {
      let guide: IntegrationReadinessGuide;

      beforeAll(() => {
        guide = executeMode2Dynamic({
          appName: "Calendly",
          websiteUrl: "https://developer.calendly.com",
        });
      });

      it("dynamically resolves Calendly as oauth_required", () => {
        expect(guide.readinessSummary.authPathClassification).toBe("oauth_required");
        expect(guide.supportedAuthSchemes.value).toEqual(["OAUTH2"]);
      });

      it("extracts Calendly authorization and token endpoints", () => {
        const spec = guide.authSpec as OAuthProtocolSpec;
        expect(spec.providerEndpoints.authorizationUrl.value).toBe("https://auth.calendly.com/oauth/authorize");
        expect(spec.providerEndpoints.tokenUrl.value).toBe("https://auth.calendly.com/oauth/token");
      });

      it("sets composioManagedAuthStatus to unknown with unverified_hypothesis", () => {
        expect(guide.composioManagedAuthStatus.value).toBe("unknown");
        expect(guide.composioManagedAuthStatus.evidence.kind).toBe("unverified_hypothesis");
      });

      it("sets approval wait time to 'No review gate identified in the sources checked'", () => {
        expect(guide.readinessSummary.approvalWaitTime.value).toBe("No review gate identified in the sources checked");
        expect(guide.readinessSummary.approvalWaitTime.evidence.kind).toBe("unverified_hypothesis");
      });

      it("conforms strictly to IntegrationReadinessGuide schema", () => {
        const report = validateIntegrationReadinessGuide(guide);
        expect(report.isValid).toBe(true);
        expect(report.errors).toHaveLength(0);
      });
    });

    describe("Arbitrary Unfamiliar App with Documentation Text Input", () => {
    it("extracts endpoints and PKCE from arbitrary documentation content", () => {
        const sampleDoc = `
          # Acme Developer API
          Acme uses standard OAuth 2.0.
          To authorize users, redirect to https://acme.io/oauth2/authorize
          Then exchange your authorization_code at https://acme.io/oauth2/token
          We recommend using code_challenge and PKCE for enhanced security.
        `;

        const guide = executeMode2Dynamic({
          appName: "Acme",
          websiteUrl: "https://acme.io",
          docContent: sampleDoc,
        });

        expect(guide.readinessSummary.authPathClassification).toBe("oauth_required");
        const spec = guide.authSpec as OAuthProtocolSpec;
        expect(spec.providerEndpoints.authorizationUrl.value).toBe("https://acme.io/oauth2/authorize");
        expect(spec.providerEndpoints.tokenUrl.value).toBe("https://acme.io/oauth2/token");
        expect(spec.pkceRequired.value).toBe("supported_optional");
        expect(validateIntegrationReadinessGuide(guide).isValid).toBe(true);
      });

      it("does not invent copyable endpoints when the source contains no endpoint", () => {
        const guide = executeMode2Dynamic({
          appName: "Unknown SaaS",
          websiteUrl: "https://unknown.example",
          docContent: "This documentation does not yet describe an OAuth authorization or token endpoint.",
        });

        const spec = guide.authSpec as OAuthProtocolSpec;
        expect(spec.providerEndpoints.authorizationUrl.value).toBe("Not identified in retrieved documentation");
        expect(spec.providerEndpoints.tokenUrl.value).toBe("Not identified in retrieved documentation");
        expect(spec.providerEndpoints.authorizationUrl.evidence.kind).toBe("unverified_hypothesis");
        expect(validateIntegrationReadinessGuide(guide).isValid).toBe(true);
      });
    });
  });

  describe("Mode B: AI-Assisted Research & Deterministic Fallback", () => {
    it("strips private reasoning fields without removing the public evidence summary", () => {
      const sanitized = stripPrivateReasoningFields({
        analysis: "private model trace",
        reasoning: "private model trace",
        chain_of_thought: "private model trace",
        investigationAnalysis: { decisionSummary: "Public evidence-linked summary" },
        nested: { thoughts: "private model trace", keep: "retained" },
      });
      expect(sanitized.removedCount).toBe(4);
      expect(sanitized.value).toEqual({
        investigationAnalysis: { decisionSummary: "Public evidence-linked summary" },
        nested: { keep: "retained" },
      });
    });

    it("bypasses retries on Gemini 503 and falls back to deterministic research", async () => {
      const originalGemini = process.env.GEMINI_API_KEY;
      const originalGroq = process.env.GROQ_API_KEY;
      const originalOpenAI = process.env.OPENAI_API_KEY;
      process.env.GEMINI_API_KEY = "test-gemini-key";
      delete process.env.GROQ_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const fetchMock = vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "temporarily overloaded" } }), {
          status: 503,
          headers: { "Retry-After": "0" },
        }));

      try {
        const result = await executeModeBAIAssisted({
          appName: "Linear",
          websiteUrl: "https://linear.app",
          docContent: "OAuth documentation",
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(result.modeUsed).toBe("heuristic_research");
        expect(result.logs.some((log) => log.includes("HTTP 503") && log.includes("Skipping retries"))).toBe(true);
      } finally {
        fetchMock.mockRestore();
        if (originalGemini === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalGemini;
        if (originalGroq === undefined) delete process.env.GROQ_API_KEY;
        else process.env.GROQ_API_KEY = originalGroq;
        if (originalOpenAI === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = originalOpenAI;
      }
    });

    it("uses Groq after Gemini returns HTTP 503", async () => {
      const originalGemini = process.env.GEMINI_API_KEY;
      const originalGroq = process.env.GROQ_API_KEY;
      const originalOpenAI = process.env.OPENAI_API_KEY;
      process.env.GEMINI_API_KEY = "test-gemini-key";
      process.env.GROQ_API_KEY = "test-groq-key";
      delete process.env.OPENAI_API_KEY;

      const guide = executeMode2Dynamic({
        appName: "Linear",
        websiteUrl: "https://linear.app",
        docContent: "OAuth documentation",
      });
      const fetchMock = vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "temporarily overloaded" } }), {
          status: 503,
          headers: { "Retry-After": "0" },
        }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          choices: [{ message: { content: JSON.stringify(guide) } }],
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));

      try {
        const result = await executeModeBAIAssisted({
          appName: "Linear",
          websiteUrl: "https://linear.app",
          docContent: "OAuth documentation",
        });

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock.mock.calls[1][0]).toBe("https://api.groq.com/openai/v1/chat/completions");
        const requestInit = fetchMock.mock.calls[1][1] as RequestInit;
        const requestBody = JSON.parse(String(requestInit.body));
        expect(requestBody.model).toBe("openai/gpt-oss-20b");
        expect(requestBody.response_format.type).toBe("json_schema");
        expect(requestBody.response_format.json_schema.name).toBe("oauth_readiness_extraction");
        expect(requestBody.response_format.json_schema.strict).toBe(true);
        expect((requestInit.headers as Record<string, string>).Authorization).toBe("Bearer test-groq-key");
        expect(result.modeUsed).toBe("ai_assisted");
        expect(result.guide.investigationAnalysis?.engine).toBe("groq_mode_b");
        expect(result.logs.some((log) => log.includes("HTTP 503") && log.includes("Skipping retries"))).toBe(true);
        expect(result.logs.some((log) => log.includes("Querying Groq API"))).toBe(true);
        expect(result.logs.join(" ")).not.toContain("test-groq-key");
      } finally {
        fetchMock.mockRestore();
        if (originalGemini === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalGemini;
        if (originalGroq === undefined) delete process.env.GROQ_API_KEY;
        else process.env.GROQ_API_KEY = originalGroq;
        if (originalOpenAI === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = originalOpenAI;
      }
    });

    it("can use Groq as the only configured Mode B provider", async () => {
      const originalGemini = process.env.GEMINI_API_KEY;
      const originalGroq = process.env.GROQ_API_KEY;
      const originalOpenAI = process.env.OPENAI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      process.env.GROQ_API_KEY = "test-groq-key";
      delete process.env.OPENAI_API_KEY;

      const guide = executeMode2Dynamic({
        appName: "Linear",
        websiteUrl: "https://linear.app",
        docContent: "OAuth documentation",
      });
      const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify(guide) } }],
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }));

      try {
        const result = await executeModeBAIAssisted({
          appName: "Linear",
          websiteUrl: "https://linear.app",
          docContent: "OAuth documentation",
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(result.modeUsed).toBe("ai_assisted");
        expect(result.guide.investigationAnalysis?.engine).toBe("groq_mode_b");
      } finally {
        fetchMock.mockRestore();
        if (originalGemini === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalGemini;
        if (originalGroq === undefined) delete process.env.GROQ_API_KEY;
        else process.env.GROQ_API_KEY = originalGroq;
        if (originalOpenAI === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = originalOpenAI;
      }
    });

    it("hydrates a compact Groq extraction into a schema-valid AI-assisted guide", async () => {
      const originalGemini = process.env.GEMINI_API_KEY;
      const originalGroq = process.env.GROQ_API_KEY;
      const originalOpenAI = process.env.OPENAI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      process.env.GROQ_API_KEY = "test-groq-key";
      delete process.env.OPENAI_API_KEY;

      const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({
          authPathClassification: "oauth_required",
          supportedAuthSchemes: ["OAUTH2"],
          authorizationUrl: "https://nebula.example/oauth/authorize",
          tokenUrl: "https://nebula.example/oauth/token",
          pkceRequired: "supported_optional",
          rationale: "OAuth endpoints are stated in the supplied documentation.",
          openQuestions: ["Confirm provider review requirements."],
        }) } }],
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }));

      try {
        const result = await executeModeBAIAssisted({
          appName: "Nebula",
          docContent: "Authorization endpoint: https://nebula.example/oauth/authorize. Token endpoint: https://nebula.example/oauth/token.",
        });

        expect(result.modeUsed).toBe("ai_assisted");
        expect(result.guide.investigationAnalysis?.engine).toBe("groq_mode_b");
        expect((result.guide.authSpec as OAuthProtocolSpec).providerEndpoints.authorizationUrl.value)
          .toBe("https://nebula.example/oauth/authorize");
        expect(validateIntegrationReadinessGuide(result.guide).isValid).toBe(true);
      } finally {
        fetchMock.mockRestore();
        if (originalGemini === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalGemini;
        if (originalGroq === undefined) delete process.env.GROQ_API_KEY;
        else process.env.GROQ_API_KEY = originalGroq;
        if (originalOpenAI === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = originalOpenAI;
      }
    });

    it("aborts a Gemini request after twelve seconds", async () => {
      const originalGemini = process.env.GEMINI_API_KEY;
      const originalGroq = process.env.GROQ_API_KEY;
      const originalOpenAI = process.env.OPENAI_API_KEY;
      process.env.GEMINI_API_KEY = "test-gemini-key";
      delete process.env.GROQ_API_KEY;
      delete process.env.OPENAI_API_KEY;
      vi.useFakeTimers();

      const guide = executeMode2Dynamic({
        appName: "Linear",
        websiteUrl: "https://linear.app",
        docContent: "OAuth documentation",
      });
      let requestSignal: AbortSignal | undefined;
      const fetchMock = vi.spyOn(globalThis, "fetch")
        .mockImplementationOnce((_input, init) => new Promise<Response>((_resolve, reject) => {
          requestSignal = init?.signal || undefined;
          requestSignal?.addEventListener(
            "abort",
            () => reject(new DOMException("The operation was aborted.", "AbortError")),
            { once: true }
          );
        }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify(guide) }] } }],
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));

      try {
        const resultPromise = executeModeBAIAssisted({
          appName: "Linear",
          websiteUrl: "https://linear.app",
          docContent: "OAuth documentation",
        });

        await vi.advanceTimersByTimeAsync(12_000);
        expect(requestSignal?.aborted).toBe(true);
        await vi.advanceTimersByTimeAsync(1_000);
        const result = await resultPromise;

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(result.modeUsed).toBe("ai_assisted");
      } finally {
        fetchMock.mockRestore();
        vi.useRealTimers();
        if (originalGemini === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalGemini;
        if (originalGroq === undefined) delete process.env.GROQ_API_KEY;
        else process.env.GROQ_API_KEY = originalGroq;
        if (originalOpenAI === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = originalOpenAI;
      }
    });

    it("retries once after a Gemini request timeout", async () => {
      const originalGemini = process.env.GEMINI_API_KEY;
      const originalGroq = process.env.GROQ_API_KEY;
      const originalOpenAI = process.env.OPENAI_API_KEY;
      process.env.GEMINI_API_KEY = "test-gemini-key";
      delete process.env.GROQ_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const guide = executeMode2Dynamic({
        appName: "Linear",
        websiteUrl: "https://linear.app",
        docContent: "OAuth documentation",
      });
      const fetchMock = vi.spyOn(globalThis, "fetch")
        .mockRejectedValueOnce(new Error("simulated request timeout"))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify(guide) }] } }],
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));

      try {
        const result = await executeModeBAIAssisted({
          appName: "Linear",
          websiteUrl: "https://linear.app",
          docContent: "OAuth documentation",
        });

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(result.modeUsed).toBe("ai_assisted");
        expect(result.logs.some((log) => log.includes("network/request error on attempt 1/2"))).toBe(true);
      } finally {
        fetchMock.mockRestore();
        if (originalGemini === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalGemini;
        if (originalGroq === undefined) delete process.env.GROQ_API_KEY;
        else process.env.GROQ_API_KEY = originalGroq;
        if (originalOpenAI === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = originalOpenAI;
      }
    });

    it("gracefully falls back to deterministic research when no API keys are configured", async () => {
      const originalGemini = process.env.GEMINI_API_KEY;
      const originalGroq = process.env.GROQ_API_KEY;
      const originalOpenAI = process.env.OPENAI_API_KEY;

      delete process.env.GEMINI_API_KEY;
      delete process.env.GROQ_API_KEY;
      delete process.env.OPENAI_API_KEY;

      try {
        const result = await executeModeBAIAssisted({
          appName: "Linear",
          websiteUrl: "https://linear.app",
        });

        expect(result.guide).toBeDefined();
        expect(result.guide.appName).toBe("Linear");
        expect(result.modeUsed).toBe("heuristic_research");
        expect(result.guide.investigationAnalysis?.engine).toBe("deterministic_mode2");
        expect(result.logs.some((l) => l.includes("deterministic"))).toBe(true);
        expect(validateIntegrationReadinessGuide(result.guide).isValid).toBe(true);
      } finally {
        if (originalGemini) process.env.GEMINI_API_KEY = originalGemini;
        if (originalGroq) process.env.GROQ_API_KEY = originalGroq;
        if (originalOpenAI) process.env.OPENAI_API_KEY = originalOpenAI;
      }
    });
  });

  describe("Unified investigateApp Entrypoint", () => {
    it("routes curated queries to Mode 1 fast-path", async () => {
      const res = await investigateApp({ appName: "Slack" });
      expect(res.modeUsed).toBe("curated_fast_path");
      expect(res.guide.appId).toBe("slack");
      expect(res.logs[0]).toContain("Mode 1 Fast-Path");
    });

    it("routes unfamiliar apps to Mode 2 dynamic research", async () => {
      const res = await investigateApp({ appName: "Linear", websiteUrl: "https://linear.app" });
      expect(res.modeUsed).toBe("heuristic_research");
      expect(res.guide.appName).toBe("Linear");
      expect(res.guide.composioManagedAuthStatus.value).toBe("unknown");
      expect((res.guide.authSpec as OAuthProtocolSpec).providerEndpoints.authorizationUrl.evidence.kind)
        .toBe("unverified_hypothesis");
    });

    it("retains Documented only when the exact claim is present in supplied source text", async () => {
      const res = await investigateApp({
        appName: "Linear",
        websiteUrl: "https://linear.app",
        docContent: "Authorization endpoint: https://linear.app/oauth/authorize",
      });
      expect((res.guide.authSpec as OAuthProtocolSpec).providerEndpoints.authorizationUrl.evidence.kind)
        .toBe("documented_not_tested");
    });

    it("supports forceMode='dynamic_only' to bypass curated fast-path", async () => {
      const res = await investigateApp({
        appName: "Slack",
        forceMode: "dynamic_only",
      });
      expect(res.modeUsed).toBe("heuristic_research");
      expect(res.guide.composioManagedAuthStatus.value).toBe("unknown");
    });
  });

  describe("Schema Validator Negative Tests", () => {
    it("detects and rejects missing required fields", () => {
      const invalidGuide = { appId: "" };
      const report = validateIntegrationReadinessGuide(invalidGuide);
      expect(report.isValid).toBe(false);
      expect(report.errors.length).toBeGreaterThan(0);
    });

    it("rejects DirectCredentialSpec that leaks OAuth endpoints", () => {
      const guide = executeMode2Dynamic({ appName: "Resend" });
      // Maliciously inject providerEndpoints into direct credential spec
      (guide.authSpec as any).providerEndpoints = {
        authorizationUrl: { value: "https://leaked.com", evidence: { kind: "unverified_hypothesis" } },
      };

      const report = validateIntegrationReadinessGuide(guide);
      expect(report.isValid).toBe(false);
      expect(report.errors.some((e) => e.includes("must not contain providerEndpoints"))).toBe(true);
    });

    it("rejects OAuth spec that contains Composio callback URLs in provider endpoints", () => {
      const guide = executeMode2Dynamic({ appName: "Linear" });
      (guide.authSpec as OAuthProtocolSpec).providerEndpoints.authorizationUrl.value =
        "https://backend.composio.dev/api/v3/toolkits/auth/callback";

      const report = validateIntegrationReadinessGuide(guide);
      expect(report.isValid).toBe(false);
      expect(report.errors.some((e) => e.includes("isolation violation"))).toBe(true);
    });
  });
});
