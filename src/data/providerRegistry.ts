/**
 * src/data/providerRegistry.ts
 * Authoritative Provider Registry with Provenance, Protocols, and Custom Transports
 */

import type {
  AuthPathClassification,
  ConcreteAuthScheme,
  CredentialType,
  CustomHeaderTransport,
} from "../types/guide";

export interface ReviewProvenance {
  reviewRequired: boolean;
  reviewNotes: string;
  sourceDocUrl?: string;
  rateLimits?: string;
  threshold?: string;
}

export interface ProviderRegistryEntry {
  id: string;
  canonicalName: string;
  aliases: string[];
  authDocUrl: string;
  websiteUrl: string;
  defaultClassification: AuthPathClassification;
  supportedAuthSchemes: ConcreteAuthScheme[];
  protocols: ("OAUTH2" | "OAUTH1" | "API_KEY" | "BEARER_TOKEN" | "CUSTOM_HEADER")[];
  credentialTypes: CredentialType[];
  customTransportHeaders: CustomHeaderTransport[];
  oauthEndpoints?: {
    authorizationUrl: string;
    tokenUrl: string;
    revocationUrl?: string;
    userInfoUrl?: string;
    supportedFlows?: ("authorization_code" | "client_credentials" | "pkce")[];
    pkceStatus?: "required" | "supported_optional" | "not_mentioned_in_sources";
  };
  endpoints?: {
    free?: string;
    pro?: string;
    standard?: string;
  };
  reviewProvenance: ReviewProvenance;
  notes?: string[];
}

export const PROVIDER_REGISTRY: Record<string, ProviderRegistryEntry> = {
  figma: {
    id: "figma",
    canonicalName: "Figma",
    aliases: ["figma.com", "figma rest api", "figma api", "https://www.figma.com"],
    authDocUrl: "https://www.figma.com/developers/api#authentication",
    websiteUrl: "https://www.figma.com",
    defaultClassification: "hybrid_oauth_or_direct",
    supportedAuthSchemes: ["OAUTH2", "BEARER_TOKEN"],
    protocols: ["OAUTH2", "CUSTOM_HEADER"],
    credentialTypes: ["personal_access_token"],
    customTransportHeaders: [
      {
        headerName: "X-Figma-Token",
        formatPattern: "X-Figma-Token: <personal_access_token>",
        location: "header",
        description: "Figma Personal Access Token (PAT) generated in Account Settings -> Personal Access Tokens",
      },
    ],
    oauthEndpoints: {
      authorizationUrl: "https://www.figma.com/oauth",
      tokenUrl: "https://api.figma.com/v1/oauth/token",
      supportedFlows: ["authorization_code"],
      pkceStatus: "not_mentioned_in_sources",
    },
    reviewProvenance: {
      reviewRequired: true,
      reviewNotes:
        "Public OAuth applications require Figma review and approval before public distribution. Private OAuth integrations and Personal Access Tokens (PAT) do not require review.",
      threshold: "Public distribution requires review; private/internal integrations do not.",
      sourceDocUrl: "https://www.figma.com/developers/api#oauth-apps",
    },
    notes: [
      "PAT tokens authenticate immediately without OAuth registration.",
      "OAuth 2.0 uses https://www.figma.com/oauth for authorization and https://api.figma.com/v1/oauth/token for code exchange.",
    ],
  },

  spotify: {
    id: "spotify",
    canonicalName: "Spotify",
    aliases: ["spotify.com", "spotify web api", "spotify api", "https://developer.spotify.com"],
    authDocUrl: "https://developer.spotify.com/documentation/web-api/concepts/authorization",
    websiteUrl: "https://developer.spotify.com",
    defaultClassification: "oauth_required",
    supportedAuthSchemes: ["OAUTH2"],
    protocols: ["OAUTH2"],
    credentialTypes: [], // Zero static API keys exist!
    customTransportHeaders: [],
    oauthEndpoints: {
      authorizationUrl: "https://accounts.spotify.com/authorize",
      tokenUrl: "https://accounts.spotify.com/api/token",
      supportedFlows: ["authorization_code", "client_credentials"],
      pkceStatus: "supported_optional",
    },
    reviewProvenance: {
      reviewRequired: true,
      reviewNotes:
        "Development mode allows up to 25 registered Spotify test users without review. Commercial quota extension or public general distribution requires Spotify Developer review.",
      threshold: "Development mode capped at 25 users. App review required for production quota extension.",
      sourceDocUrl: "https://developer.spotify.com/documentation/web-api/concepts/quota-modes",
    },
    notes: [
      "Spotify Web API exclusively uses OAuth 2.0; zero static API key credentials exist.",
      "Supports Client Credentials flow for server-to-server metadata endpoints and Authorization Code with PKCE for user access.",
    ],
  },

  postmark: {
    id: "postmark",
    canonicalName: "Postmark",
    aliases: ["postmarkapp.com", "postmark api", "postmarkapp", "https://postmarkapp.com"],
    authDocUrl: "https://postmarkapp.com/developer/api/overview",
    websiteUrl: "https://postmarkapp.com",
    defaultClassification: "direct_credential_only",
    supportedAuthSchemes: ["API_KEY"],
    protocols: ["CUSTOM_HEADER", "API_KEY"],
    credentialTypes: ["server_token", "account_token"],
    customTransportHeaders: [
      {
        headerName: "X-Postmark-Server-Token",
        formatPattern: "X-Postmark-Server-Token: <server-token>",
        location: "header",
        description: "Server API token used for sending transactional emails, messages, bounces, and templates",
      },
      {
        headerName: "X-Postmark-Account-Token",
        formatPattern: "X-Postmark-Account-Token: <account-token>",
        location: "header",
        description: "Account API token used for managing servers, sender signatures, domains, and data exports",
      },
    ],
    reviewProvenance: {
      reviewRequired: false,
      reviewNotes:
        "Self-serve API keys provisioned immediately in Postmark console. Outbound delivery to external inboxes requires sending approval/warmup, but API tokens require zero provider review gate.",
      sourceDocUrl: "https://postmarkapp.com/developer/api/overview",
    },
    notes: [
      "Direct credential only; zero OAuth endpoints exist.",
      "Two distinct custom headers: X-Postmark-Server-Token for mail operations and X-Postmark-Account-Token for administrative tasks.",
    ],
  },

  strava: {
    id: "strava",
    canonicalName: "Strava",
    aliases: ["strava.com", "strava api", "strava v3", "https://developers.strava.com"],
    authDocUrl: "https://developers.strava.com/docs/authentication/",
    websiteUrl: "https://developers.strava.com",
    defaultClassification: "oauth_required",
    supportedAuthSchemes: ["OAUTH2"],
    protocols: ["OAUTH2"],
    credentialTypes: [],
    customTransportHeaders: [],
    oauthEndpoints: {
      authorizationUrl: "https://www.strava.com/oauth/authorize",
      tokenUrl: "https://www.strava.com/oauth/token",
      revocationUrl: "https://www.strava.com/oauth/deauthorize",
      supportedFlows: ["authorization_code"],
      pkceStatus: "not_mentioned_in_sources",
    },
    reviewProvenance: {
      reviewRequired: true,
      reviewNotes:
        "Strava applications operate in development sandbox mode limited to 10 athletes. Developer review and approval are strictly required when scaling beyond 10 connected athletes.",
      threshold: "Review required when scaling beyond 10 connected athletes",
      rateLimits:
        "Default: 100 requests per 15 minutes, 1,000 requests per day; Overall rate limit: 200 requests per 15 minutes, 2,000 requests per day.",
      sourceDocUrl: "https://developers.strava.com/docs/rate-limits/",
    },
    notes: [
      "Strict OAuth 2.0 authorization code flow.",
      "Review gate is triggered at 10 connected athletes.",
      "Rate limit: 200 req/15min overall rate limit.",
    ],
  },

  deepl: {
    id: "deepl",
    canonicalName: "DeepL",
    aliases: ["deepl.com", "deepl api", "deepl translator", "https://www.deepl.com"],
    authDocUrl: "https://www.deepl.com/docs-api/accessing-the-api/",
    websiteUrl: "https://www.deepl.com",
    defaultClassification: "direct_credential_only",
    supportedAuthSchemes: ["API_KEY"],
    protocols: ["CUSTOM_HEADER", "API_KEY"],
    credentialTypes: ["api_key", "plan_token"],
    customTransportHeaders: [
      {
        headerName: "Authorization",
        formatPattern: "Authorization: DeepL-Auth-Key [yourAuthKey]",
        location: "header",
        description: "DeepL API authentication key passed with the 'DeepL-Auth-Key' prefix in the Authorization header",
      },
    ],
    endpoints: {
      free: "https://api-free.deepl.com/v2/",
      pro: "https://api.deepl.com/v2/",
    },
    reviewProvenance: {
      reviewRequired: false,
      reviewNotes: "Instant self-serve API key provisioned upon plan signup; no application review gate.",
      sourceDocUrl: "https://www.deepl.com/docs-api/accessing-the-api/",
    },
    notes: [
      "Direct credential only; zero OAuth endpoints exist.",
      "Uses custom header format 'Authorization: DeepL-Auth-Key [yourAuthKey]'.",
      "Endpoint URLs differ between Free (https://api-free.deepl.com/v2/, keys end in ':fx') and Pro (https://api.deepl.com/v2/).",
    ],
  },
};

export function findProviderInRegistry(query: string): ProviderRegistryEntry | undefined {
  if (!query || typeof query !== "string") return undefined;
  const clean = query.trim().toLowerCase();
  if (!clean) return undefined;
  const normalized = clean.replace(/[^a-z0-9]/g, "");

  // 1. Direct ID match
  if (PROVIDER_REGISTRY[clean]) return PROVIDER_REGISTRY[clean];
  if (normalized && PROVIDER_REGISTRY[normalized]) return PROVIDER_REGISTRY[normalized];

  // 2. Iterate entries
  for (const entry of Object.values(PROVIDER_REGISTRY)) {
    if (entry.id === clean || (normalized && entry.id === normalized)) return entry;
    if (entry.canonicalName.toLowerCase() === clean) return entry;
    if (normalized && entry.canonicalName.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized) return entry;
    for (const alias of entry.aliases) {
      const aliasClean = alias.toLowerCase();
      const aliasNorm = aliasClean.replace(/[^a-z0-9]/g, "");
      if (clean === aliasClean || (normalized && aliasNorm && normalized === aliasNorm)) {
        return entry;
      }
      if (clean.length >= 2 && (clean.includes(aliasClean) || aliasClean.includes(clean))) {
        return entry;
      }
    }
  }

  return undefined;
}
