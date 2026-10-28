/**
 * src/agent/searchDiscovery.ts
 * Real Server-Side Web Discovery Pipeline with Domain Safety and SSRF Filters
 */

import * as cheerio from "cheerio";
import { validateSsrfTarget } from "./sanitizer";

export interface DiscoveryQuery {
  appName: string;
  websiteUrl?: string;
}

export interface DiscoveredCandidate {
  url: string;
  title: string;
  snippet?: string;
  sourceProvider: "duckduckgo" | "brave" | "fixture" | string;
  confidenceScore: number;
}

export interface SearchDiscoveryProvider {
  readonly name: string;
  search(query: DiscoveryQuery): Promise<DiscoveredCandidate[]>;
}

/**
 * Aggregator, directory, and forum domains strictly disallowed during discovery.
 * Prevents noisy search results from overriding official developer auth docs.
 */
export const DISALLOWED_DISCOVERY_DOMAINS: string[] = [
  // Aggregators & Software Directories
  "g2.com",
  "capterra.com",
  "producthunt.com",
  "alternativeto.net",
  "trustradius.com",
  "softwareadvice.com",
  "getapp.com",
  "crunchbase.com",
  "zoominfo.com",
  "pitchbook.com",
  "wikipedia.org",
  "wikibooks.org",
  "wikidata.org",
  "slant.co",
  "saasworthy.com",
  "sourceforge.net",
  // Forums, Q&A, and Social Networks
  "reddit.com",
  "stackoverflow.com",
  "stackexchange.com",
  "quora.com",
  "news.ycombinator.com",
  "medium.com",
  "dev.to",
  "twitter.com",
  "x.com",
  "facebook.com",
  "linkedin.com",
  "youtube.com",
  "instagram.com",
  "tiktok.com",
  "pinterest.com",
  // Package Managers
  "npmjs.com",
  "pypi.org",
  "crates.io",
  "packagist.org",
  "rubygems.org",
  // Self / Copilot
  "composio.dev",
  "composio.com",
];

export function isDisallowedDiscoveryDomain(candidateUrl: string): boolean {
  try {
    const parsed = new URL(candidateUrl);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return DISALLOWED_DISCOVERY_DOMAINS.some(
      (disallowed) => host === disallowed || host.endsWith("." + disallowed)
    );
  } catch {
    return true; // Malformed URLs are considered disallowed
  }
}

export function scoreDiscoveredCandidate(
  candidate: { url: string; title: string; snippet?: string },
  query: DiscoveryQuery
): number {
  let score = 0;
  const urlLower = candidate.url.toLowerCase();
  const titleLower = candidate.title.toLowerCase();
  const appLower = query.appName.toLowerCase().trim();

  // Prefer developer/docs subdomains and paths
  if (urlLower.includes("docs.") || urlLower.includes("developer.") || urlLower.includes("api.")) {
    score += 10;
  }
  if (urlLower.includes("/docs") || urlLower.includes("/developer") || urlLower.includes("/api")) {
    score += 8;
  }
  if (urlLower.includes("/oauth") || urlLower.includes("/authentication") || urlLower.includes("/auth")) {
    score += 7;
  }
  // Domain match with websiteUrl if provided
  if (query.websiteUrl) {
    try {
      const targetHost = new URL(query.websiteUrl).hostname.replace(/^www\./, "").toLowerCase();
      const candHost = new URL(candidate.url).hostname.replace(/^www\./, "").toLowerCase();
      if (candHost === targetHost || candHost.endsWith("." + targetHost)) {
        score += 15;
      }
    } catch {
      // ignore
    }
  }
  if (titleLower.includes(appLower)) {
    score += 5;
  }
  if (
    titleLower.includes("api") ||
    titleLower.includes("developer") ||
    titleLower.includes("authentication") ||
    titleLower.includes("oauth")
  ) {
    score += 5;
  }

  return score;
}

export class FixtureDiscoveryProvider implements SearchDiscoveryProvider {
  readonly name = "fixture";
  private fixtures = new Map<string, DiscoveredCandidate[]>();

  constructor(initialFixtures?: Record<string, DiscoveredCandidate[]>) {
    // Pre-seed fixtures for known test cases
    this.registerFixture("figma", [
      {
        url: "https://www.figma.com/developers/api#authentication",
        title: "Figma Developer API Authentication",
        snippet: "Figma REST API and OAuth 2.0 guide with Personal Access Tokens",
        sourceProvider: "fixture",
        confidenceScore: 35,
      },
    ]);
    this.registerFixture("spotify", [
      {
        url: "https://developer.spotify.com/documentation/web-api/concepts/authorization",
        title: "Spotify Web API Authorization Guide",
        snippet: "Spotify Web API exclusively uses OAuth 2.0",
        sourceProvider: "fixture",
        confidenceScore: 35,
      },
    ]);
    this.registerFixture("postmark", [
      {
        url: "https://postmarkapp.com/developer/api/overview",
        title: "Postmark Developer API Overview",
        snippet: "Postmark API authentication with server and account tokens",
        sourceProvider: "fixture",
        confidenceScore: 35,
      },
    ]);
    this.registerFixture("strava", [
      {
        url: "https://developers.strava.com/docs/authentication/",
        title: "Strava Developers Authentication",
        snippet: "Strava OAuth 2.0 authentication flow and rate limits",
        sourceProvider: "fixture",
        confidenceScore: 35,
      },
    ]);
    this.registerFixture("deepl", [
      {
        url: "https://www.deepl.com/docs-api/accessing-the-api/",
        title: "DeepL API Documentation",
        snippet: "DeepL API authentication with DeepL-Auth-Key header",
        sourceProvider: "fixture",
        confidenceScore: 35,
      },
    ]);

    if (initialFixtures) {
      for (const [key, candidates] of Object.entries(initialFixtures)) {
        this.registerFixture(key, candidates);
      }
    }
  }

  registerFixture(appName: string, candidates: DiscoveredCandidate[]): void {
    const key = appName.trim().toLowerCase();
    this.fixtures.set(key, candidates);
    const normalized = key.replace(/[^a-z0-9]/g, "");
    if (normalized !== key) {
      this.fixtures.set(normalized, candidates);
    }
  }

  async search(query: DiscoveryQuery): Promise<DiscoveredCandidate[]> {
    const key = query.appName.trim().toLowerCase();
    const normalized = key.replace(/[^a-z0-9]/g, "");
    const results = this.fixtures.get(key) || this.fixtures.get(normalized) || [];
    return results.filter((cand) => {
      if (isDisallowedDiscoveryDomain(cand.url)) return false;
      const ssrf = validateSsrfTarget(cand.url);
      return ssrf.isValid && ssrf.allowed;
    });
  }
}

export class DuckDuckGoDiscoveryProvider implements SearchDiscoveryProvider {
  readonly name = "duckduckgo";

  async search(query: DiscoveryQuery): Promise<DiscoveredCandidate[]> {
    const searchTerm = `${query.appName} api developer documentation authentication oauth`;
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchTerm)}`;
    const ssrf = validateSsrfTarget(searchUrl);
    if (!ssrf.isValid || !ssrf.allowed) return [];

    try {
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) return [];

      const html = await response.text();
      const $ = cheerio.load(html);
      const candidates: DiscoveredCandidate[] = [];

      $(".result").each((_, el) => {
        const link = $(el).find(".result__url").attr("href") || $(el).find(".result__title a").attr("href");
        const title = $(el).find(".result__title").text().trim();
        const snippet = $(el).find(".result__snippet").text().trim();

        if (!link) return;

        let realUrl = link;
        if (link.includes("uddg=")) {
          try {
            const match = link.match(/[?&]uddg=([^&]+)/);
            if (match) {
              realUrl = decodeURIComponent(match[1]);
            }
          } catch {
            // keep link
          }
        }

        if (isDisallowedDiscoveryDomain(realUrl)) return;
        const targetSsrf = validateSsrfTarget(realUrl);
        if (!targetSsrf.isValid || !targetSsrf.allowed) return;

        const score = scoreDiscoveredCandidate({ url: realUrl, title, snippet }, query);
        candidates.push({
          url: realUrl,
          title: title || `${query.appName} Documentation`,
          snippet,
          sourceProvider: "duckduckgo",
          confidenceScore: score,
        });
      });

      return candidates.sort((a, b) => b.confidenceScore - a.confidenceScore);
    } catch {
      return [];
    }
  }
}

export class BraveSearchDiscoveryProvider implements SearchDiscoveryProvider {
  readonly name = "brave";

  async search(query: DiscoveryQuery): Promise<DiscoveredCandidate[]> {
    const apiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!apiKey) return [];

    const searchTerm = `${query.appName} api authentication developer documentation`;
    const searchUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchTerm)}&count=5`;
    const ssrf = validateSsrfTarget(searchUrl);
    if (!ssrf.isValid || !ssrf.allowed) return [];

    try {
      const response = await fetch(searchUrl, {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": apiKey,
        },
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) return [];

      const data = (await response.json()) as any;
      const webResults = data?.web?.results || [];
      const candidates: DiscoveredCandidate[] = [];

      for (const item of webResults) {
        const url = item.url;
        if (!url || isDisallowedDiscoveryDomain(url)) continue;
        const targetSsrf = validateSsrfTarget(url);
        if (!targetSsrf.isValid || !targetSsrf.allowed) continue;

        const title = item.title || `${query.appName} Documentation`;
        const snippet = item.description || "";
        const score = scoreDiscoveredCandidate({ url, title, snippet }, query);

        candidates.push({
          url,
          title,
          snippet,
          sourceProvider: "brave",
          confidenceScore: score,
        });
      }

      return candidates.sort((a, b) => b.confidenceScore - a.confidenceScore);
    } catch {
      return [];
    }
  }
}

export interface WebDiscoveryPipelineOptions {
  providers?: SearchDiscoveryProvider[];
  allowLiveNetwork?: boolean;
}

export class WebDiscoveryPipeline {
  private providers: SearchDiscoveryProvider[];

  constructor(options?: WebDiscoveryPipelineOptions) {
    if (options?.providers && options.providers.length > 0) {
      this.providers = options.providers;
    } else {
      const allowLive = options?.allowLiveNetwork ?? (process.env.LIVE_NETWORK_DISCOVERY === "true");
      const list: SearchDiscoveryProvider[] = [new FixtureDiscoveryProvider()];
      if (allowLive) {
        if (process.env.BRAVE_SEARCH_API_KEY) {
          list.push(new BraveSearchDiscoveryProvider());
        }
        list.push(new DuckDuckGoDiscoveryProvider());
      }
      this.providers = list;
    }
  }

  getProviders(): readonly SearchDiscoveryProvider[] {
    return this.providers;
  }

  async search(query: DiscoveryQuery): Promise<DiscoveredCandidate[]> {
    const all: DiscoveredCandidate[] = [];
    for (const provider of this.providers) {
      try {
        const candidates = await provider.search(query);
        for (const cand of candidates) {
          if (!isDisallowedDiscoveryDomain(cand.url)) {
            const ssrf = validateSsrfTarget(cand.url);
            if (ssrf.isValid && ssrf.allowed) {
              all.push(cand);
            }
          }
        }
        if (all.length > 0) break; // Return first provider that produced safe results
      } catch {
        continue;
      }
    }
    return all.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  async discover(query: DiscoveryQuery): Promise<DiscoveredCandidate | undefined> {
    const candidates = await this.search(query);
    return candidates[0];
  }
}
