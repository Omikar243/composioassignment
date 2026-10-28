/**
 * src/utils/investigationSource.ts
 * Authoritative Investigation Source Resolver with Strict Override Precedence
 */

export type SourceSelectionType =
  | "user_override"
  | "catalog_auth_doc"
  | "discovered_url"
  | "website_url"
  | "none";

export interface InvestigationSourceSelection {
  sourceType: SourceSelectionType;
  url?: string;
  isOverride: boolean;
  notes: string;
}

export interface SelectInvestigationSourceInputs {
  userOverrideUrl?: string;
  catalogAuthDocUrl?: string;
  websiteUrl?: string;
  discoveredUrl?: string;
  isUserEntered?: boolean;
}

function normalizeUrlForComparison(url?: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url.trim());
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}${parsed.search}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, "");
  }
}

/**
 * Authoritatively resolves the source URL for an investigation.
 * Strict Precedence Order:
 * 1. userOverrideUrl (100% priority - fallback strictly prohibited)
 * 2. catalogAuthDocUrl (Official curated documentation)
 * 3. discoveredUrl (Discovered via search pipeline)
 * 4. websiteUrl (General homepage fallback)
 * 5. none (No source available)
 */
export function selectInvestigationSource(inputs: SelectInvestigationSourceInputs): InvestigationSourceSelection {
  const override = inputs.userOverrideUrl?.trim();
  const catalogDoc = inputs.catalogAuthDocUrl?.trim();
  const website = inputs.websiteUrl?.trim();

  // Check if userOverrideUrl is actually a pre-populated catalog default URL
  const matchesCatalogDoc = Boolean(
    override && catalogDoc && normalizeUrlForComparison(override) === normalizeUrlForComparison(catalogDoc)
  );
  const matchesCatalogWebsite = Boolean(
    override && website && !catalogDoc && normalizeUrlForComparison(override) === normalizeUrlForComparison(website)
  );

  const isPrepopulatedDefault =
    inputs.isUserEntered === false ||
    (inputs.isUserEntered !== true && (matchesCatalogDoc || matchesCatalogWebsite));

  if (override && !isPrepopulatedDefault) {
    return {
      sourceType: "user_override",
      url: override,
      isOverride: true,
      notes: "Authoritative user override URL selected. Fallback is strictly disabled.",
    };
  }

  const catalogDocUrl = catalogDoc || (matchesCatalogDoc ? override : undefined);
  if (catalogDocUrl) {
    return {
      sourceType: "catalog_auth_doc",
      url: catalogDocUrl,
      isOverride: false,
      notes: matchesCatalogDoc
        ? "Official catalog authentication documentation URL selected (matched pre-populated default)."
        : "Official catalog authentication documentation URL selected.",
    };
  }

  const discovered = inputs.discoveredUrl?.trim();
  if (discovered) {
    return {
      sourceType: "discovered_url",
      url: discovered,
      isOverride: false,
      notes: "Discovered authentication documentation URL selected.",
    };
  }

  const websiteUrlCandidate = website || (matchesCatalogWebsite ? override : undefined);
  if (websiteUrlCandidate) {
    return {
      sourceType: "website_url",
      url: websiteUrlCandidate,
      isOverride: false,
      notes: matchesCatalogWebsite
        ? "Provider website URL selected as fallback (matched pre-populated default)."
        : "Provider website URL selected as fallback.",
    };
  }

  return {
    sourceType: "none",
    isOverride: false,
    notes: "No source URL provided or discovered.",
  };
}
