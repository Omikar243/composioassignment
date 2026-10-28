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

/**
 * Authoritatively resolves the source URL for an investigation.
 * Strict Precedence Order:
 * 1. userOverrideUrl (100% priority - fallback strictly prohibited)
 * 2. catalogAuthDocUrl (Official curated documentation)
 * 3. discoveredUrl (Discovered via search pipeline)
 * 4. websiteUrl (General homepage fallback)
 * 5. none (No source available)
 */
export function selectInvestigationSource(inputs: {
  userOverrideUrl?: string;
  catalogAuthDocUrl?: string;
  websiteUrl?: string;
  discoveredUrl?: string;
}): InvestigationSourceSelection {
  const override = inputs.userOverrideUrl?.trim();
  if (override) {
    return {
      sourceType: "user_override",
      url: override,
      isOverride: true,
      notes: "Authoritative user override URL selected. Fallback is strictly disabled.",
    };
  }

  const catalogDoc = inputs.catalogAuthDocUrl?.trim();
  if (catalogDoc) {
    return {
      sourceType: "catalog_auth_doc",
      url: catalogDoc,
      isOverride: false,
      notes: "Official catalog authentication documentation URL selected.",
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

  const website = inputs.websiteUrl?.trim();
  if (website) {
    return {
      sourceType: "website_url",
      url: website,
      isOverride: false,
      notes: "Provider website URL selected as fallback.",
    };
  }

  return {
    sourceType: "none",
    isOverride: false,
    notes: "No source URL provided or discovered.",
  };
}
