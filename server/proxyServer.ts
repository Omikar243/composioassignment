/**
 * server/proxyServer.ts
 * SSRF-Protected Retrieval Server & Dual-Mode Investigator Engine Backend
 *
 * Implements:
 * - Express server on port 3001 with cors and express.json()
 * - GET /api/health
 * - POST /api/retrieve with SSRF guards, 8s timeout, Cheerio HTML sanitization, Turndown Markdown, 15k char budget
 * - POST /api/investigate supporting Mode 1 fast-path, Mode 2 dynamic research, Mode B AI-assisted research
 */

import express, { Request, Response } from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import TurndownService from "turndown";
import { validateSsrfTarget, validateSsrfTargetWithDns } from "../src/agent/sanitizer.js";
import type { AuthPathClassification, CatalogAuthBaseline, ConcreteAuthScheme } from "../src/types/guide.js";
import {
  enforceDocumentEvidence,
  investigateApp,
  synchronizeInvestigationAnalysis,
  TrustedSourceMetadata,
  validateIntegrationReadinessGuide,
} from "../src/agent/investigatorEngine.js";
import { selectInvestigationSource } from "../src/utils/investigationSource.js";
import { WebDiscoveryPipeline } from "../src/agent/searchDiscovery.js";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// In-memory cache for retrieved documentation (1 hour TTL)
interface CacheEntry {
  title: string;
  markdown: string;
  characterCount: number;
  finalUrl: string;
  cachedAt: number;
}
const retrievalCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_ENTRIES = 100;
const MAX_RESPONSE_BYTES = 1_500_000;

// Initialize TurndownService
const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "_",
});

// Configure Turndown rules: remove script, style, nav, etc. in case raw tags leak
turndown.remove(["script", "style", "noscript", "iframe", "svg", "button", "nav", "footer", "header", "aside"] as any);

// Preserve code blocks inside <pre> with language class and formatting
turndown.addRule("preserveFencedCodeBlocks", {
  filter: (node) => node.nodeName === "PRE" || node.nodeName === "pre",
  replacement: (content, node) => {
    const el = node as any;
    const rawText = el.textContent ?? content ?? "";
    const text = String(rawText).replace(/\r\n/g, "\n").trim();
    const preClass = typeof el.getAttribute === "function" ? (el.getAttribute("class") || "") : (el.className || "");
    let codeClass = "";
    if (typeof el.querySelector === "function") {
      const codeChild = el.querySelector("code");
      if (codeChild) {
        codeClass = typeof codeChild.getAttribute === "function" ? (codeChild.getAttribute("class") || "") : (codeChild.className || "");
      }
    } else if (Array.isArray(el.childNodes)) {
      const codeChild = el.childNodes.find((c: any) => c.nodeName === "CODE" || c.nodeName === "code");
      if (codeChild) {
        codeClass = typeof codeChild.getAttribute === "function" ? (codeChild.getAttribute("class") || "") : (codeChild.className || "");
      }
    }
    const match = `${codeClass} ${preClass}`.match(/language-([a-zA-Z0-9_\-]+)/i);
    const language = match ? match[1] : "";
    return `\n\n\`\`\`${language}\n${text}\n\`\`\`\n\n`;
  },
});

class ResponseTooLargeError extends Error {
  constructor() {
    super(`Target response exceeded the ${MAX_RESPONSE_BYTES.toLocaleString()} byte limit`);
    this.name = "ResponseTooLargeError";
  }
}

async function readResponseTextWithinBudget(response: globalThis.Response): Promise<string> {
  // Lightweight mocked responses used by the unit suite may not expose a stream.
  // Real fetch responses do, so production reads are bounded before parsing HTML.
  if (!response.body || typeof response.body.getReader !== "function") {
    return response.text();
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let bytesRead = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new ResponseTooLargeError();
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return chunks.join("");
  } finally {
    reader.releaseLock();
  }
}

// ============================================================================
// Route 1: GET /api/health
// ============================================================================
export function handleHealth(_req: Request, res: Response) {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "composio-oauth-readiness-proxy",
    uptimeSeconds: Math.floor(process.uptime()),
  });
}
app.get("/api/health", handleHealth);

// ============================================================================
// Internal Helper: Fetch and Clean Documentation
// ============================================================================
export async function fetchAndCleanDoc(targetUrl: string): Promise<{
  success: boolean;
  status?: string;
  title: string;
  markdown: string;
  finalUrl: string;
  characterCount: number;
  cached: boolean;
  error?: string;
  httpStatus?: number;
}> {
  // 1. SSRF Guard
  const ssrfCheck = await validateSsrfTargetWithDns(targetUrl, { skipDnsInTest: true });
  if (!ssrfCheck.isValid || !ssrfCheck.allowed) {
    return {
      success: false,
      title: "",
      markdown: "",
      finalUrl: targetUrl,
      characterCount: 0,
      cached: false,
      error: ssrfCheck.error || "SSRF validation failed: destination disallowed",
      httpStatus: 400,
    };
  }

  // 2. Cache Check
  const cached = retrievalCache.get(targetUrl);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return {
      success: true,
      title: cached.title,
      markdown: cached.markdown,
      finalUrl: cached.finalUrl,
      characterCount: cached.characterCount,
      cached: true,
    };
  }

  // 3. HTTP Outbound Fetch with 8s Timeout & Browser Headers
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const requestHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 ComposioOAuthReadinessBot/1.0",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
    };

    let currentUrl = targetUrl;
    let response: globalThis.Response | undefined;
    const maxRedirects = 4;
    for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
      const hopSsrf = await validateSsrfTargetWithDns(currentUrl, { skipDnsInTest: true });
      if (!hopSsrf.isValid || !hopSsrf.allowed) {
        return {
          success: false,
          title: "",
          markdown: "",
          finalUrl: currentUrl,
          characterCount: 0,
          cached: false,
          error: "Redirect target violated SSRF security guard",
          httpStatus: 400,
        };
      }

      response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: "manual",
        headers: requestHeaders,
      });

      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      if (redirectCount === maxRedirects) {
        return {
          success: false,
          title: "",
          markdown: "",
          finalUrl: currentUrl,
          characterCount: 0,
          cached: false,
          error: `Too many redirects (maximum ${maxRedirects})`,
          httpStatus: 508,
        };
      }

      const location = response.headers.get("location");
      if (!location) {
        return {
          success: false,
          title: "",
          markdown: "",
          finalUrl: currentUrl,
          characterCount: 0,
          cached: false,
          error: "Target returned a redirect without a Location header",
          httpStatus: 502,
        };
      }

      try {
        currentUrl = new URL(location, currentUrl).toString();
      } catch {
        return {
          success: false,
          title: "",
          markdown: "",
          finalUrl: currentUrl,
          characterCount: 0,
          cached: false,
          error: "Target returned an invalid redirect Location header",
          httpStatus: 502,
        };
      }
    }

    if (!response) throw new Error("Target returned no response");
    clearTimeout(timeoutId);

    // Guard against post-redirect SSRF (redirected to internal IP)
    const finalUrl = response.url || currentUrl;
    const finalSsrf = validateSsrfTarget(finalUrl);
    if (!finalSsrf.isValid || !finalSsrf.allowed) {
      return {
        success: false,
        title: "",
        markdown: "",
        finalUrl,
        characterCount: 0,
        cached: false,
        error: "Redirect target violated SSRF security guard",
        httpStatus: 400,
      };
    }

    // Bot detection / Cloudflare interception check
    if (response.status === 403 || response.status === 503) {
      const text = await response.text();
      if (/cloudflare|cf-ray|just a moment|bot protection|turnstile/i.test(text)) {
        return {
          success: false,
          status: "scrape_blocked",
          title: "Scrape Blocked",
          markdown: "",
          finalUrl,
          characterCount: 0,
          cached: false,
          error: "Target returned HTTP 403/503 (Cloudflare/Bot detection)",
          httpStatus: 403,
        };
      }
    }

    if (!response.ok) {
      return {
        success: false,
        title: "",
        markdown: "",
        finalUrl,
        characterCount: 0,
        cached: false,
        error: `Target server returned HTTP ${response.status}: ${response.statusText}`,
        httpStatus: response.status,
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("application/xhtml")
    ) {
      return {
        success: false,
        title: "",
        markdown: "",
        finalUrl,
        characterCount: 0,
        cached: false,
        error: `Invalid content type: '${contentType}'. Only HTML and text documents can be retrieved.`,
        httpStatus: 400,
      };
    }

    const rawHtml = await readResponseTextWithinBudget(response);

    // 4. Cheerio DOM Sanitization
    const $ = cheerio.load(rawHtml);

    // Strip non-content / boilerplate elements
    $(
      "script, style, nav, footer, header, aside, noscript, svg, iframe, form, button, .cookie-banner, .advertisement, #onetrust-consent-sdk"
    ).remove();

    // Extract Title
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text().trim() ||
      new URL(targetUrl).hostname;

    // Isolate Main Semantic Container
    const mainHtml =
      $("main").html() ||
      $("article").html() ||
      $('[role="main"]').html() ||
      $(".documentation").html() ||
      $(".markdown-body").html() ||
      $(".docs-content").html() ||
      $(".content").html() ||
      $("body").html() ||
      "";

    // 5. Convert to Markdown via Turndown
    let markdown = turndown.turndown(mainHtml).trim();

    // 6. Enforce 15,000 Character Budget with balanced code fences
    if (markdown.length > 15000) {
      let truncated = markdown.substring(0, 15000);
      const fenceCount = (truncated.match(/```/g) || []).length;
      if (fenceCount % 2 !== 0) {
        truncated += "\n```";
      }
      markdown =
        truncated +
        "\n\n[Content truncated to 15,000 character budget...]";
    }

    const entry: CacheEntry = {
      title,
      markdown,
      characterCount: markdown.length,
      finalUrl,
      cachedAt: Date.now(),
    };
    while (retrievalCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = retrievalCache.keys().next().value;
      if (!oldestKey) break;
      retrievalCache.delete(oldestKey);
    }
    retrievalCache.set(targetUrl, entry);

    return {
      success: true,
      title,
      markdown,
      finalUrl,
      characterCount: markdown.length,
      cached: false,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "ResponseTooLargeError") {
      return {
        success: false,
        title: "",
        markdown: "",
        finalUrl: targetUrl,
        characterCount: 0,
        cached: false,
        error: err.message,
        httpStatus: 413,
      };
    }
    if (err.name === "AbortError" || err.message?.includes("aborted")) {
      return {
        success: false,
        title: "",
        markdown: "",
        finalUrl: targetUrl,
        characterCount: 0,
        cached: false,
        error: "Request timed out after 8000ms",
        httpStatus: 504,
      };
    }
    return {
      success: false,
      title: "",
      markdown: "",
      finalUrl: targetUrl,
      characterCount: 0,
      cached: false,
      error: `Network retrieval failed: ${err.message}`,
      httpStatus: 502,
    };
  }
}

// ============================================================================
// Route 2: POST /api/retrieve
// ============================================================================
export async function handleRetrieve(req: Request, res: Response) {
  const { url } = req.body;

  if (!url || typeof url !== "string") {
    res.status(400).json({
      success: false,
      error: "Missing or invalid 'url' in request body",
    });
    return;
  }

  const result = await fetchAndCleanDoc(url);

  if (!result.success) {
    res.status(result.httpStatus || 400).json({
      success: false,
      url,
      error: result.error,
      status: result.status,
    });
    return;
  }

  res.json({
    success: true,
    url,
    finalUrl: result.finalUrl,
    title: result.title,
    markdown: result.markdown,
    characterCount: result.characterCount,
    charCount: result.characterCount,
    cached: result.cached,
    fetchedAt: new Date().toISOString(),
  });
}
app.post("/api/retrieve", handleRetrieve);

// ============================================================================
// Route 3: POST /api/investigate
// ============================================================================
export async function handleInvestigate(req: Request, res: Response) {
  const { appName, websiteUrl, userOverrideUrl, mode, forceMode, docContent, catalogBaseline } = req.body;

  if (!appName || typeof appName !== "string" || appName.trim() === "") {
    res.status(400).json({
      success: false,
      error: "Missing or invalid 'appName' parameter",
    });
    return;
  }

  try {
    let resolvedDocContent = typeof docContent === "string" ? docContent : undefined;
    let trustedServerSource: TrustedSourceMetadata | undefined;
    let effectiveForceMode = forceMode || "auto";
    const retrievalLogs: string[] = [];
    const evidenceLogs: string[] = [];

    // 1. Authoritative Investigation Source Selection
    let sourceSelection = selectInvestigationSource({
      userOverrideUrl: typeof userOverrideUrl === "string" ? userOverrideUrl : undefined,
      catalogAuthDocUrl: typeof catalogBaseline?.authDocUrl === "string" ? catalogBaseline.authDocUrl : undefined,
      websiteUrl: typeof websiteUrl === "string" ? websiteUrl : undefined,
    });

    // If no explicit source and no caller-supplied doc content, run web discovery pipeline
    if (sourceSelection.sourceType === "none" && !resolvedDocContent) {
      const discoveryPipeline = new WebDiscoveryPipeline();
      const discovered = await discoveryPipeline.discover({
        appName: appName.trim(),
        websiteUrl: typeof websiteUrl === "string" ? websiteUrl.trim() : undefined,
      });
      if (discovered) {
        retrievalLogs.push(
          `[DISCOVERY] Discovered documentation via ${discovered.sourceProvider}: ${discovered.url} (confidence score: ${discovered.confidenceScore}).`
        );
        sourceSelection = {
          sourceType: "discovered_url",
          url: discovered.url,
          isOverride: false,
          notes: `Discovered documentation via ${discovered.sourceProvider}`,
        };
      }
    }

    // 2. Strict Override Precedence & Isolation Branch
    if (sourceSelection.sourceType === "user_override") {
      const overrideUrl = sourceSelection.url!;
      retrievalLogs.push(`[TRIAGE] Selected source: user_override (${overrideUrl})`);
      effectiveForceMode = "dynamic_only";

      const ssrfCheck = await validateSsrfTargetWithDns(overrideUrl, { skipDnsInTest: true });
      if (!ssrfCheck.isValid || !ssrfCheck.allowed) {
        res.status(400).json({
          success: false,
          retrievalStatus: "failed",
          selectedSource: sourceSelection,
          error: `Override URL validation failed: ${ssrfCheck.error}`,
          logs: [
            ...retrievalLogs,
            `[SECURITY] Override URL validation failed: ${ssrfCheck.error}`,
            `[OVERRIDE] Isolated failure: fallback to catalog/registry is strictly prohibited.`,
          ],
          appName: appName.trim(),
          authPathClassification: "undetermined",
        });
        return;
      }

      const retrieval = await fetchAndCleanDoc(overrideUrl);
      if (!retrieval.success) {
        res.status(retrieval.httpStatus || 502).json({
          success: false,
          retrievalStatus: "failed",
          selectedSource: sourceSelection,
          error: `Override URL retrieval failed: ${retrieval.error}`,
          logs: [
            ...retrievalLogs,
            `[PROXY] Retrieval failed: ${retrieval.error}`,
            `[OVERRIDE] Isolated failure: fallback to catalog/registry is strictly prohibited.`,
          ],
          appName: appName.trim(),
          authPathClassification: "undetermined",
        });
        return;
      }

      resolvedDocContent = retrieval.markdown;
      trustedServerSource = {
        text: retrieval.markdown,
        url: retrieval.finalUrl,
        title: retrieval.title,
      };
      retrievalLogs.push(
        `[PROXY] Retrieved ${retrieval.title || "override documentation"} from ${retrieval.finalUrl} (${retrieval.characterCount} characters${retrieval.cached ? ", cached" : ""}).`
      );
    } else if (sourceSelection.url) {
      // Non-override: Catalog auth doc, discovered URL, or website URL
      const retrieval = await fetchAndCleanDoc(sourceSelection.url);
      if (retrieval.success) {
        resolvedDocContent = retrieval.markdown;
        trustedServerSource = {
          text: retrieval.markdown,
          url: retrieval.finalUrl,
          title: retrieval.title,
        };
        retrievalLogs.push(
          `[PROXY] Retrieved ${retrieval.title || "provider documentation"} from ${retrieval.finalUrl} (${retrieval.characterCount} characters${retrieval.cached ? ", cached" : ""}).`
        );
      } else {
        const reason = (retrieval.error || "unknown retrieval error").slice(0, 240);
        retrievalLogs.push(
          `[PROXY] Live documentation retrieval failed: ${reason}. No server-verified source text was added; unsupported generated evidence will remain Hypothesis.`
        );
      }
    } else if (resolvedDocContent) {
      retrievalLogs.push(
        "[PROXY] Caller-supplied documentation text is treated as unverified input; it cannot establish Documented evidence without a matching server-retrieved source."
      );
    }

    const validAuthPaths: AuthPathClassification[] = [
      "oauth_required",
      "hybrid_oauth_or_direct",
      "direct_credential_only",
      "undetermined",
    ];
    const validSchemes: ConcreteAuthScheme[] = ["OAUTH2", "OAUTH1", "API_KEY", "BEARER_TOKEN", "BASIC_AUTH"];
    const resolvedCatalogBaseline: CatalogAuthBaseline | undefined =
      catalogBaseline && typeof catalogBaseline === "object" &&
      validAuthPaths.includes(catalogBaseline.authPath) &&
      Array.isArray(catalogBaseline.supportedAuthSchemes)
        ? {
            authPath: catalogBaseline.authPath,
            supportedAuthSchemes: catalogBaseline.supportedAuthSchemes.filter(
              (scheme: unknown): scheme is ConcreteAuthScheme => validSchemes.includes(scheme as ConcreteAuthScheme)
            ),
            ...(typeof catalogBaseline.authDocUrl === "string" ? { authDocUrl: catalogBaseline.authDocUrl } : {}),
          }
        : undefined;

    const targetUrl = trustedServerSource?.url || sourceSelection.url || (typeof websiteUrl === "string" ? websiteUrl.trim() : undefined);

    const result = await investigateApp({
      appName: appName.trim(),
      websiteUrl: targetUrl,
      docContent: resolvedDocContent,
      catalogBaseline: resolvedCatalogBaseline,
      mode: mode === "ai_assisted" ? "ai_assisted" : "deterministic",
      forceMode: effectiveForceMode,
    });

    let guide = result.guide;
    if (result.modeUsed !== "curated_fast_path") {
      const evidenceCheck = enforceDocumentEvidence(result.guide, trustedServerSource);
      guide = evidenceCheck.guide;
      guide = synchronizeInvestigationAnalysis(guide);
      if (evidenceCheck.downgradedCount > 0) {
        evidenceLogs.push(
          `[EVIDENCE] ${evidenceCheck.downgradedCount} generated claims lacked a matching server-retrieved quote or an executed live test and were labeled Hypothesis.`
        );
      }
    }

    if (!targetUrl && !docContent) {
      retrievalLogs.push(
        result.modeUsed === "curated_fast_path"
          ? "[PROXY] No live provider URL was supplied; the matching curated guide was used."
          : "[PROXY] No live provider documentation was supplied; this dynamic result is heuristic and unsupported claims are labeled Hypothesis."
      );
    }

    // Validate generated guide
    const validation = validateIntegrationReadinessGuide(guide);
    if (!validation.isValid) {
      res.status(500).json({
        success: false,
        error: "Investigator generated an invalid guide structure",
        validationErrors: validation.errors,
      });
      return;
    }

    res.json({
      success: true,
      guide,
      modeUsed: result.modeUsed,
      retrievalStatus: trustedServerSource ? "success" : "not_attempted",
      selectedSource: sourceSelection,
      logs: [...retrievalLogs, ...result.logs, ...evidenceLogs],
      appName: guide.appName,
      authPathClassification: guide.readinessSummary.authPathClassification,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Investigation failed: ${err.message}`,
    });
  }
}
app.post("/api/investigate", handleInvestigate);

// ============================================================================
// Server Startup (Port 3001)
// ============================================================================
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

export function startServer(port = PORT) {
  return app.listen(port, () => {
    console.log(`[Composio OAuth Readiness Proxy] Listening on http://localhost:${port}`);
  });
}

// Start a listener for local development, but never inside Vercel Functions.
if (
  process.env.NODE_ENV !== "test" &&
  process.env.VERCEL !== "1" &&
  typeof process.send !== "function"
) {
  startServer();
}
