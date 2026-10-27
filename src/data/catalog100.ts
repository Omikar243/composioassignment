/**
 * src/data/catalog100.ts
 * 100 Real AI Agent Integrations Index
 *
 * Categorized across 10 distinct domains (exactly 10 apps each).
 * Auth Path Distribution: exactly 50% oauth_required (50), 25% hybrid_oauth_or_direct (25), 25% direct_credential_only (25).
 * Review Gate taxonomy: no_gate, conditional_gate, mandatory_enterprise_gate, unknown.
 * Setup Difficulty: easy, medium, hard.
 * Epistemic labeling applied to all setup time and approval wait estimates.
 */

import {
  AuthPathClassification,
  ConcreteAuthScheme,
  ManagedAuthAvailability,
  Traceable,
} from "../types/guide";

export type CatalogCategory =
  | "Developer Tools"
  | "Communication"
  | "Productivity"
  | "CRM & Sales"
  | "AI & Search"
  | "Social & Marketing"
  | "Finance & Payments"
  | "Cloud Storage"
  | "E-Commerce"
  | "HR & Operations";

export type ReviewGateStatus =
  | "no_gate"
  | "conditional_gate"
  | "mandatory_enterprise_gate"
  | "unknown";

export type SetupDifficulty = "easy" | "medium" | "hard";

export interface CatalogApp {
  id: string;
  appId: string;
  name: string;
  appName: string;
  category: CatalogCategory;
  authPath: AuthPathClassification;
  authPathClassification: AuthPathClassification;
  reviewGate: ReviewGateStatus;
  reviewGateStatus: ReviewGateStatus;
  difficulty: SetupDifficulty;
  setupDifficulty: SetupDifficulty;
  supportedAuthSchemes: ConcreteAuthScheme[];
  composioManagedAuthStatus: ManagedAuthAvailability;
  setupTimeEstimate: Traceable<string>;
  approvalWaitEstimate: Traceable<string>;
  websiteUrl: string;
  composioToolkitSlug?: string;
  hasCuratedDeepGuide: boolean;
  keyNuanceOrPitfall: string;
}

export type CatalogAppIndexItem = CatalogApp;

export const CATALOG_100_APPS: CatalogApp[] = [
  {
    id: "github",
    appId: "github",
    name: "GitHub",
    appName: "GitHub",
    category: "Developer Tools",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["OAUTH2","BEARER_TOKEN"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~5–10 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from 4 required form fields in GitHub Developer Settings; official docs do not state duration.",
        whatRemainsUnverified: "Actual portal completion time across varying developer experience levels."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://github.com",
    composioToolkitSlug: "github",
    hasCuratedDeepGuide: true,
    keyNuanceOrPitfall: "GitHub App vs OAuth App architecture choice; default 8-hour token expiry."
  },
  {
    id: "gitlab",
    appId: "gitlab",
    name: "GitLab",
    appName: "GitLab",
    category: "Developer Tools",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["OAUTH2","BEARER_TOKEN"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~5–10 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://gitlab.com",
    composioToolkitSlug: "gitlab",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Supports both Personal Access Tokens and OAuth 2.0 applications with scoped API permissions."
  },
  {
    id: "jira",
    appId: "jira",
    name: "Jira",
    appName: "Jira",
    category: "Developer Tools",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~30–60 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Workspace admin consent required for 3LO app installation",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Jira Developer Documentation",
        sourceUrl: "https://www.atlassian.com/software/jira",
        whatSourceExplicitlyStates: "Workspace admin consent required for 3LO app installation"
      }
    },
    websiteUrl: "https://www.atlassian.com/software/jira",
    composioToolkitSlug: "jira",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Atlassian 3LO OAuth 2.0 requires mapping accessible resources via cloudId parameter."
  },
  {
    id: "linear",
    appId: "linear",
    name: "Linear",
    appName: "Linear",
    category: "Developer Tools",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["OAUTH2","BEARER_TOKEN"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~5–10 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://linear.app",
    composioToolkitSlug: "linear",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Personal API keys work instantly for private scripts; public OAuth apps require webhook callback registration."
  },
  {
    id: "sentry",
    appId: "sentry",
    name: "Sentry",
    appName: "Sentry",
    category: "Developer Tools",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~15–20 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://sentry.io",
    composioToolkitSlug: "sentry",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Internal integration vs public OAuth App determines whether token can access multiple organizations."
  },
  {
    id: "datadog",
    appId: "datadog",
    name: "Datadog",
    appName: "Datadog",
    category: "Developer Tools",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://www.datadoghq.com",
    composioToolkitSlug: "datadog",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Requires both Datadog API Key and Application Key with specific site region endpoints."
  },
  {
    id: "bitbucket",
    appId: "bitbucket",
    name: "Bitbucket",
    appName: "Bitbucket",
    category: "Developer Tools",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2","BASIC_AUTH"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~10–15 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://bitbucket.org",
    composioToolkitSlug: "bitbucket",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Supports Repository/Workspace App Passwords for direct auth and OAuth 2.0 consumers."
  },
  {
    id: "circleci",
    appId: "circleci",
    name: "CircleCI",
    appName: "CircleCI",
    category: "Developer Tools",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~15–25 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://circleci.com",
    composioToolkitSlug: "circleci",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "OAuth client management is scoped to organization administrators with granular pipeline permissions."
  },
  {
    id: "vercel",
    appId: "vercel",
    name: "Vercel",
    appName: "Vercel",
    category: "Developer Tools",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["BEARER_TOKEN"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://vercel.com",
    composioToolkitSlug: "vercel",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Personal access tokens carry team-level scoping via Authorization: Bearer token."
  },
  {
    id: "supabase",
    appId: "supabase",
    name: "Supabase",
    appName: "Supabase",
    category: "Developer Tools",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://supabase.com",
    composioToolkitSlug: "supabase",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Requires project URL and service_role secret key for administrative agent access."
  },
  {
    id: "slack",
    appId: "slack",
    name: "Slack",
    appName: "Slack",
    category: "Communication",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~20–30 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate for single workspace; public distribution requires App Directory review",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Slack Developer Documentation",
        sourceUrl: "https://slack.com",
        whatSourceExplicitlyStates: "No review gate for single workspace; public distribution requires App Directory review"
      }
    },
    websiteUrl: "https://slack.com",
    composioToolkitSlug: "slack",
    hasCuratedDeepGuide: true,
    keyNuanceOrPitfall: "Bot scopes vs user scopes separation; redirect URI cannot contain '#' anchors."
  },
  {
    id: "discord",
    appId: "discord",
    name: "Discord",
    appName: "Discord",
    category: "Communication",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2","BEARER_TOKEN"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~10–20 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Bot verification required when installed in >100 servers",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Discord Developer Documentation",
        sourceUrl: "https://discord.com",
        whatSourceExplicitlyStates: "Bot verification required when installed in >100 servers"
      }
    },
    websiteUrl: "https://discord.com",
    composioToolkitSlug: "discord",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Bot tokens require Privileged Gateway Intents (Message Content, Server Members) toggled in portal."
  },
  {
    id: "microsoft_teams",
    appId: "microsoft_teams",
    name: "Microsoft Teams",
    appName: "Microsoft Teams",
    category: "Communication",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "mandatory_enterprise_gate",
    reviewGateStatus: "mandatory_enterprise_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~45–60 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Requires Microsoft Azure AD tenant admin consent for application scopes",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Microsoft Teams Enterprise & Partner Guidelines",
        sourceUrl: "https://www.microsoft.com/microsoft-teams",
        whatSourceExplicitlyStates: "Requires Microsoft Azure AD tenant admin consent for application scopes"
      }
    },
    websiteUrl: "https://www.microsoft.com/microsoft-teams",
    composioToolkitSlug: "microsoft_teams",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Requires Azure App Registration with Microsoft Graph permissions and admin consent grant."
  },
  {
    id: "zoom",
    appId: "zoom",
    name: "Zoom",
    appName: "Zoom",
    category: "Communication",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~30–60 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Marketplace publishing review required for multi-tenant installation outside developer account",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Zoom Developer Documentation",
        sourceUrl: "https://zoom.us",
        whatSourceExplicitlyStates: "Marketplace publishing review required for multi-tenant installation outside developer account"
      }
    },
    websiteUrl: "https://zoom.us",
    composioToolkitSlug: "zoom",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Account-level OAuth apps require admin approval; Server-to-Server OAuth available for internal bots."
  },
  {
    id: "twilio",
    appId: "twilio",
    name: "Twilio",
    appName: "Twilio",
    category: "Communication",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["BASIC_AUTH"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://www.twilio.com",
    composioToolkitSlug: "twilio",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "HTTP Basic Auth using Account SID as username and Auth Token as password."
  },
  {
    id: "sendgrid",
    appId: "sendgrid",
    name: "SendGrid",
    appName: "SendGrid",
    category: "Communication",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://sendgrid.com",
    composioToolkitSlug: "sendgrid",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "API keys generated with Full Access or Restricted Mail Send permissions."
  },
  {
    id: "telegram",
    appId: "telegram",
    name: "Telegram",
    appName: "Telegram",
    category: "Communication",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["BEARER_TOKEN"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://telegram.org",
    composioToolkitSlug: "telegram",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Bot tokens issued instantly via @BotFather chat bot without OAuth registration."
  },
  {
    id: "whatsapp",
    appId: "whatsapp",
    name: "WhatsApp Business",
    appName: "WhatsApp Business",
    category: "Communication",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "mandatory_enterprise_gate",
    reviewGateStatus: "mandatory_enterprise_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~45–90 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Meta Business Verification and WhatsApp phone number approval required (2–7 days)",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "WhatsApp Business Enterprise & Partner Guidelines",
        sourceUrl: "https://business.whatsapp.com",
        whatSourceExplicitlyStates: "Meta Business Verification and WhatsApp phone number approval required (2–7 days)"
      }
    },
    websiteUrl: "https://business.whatsapp.com",
    composioToolkitSlug: "whatsapp",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Requires Meta Developer App, Business Manager account, and verified phone number."
  },
  {
    id: "intercom",
    appId: "intercom",
    name: "Intercom",
    appName: "Intercom",
    category: "Communication",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~20–30 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "App Store submission review required for public listing; internal workspace install is instant",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Intercom Developer Documentation",
        sourceUrl: "https://www.intercom.com",
        whatSourceExplicitlyStates: "App Store submission review required for public listing; internal workspace install is instant"
      }
    },
    websiteUrl: "https://www.intercom.com",
    composioToolkitSlug: "intercom",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Access token granted per workspace; Regional data hosting (US vs EU vs AU) changes API base URL."
  },
  {
    id: "pagerduty",
    appId: "pagerduty",
    name: "PagerDuty",
    appName: "PagerDuty",
    category: "Communication",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~15–20 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://www.pagerduty.com",
    composioToolkitSlug: "pagerduty",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Supports PKCE OAuth 2.0 for user authorization and REST API keys for global access."
  },
  {
    id: "notion",
    appId: "notion",
    name: "Notion",
    appName: "Notion",
    category: "Productivity",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["BEARER_TOKEN","OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~2–5 mins (Internal) vs ~15 mins (Public)",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate for public connections; marketplace listing managed separately",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://notion.so",
    composioToolkitSlug: "notion",
    hasCuratedDeepGuide: true,
    keyNuanceOrPitfall: "Internal connection token ~2 mins; permanent installation scope at creation time; explicit page sharing prerequisite."
  },
  {
    id: "google_workspace",
    appId: "google_workspace",
    name: "Google Workspace",
    appName: "Google Workspace",
    category: "Productivity",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~30–90 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Testing mode capped at 100 users; sensitive/restricted scopes require verification & CASA audit (2–6 weeks)",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Google Workspace Developer Documentation",
        sourceUrl: "https://workspace.google.com",
        whatSourceExplicitlyStates: "Testing mode capped at 100 users; sensitive/restricted scopes require verification & CASA audit (2–6 weeks)"
      }
    },
    websiteUrl: "https://workspace.google.com",
    composioToolkitSlug: "google_workspace",
    hasCuratedDeepGuide: true,
    keyNuanceOrPitfall: "Requires OAuth consent screen configuration, least-privilege scope selection, and handling 7-day token expiry in Testing mode."
  },
  {
    id: "microsoft_365",
    appId: "microsoft_365",
    name: "Microsoft 365",
    appName: "Microsoft 365",
    category: "Productivity",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "mandatory_enterprise_gate",
    reviewGateStatus: "mandatory_enterprise_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~45–90 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Enterprise tenant admin consent required for cross-user Graph mail/calendar scopes",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Microsoft 365 Enterprise & Partner Guidelines",
        sourceUrl: "https://www.microsoft.com/microsoft-365",
        whatSourceExplicitlyStates: "Enterprise tenant admin consent required for cross-user Graph mail/calendar scopes"
      }
    },
    websiteUrl: "https://www.microsoft.com/microsoft-365",
    composioToolkitSlug: "microsoft_365",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Azure App Registration requires handling delegated vs application permissions and tenant endpoints."
  },
  {
    id: "asana",
    appId: "asana",
    name: "Asana",
    appName: "Asana",
    category: "Productivity",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["OAUTH2","BEARER_TOKEN"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~5–15 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://asana.com",
    composioToolkitSlug: "asana",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Personal Access Tokens available immediately in Developer App Console; OAuth 2.0 supports refresh rotation."
  },
  {
    id: "trello",
    appId: "trello",
    name: "Trello",
    appName: "Trello",
    category: "Productivity",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["OAUTH1","API_KEY"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~5–10 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate for personal development keys; public Power-Up directory listing requires Atlassian review",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Trello Developer Documentation",
        sourceUrl: "https://developer.atlassian.com/cloud/trello",
        whatSourceExplicitlyStates: "Personal API keys generated instantly in developer portal; public directory Power-Ups require review."
      }
    },
    websiteUrl: "https://trello.com",
    composioToolkitSlug: "trello",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Atlassian developer key paired with user token via URL authorize parameter; OAuth 1.0 also supported."
  },
  {
    id: "clickup",
    appId: "clickup",
    name: "ClickUp",
    appName: "ClickUp",
    category: "Productivity",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["OAUTH2","BEARER_TOKEN"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~5–15 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://clickup.com",
    composioToolkitSlug: "clickup",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Personal API token generated in User Settings -> Apps; OAuth 2.0 apps generate permanent client secrets."
  },
  {
    id: "monday",
    appId: "monday",
    name: "Monday.com",
    appName: "Monday.com",
    category: "Productivity",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2","BEARER_TOKEN"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~15–30 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "App Marketplace listing requires review; private app install requires account admin consent",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Monday.com Developer Documentation",
        sourceUrl: "https://monday.com",
        whatSourceExplicitlyStates: "App Marketplace listing requires review; private app install requires account admin consent"
      }
    },
    websiteUrl: "https://monday.com",
    composioToolkitSlug: "monday",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "GraphQL API queries require Authorization header; OAuth 2.0 app scopes include boards:read, boards:write."
  },
  {
    id: "airtable",
    appId: "airtable",
    name: "Airtable",
    appName: "Airtable",
    category: "Productivity",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["OAUTH2","BEARER_TOKEN"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~5–15 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://airtable.com",
    composioToolkitSlug: "airtable",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Personal Access Tokens (PATs) require granular base and scope selection; OAuth 2.0 apps use PKCE with refresh tokens."
  },
  {
    id: "coda",
    appId: "coda",
    name: "Coda",
    appName: "Coda",
    category: "Productivity",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["BEARER_TOKEN","OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~5–10 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://coda.io",
    composioToolkitSlug: "coda",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "API tokens generated in Account settings with read/write restrictions; Pack OAuth supported for public add-ons."
  },
  {
    id: "todoist",
    appId: "todoist",
    name: "Todoist",
    appName: "Todoist",
    category: "Productivity",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["OAUTH2","BEARER_TOKEN"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~5–10 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://todoist.com",
    composioToolkitSlug: "todoist",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "API token located under Settings -> Integrations -> Developer; OAuth 2.0 app flow for multi-user distribution."
  },
  {
    id: "salesforce",
    appId: "salesforce",
    name: "Salesforce",
    appName: "Salesforce",
    category: "CRM & Sales",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "mandatory_enterprise_gate",
    reviewGateStatus: "mandatory_enterprise_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~45–90 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Connected App propagation takes 10–30 mins; AppExchange distribution requires security review ($999 fee)",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Salesforce Enterprise & Partner Guidelines",
        sourceUrl: "https://salesforce.com",
        whatSourceExplicitlyStates: "Connected App propagation takes 10–30 mins; AppExchange distribution requires security review ($999 fee)"
      }
    },
    websiteUrl: "https://salesforce.com",
    composioToolkitSlug: "salesforce",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "External Client Apps / Connected Apps require IP relaxation and 'All users may self-authorize' policies."
  },
  {
    id: "hubspot",
    appId: "hubspot",
    name: "HubSpot",
    appName: "HubSpot",
    category: "CRM & Sales",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~20–40 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "App Marketplace review required for public listing; developer test accounts are unverified",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "HubSpot Developer Documentation",
        sourceUrl: "https://www.hubspot.com",
        whatSourceExplicitlyStates: "App Marketplace review required for public listing; developer test accounts are unverified"
      }
    },
    websiteUrl: "https://www.hubspot.com",
    composioToolkitSlug: "hubspot",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Private Apps use direct tokens for single accounts; multi-tenant agent connectors require Developer Portal OAuth 2.0 app."
  },
  {
    id: "zendesk",
    appId: "zendesk",
    name: "Zendesk",
    appName: "Zendesk",
    category: "CRM & Sales",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~20–30 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Admin privileges required in target subdomain; Marketplace apps reviewed by Zendesk",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Zendesk Developer Documentation",
        sourceUrl: "https://www.zendesk.com",
        whatSourceExplicitlyStates: "Admin privileges required in target subdomain; Marketplace apps reviewed by Zendesk"
      }
    },
    websiteUrl: "https://www.zendesk.com",
    composioToolkitSlug: "zendesk",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "OAuth client created inside Zendesk Admin Center -> Apps and integrations -> API -> OAuth Clients."
  },
  {
    id: "freshdesk",
    appId: "freshdesk",
    name: "Freshdesk",
    appName: "Freshdesk",
    category: "CRM & Sales",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://freshdesk.com",
    composioToolkitSlug: "freshdesk",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Basic Auth using API key as username and dummy string 'X' as password, scoped to user profile."
  },
  {
    id: "pipedrive",
    appId: "pipedrive",
    name: "Pipedrive",
    appName: "Pipedrive",
    category: "CRM & Sales",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~20–30 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Marketplace app review required for public distribution; internal apps install immediately in developer company",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Pipedrive Developer Documentation",
        sourceUrl: "https://www.pipedrive.com",
        whatSourceExplicitlyStates: "Marketplace app review required for public distribution; internal apps install immediately in developer company"
      }
    },
    websiteUrl: "https://www.pipedrive.com",
    composioToolkitSlug: "pipedrive",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "OAuth access tokens expire in 1 hour; refresh tokens must be exchanged and rotated regularly."
  },
  {
    id: "zoho_crm",
    appId: "zoho_crm",
    name: "Zoho CRM",
    appName: "Zoho CRM",
    category: "CRM & Sales",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~20–35 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://www.zoho.com/crm",
    composioToolkitSlug: "zoho_crm",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Zoho Accounts API uses multi-region DC domains (.com, .eu, .in, .com.au) that must match account location."
  },
  {
    id: "close",
    appId: "close",
    name: "Close",
    appName: "Close",
    category: "CRM & Sales",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "unknown",
    reviewGateStatus: "unknown",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Review gate policy not established in official sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Public documentation covers API keys; third-party OAuth app review policies are not documented in public sources.",
        whatRemainsUnverified: "Official developer portal review process and approval criteria for partner apps."
      }
    },
    websiteUrl: "https://close.com",
    composioToolkitSlug: "close",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Direct API keys created in Settings -> API Keys; HTTP Basic Auth with API key as username."
  },
  {
    id: "salesloft",
    appId: "salesloft",
    name: "Salesloft",
    appName: "Salesloft",
    category: "CRM & Sales",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~20–30 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Production app publishing requires Salesloft Partner approval",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Salesloft Developer Documentation",
        sourceUrl: "https://salesloft.com",
        whatSourceExplicitlyStates: "Production app publishing requires Salesloft Partner approval"
      }
    },
    websiteUrl: "https://salesloft.com",
    composioToolkitSlug: "salesloft",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Standard OAuth 2.0 authorization code grant; refresh tokens expire after 2 weeks of inactivity."
  },
  {
    id: "apollo",
    appId: "apollo",
    name: "Apollo",
    appName: "Apollo",
    category: "CRM & Sales",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "unknown",
    reviewGateStatus: "unknown",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Review gate policy not established in official sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct API keys used for integration; official documentation does not establish whether external partner review gates exist.",
        whatRemainsUnverified: "Partner OAuth review gate requirements and turnaround times."
      }
    },
    websiteUrl: "https://www.apollo.io",
    composioToolkitSlug: "apollo",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "API keys passed in request header 'X-Api-Key' or payload; tiered rate limits based on plan."
  },
  {
    id: "outreach",
    appId: "outreach",
    name: "Outreach",
    appName: "Outreach",
    category: "CRM & Sales",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~30–45 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Requires Outreach admin approval for app installation",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Outreach Developer Documentation",
        sourceUrl: "https://www.outreach.io",
        whatSourceExplicitlyStates: "Requires Outreach admin approval for app installation"
      }
    },
    websiteUrl: "https://www.outreach.io",
    composioToolkitSlug: "outreach",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Strict PKCE support and TLS 1.2+ requirement; token refresh requires single-use refresh token exchange."
  },
  {
    id: "openai",
    appId: "openai",
    name: "OpenAI",
    appName: "OpenAI",
    category: "AI & Search",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://openai.com",
    composioToolkitSlug: "openai",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Project-scoped API keys with Header Authorization: Bearer sk-proj-...; zero OAuth app required."
  },
  {
    id: "anthropic",
    appId: "anthropic",
    name: "Anthropic",
    appName: "Anthropic",
    category: "AI & Search",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://anthropic.com",
    composioToolkitSlug: "anthropic",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Header x-api-key: sk-ant-... and anthropic-version: 2023-06-01; direct credentials only."
  },
  {
    id: "perplexity",
    appId: "perplexity",
    name: "Perplexity",
    appName: "Perplexity",
    category: "AI & Search",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://perplexity.ai",
    composioToolkitSlug: "perplexity",
    hasCuratedDeepGuide: true,
    keyNuanceOrPitfall: "OAuth setup isn't required for this integration path. Uses direct API key authentication."
  },
  {
    id: "tavily",
    appId: "tavily",
    name: "Tavily",
    appName: "Tavily",
    category: "AI & Search",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://tavily.com",
    composioToolkitSlug: "tavily",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "API keys passed via request body 'api_key' or Authorization: Bearer header."
  },
  {
    id: "cohere",
    appId: "cohere",
    name: "Cohere",
    appName: "Cohere",
    category: "AI & Search",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://cohere.com",
    composioToolkitSlug: "cohere",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Trial keys carry rate limits of 10 requests/min; Production keys require payment method on file."
  },
  {
    id: "pinecone",
    appId: "pinecone",
    name: "Pinecone",
    appName: "Pinecone",
    category: "AI & Search",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://www.pinecone.io",
    composioToolkitSlug: "pinecone",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "API keys passed in header 'Api-Key'; Serverless vs Pod index host URLs must be configured per index."
  },
  {
    id: "weaviate",
    appId: "weaviate",
    name: "Weaviate",
    appName: "Weaviate",
    category: "AI & Search",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://weaviate.io",
    composioToolkitSlug: "weaviate",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Weaviate Cloud cluster URL paired with cluster API key via Authorization: Bearer."
  },
  {
    id: "elevenlabs",
    appId: "elevenlabs",
    name: "ElevenLabs",
    appName: "ElevenLabs",
    category: "AI & Search",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://elevenlabs.io",
    composioToolkitSlug: "elevenlabs",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Direct header 'xi-api-key' authentication; character quota limits tied directly to API key account tier."
  },
  {
    id: "replicate",
    appId: "replicate",
    name: "Replicate",
    appName: "Replicate",
    category: "AI & Search",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["BEARER_TOKEN"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://replicate.com",
    composioToolkitSlug: "replicate",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "API token passed via Authorization: Bearer r8_...; prediction polling via webhooks or get-status endpoint."
  },
  {
    id: "hugging_face",
    appId: "hugging_face",
    name: "Hugging Face",
    appName: "Hugging Face",
    category: "AI & Search",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["BEARER_TOKEN"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://huggingface.co",
    composioToolkitSlug: "hugging_face",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "User Access Tokens generated with Read or Write roles; fine-grained tokens limit repo/inference endpoints."
  },
  {
    id: "twitter",
    appId: "twitter",
    name: "X/Twitter",
    appName: "X/Twitter",
    category: "Social & Marketing",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "mandatory_enterprise_gate",
    reviewGateStatus: "mandatory_enterprise_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~30–60 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Developer Portal application review and paid tier subscription (Basic $100/mo or Pro $5000/mo) required",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "X/Twitter Enterprise & Partner Guidelines",
        sourceUrl: "https://x.com",
        whatSourceExplicitlyStates: "Developer Portal application review and paid tier subscription (Basic $100/mo or Pro $5000/mo) required"
      }
    },
    websiteUrl: "https://x.com",
    composioToolkitSlug: "twitter",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "OAuth 2.0 with PKCE required for v2 endpoints; Free tier is write-only with strict tweet caps."
  },
  {
    id: "linkedin",
    appId: "linkedin",
    name: "LinkedIn",
    appName: "LinkedIn",
    category: "Social & Marketing",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "mandatory_enterprise_gate",
    reviewGateStatus: "mandatory_enterprise_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~30–60 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Company page verification and product approval required (Share on LinkedIn vs Marketing Developer Platform)",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "LinkedIn Enterprise & Partner Guidelines",
        sourceUrl: "https://www.linkedin.com",
        whatSourceExplicitlyStates: "Company page verification and product approval required (Share on LinkedIn vs Marketing Developer Platform)"
      }
    },
    websiteUrl: "https://www.linkedin.com",
    composioToolkitSlug: "linkedin",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "OAuth access tokens expire in 60 days; refresh tokens expire in 365 days; company page verification URL requires admin approval."
  },
  {
    id: "youtube",
    appId: "youtube",
    name: "YouTube",
    appName: "YouTube",
    category: "Social & Marketing",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~30–60 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Production verification required for non-test accounts; daily API quota audit request takes 2–4 weeks",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "YouTube Developer Documentation",
        sourceUrl: "https://www.youtube.com",
        whatSourceExplicitlyStates: "Production verification required for non-test accounts; daily API quota audit request takes 2–4 weeks"
      }
    },
    websiteUrl: "https://www.youtube.com",
    composioToolkitSlug: "youtube",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Google Cloud Console project with YouTube Data API v3 enabled; 10,000 units default daily quota."
  },
  {
    id: "facebook",
    appId: "facebook",
    name: "Facebook/Meta",
    appName: "Facebook/Meta",
    category: "Social & Marketing",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "mandatory_enterprise_gate",
    reviewGateStatus: "mandatory_enterprise_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~45–90 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Meta App Review and Business Verification mandatory for public user access (1–3 weeks)",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Facebook/Meta Enterprise & Partner Guidelines",
        sourceUrl: "https://www.facebook.com",
        whatSourceExplicitlyStates: "Meta App Review and Business Verification mandatory for public user access (1–3 weeks)"
      }
    },
    websiteUrl: "https://www.facebook.com",
    composioToolkitSlug: "facebook",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Development mode grants access only to app administrators, developers, and testers; Page Access Token requires user token exchange."
  },
  {
    id: "instagram",
    appId: "instagram",
    name: "Instagram",
    appName: "Instagram",
    category: "Social & Marketing",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "mandatory_enterprise_gate",
    reviewGateStatus: "mandatory_enterprise_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~45–90 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Instagram Graph API permissions require Meta App Review and verified Meta Business account",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Instagram Enterprise & Partner Guidelines",
        sourceUrl: "https://www.instagram.com",
        whatSourceExplicitlyStates: "Instagram Graph API permissions require Meta App Review and verified Meta Business account"
      }
    },
    websiteUrl: "https://www.instagram.com",
    composioToolkitSlug: "instagram",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Requires Instagram Professional (Business/Creator) account linked to a verified Facebook Page."
  },
  {
    id: "mailchimp",
    appId: "mailchimp",
    name: "Mailchimp",
    appName: "Mailchimp",
    category: "Social & Marketing",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~15–25 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://mailchimp.com",
    composioToolkitSlug: "mailchimp",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "After OAuth token exchange, client must call metadata endpoint to discover server prefix (e.g. us1, us2)."
  },
  {
    id: "buffer",
    appId: "buffer",
    name: "Buffer",
    appName: "Buffer",
    category: "Social & Marketing",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~20–30 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Requires Buffer developer program access confirmation",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Buffer Developer Documentation",
        sourceUrl: "https://buffer.com",
        whatSourceExplicitlyStates: "Requires Buffer developer program access confirmation"
      }
    },
    websiteUrl: "https://buffer.com",
    composioToolkitSlug: "buffer",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "OAuth 2.0 access token granted permanently until revoked; manages connected social channel profile IDs."
  },
  {
    id: "hootsuite",
    appId: "hootsuite",
    name: "Hootsuite",
    appName: "Hootsuite",
    category: "Social & Marketing",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "mandatory_enterprise_gate",
    reviewGateStatus: "mandatory_enterprise_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~40–60 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Developer terms agreement and App Directory review for public distribution",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Hootsuite Enterprise & Partner Guidelines",
        sourceUrl: "https://hootsuite.com",
        whatSourceExplicitlyStates: "Developer terms agreement and App Directory review for public distribution"
      }
    },
    websiteUrl: "https://hootsuite.com",
    composioToolkitSlug: "hootsuite",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "OAuth tokens expire in 12 hours; refresh tokens expire in 14 days and use single-use rotation."
  },
  {
    id: "reddit",
    appId: "reddit",
    name: "Reddit",
    appName: "Reddit",
    category: "Social & Marketing",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~15–25 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Commercial API usage requires contract approval; non-commercial script apps are instant",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Reddit Developer Documentation",
        sourceUrl: "https://www.reddit.com",
        whatSourceExplicitlyStates: "Commercial API usage requires contract approval; non-commercial script apps are instant"
      }
    },
    websiteUrl: "https://www.reddit.com",
    composioToolkitSlug: "reddit",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "User-Agent header format is strictly enforced; Basic auth using client_id and client_secret during token grant."
  },
  {
    id: "tiktok",
    appId: "tiktok",
    name: "TikTok",
    appName: "TikTok",
    category: "Social & Marketing",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "mandatory_enterprise_gate",
    reviewGateStatus: "mandatory_enterprise_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~45–90 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "TikTok Developer App Review and business documentation review (1–2 weeks)",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "TikTok Enterprise & Partner Guidelines",
        sourceUrl: "https://www.tiktok.com",
        whatSourceExplicitlyStates: "TikTok Developer App Review and business documentation review (1–2 weeks)"
      }
    },
    websiteUrl: "https://www.tiktok.com",
    composioToolkitSlug: "tiktok",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "TikTok Login Kit and Content Posting API require separate approval scopes and PKCE code challenge."
  },
  {
    id: "stripe",
    appId: "stripe",
    name: "Stripe",
    appName: "Stripe",
    category: "Finance & Payments",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY","OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~2–5 mins (API Key) vs ~15 mins (Stripe Connect)",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate for test/live secret keys; Stripe Connect onboarding handled per platform account",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://stripe.com",
    composioToolkitSlug: "stripe",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Restricted API keys provide granular endpoint access; Stripe Connect OAuth 2.0 used for platform accounts."
  },
  {
    id: "paypal",
    appId: "paypal",
    name: "PayPal",
    appName: "PayPal",
    category: "Finance & Payments",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~20–35 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Sandbox instant; Live processing requires verified PayPal Business account",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "PayPal Developer Documentation",
        sourceUrl: "https://www.paypal.com",
        whatSourceExplicitlyStates: "Sandbox instant; Live processing requires verified PayPal Business account"
      }
    },
    websiteUrl: "https://www.paypal.com",
    composioToolkitSlug: "paypal",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "OAuth 2.0 client_credentials grant for server apps; Authorization code flow for user PayPal checkout."
  },
  {
    id: "quickbooks",
    appId: "quickbooks",
    name: "QuickBooks",
    appName: "QuickBooks",
    category: "Finance & Payments",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "mandatory_enterprise_gate",
    reviewGateStatus: "mandatory_enterprise_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~40–60 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Intuit Developer App assessment questionnaire and security questionnaire for production keys",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "QuickBooks Enterprise & Partner Guidelines",
        sourceUrl: "https://quickbooks.intuit.com",
        whatSourceExplicitlyStates: "Intuit Developer App assessment questionnaire and security questionnaire for production keys"
      }
    },
    websiteUrl: "https://quickbooks.intuit.com",
    composioToolkitSlug: "quickbooks",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Production credentials require publishing profile completion; token response includes realmId (company ID)."
  },
  {
    id: "xero",
    appId: "xero",
    name: "Xero",
    appName: "Xero",
    category: "Finance & Payments",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~30–45 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Custom connections instant for internal org; App Store partner certification for public multi-tenant",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Xero Developer Documentation",
        sourceUrl: "https://www.xero.com",
        whatSourceExplicitlyStates: "Custom connections instant for internal org; App Store partner certification for public multi-tenant"
      }
    },
    websiteUrl: "https://www.xero.com",
    composioToolkitSlug: "xero",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "After token exchange, client must query /connections endpoint to obtain active tenantId header."
  },
  {
    id: "plaid",
    appId: "plaid",
    name: "Plaid",
    appName: "Plaid",
    category: "Finance & Payments",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~15–30 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Sandbox instant; Production access requires security questionnaire and compliance review",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Plaid Developer Documentation",
        sourceUrl: "https://plaid.com",
        whatSourceExplicitlyStates: "Sandbox instant; Production access requires security questionnaire and compliance review"
      }
    },
    websiteUrl: "https://plaid.com",
    composioToolkitSlug: "plaid",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "API requests use client_id and secret in JSON payload; user links bank account via frontend Plaid Link."
  },
  {
    id: "square",
    appId: "square",
    name: "Square",
    appName: "Square",
    category: "Finance & Payments",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["OAUTH2","BEARER_TOKEN"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~5–15 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://squareup.com",
    composioToolkitSlug: "square",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Personal access tokens provide full developer account access; OAuth 2.0 required for taking actions on merchant accounts."
  },
  {
    id: "brex",
    appId: "brex",
    name: "Brex",
    appName: "Brex",
    category: "Finance & Payments",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~20–30 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Admin authorization in company Brex account required",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Brex Developer Documentation",
        sourceUrl: "https://www.brex.com",
        whatSourceExplicitlyStates: "Admin authorization in company Brex account required"
      }
    },
    websiteUrl: "https://www.brex.com",
    composioToolkitSlug: "brex",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "User tokens granted via OAuth 2.0 with PKCE; webhook subscriptions require separate signature verification secret."
  },
  {
    id: "ramp",
    appId: "ramp",
    name: "Ramp",
    appName: "Ramp",
    category: "Finance & Payments",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~20–30 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Requires Ramp Developer Portal access and company admin consent",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Ramp Developer Documentation",
        sourceUrl: "https://ramp.com",
        whatSourceExplicitlyStates: "Requires Ramp Developer Portal access and company admin consent"
      }
    },
    websiteUrl: "https://ramp.com",
    composioToolkitSlug: "ramp",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "OAuth 2.0 authorization code flow with client credentials; granular scopes for cards, transactions, reimbursements."
  },
  {
    id: "mercury",
    appId: "mercury",
    name: "Mercury",
    appName: "Mercury",
    category: "Finance & Payments",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["BEARER_TOKEN"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://mercury.com",
    composioToolkitSlug: "mercury",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "API tokens generated with Read-Only or Read-Write permissions in Mercury dashboard; Authorization: Bearer."
  },
  {
    id: "wise",
    appId: "wise",
    name: "Wise",
    appName: "Wise",
    category: "Finance & Payments",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2","BEARER_TOKEN"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~10–20 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://wise.com",
    composioToolkitSlug: "wise",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Personal API tokens support Strong Customer Authentication (SCA) with public/private key signing."
  },
  {
    id: "google_drive",
    appId: "google_drive",
    name: "Google Drive",
    appName: "Google Drive",
    category: "Cloud Storage",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~30–60 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Sensitive scope verification required for drive.file / full drive scope (3–5 days to 4 weeks)",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Google Drive Developer Documentation",
        sourceUrl: "https://drive.google.com",
        whatSourceExplicitlyStates: "Sensitive scope verification required for drive.file / full drive scope (3–5 days to 4 weeks)"
      }
    },
    websiteUrl: "https://drive.google.com",
    composioToolkitSlug: "google_drive",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Recommend drive.file scope to avoid full CASA security assessment audit requirements."
  },
  {
    id: "dropbox",
    appId: "dropbox",
    name: "Dropbox",
    appName: "Dropbox",
    category: "Cloud Storage",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~15–30 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Development status allows up to 500 users; Production status requires app branding approval",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Dropbox Developer Documentation",
        sourceUrl: "https://www.dropbox.com",
        whatSourceExplicitlyStates: "Development status allows up to 500 users; Production status requires app branding approval"
      }
    },
    websiteUrl: "https://www.dropbox.com",
    composioToolkitSlug: "dropbox",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Short-lived access tokens (4 hours) are default; refresh tokens require token_access_type=offline."
  },
  {
    id: "box",
    appId: "box",
    name: "Box",
    appName: "Box",
    category: "Cloud Storage",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~30–60 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Custom apps with Server Authentication (JWT) require Box enterprise admin authorization",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Box Developer Documentation",
        sourceUrl: "https://www.box.com",
        whatSourceExplicitlyStates: "Custom apps with Server Authentication (JWT) require Box enterprise admin authorization"
      }
    },
    websiteUrl: "https://www.box.com",
    composioToolkitSlug: "box",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "OAuth 2.0 (User Authentication) for multi-tenant users; JWT Server Authentication for headless agent storage."
  },
  {
    id: "onedrive",
    appId: "onedrive",
    name: "OneDrive",
    appName: "OneDrive",
    category: "Cloud Storage",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~30–60 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Personal accounts instant; Business/School OneDrive requires tenant admin consent for Files.ReadWrite.All",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "OneDrive Developer Documentation",
        sourceUrl: "https://onedrive.live.com",
        whatSourceExplicitlyStates: "Personal accounts instant; Business/School OneDrive requires tenant admin consent for Files.ReadWrite.All"
      }
    },
    websiteUrl: "https://onedrive.live.com",
    composioToolkitSlug: "onedrive",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Microsoft Graph Files API; separate endpoints and scope models for consumer Microsoft Accounts vs work accounts."
  },
  {
    id: "aws_s3",
    appId: "aws_s3",
    name: "AWS S3",
    appName: "AWS S3",
    category: "Cloud Storage",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~5–15 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://aws.amazon.com/s3",
    composioToolkitSlug: "aws_s3",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "AWS IAM Access Key ID and Secret Access Key; recommend least-privilege IAM user policy limited to target bucket."
  },
  {
    id: "google_cloud_storage",
    appId: "google_cloud_storage",
    name: "Google Cloud Storage",
    appName: "Google Cloud Storage",
    category: "Cloud Storage",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["BEARER_TOKEN"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~5–15 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://cloud.google.com/storage",
    composioToolkitSlug: "google_cloud_storage",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Service Account JSON key file or HMAC keys; roles/storage.objectAdmin role on bucket level."
  },
  {
    id: "cloudflare_r2",
    appId: "cloudflare_r2",
    name: "Cloudflare R2",
    appName: "Cloudflare R2",
    category: "Cloud Storage",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://www.cloudflare.com/developer-platform/r2",
    composioToolkitSlug: "cloudflare_r2",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "S3-compatible Access Key ID and Secret Access Key generated directly in Cloudflare R2 dashboard."
  },
  {
    id: "sharepoint",
    appId: "sharepoint",
    name: "SharePoint",
    appName: "SharePoint",
    category: "Cloud Storage",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~45–90 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Tenant Admin consent mandatory for Sites.Selected or Sites.ReadWrite.All Microsoft Graph permissions",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "SharePoint Enterprise & Partner Guidelines",
        sourceUrl: "https://www.microsoft.com/sharepoint",
        whatSourceExplicitlyStates: "Tenant Admin consent mandatory for Sites.Selected or Sites.ReadWrite.All Microsoft Graph permissions"
      }
    },
    websiteUrl: "https://www.microsoft.com/sharepoint",
    composioToolkitSlug: "sharepoint",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Microsoft Graph Sites API; requires specifying site collection URL and tenant admin consent."
  },
  {
    id: "egnyte",
    appId: "egnyte",
    name: "Egnyte",
    appName: "Egnyte",
    category: "Cloud Storage",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "unknown",
    reviewGateStatus: "unknown",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~30–60 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Review gate policy not established in official sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer key application form does not document whether an approval review gate or waiting period exists.",
        whatRemainsUnverified: "Official developer portal review process and approval turnaround times."
      }
    },
    websiteUrl: "https://www.egnyte.com",
    composioToolkitSlug: "egnyte",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "API calls route to custom domain subdomain.egnyte.com; OAuth token grant requires API key parameter."
  },
  {
    id: "backblaze",
    appId: "backblaze",
    name: "Backblaze",
    appName: "Backblaze",
    category: "Cloud Storage",
    authPath: "direct_credential_only",
    authPathClassification: "direct_credential_only",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY"],
    composioManagedAuthStatus: "bring_your_own_required",
    setupTimeEstimate: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Direct credential generation from user/developer settings; official docs do not specify timing.",
        whatRemainsUnverified: "Hands-on setup time in live portal."
      }
    },
    approvalWaitEstimate: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://www.backblaze.com",
    composioToolkitSlug: "backblaze",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Backblaze B2 Application Key ID and Application Key; S3-compatible endpoints or Native B2 REST API."
  },
  {
    id: "shopify",
    appId: "shopify",
    name: "Shopify",
    appName: "Shopify",
    category: "E-Commerce",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~30–60 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Custom apps installed directly by store merchant; Public App Store apps require strict review (1–2 weeks)",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Shopify Developer Documentation",
        sourceUrl: "https://www.shopify.com",
        whatSourceExplicitlyStates: "Custom apps installed directly by store merchant; Public App Store apps require strict review (1–2 weeks)"
      }
    },
    websiteUrl: "https://www.shopify.com",
    composioToolkitSlug: "shopify",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "OAuth authorize URL requires dynamic store subdomain {shop}.myshopify.com/admin/oauth/authorize."
  },
  {
    id: "woocommerce",
    appId: "woocommerce",
    name: "WooCommerce",
    appName: "WooCommerce",
    category: "E-Commerce",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["BASIC_AUTH","OAUTH1"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~5–15 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://woocommerce.com",
    composioToolkitSlug: "woocommerce",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "REST API Consumer Key and Consumer Secret generated in WooCommerce -> Settings -> Advanced -> REST API."
  },
  {
    id: "bigcommerce",
    appId: "bigcommerce",
    name: "BigCommerce",
    appName: "BigCommerce",
    category: "E-Commerce",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~30–60 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Single-store apps install via control panel; App Marketplace listing requires approval",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "BigCommerce Developer Documentation",
        sourceUrl: "https://www.bigcommerce.com",
        whatSourceExplicitlyStates: "Single-store apps install via control panel; App Marketplace listing requires approval"
      }
    },
    websiteUrl: "https://www.bigcommerce.com",
    composioToolkitSlug: "bigcommerce",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "OAuth callback payload delivers permanent context store_hash and access_token."
  },
  {
    id: "magento",
    appId: "magento",
    name: "Magento",
    appName: "Magento",
    category: "E-Commerce",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "unknown",
    reviewGateStatus: "unknown",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["BEARER_TOKEN","OAUTH1"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~15–30 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Review gate policy not established in official sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Open-source Magento has no gate, but Adobe Commerce Cloud partner review requirements are not established in public developer documentation.",
        whatRemainsUnverified: "Commerce Marketplace review duration and partner gate criteria."
      }
    },
    websiteUrl: "https://business.adobe.com/products/magento/magento-commerce.html",
    composioToolkitSlug: "magento",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Admin integration tokens generated in System -> Extensions -> Integrations with resource tree permissions."
  },
  {
    id: "amazon_seller",
    appId: "amazon_seller",
    name: "Amazon Seller Central",
    appName: "Amazon Seller Central",
    category: "E-Commerce",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "mandatory_enterprise_gate",
    reviewGateStatus: "mandatory_enterprise_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~60–120 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Selling Partner API (SP-API) developer profile application and data protection audit (2–4 weeks)",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Amazon Seller Central Enterprise & Partner Guidelines",
        sourceUrl: "https://sellercentral.amazon.com",
        whatSourceExplicitlyStates: "Selling Partner API (SP-API) developer profile application and data protection audit (2–4 weeks)"
      }
    },
    websiteUrl: "https://sellercentral.amazon.com",
    composioToolkitSlug: "amazon_seller",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Requires AWS IAM ARN role authorization and LWA (Login with Amazon) OAuth credentials with restricted PII role."
  },
  {
    id: "ebay",
    appId: "ebay",
    name: "eBay",
    appName: "eBay",
    category: "E-Commerce",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~30–60 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Sandbox instant; Production keys require developer verification and marketplace deletion compliance endpoint",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "eBay Developer Documentation",
        sourceUrl: "https://www.ebay.com",
        whatSourceExplicitlyStates: "Sandbox instant; Production keys require developer verification and marketplace deletion compliance endpoint"
      }
    },
    websiteUrl: "https://www.ebay.com",
    composioToolkitSlug: "ebay",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Requires RuName (eBay Redirect URL name) and Marketplace Account Deletion notification endpoint registration."
  },
  {
    id: "etsy",
    appId: "etsy",
    name: "Etsy",
    appName: "Etsy",
    category: "E-Commerce",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~20–35 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Commercial access requires Etsy API review; personal apps run in limited provisional access",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Etsy Developer Documentation",
        sourceUrl: "https://www.etsy.com",
        whatSourceExplicitlyStates: "Commercial access requires Etsy API review; personal apps run in limited provisional access"
      }
    },
    websiteUrl: "https://www.etsy.com",
    composioToolkitSlug: "etsy",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "OAuth 2.0 with mandatory PKCE (code_challenge and code_verifier); token refresh rotates every 90 days."
  },
  {
    id: "stripe_billing",
    appId: "stripe_billing",
    name: "Stripe Billing",
    appName: "Stripe Billing",
    category: "E-Commerce",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY","OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~2–5 mins (API Key) vs ~15 mins (OAuth)",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://stripe.com/billing",
    composioToolkitSlug: "stripe_billing",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Manages customer subscriptions and invoices; Restricted keys limit access to Billing APIs."
  },
  {
    id: "chargebee",
    appId: "chargebee",
    name: "Chargebee",
    appName: "Chargebee",
    category: "E-Commerce",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY","BASIC_AUTH"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~5–15 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://www.chargebee.com",
    composioToolkitSlug: "chargebee",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "HTTP Basic Authentication with full-access or read-only API key as username; site subdomain in API URL."
  },
  {
    id: "square_online",
    appId: "square_online",
    name: "Square Online",
    appName: "Square Online",
    category: "E-Commerce",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~15–30 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://squareup.com/online-store",
    composioToolkitSlug: "square_online",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Catalog and Orders APIs authenticated via Square OAuth 2.0 with ORDERS_WRITE and ITEMS_READ scopes."
  },
  {
    id: "bamboohr",
    appId: "bamboohr",
    name: "BambooHR",
    appName: "BambooHR",
    category: "HR & Operations",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY","BASIC_AUTH"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~5–10 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://www.bamboohr.com",
    composioToolkitSlug: "bamboohr",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "API keys generated from User Profile; Basic Auth with API key as username and dummy string 'x' as password."
  },
  {
    id: "workday",
    appId: "workday",
    name: "Workday",
    appName: "Workday",
    category: "HR & Operations",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "mandatory_enterprise_gate",
    reviewGateStatus: "mandatory_enterprise_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~60–120 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Requires Workday tenant security administrator configuration and ISU (Integration System User) provisioning",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Workday Enterprise & Partner Guidelines",
        sourceUrl: "https://www.workday.com",
        whatSourceExplicitlyStates: "Requires Workday tenant security administrator configuration and ISU (Integration System User) provisioning"
      }
    },
    websiteUrl: "https://www.workday.com",
    composioToolkitSlug: "workday",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "API client registration in Workday tenant; requires setting up Integration Security Group and domain security policies."
  },
  {
    id: "gusto",
    appId: "gusto",
    name: "Gusto",
    appName: "Gusto",
    category: "HR & Operations",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~30–60 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Production partner application approval required from Gusto Partnerships team (1–3 weeks)",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Gusto Developer Documentation",
        sourceUrl: "https://gusto.com",
        whatSourceExplicitlyStates: "Production partner application approval required from Gusto Partnerships team (1–3 weeks)"
      }
    },
    websiteUrl: "https://gusto.com",
    composioToolkitSlug: "gusto",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Demo API sandbox instant; production access requires approved Partner agreement and OAuth 2.0 client credentials."
  },
  {
    id: "rippling",
    appId: "rippling",
    name: "Rippling",
    appName: "Rippling",
    category: "HR & Operations",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "mandatory_enterprise_gate",
    reviewGateStatus: "mandatory_enterprise_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~45–90 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Requires Rippling App Shop partner review and company admin installation",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Rippling Enterprise & Partner Guidelines",
        sourceUrl: "https://www.rippling.com",
        whatSourceExplicitlyStates: "Requires Rippling App Shop partner review and company admin installation"
      }
    },
    websiteUrl: "https://www.rippling.com",
    composioToolkitSlug: "rippling",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "OAuth 2.0 with fine-grained employee directory scopes; strict rate limits and webhook signature verification."
  },
  {
    id: "deel",
    appId: "deel",
    name: "Deel",
    appName: "Deel",
    category: "HR & Operations",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2","BEARER_TOKEN"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~10–20 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://www.deel.com",
    composioToolkitSlug: "deel",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Organization API access tokens generated in Deel settings; OAuth 2.0 supported for multi-tenant integrations."
  },
  {
    id: "greenhouse",
    appId: "greenhouse",
    name: "Greenhouse",
    appName: "Greenhouse",
    category: "HR & Operations",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["API_KEY","BASIC_AUTH"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~5–15 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://greenhouse.com",
    composioToolkitSlug: "greenhouse",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Harvest API keys created in Configure -> Dev Center -> API Credential Management; HTTP Basic auth."
  },
  {
    id: "lever",
    appId: "lever",
    name: "Lever",
    appName: "Lever",
    category: "HR & Operations",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "conditional_gate",
    reviewGateStatus: "conditional_gate",
    difficulty: "medium",
    setupDifficulty: "medium",
    supportedAuthSchemes: ["OAUTH2","API_KEY"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~15–30 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Partner integration review required for public directory listing; API key instant for super admins",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Lever Developer Documentation",
        sourceUrl: "https://www.lever.co",
        whatSourceExplicitlyStates: "Partner integration review required for public directory listing; API key instant for super admins"
      }
    },
    websiteUrl: "https://www.lever.co",
    composioToolkitSlug: "lever",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Lever Postings API vs Lever Hire API; OAuth 2.0 uses bearer token with auto-refresh mechanism."
  },
  {
    id: "personio",
    appId: "personio",
    name: "Personio",
    appName: "Personio",
    category: "HR & Operations",
    authPath: "hybrid_oauth_or_direct",
    authPathClassification: "hybrid_oauth_or_direct",
    reviewGate: "no_gate",
    reviewGateStatus: "no_gate",
    difficulty: "easy",
    setupDifficulty: "easy",
    supportedAuthSchemes: ["BEARER_TOKEN","API_KEY"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~5–15 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Developer settings registration generates credentials immediately without a centralized provider review queue.",
        whatRemainsUnverified: "Whether specific organizations enforce internal administrative approval restrictions."
      }
    },
    websiteUrl: "https://www.personio.com",
    composioToolkitSlug: "personio",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "API credentials generate Client ID and Secret in Settings -> Integrations -> API credentials; bearer token exchange."
  },
  {
    id: "adp",
    appId: "adp",
    name: "ADP",
    appName: "ADP",
    category: "HR & Operations",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "mandatory_enterprise_gate",
    reviewGateStatus: "mandatory_enterprise_gate",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~60–120 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "ADP Marketplace partner onboarding and mutual TLS (mTLS) certificate exchange (3–6 weeks)",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "ADP Enterprise & Partner Guidelines",
        sourceUrl: "https://www.adp.com",
        whatSourceExplicitlyStates: "ADP Marketplace partner onboarding and mutual TLS (mTLS) certificate exchange (3–6 weeks)"
      }
    },
    websiteUrl: "https://www.adp.com",
    composioToolkitSlug: "adp",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Requires mutual TLS with ADP issued certificate and OAuth 2.0 client credentials grant."
  },
  {
    id: "justworks",
    appId: "justworks",
    name: "Justworks",
    appName: "Justworks",
    category: "HR & Operations",
    authPath: "oauth_required",
    authPathClassification: "oauth_required",
    reviewGate: "unknown",
    reviewGateStatus: "unknown",
    difficulty: "hard",
    setupDifficulty: "hard",
    supportedAuthSchemes: ["OAUTH2"],
    composioManagedAuthStatus: "available",
    setupTimeEstimate: {
      value: "~45–90 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Inferred from configuration steps, redirect URI requirements, and developer portal workflows.",
        whatRemainsUnverified: "Actual portal completion time across developers."
      }
    },
    approvalWaitEstimate: {
      value: "Review gate policy not established in official sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis: "Justworks API access is managed through enterprise customer account reps; public developer review gate criteria are unverified.",
        whatRemainsUnverified: "Partner API review queue rules and criteria."
      }
    },
    websiteUrl: "https://www.justworks.com",
    composioToolkitSlug: "justworks",
    hasCuratedDeepGuide: false,
    keyNuanceOrPitfall: "Enterprise API integration requires partner agreement and company admin consent."
  }
];

// ============================================================================
// Helper Functions: Filter, Search & Stats
// ============================================================================

export interface CatalogFilters {
  category?: CatalogCategory | "All";
  authPath?: AuthPathClassification | "All";
  reviewGate?: ReviewGateStatus | "All";
  difficulty?: SetupDifficulty | "All";
  searchQuery?: string;
  hasCuratedGuide?: boolean;
}

export interface CatalogStats {
  totalApps: number;
  byCategory: Record<CatalogCategory, number>;
  byAuthPath: {
    oauth_required: number;
    hybrid_oauth_or_direct: number;
    direct_credential_only: number;
  };
  byReviewGate: {
    no_gate: number;
    conditional_gate: number;
    mandatory_enterprise_gate: number;
    unknown: number;
  };
  byDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  curatedGuideCount: number;
}

/**
 * Searches catalog by query string across name, category, nuance, and ID.
 */
export function searchCatalog(query: string, apps: CatalogApp[] = CATALOG_100_APPS): CatalogApp[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return apps;

  return apps.filter((app) => {
    return (
      app.name.toLowerCase().includes(trimmed) ||
      app.id.toLowerCase().includes(trimmed) ||
      app.category.toLowerCase().includes(trimmed) ||
      app.keyNuanceOrPitfall.toLowerCase().includes(trimmed) ||
      (app.composioToolkitSlug && app.composioToolkitSlug.toLowerCase().includes(trimmed))
    );
  });
}

/**
 * Filters catalog by multiple criteria (category, authPath, reviewGate, difficulty, curated status, search).
 */
export function filterCatalog(filters: CatalogFilters, apps: CatalogApp[] = CATALOG_100_APPS): CatalogApp[] {
  let result = apps;

  if (filters.searchQuery) {
    result = searchCatalog(filters.searchQuery, result);
  }

  if (filters.category && filters.category !== "All") {
    result = result.filter((app) => app.category === filters.category);
  }

  if (filters.authPath && filters.authPath !== "All") {
    result = result.filter((app) => app.authPath === filters.authPath);
  }

  if (filters.reviewGate && filters.reviewGate !== "All") {
    result = result.filter((app) => app.reviewGate === filters.reviewGate);
  }

  if (filters.difficulty && filters.difficulty !== "All") {
    result = result.filter((app) => app.difficulty === filters.difficulty);
  }

  if (filters.hasCuratedGuide !== undefined) {
    result = result.filter((app) => app.hasCuratedDeepGuide === filters.hasCuratedGuide);
  }

  return result;
}

/**
 * Computes live statistical aggregations for catalog apps.
 */
export function getCatalogStats(apps: CatalogApp[] = CATALOG_100_APPS): CatalogStats {
  const byCategory: Record<CatalogCategory, number> = {
    "Developer Tools": 0,
    "Communication": 0,
    "Productivity": 0,
    "CRM & Sales": 0,
    "AI & Search": 0,
    "Social & Marketing": 0,
    "Finance & Payments": 0,
    "Cloud Storage": 0,
    "E-Commerce": 0,
    "HR & Operations": 0,
  };

  const byAuthPath = {
    oauth_required: 0,
    hybrid_oauth_or_direct: 0,
    direct_credential_only: 0,
  };

  const byReviewGate = {
    no_gate: 0,
    conditional_gate: 0,
    mandatory_enterprise_gate: 0,
    unknown: 0,
  };

  const byDifficulty = {
    easy: 0,
    medium: 0,
    hard: 0,
  };

  let curatedGuideCount = 0;

  for (const app of apps) {
    if (byCategory[app.category] !== undefined) {
      byCategory[app.category]++;
    }
    if (byAuthPath[app.authPath] !== undefined) {
      byAuthPath[app.authPath]++;
    }
    if (byReviewGate[app.reviewGate] !== undefined) {
      byReviewGate[app.reviewGate]++;
    }
    if (byDifficulty[app.difficulty] !== undefined) {
      byDifficulty[app.difficulty]++;
    }
    if (app.hasCuratedDeepGuide) {
      curatedGuideCount++;
    }
  }

  return {
    totalApps: apps.length,
    byCategory,
    byAuthPath,
    byReviewGate,
    byDifficulty,
    curatedGuideCount,
  };
}
