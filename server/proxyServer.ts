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
import { validateSsrfTarget } from "../src/agent/sanitizer";
import {
  investigateApp,
  validateIntegrationReadinessGuide,
} from "../src/agent/investigatorEngine";

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

// Initialize TurndownService
const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "_",
});

// Configure Turndown rules: remove script, style, nav, etc. in case raw tags leak
turndown.remove(["script", "style", "noscript", "iframe", "svg", "button", "nav", "footer", "header", "aside"] as any);

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
  const ssrfCheck = validateSsrfTarget(targetUrl);
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
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 ComposioOAuthReadinessBot/1.0",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    });

    clearTimeout(timeoutId);

    // Guard against post-redirect SSRF (redirected to internal IP)
    const finalSsrf = validateSsrfTarget(response.url);
    if (!finalSsrf.isValid || !finalSsrf.allowed) {
      return {
        success: false,
        title: "",
        markdown: "",
        finalUrl: response.url,
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
          finalUrl: response.url,
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
        finalUrl: response.url,
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
        finalUrl: response.url,
        characterCount: 0,
        cached: false,
        error: `Invalid content type: '${contentType}'. Only HTML and text documents can be retrieved.`,
        httpStatus: 400,
      };
    }

    const rawHtml = await response.text();

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

    // 6. Enforce 15,000 Character Budget
    if (markdown.length > 15000) {
      markdown =
        markdown.substring(0, 15000) +
        "\n\n[Content truncated to 15,000 character budget...]";
    }

    const entry: CacheEntry = {
      title,
      markdown,
      characterCount: markdown.length,
      finalUrl: response.url,
      cachedAt: Date.now(),
    };
    retrievalCache.set(targetUrl, entry);

    return {
      success: true,
      title,
      markdown,
      finalUrl: response.url,
      characterCount: markdown.length,
      cached: false,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
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
  const { appName, websiteUrl, mode, forceMode, docContent } = req.body;

  if (!appName || typeof appName !== "string" || appName.trim() === "") {
    res.status(400).json({
      success: false,
      error: "Missing or invalid 'appName' parameter",
    });
    return;
  }

  try {
    let resolvedDocContent = docContent;

    // If websiteUrl provided and no pre-supplied docContent, attempt live retrieval
    if (!resolvedDocContent && websiteUrl && typeof websiteUrl === "string") {
      const retrieval = await fetchAndCleanDoc(websiteUrl);
      if (retrieval.success) {
        resolvedDocContent = retrieval.markdown;
      }
    }

    const result = await investigateApp({
      appName: appName.trim(),
      websiteUrl: websiteUrl ? String(websiteUrl).trim() : undefined,
      docContent: resolvedDocContent,
      mode: mode === "ai_assisted" ? "ai_assisted" : "deterministic",
      forceMode: forceMode || "auto",
    });

    // Validate generated guide
    const validation = validateIntegrationReadinessGuide(result.guide);
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
      guide: result.guide,
      modeUsed: result.modeUsed,
      logs: result.logs,
      appName: result.guide.appName,
      authPathClassification: result.guide.readinessSummary.authPathClassification,
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

// Start listener when executed directly
if (process.env.NODE_ENV !== "test" && typeof process.send !== "function") {
  startServer();
}
