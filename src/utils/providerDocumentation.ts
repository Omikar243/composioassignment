const EVIDENCE_URL_FIELDS = new Set([
  "sourceUrl",
  "relatedSourceUrl",
  "referenceUrl",
  "sourceDocUrl",
]);

const DOCUMENTATION_HOST = /(^|\.)(?:docs?|developers?|developer|api|reference|guides?|help|support|platform)(\.|$)/i;
const DOCUMENTATION_PATH = /(?:^|\/)(?:docs?|developers?|api|reference|guides?|help|support|oauth|auth|authentication|tutorials?|quickstart)(?:\/|$)/i;

function collectEvidenceUrls(value: unknown, urls: string[], visited: Set<object>): void {
  if (!value || typeof value !== "object" || visited.has(value)) return;
  visited.add(value);

  if (Array.isArray(value)) {
    value.forEach((item) => collectEvidenceUrls(item, urls, visited));
    return;
  }

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (EVIDENCE_URL_FIELDS.has(key) && typeof nested === "string") {
      urls.push(nested);
    } else {
      collectEvidenceUrls(nested, urls, visited);
    }
  }
}

function isComposioHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "composio.dev" ||
    host.endsWith(".composio.dev") ||
    host === "composio.com" ||
    host.endsWith(".composio.com")
  );
}

function isProviderDocumentationUrl(candidate: string, websiteUrl: string): boolean {
  let url: URL;
  let homepage: URL | undefined;

  try {
    url = new URL(candidate);
    if (url.protocol !== "https:") return false;
  } catch {
    return false;
  }

  try {
    homepage = new URL(websiteUrl);
  } catch {
    // The source URL can still be useful even when the fallback URL is malformed.
  }

  if (isComposioHost(url.hostname) && (!homepage || !isComposioHost(homepage.hostname))) {
    return false;
  }

  if (
    url.hostname.toLowerCase() === "github.com" &&
    url.pathname.toLowerCase().includes("/omikar243/composioassignment")
  ) {
    return false;
  }

  return DOCUMENTATION_HOST.test(url.hostname) || DOCUMENTATION_PATH.test(url.pathname);
}

/**
 * Prefer a provider documentation URL carried by source evidence. If none is
 * identifiable, return the provider's main website URL as the safe fallback.
 */
export function resolveProviderDocumentationUrl<T extends { websiteUrl: string }>(guide: T): string {
  const evidenceUrls: string[] = [];
  collectEvidenceUrls(guide, evidenceUrls, new Set<object>());

  const candidates = [...new Set([...evidenceUrls, guide.websiteUrl])];
  return (
    candidates.find((candidate) => isProviderDocumentationUrl(candidate, guide.websiteUrl)) ??
    guide.websiteUrl
  );
}
