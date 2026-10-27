/**
 * src/data/curatedGuides.ts
 * Five Deep Curated Guides for APM Integrations OAuth Readiness Copilot
 *
 * Grounded in official provider documentation and strict epistemic honesty.
 * Every metric, setup duration, and approval gate assumption is explicitly tagged
 * as tested_live, documented_not_tested, or unverified_hypothesis.
 */

import { IntegrationReadinessGuide } from "../types/guide";

export const GITHUB_GUIDE: IntegrationReadinessGuide = {
  appId: "github",
  appName: "GitHub",
  websiteUrl: "https://github.com",
  composioToolkitSlug: "github",
  supportedAuthSchemes: {
    value: ["OAUTH2", "BEARER_TOKEN"],
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "GitHub REST API Authentication",
      sourceUrl:
        "https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api",
      whatSourceExplicitlyStates:
        "You can authenticate to the GitHub API using a personal access token or through an OAuth app.",
    },
  },
  composioManagedAuthStatus: {
    value: "available",
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Composio Managed Auth Documentation",
      sourceUrl: "https://docs.composio.dev/toolkits/managed-auth",
      whatSourceExplicitlyStates:
        "Composio provides managed OAuth credentials for GitHub, allowing instant user connections without developer app registration.",
    },
  },
  readinessSummary: {
    authPathClassification: "hybrid_oauth_or_direct",
    oauthNecessityBanner:
      "OAuth setup is optional. For single-user agent scripts or personal automation, a Personal Access Token (PAT) with fine-grained permissions or classic repo scope requires zero OAuth app registration. Register a custom OAuth App or GitHub App only when connecting arbitrary third-party GitHub users.",
    activeSetupTime: {
      value: "~5–10 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis:
          "Inferred from 4 required form fields in GitHub Developer Settings (Application name, Homepage URL, Callback URL, Description); official docs do not state setup duration.",
        whatRemainsUnverified:
          "Actual portal completion time and organization-level approval turnaround rules.",
      },
    },
    approvalWaitTime: {
      value: "No review gate identified in the sources checked",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis:
          "Developer settings registration ends immediately upon clicking 'Register application', generating a Client ID instantly without a centralized GitHub review queue.",
        whatRemainsUnverified:
          "Whether target organizations have enabled 'OAuth App access restrictions' which require individual organization owner approvals.",
      },
    },
    oneLineSummary:
      "Instant self-serve client ID with no central review queue, but defaults to 8-hour expiring user tokens and can be blocked by organization third-party restrictions.",
  },
  prerequisites: {
    value: [
      {
        item: "GitHub Account",
        requiredForTesting: true,
        requiredForProduction: true,
        detail:
          "A valid personal or organization GitHub account with verified email address.",
      },
      {
        item: "Organization Admin Permissions (Optional)",
        requiredForTesting: false,
        requiredForProduction: false,
        detail:
          "Required only if your agent accesses organizational repositories subject to third-party access restrictions.",
      },
      {
        item: "Composio Workspace Account",
        requiredForTesting: true,
        requiredForProduction: true,
        detail:
          "Access to Composio dashboard to retrieve your active redirect URI or configure custom auth credentials.",
      },
    ],
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Creating an OAuth App - GitHub Docs",
      sourceUrl:
        "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app",
      whatSourceExplicitlyStates:
        "You can create an OAuth app under your personal account or under any organization you have administrative access to.",
    },
  },
  authSpec: {
    mode: "hybrid",
    pathDecisionGuide: {
      value:
        "Choose Direct Credential (PAT) if building internal scripts, cron agents, or single-user assistants where you own the GitHub account. Choose OAuth 2.0 if building multi-user applications where external end-users need to grant your agent access to their repositories.",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "GitHub Apps vs OAuth Apps",
        sourceUrl:
          "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps",
        whatSourceExplicitlyStates:
          "OAuth apps act as the authenticated user, while personal access tokens allow direct authentication for personal use cases.",
      },
    },
    directCredentialPath: {
      mode: "direct_credential",
      scheme: "BEARER_TOKEN",
      credentialLabel: "Personal Access Token (Classic or Fine-Grained)",
      whyOAuthIsNotRequired:
        "OAuth setup isn't required for this integration path. Personal access tokens authenticate directly against the GitHub API.",
      headerOrParamFormat: {
        value: "Authorization: Bearer ghp_...",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Authenticating with a personal access token",
          sourceUrl:
            "https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api#authenticating-with-a-personal-access-token",
          whatSourceExplicitlyStates:
            "Pass the token in the Authorization header with the Bearer scheme.",
        },
      },
      rotationAndExpiryRules: {
        value:
          "Configurable at creation (recommended: 30 to 90 days for classic tokens; fine-grained tokens mandate an expiration date of at most 1 year).",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Managing your personal access tokens",
          sourceUrl:
            "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens",
          whatSourceExplicitlyStates:
            "GitHub requires an expiration date for fine-grained personal access tokens and recommends setting an expiration for classic tokens.",
        },
      },
      portalUrl: "https://github.com/settings/tokens",
    },
    oauthPath: {
      mode: "oauth",
      scheme: "OAUTH2",
      providerEndpoints: {
        authorizationUrl: {
          value: "https://github.com/login/oauth/authorize",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Authorizing OAuth Apps",
            sourceUrl:
              "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#1-request-a-users-github-identity",
            whatSourceExplicitlyStates:
              "GET https://github.com/login/oauth/authorize",
          },
        },
        tokenUrl: {
          value: "https://github.com/login/oauth/access_token",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Authorizing OAuth Apps",
            sourceUrl:
              "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#2-users-are-redirected-back-to-your-site-by-github",
            whatSourceExplicitlyStates:
              "POST https://github.com/login/oauth/access_token",
          },
        },
        userInfoUrl: {
          value: "https://api.github.com/user",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Get the authenticated user",
            sourceUrl:
              "https://docs.github.com/en/rest/users/users#get-the-authenticated-user",
            whatSourceExplicitlyStates:
              "GET /user retrieves the authenticated user's profile.",
          },
        },
      },
      composioCallbackGuidance: {
        howToLocateAndVerify:
          "Navigate to Composio Dashboard -> Toolkits -> GitHub -> Custom Auth Config. Copy the exact oauth_redirect_uri displayed in your active workspace configuration and paste it into GitHub's 'Authorization callback URL' field.",
        documentedReferenceNote: {
          value:
            "Documentation reference: Composio Custom Auth Configs guides cite 'https://backend.composio.dev/api/v3/toolkits/auth/callback' and legacy 'https://backend.composio.dev/api/v1/auth-apps/add'. Always verify against your active project dashboard.",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Composio Custom Auth Configs",
            sourceUrl:
              "https://docs.composio.dev/docs/auth-configuration/custom-auth-configs",
            whatSourceExplicitlyStates:
              "Enter the OAuth redirect URI from your Composio configuration into the third-party developer portal.",
          },
        },
      },
      pkceRequired: {
        value: "not_mentioned_in_sources",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Authorizing OAuth Apps",
          sourceUrl:
            "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps",
          whatSourceExplicitlyStates:
            "GitHub OAuth web application flow uses client_id, client_secret, and authorization code; PKCE is supported for GitHub Apps with user-to-server tokens but not required for OAuth Apps.",
        },
      },
      tokenAndRefreshBehavior: {
        value:
          "Expire user access tokens is enabled by default for new OAuth apps. User access tokens have an 8-hour lifetime (28,800 seconds); refresh tokens are valid for 6 months and rotate upon use.",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Refreshing user access tokens",
          sourceUrl:
            "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/refreshing-user-access-tokens",
          whatSourceExplicitlyStates:
            "User access tokens expire after 8 hours. When you receive a refresh token, it expires after 6 months.",
        },
      },
      scopes: {
        value: [
          {
            scope: "repo",
            category: "Code & Repositories",
            description:
              "Grants full control of private repositories, commit status, and deployment statuses.",
          },
          {
            scope: "read:user",
            category: "User Data",
            description: "Grants read access to a user's profile data.",
          },
          {
            scope: "user:email",
            category: "User Data",
            description: "Grants read access to a user's verified email addresses.",
          },
          {
            scope: "read:org",
            category: "Organizations",
            description: "Read-only access to organization membership and teams.",
          },
          {
            scope: "gist",
            category: "Gists",
            description: "Grants write access to the user's gists.",
          },
        ],
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Scopes for OAuth apps",
          sourceUrl:
            "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps",
          whatSourceExplicitlyStates:
            "Available OAuth scopes determine what resources the token can access on behalf of the user.",
        },
      },
      reviewerSubmissionDraft: {
        scopeJustificationDraft:
          "Our AI agent assistant requires repo scope to analyze repository structure, create issues, and open pull requests requested by the user, and read:user to verify the author identity.",
        reviewerNotes:
          "GitHub OAuth apps do not undergo mandatory centralized marketplace review for private or unlisted usage.",
      },
    },
  },
  setupRunbook: [
    {
      stepNumber: 1,
      title: "Navigate to GitHub Developer Settings",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~1 min",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Direct UI navigation to settings tab.",
          whatRemainsUnverified: "Portal load time and user login status.",
        },
      },
      portalUrl: "https://github.com/settings/developers",
      instructions: [
        "Sign in to your GitHub account.",
        "In the top-right corner of any page, click your profile photo -> Settings.",
        "In the left sidebar, click 'Developer settings' -> 'OAuth Apps'.",
      ],
      copyableAssets: [
        {
          label: "Direct Developer Settings URL",
          value: "https://github.com/settings/developers",
          note: "Direct portal link to OAuth Apps manager.",
        },
      ],
    },
    {
      stepNumber: 2,
      title: "Register New OAuth Application",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~2 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Typing app name, URLs, and description.",
          whatRemainsUnverified: "User typing speed.",
        },
      },
      instructions: [
        "Click the 'New OAuth App' button.",
        "Enter an 'Application name' (e.g. 'My AI Assistant').",
        "Enter your 'Homepage URL' (e.g. 'https://myapp.com').",
        "Enter the Composio Authorization callback URL retrieved from your Composio Dashboard.",
        "Click 'Register application'.",
      ],
      commonPitfall: {
        value:
          "Do not confuse 'OAuth Apps' with 'GitHub Apps'. GitHub Apps use webhooks, private keys, and repo installations, while OAuth Apps use standard Client ID and Secret with user scopes.",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Differences between GitHub Apps and OAuth Apps",
          sourceUrl:
            "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps",
          whatSourceExplicitlyStates:
            "GitHub Apps offer fine-grained permissions and short-lived tokens, while OAuth Apps grant broad account-wide scopes.",
        },
      },
    },
    {
      stepNumber: 3,
      title: "Generate Client Secret",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~1 min",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Single button click and 2FA confirmation.",
          whatRemainsUnverified: "2FA challenge duration.",
        },
      },
      instructions: [
        "On the newly created app page, note your Client ID (starts with Ov23...).",
        "Click 'Generate a new client secret'.",
        "Authenticate with your 2FA app or security key if prompted.",
        "IMMEDIATELY copy the Client Secret string; it will never be displayed again.",
      ],
      copyableAssets: [
        {
          label: "Client Secret Placeholder",
          value: "<PASTE_YOUR_COPIED_CLIENT_SECRET>",
          note: "Store securely in your secrets manager or Composio config.",
        },
      ],
    },
    {
      stepNumber: 4,
      title: "Configure Token Expiration Settings",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~1 min",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Reviewing checkbox in app configuration.",
          whatRemainsUnverified: "Whether the user chooses to enable or disable expiry.",
        },
      },
      instructions: [
        "Check the 'Expire user access tokens' setting.",
        "Notice that modern GitHub OAuth Apps enable token expiration by default (8-hour tokens).",
        "Ensure your integration supports token refresh via the refresh token, or disable token expiration if your enterprise architecture does not yet support automatic rotation.",
      ],
      commonPitfall: {
        value:
          "If token expiration is left enabled and your system does not execute refresh token exchange, API calls will suddenly fail with 401 Unauthorized after 8 hours.",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Refreshing user access tokens",
          sourceUrl:
            "https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/refreshing-user-access-tokens",
          whatSourceExplicitlyStates:
            "User access tokens expire after 8 hours. When you receive a refresh token, it expires after 6 months.",
        },
      },
    },
    {
      stepNumber: 5,
      title: "Add Custom Auth Credentials to Composio",
      actor: "agent_prepared",
      estimatedDuration: {
        value: "~1 min",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Copy-pasting Client ID and Secret into Composio.",
          whatRemainsUnverified: "Network latency to Composio dashboard.",
        },
      },
      instructions: [
        "In the Composio Dashboard, go to Toolkits -> GitHub -> Custom Auth Config.",
        "Paste the Client ID and Client Secret.",
        "Save the custom auth configuration.",
        "Trigger a test connection to verify the end-to-end OAuth handshake.",
      ],
    },
  ],
  blockersAndPlaybooks: {
    value: [
      {
        blockerTitle: "Organization OAuth App Access Restrictions (Organization approval required)",
        triggerCondition:
          "End user belongs to a GitHub Organization that enforces third-party application restrictions.",
        errorCodeOrSymptom:
          "Organization resources or repositories are invisible to the token, or user sees 'Organization access restricted' during consent screen.",
        howToUnblock:
          "User must click 'Request access' next to the organization name on the OAuth grant screen. An Organization Owner must approve the application in Organization Settings -> Third-party access.",
        workaroundWhilstWaiting:
          "For immediate agent testing, use a personal repository owned directly by the user account, or invite the agent service account to a non-restricted sandbox organization.",
      },
      {
        blockerTitle: "Access Token Expiration (401 Bad credentials / Expired token)",
        triggerCondition:
          "The 8-hour access token lifecycle expires without refresh.",
        errorCodeOrSymptom:
          "HTTP 401 Unauthorized: 'Bad credentials' on subsequent API operations.",
        howToUnblock:
          "Perform a POST request to https://github.com/login/oauth/access_token with grant_type=refresh_token, refresh_token, client_id, and client_secret to obtain a fresh access token.",
        workaroundWhilstWaiting:
          "In GitHub Developer Settings -> OAuth App, temporarily uncheck 'Expire user access tokens' to issue permanent tokens during early prototyping.",
      },
    ],
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "About OAuth App access restrictions",
      sourceUrl:
        "https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions",
      whatSourceExplicitlyStates:
        "Organization owners can restrict third-party access to their organization's data, requiring an owner to review and approve every OAuth app.",
    },
  },
  composioIntegration: {
    recommendedScheme: "OAUTH2",
    configurationSteps: {
      value: [
        "Open Composio Dashboard -> Integrations -> GitHub.",
        "Under Auth Config, select 'Custom App' to use your registered OAuth credentials, or 'Composio Managed' for instant zero-config testing.",
        "Input your GitHub Client ID and Client Secret.",
        "Initiate a user connection via Composio SDK or dashboard test link.",
      ],
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Composio GitHub Toolkit Setup",
        sourceUrl: "https://docs.composio.dev/toolkits/github",
        whatSourceExplicitlyStates:
          "Composio supports both managed authentication and custom developer OAuth configurations for GitHub.",
      },
    },
    sdkSnippets: [
      {
        language: "python",
        code: `from composio import ComposioToolSet, App

# Initialize toolset
toolset = ComposioToolSet()

# Option A: Connect using Composio Managed Auth (zero custom setup)
# connection = toolset.initiate_connection(app=App.GITHUB)

# Option B: Connect with Custom OAuth App credentials
connection = toolset.initiate_connection(
    app=App.GITHUB,
    auth_config_id="YOUR_CUSTOM_GITHUB_AUTH_CONFIG_ID"
)
print(f"Authorize agent at: {connection.redirectUrl}")`,
        validationStatus: "adapted_from_docs_needs_validation",
        sourceDocUrl: "https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app",
        validationNote:
          "Adapted from Composio Custom App session documentation; verify exact SDK method names against composio-core v0.6+.",
      },
      {
        language: "typescript",
        code: `import { Composio } from "composio-core";

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

async function connectGitHub() {
  const connection = await composio.connectedAccounts.initiate({
    appName: "github",
    authConfigId: "YOUR_CUSTOM_GITHUB_AUTH_CONFIG_ID",
  });
  console.log("Authorize agent here:", connection.redirectUrl);
}

connectGitHub();`,
        validationStatus: "adapted_from_docs_needs_validation",
        sourceDocUrl: "https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app",
        validationNote:
          "Adapted from Composio TypeScript SDK documentation; check composio-core package version.",
      },
    ],
  },
};

export const SLACK_GUIDE: IntegrationReadinessGuide = {
  appId: "slack",
  appName: "Slack",
  websiteUrl: "https://slack.com",
  composioToolkitSlug: "slack",
  supportedAuthSchemes: {
    value: ["OAUTH2"],
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Slack API OAuth v2",
      sourceUrl: "https://api.slack.com/authentication/oauth-v2",
      whatSourceExplicitlyStates:
        "Slack uses OAuth 2.0 to authenticate and authorize requests for workspace installations.",
    },
  },
  composioManagedAuthStatus: {
    value: "available",
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Composio Managed Auth Documentation",
      sourceUrl: "https://docs.composio.dev/toolkits/managed-auth",
      whatSourceExplicitlyStates:
        "Slack is supported under Composio Managed Auth for development and prototype workflows.",
    },
  },
  readinessSummary: {
    authPathClassification: "oauth_required",
    oauthNecessityBanner:
      "OAuth 2.0 is required for Slack user and workspace authorization. Creating a Slack App requires configuring Bot and User scopes, redirect URIs, and enabling public distribution if installing outside your development workspace.",
    activeSetupTime: {
      value: "~20–30 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis:
          "Inferred from multi-step app creation, redirect URI configuration, granular bot token scopes selection, and distribution activation.",
        whatRemainsUnverified:
          "Actual portal completion time for first-time Slack developers.",
      },
    },
    approvalWaitTime: {
      value:
        "No review gate identified for single-workspace install; multi-workspace distribution and Marketplace review require approval",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Installing via OAuth authorization code flow - Slack Docs",
        sourceUrl: "https://api.slack.com/authentication/oauth-v2",
        whatSourceExplicitlyStates:
          "You can immediately install the app to your development workspace. To distribute to outside workspaces, public distribution must be activated, and enterprise workspaces may enforce admin approval for unapproved scopes.",
      },
    },
    oneLineSummary:
      "Instant install on development workspace; external workspace distribution requires activating Public Distribution and enterprise scopes require admin approval.",
  },
  prerequisites: {
    value: [
      {
        item: "Slack Workspace Admin or App Creator Access",
        requiredForTesting: true,
        requiredForProduction: true,
        detail:
          "You need a development Slack workspace where you have permission to install and test custom applications.",
      },
      {
        item: "Registered Slack App at api.slack.com",
        requiredForTesting: true,
        requiredForProduction: true,
        detail: "A Slack App configured via the Slack API developer console.",
      },
      {
        item: "HTTPS Redirect URI (No '#' fragments)",
        requiredForTesting: true,
        requiredForProduction: true,
        detail:
          "Slack strictly prohibits HTTP (except localhost) and forbids '#' URL fragment anchors.",
      },
    ],
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Installing via OAuth authorization code flow - Slack Docs",
      sourceUrl: "https://api.slack.com/authentication/oauth-v2",
      whatSourceExplicitlyStates:
        "Redirect URLs must use HTTPS and cannot contain anchor tags (#).",
    },
  },
  authSpec: {
    mode: "oauth",
    scheme: "OAUTH2",
    providerEndpoints: {
      authorizationUrl: {
        value: "https://slack.com/oauth/v2/authorize",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Slack API OAuth v2",
          sourceUrl: "https://api.slack.com/authentication/oauth-v2",
          whatSourceExplicitlyStates: "GET https://slack.com/oauth/v2/authorize",
        },
      },
      tokenUrl: {
        value: "https://slack.com/api/oauth.v2.access",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Slack API Methods: oauth.v2.access",
          sourceUrl: "https://api.slack.com/methods/oauth.v2.access",
          whatSourceExplicitlyStates:
            "POST https://slack.com/api/oauth.v2.access exchange authorization code for token.",
        },
      },
    },
    composioCallbackGuidance: {
      howToLocateAndVerify:
        "Navigate to Composio Dashboard -> Toolkits -> Slack -> Custom Auth Config. Copy the exact oauth_redirect_uri displayed and paste into Slack App Settings -> OAuth & Permissions -> Redirect URLs. Ensure the protocol is HTTPS and has NO '#' anchor fragments.",
      documentedReferenceNote: {
        value:
          "Documentation reference: Composio Custom Auth Configs guides cite 'https://backend.composio.dev/api/v3/toolkits/auth/callback'. Always verify against your active project dashboard.",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Composio Custom Auth Configs",
          sourceUrl:
            "https://docs.composio.dev/docs/auth-configuration/custom-auth-configs",
          whatSourceExplicitlyStates:
            "Enter the OAuth redirect URI from your Composio configuration into the Slack developer portal.",
        },
      },
    },
    pkceRequired: {
      value: "not_mentioned_in_sources",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Slack API OAuth v2",
        sourceUrl: "https://api.slack.com/authentication/oauth-v2",
        whatSourceExplicitlyStates:
          "Slack OAuth v2 uses standard client_id, client_secret, code, and redirect_uri parameters.",
      },
    },
    tokenAndRefreshBehavior: {
      value:
        "Temporary authorization code expires in 10 minutes. Bot tokens (xoxb-...) do not expire by default unless token rotation is enabled in app settings.",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Slack API Methods: oauth.v2.access",
        sourceUrl: "https://api.slack.com/methods/oauth.v2.access",
        whatSourceExplicitlyStates:
          "Authorization codes are short-lived and expire after 10 minutes. Tokens issued do not expire unless token rotation is enabled.",
      },
    },
    scopes: {
      value: [
        {
          scope: "chat:write",
          category: "Bot Scope",
          description: "Send messages as your bot in authorized channels.",
        },
        {
          scope: "channels:read",
          category: "Bot Scope",
          description: "View basic information about public channels in the workspace.",
        },
        {
          scope: "channels:history",
          category: "Bot Scope",
          description: "View messages and other content in public channels.",
        },
        {
          scope: "commands",
          category: "Bot Scope",
          description: "Add slash commands and shortcuts for users.",
        },
        {
          scope: "users:read",
          category: "Bot Scope",
          description: "View people in a workspace.",
        },
        {
          scope: "identity.basic",
          category: "User Scope",
          description: "View the identity of the user installing or authenticating the app.",
        },
      ],
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Slack Permission Scopes",
        sourceUrl: "https://api.slack.com/scopes",
        whatSourceExplicitlyStates:
          "Bot token scopes (scope=) determine what your bot can do; user token scopes (user_scope=) act on behalf of the authorizing user.",
      },
    },
    reviewerSubmissionDraft: {
      scopeJustificationDraft:
        "Our AI agent needs chat:write to post intelligent answers to user queries, channels:read to understand channel context, and commands to handle slash command invocations.",
      reviewerNotes:
        "App is used for direct internal workspace automation or distributed via direct install link.",
    },
  },
  setupRunbook: [
    {
      stepNumber: 1,
      title: "Create App in Slack Developer Portal",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~2 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Clicking Create New App -> From scratch.",
          whatRemainsUnverified: "Portal responsiveness.",
        },
      },
      portalUrl: "https://api.slack.com/apps",
      instructions: [
        "Go to api.slack.com/apps and click 'Create New App'.",
        "Select 'From scratch'.",
        "Enter an App Name (e.g. 'Composio Assistant') and select your development workspace.",
        "Click 'Create App'.",
      ],
    },
    {
      stepNumber: 2,
      title: "Configure Redirect URLs",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~2 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Copy-pasting redirect URI.",
          whatRemainsUnverified: "Form saving time.",
        },
      },
      instructions: [
        "In the left navigation menu, click 'OAuth & Permissions'.",
        "Scroll down to 'Redirect URLs' and click 'Add New Redirect URL'.",
        "Paste the exact redirect URI from Composio (must start with https:// and MUST NOT contain '#' anchors).",
        "Click 'Add' and then click 'Save URLs'.",
      ],
      commonPitfall: {
        value:
          "Slack rejects redirect URIs containing '#' anchor fragments. Also, the redirect URI provided during the authorization code exchange must match this configured URI byte-for-byte.",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Slack OAuth v2 Redirect URLs",
          sourceUrl: "https://api.slack.com/authentication/oauth-v2#redirect_urls",
          whatSourceExplicitlyStates:
            "Redirect URLs must use HTTPS and cannot contain anchor tags (#).",
        },
      },
    },
    {
      stepNumber: 3,
      title: "Add Bot Token Scopes",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~3 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Selecting 4-6 scopes from dropdown.",
          whatRemainsUnverified: "User familiarity with Slack scope names.",
        },
      },
      instructions: [
        "On the 'OAuth & Permissions' page, scroll down to the 'Scopes' section.",
        "Under 'Bot Token Scopes', click 'Add an OAuth Scope'.",
        "Add: 'chat:write', 'channels:read', 'channels:history', 'users:read'.",
        "CRITICAL: Do not mix bot scopes and user scopes! Bot scopes must be added under Bot Token Scopes.",
      ],
    },
    {
      stepNumber: 4,
      title: "Install to Development Workspace",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~2 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Clicking Install to Workspace and clicking Allow.",
          whatRemainsUnverified: "Consent dialog confirmation.",
        },
      },
      instructions: [
        "Scroll to the top of the 'OAuth & Permissions' page.",
        "Click 'Install to Workspace' (or 'Reinstall to Workspace' after updating scopes).",
        "Review permissions on the Slack consent screen and click 'Allow'.",
      ],
    },
    {
      stepNumber: 5,
      title: "Activate Public Distribution (For Multi-Workspace Support)",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~5 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Navigating to Manage Distribution tab and enabling toggle.",
          whatRemainsUnverified: "Whether all distribution checklist items are satisfied.",
        },
      },
      instructions: [
        "In the left sidebar, click 'Manage Distribution'.",
        "Verify that all required sections (Display Information, Scopes, Redirect URLs) are completed.",
        "Under 'Share Your App with Other Workspaces', click 'Activate Public Distribution'.",
        "This allows users from other Slack workspaces to install the app without getting 'invalid_team_for_non_distributed_app'.",
      ],
      commonPitfall: {
        value:
          "Undistributed apps fail immediately when an external workspace tries to connect, returning 'invalid_team_for_non_distributed_app'.",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Slack Distributing your app",
          sourceUrl: "https://api.slack.com/start/distributing",
          whatSourceExplicitlyStates:
            "If your app is not publicly distributed, only members of the workspace where the app was created can install it.",
        },
      },
    },
    {
      stepNumber: 6,
      title: "Retrieve Credentials and Configure in Composio",
      actor: "agent_prepared",
      estimatedDuration: {
        value: "~2 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Copying Client ID & Secret into Composio.",
          whatRemainsUnverified: "Network response time.",
        },
      },
      instructions: [
        "Navigate to 'Basic Information' in your Slack app settings.",
        "Scroll to 'App Credentials' and copy the 'Client ID' and 'Client Secret'.",
        "Open Composio Dashboard -> Toolkits -> Slack -> Custom Auth Config.",
        "Paste the Client ID and Secret, and save the configuration.",
      ],
    },
  ],
  blockersAndPlaybooks: {
    value: [
      {
        blockerTitle: "invalid_team_for_non_distributed_app",
        triggerCondition:
          "A user from an external Slack workspace attempts to authenticate before Public Distribution is activated.",
        errorCodeOrSymptom:
          "OAuth authorize step halts with error: 'invalid_team_for_non_distributed_app'.",
        howToUnblock:
          "Open your Slack App developer console -> Manage Distribution -> click 'Activate Public Distribution'.",
        workaroundWhilstWaiting:
          "Test exclusively within your development workspace where the app was initially created.",
      },
      {
        blockerTitle: "bad_redirect_uri",
        triggerCondition:
          "The redirect URI passed in the authorize URL does not match the configured redirect URI byte-for-byte, or contains an anchor (#).",
        errorCodeOrSymptom:
          "Slack returns error: 'bad_redirect_uri' upon authorization request.",
        howToUnblock:
          "Ensure the redirect URI in Composio matches the registered Slack redirect URI exactly, including trailing slashes and HTTPS scheme. Remove any '#' fragments.",
        workaroundWhilstWaiting:
          "Verify the exact redirect URI in your Composio Dashboard under Custom Auth Config.",
      },
      {
        blockerTitle: "unapproved_scope",
        triggerCondition:
          "The requested scopes have not been approved by an enterprise workspace administrator.",
        errorCodeOrSymptom:
          "User receives 'This app requires approval from an admin' or 'unapproved_scope'.",
        howToUnblock:
          "Submit an app approval request inside the Slack workspace client to the workspace administrator.",
        workaroundWhilstWaiting:
          "Request only essential basic scopes (e.g. chat:write) that do not trigger elevated enterprise security gates.",
      },
    ],
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Slack OAuth Error Responses",
      sourceUrl: "https://api.slack.com/methods/oauth.v2.access#errors",
      whatSourceExplicitlyStates:
        "Slack returns specific error strings: bad_redirect_uri, invalid_scope, invalid_team_for_non_distributed_app, unapproved_scope.",
    },
  },
  composioIntegration: {
    recommendedScheme: "OAUTH2",
    configurationSteps: {
      value: [
        "In Composio Dashboard, navigate to Toolkits -> Slack.",
        "Select 'Custom App' and enter your Slack Client ID and Client Secret.",
        "Save and generate a connection link to test the Slack OAuth authorization flow.",
      ],
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Composio Slack Integration Guide",
        sourceUrl: "https://docs.composio.dev/toolkits/slack",
        whatSourceExplicitlyStates:
          "Composio connects to Slack via OAuth 2.0 using either managed or custom credentials.",
      },
    },
    sdkSnippets: [
      {
        language: "python",
        code: `from composio import ComposioToolSet, App

toolset = ComposioToolSet()

# Initiate connection for Slack with your custom auth config
connection = toolset.initiate_connection(
    app=App.SLACK,
    auth_config_id="YOUR_CUSTOM_SLACK_AUTH_CONFIG_ID"
)
print("Complete Slack OAuth at:", connection.redirectUrl)`,
        validationStatus: "adapted_from_docs_needs_validation",
        sourceDocUrl: "https://docs.composio.dev/toolkits/slack",
        validationNote:
          "Adapted from Composio Slack toolkit examples; ensure auth_config_id matches your custom configuration.",
      },
      {
        language: "typescript",
        code: `import { Composio } from "composio-core";

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

async function connectSlack() {
  const connection = await composio.connectedAccounts.initiate({
    appName: "slack",
    authConfigId: "YOUR_CUSTOM_SLACK_AUTH_CONFIG_ID",
  });
  console.log("Authorize Slack integration:", connection.redirectUrl);
}

connectSlack();`,
        validationStatus: "adapted_from_docs_needs_validation",
        sourceDocUrl: "https://docs.composio.dev/toolkits/slack",
        validationNote:
          "Adapted from Composio TypeScript SDK documentation.",
      },
    ],
  },
};

export const GOOGLE_WORKSPACE_GUIDE: IntegrationReadinessGuide = {
  appId: "google_workspace",
  appName: "Google Workspace (Gmail / Drive)",
  websiteUrl: "https://workspace.google.com",
  composioToolkitSlug: "gmail",
  supportedAuthSchemes: {
    value: ["OAUTH2"],
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Using OAuth 2.0 to Access Google APIs",
      sourceUrl: "https://developers.google.com/identity/protocols/oauth2",
      whatSourceExplicitlyStates:
        "Google APIs use the OAuth 2.0 protocol for authentication and authorization.",
    },
  },
  composioManagedAuthStatus: {
    value: "available",
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Composio Managed Auth Documentation",
      sourceUrl: "https://docs.composio.dev/toolkits/managed-auth",
      whatSourceExplicitlyStates:
        "Composio provides managed OAuth credentials for Google Workspace toolkits including Gmail and Google Calendar.",
    },
  },
  readinessSummary: {
    authPathClassification: "oauth_required",
    oauthNecessityBanner:
      "OAuth 2.0 Web Application credentials required. Development testing mode allows up to 100 manual test users; production multi-user access requires Google Brand Verification and CASA security audits for restricted scopes.",
    activeSetupTime: {
      value: "~30–90 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis:
          "Inferred from Google Cloud Console project creation, OAuth consent screen branding configuration, test user whitelisting, and OAuth Web client credentials generation.",
        whatRemainsUnverified:
          "GCP Console interface navigation and billing account association time.",
      },
    },
    approvalWaitTime: {
      value:
        "Review wait time not established in overview docs; estimated 2–6 weeks for sensitive/restricted scopes requiring CASA Tier 2 security assessment",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis:
          "Google documentation states sensitive scopes require brand verification and restricted scopes (e.g. Gmail full read/send) require third-party Cloud Application Security Assessment (CASA) Tier 2 audit by authorized security labs.",
        whatRemainsUnverified:
          "Actual turnaround time per authorized CASA lab and Google trust review queue.",
      },
    },
    oneLineSummary:
      "Quick setup for 100 whitelisted test users with 7-day token lifespan; production deployment requires Google OAuth brand verification and independent security assessment.",
  },
  prerequisites: {
    value: [
      {
        item: "Google Cloud Platform (GCP) Project",
        requiredForTesting: true,
        requiredForProduction: true,
        detail:
          "A Google Cloud project with APIs enabled (e.g. Gmail API, Google Drive API, Google Calendar API).",
      },
      {
        item: "Configured OAuth Consent Screen",
        requiredForTesting: true,
        requiredForProduction: true,
        detail:
          "App name, user support email, and developer contact email configured in GCP Console.",
      },
      {
        item: "Whitelisted Test Users (In Testing Status)",
        requiredForTesting: true,
        requiredForProduction: false,
        detail:
          "While publishing status is 'Testing', only explicitly whitelisted Google accounts (up to 100) can authenticate.",
      },
    ],
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Google Identity: Setting up OAuth 2.0",
      sourceUrl:
        "https://support.google.com/cloud/answer/6158849?hl=en",
      whatSourceExplicitlyStates:
        "To use OAuth 2.0 in your application, you need an OAuth 2.0 client ID from the Google API Console.",
    },
  },
  authSpec: {
    mode: "oauth",
    scheme: "OAUTH2",
    providerEndpoints: {
      authorizationUrl: {
        value: "https://accounts.google.com/o/oauth2/v2/auth",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Google OAuth 2.0 Web Server Flow",
          sourceUrl:
            "https://developers.google.com/identity/protocols/oauth2/web-server#creatingclient",
          whatSourceExplicitlyStates:
            "GET https://accounts.google.com/o/oauth2/v2/auth",
        },
      },
      tokenUrl: {
        value: "https://oauth2.googleapis.com/token",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Google OAuth 2.0 Web Server Flow",
          sourceUrl:
            "https://developers.google.com/identity/protocols/oauth2/web-server#exchange-authorization-code",
          whatSourceExplicitlyStates: "POST https://oauth2.googleapis.com/token",
        },
      },
      revocationUrl: {
        value: "https://oauth2.googleapis.com/revoke",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Revoking a token",
          sourceUrl:
            "https://developers.google.com/identity/protocols/oauth2/web-server#tokenrevoke",
          whatSourceExplicitlyStates: "POST https://oauth2.googleapis.com/revoke",
        },
      },
      userInfoUrl: {
        value: "https://www.googleapis.com/oauth2/v3/userinfo",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "OpenID Connect Google",
          sourceUrl:
            "https://developers.google.com/identity/openid-connect/openid-connect#obtainuserinfo",
          whatSourceExplicitlyStates:
            "GET https://www.googleapis.com/oauth2/v3/userinfo",
        },
      },
    },
    composioCallbackGuidance: {
      howToLocateAndVerify:
        "Navigate to Composio Dashboard -> Toolkits -> Gmail / Google Workspace -> Custom Auth Config. Copy the oauth_redirect_uri displayed and add it under Google Cloud Console -> APIs & Services -> Credentials -> OAuth 2.0 Client IDs -> Authorized redirect URIs.",
      documentedReferenceNote: {
        value:
          "Documentation reference: Composio Custom Auth Configs guides cite 'https://backend.composio.dev/api/v3/toolkits/auth/callback'. Always verify against your active project dashboard.",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Composio Custom Auth Configs",
          sourceUrl:
            "https://docs.composio.dev/docs/auth-configuration/custom-auth-configs",
          whatSourceExplicitlyStates:
            "Enter the OAuth redirect URI from your Composio configuration into the Google Cloud Console credentials page.",
        },
      },
    },
    pkceRequired: {
      value: "supported_optional",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Google OAuth 2.0 Web Server Applications",
        sourceUrl:
          "https://developers.google.com/identity/protocols/oauth2/web-server",
        whatSourceExplicitlyStates:
          "Google supports PKCE (code_challenge and code_verifier) for web applications and strongly recommends it for native/mobile clients.",
      },
    },
    tokenAndRefreshBehavior: {
      value:
        "In Testing status, refresh tokens expire in 7 days (unverified_hypothesis). Refresh tokens require access_type=offline and prompt=consent during authorization.",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Google OAuth 2.0 Refresh Tokens",
        sourceUrl:
          "https://developers.google.com/identity/protocols/oauth2/web-server#offline",
        whatSourceExplicitlyStates:
          "A refresh token is only returned if access_type=offline is passed. A Google Cloud project in 'Testing' publishing status issues refresh tokens that expire after 7 days.",
      },
    },
    scopes: {
      value: [
        {
          scope: "https://www.googleapis.com/auth/userinfo.email",
          category: "Non-Sensitive",
          description: "See your primary Google Account email address.",
          isSensitiveOrRestricted: false,
        },
        {
          scope: "https://www.googleapis.com/auth/userinfo.profile",
          category: "Non-Sensitive",
          description: "See your personal info, including any personal info you've made publicly available.",
          isSensitiveOrRestricted: false,
        },
        {
          scope: "https://www.googleapis.com/auth/calendar.events",
          category: "Sensitive",
          description: "View and edit events on all your calendars.",
          isSensitiveOrRestricted: true,
        },
        {
          scope: "https://www.googleapis.com/auth/drive.file",
          category: "Sensitive",
          description: "See, create, and delete only the specific Google Drive files that you use with this app.",
          isSensitiveOrRestricted: true,
        },
        {
          scope: "https://www.googleapis.com/auth/gmail.send",
          category: "Restricted",
          description: "Send email messages on your behalf.",
          isSensitiveOrRestricted: true,
        },
        {
          scope: "https://mail.google.com/",
          category: "Restricted",
          description: "Read, compose, send, and permanently delete all your email from Gmail.",
          isSensitiveOrRestricted: true,
        },
      ],
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "OAuth 2.0 Scopes for Google APIs",
        sourceUrl:
          "https://developers.google.com/identity/protocols/oauth2/scopes",
        whatSourceExplicitlyStates:
          "Google classifies scopes into Non-Sensitive, Sensitive, and Restricted tiers based on privacy risk.",
      },
    },
    reviewerSubmissionDraft: {
      scopeJustificationDraft:
        "Our assistant requires drive.file (least-privilege) to create and save documents generated during user chat sessions, and gmail.send to draft and dispatch confirmation emails explicitly approved by the user.",
      reviewerNotes:
        "Demonstrate scope justification via YouTube unlisted video demonstrating OAuth consent screen, client ID in URL bar, and feature in action.",
    },
  },
  setupRunbook: [
    {
      stepNumber: 1,
      title: "Create Project in Google Cloud Console",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~3 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Creating new GCP project in console.",
          whatRemainsUnverified: "GCP project provisioning latency.",
        },
      },
      portalUrl: "https://console.cloud.google.com/projectcreate",
      instructions: [
        "Go to Google Cloud Console (console.cloud.google.com).",
        "Click the project dropdown in the top bar -> 'New Project'.",
        "Enter Project Name (e.g. 'Composio Workspace Agent') and click 'Create'.",
        "Ensure the new project is selected in the top bar.",
      ],
    },
    {
      stepNumber: 2,
      title: "Enable Required Google APIs",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~3 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Searching and enabling 2-3 APIs in library.",
          whatRemainsUnverified: "Console search latency.",
        },
      },
      instructions: [
        "In the left menu, go to 'APIs & Services' -> 'Library'.",
        "Search for 'Gmail API' and click 'Enable'.",
        "Search for 'Google Calendar API' or 'Google Drive API' as needed by your agent and click 'Enable'.",
      ],
    },
    {
      stepNumber: 3,
      title: "Configure OAuth Consent Screen",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~10 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Filling in app branding, emails, and scopes.",
          whatRemainsUnverified: "Form completion speed.",
        },
      },
      portalUrl: "https://console.cloud.google.com/apis/credentials/consent",
      instructions: [
        "Navigate to 'APIs & Services' -> 'OAuth consent screen'.",
        "Choose 'External' user type (unless restricted purely to your Google Workspace organization).",
        "Enter App Name, User support email, and Developer contact information.",
        "On the 'Scopes' page, add your requested scopes (prefer non-sensitive or least-privilege like drive.file over full mail.google.com).",
        "Click 'Save and Continue'.",
      ],
    },
    {
      stepNumber: 4,
      title: "Add Whitelisted Test Users (Crucial)",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~2 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Typing email addresses into test list.",
          whatRemainsUnverified: "Number of test users.",
        },
      },
      instructions: [
        "On the 'Test users' screen, click 'Add Users'.",
        "Enter the exact Google email addresses of all accounts that will test the integration during development (maximum 100 users).",
        "Click 'Save and Continue'.",
      ],
      commonPitfall: {
        value:
          "If a user who is not added to the Test users list attempts to authenticate while the app is in 'Testing' status, Google halts the flow with 'Error 403: access_denied (App not verified)'.",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Google OAuth Verification FAQ",
          sourceUrl: "https://support.google.com/cloud/answer/10311615",
          whatSourceExplicitlyStates:
            "While in testing status, only users added to the test user list can access the app.",
        },
      },
    },
    {
      stepNumber: 5,
      title: "Create OAuth Client ID (Web Application)",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~3 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Selecting Web application and adding redirect URI.",
          whatRemainsUnverified: "Credentials creation latency.",
        },
      },
      portalUrl: "https://console.cloud.google.com/apis/credentials",
      instructions: [
        "Navigate to 'APIs & Services' -> 'Credentials'.",
        "Click '+ Create Credentials' -> 'OAuth client ID'.",
        "Select Application type: 'Web application'.",
        "Under 'Authorized redirect URIs', click '+ Add URI' and paste the exact Composio callback URI.",
        "Click 'Create'.",
        "A modal will appear displaying your 'Client ID' and 'Client Secret'. Copy both values.",
      ],
    },
    {
      stepNumber: 6,
      title: "Configure Custom Auth in Composio Dashboard",
      actor: "agent_prepared",
      estimatedDuration: {
        value: "~2 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Pasting credentials into Composio.",
          whatRemainsUnverified: "Dashboard save latency.",
        },
      },
      instructions: [
        "Open Composio Dashboard -> Toolkits -> Gmail / Google Workspace -> Custom Auth Config.",
        "Paste the Client ID and Client Secret.",
        "Save the configuration and test the connection using one of your whitelisted test user accounts.",
      ],
    },
  ],
  blockersAndPlaybooks: {
    value: [
      {
        blockerTitle: "Error 403: access_denied (App not verified)",
        triggerCondition:
          "The Google account authenticating has not been added to the 'Test users' list in GCP Console while publishing status is 'Testing'.",
        errorCodeOrSymptom:
          "Google OAuth screen throws 'Access blocked: [App Name] has not completed the Google verification process. Error 403: access_denied'.",
        howToUnblock:
          "Go to Google Cloud Console -> APIs & Services -> OAuth consent screen -> Test users. Add the user's Google email address and save.",
        workaroundWhilstWaiting:
          "Verify the user is logging in with the exact email address added to the test list.",
      },
      {
        blockerTitle: "7-Day Refresh Token Expiration in Testing Mode",
        triggerCondition:
          "GCP projects in 'Testing' publishing status have a hard 7-day TTL on issued OAuth refresh tokens.",
        errorCodeOrSymptom:
          "Agent integrations work for 7 days then start failing with invalid_grant on refresh token calls.",
        howToUnblock:
          "Either re-authenticate weekly during development testing, or publish the app to 'In production' (which requires Google Brand Verification if sensitive/restricted scopes are requested).",
        workaroundWhilstWaiting:
          "Implement automatic user notification prompting re-authentication before the 7-day expiry window.",
      },
      {
        blockerTitle: "CASA Tier 2 Security Audit for Restricted Scopes",
        triggerCondition:
          "Requesting restricted scopes (e.g. mail.google.com, gmail.readonly, full Google Drive) for production multi-tenant deployment.",
        errorCodeOrSymptom:
          "Google verification team blocks production publishing pending Cloud Application Security Assessment (CASA) Tier 2 validation.",
        howToUnblock:
          "Engage an authorized third-party security lab (e.g. Bishop Fox, Praetorian) to conduct an annual CASA assessment, costing $500–$5,000+ and taking 2–6 weeks.",
        workaroundWhilstWaiting:
          "Refactor agent to request least-privilege sensitive scopes (drive.file instead of drive) or restrict app to an Internal Google Workspace domain which bypasses public verification.",
      },
    ],
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Google OAuth API Verification Policies",
      sourceUrl:
        "https://support.google.com/cloud/answer/9110914",
      whatSourceExplicitlyStates:
        "Apps requesting restricted scopes must undergo independent security assessments under the Cloud Application Security Assessment (CASA) framework.",
    },
  },
  composioIntegration: {
    recommendedScheme: "OAUTH2",
    configurationSteps: {
      value: [
        "In Composio Dashboard, navigate to Toolkits -> Gmail.",
        "Choose 'Custom Auth' to use your Google Cloud Web Application credentials.",
        "Enter your Client ID and Client Secret.",
        "Initiate connection using a whitelisted test user account.",
      ],
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Composio Gmail Integration Guide",
        sourceUrl: "https://docs.composio.dev/toolkits/gmail",
        whatSourceExplicitlyStates:
          "Composio connects to Gmail and Google Calendar using OAuth 2.0.",
      },
    },
    sdkSnippets: [
      {
        language: "python",
        code: `from composio import ComposioToolSet, App

toolset = ComposioToolSet()

# Connect Google Workspace using custom OAuth credentials
connection = toolset.initiate_connection(
    app=App.GMAIL,
    auth_config_id="YOUR_CUSTOM_GOOGLE_AUTH_CONFIG_ID"
)
print("Authorize with whitelisted test account:", connection.redirectUrl)`,
        validationStatus: "adapted_from_docs_needs_validation",
        sourceDocUrl: "https://docs.composio.dev/toolkits/gmail",
        validationNote:
          "Adapted from Composio Gmail toolkit documentation; requires whitelisted test user in GCP console.",
      },
      {
        language: "typescript",
        code: `import { Composio } from "composio-core";

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

async function connectGoogle() {
  const connection = await composio.connectedAccounts.initiate({
    appName: "gmail",
    authConfigId: "YOUR_CUSTOM_GOOGLE_AUTH_CONFIG_ID",
  });
  console.log("Authorize Google connection:", connection.redirectUrl);
}

connectGoogle();`,
        validationStatus: "adapted_from_docs_needs_validation",
        sourceDocUrl: "https://docs.composio.dev/toolkits/gmail",
        validationNote:
          "Adapted from Composio TypeScript SDK documentation.",
      },
    ],
  },
};

export const NOTION_GUIDE: IntegrationReadinessGuide = {
  appId: "notion",
  appName: "Notion",
  websiteUrl: "https://www.notion.so",
  composioToolkitSlug: "notion",
  supportedAuthSchemes: {
    value: ["BEARER_TOKEN", "OAUTH2"],
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Notion Authorization Guide",
      sourceUrl:
        "https://developers.notion.com/guides/get-started/authorization",
      whatSourceExplicitlyStates:
        "Notion supports two integration types: internal integrations (using an internal API secret) and public integrations (using OAuth 2.0).",
    },
  },
  composioManagedAuthStatus: {
    value: "available",
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Composio Managed Auth Documentation",
      sourceUrl: "https://docs.composio.dev/toolkits/managed-auth",
      whatSourceExplicitlyStates:
        "Composio supports managed authentication for Notion.",
    },
  },
  readinessSummary: {
    authPathClassification: "hybrid_oauth_or_direct",
    oauthNecessityBanner:
      "OAuth setup isn't required for single-workspace automations or personal scripts! Create an Internal Connection in ~2 minutes and use its Bearer token. Public Connection OAuth 2.0 is only required if distributing to other Notion users across arbitrary workspaces.",
    activeSetupTime: {
      value: "~2–5 mins (Internal Connection) vs ~15–20 mins (Public OAuth Connection)",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis:
          "Internal connection requires clicking 'New integration' and copying the internal token (~2 mins). Public connection requires redirect URI, logo, and OAuth credentials setup (~15 mins).",
        whatRemainsUnverified:
          "Exact UI navigation time and user familiarity with Notion developer portal.",
      },
    },
    approvalWaitTime: {
      value:
        "No review gate identified for standard Public Connection creation; Marketplace listing managed separately",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Notion Public Connections",
        sourceUrl:
          "https://developers.notion.com/guides/get-started/public-connections",
        whatSourceExplicitlyStates:
          "Public connections can be created and used immediately with their OAuth client credentials. Notion Marketplace distribution is an optional separate process.",
      },
    },
    oneLineSummary:
      "Instant setup via Internal Connection bot token (~2 mins); Public OAuth takes ~15 mins with permanent installation scope lock-in.",
  },
  prerequisites: {
    value: [
      {
        item: "Notion Workspace Admin Access",
        requiredForTesting: true,
        requiredForProduction: true,
        detail:
          "You must be an admin of the Notion workspace to add internal integrations or connect integrations to pages.",
      },
      {
        item: "Target Page / Database Sharing",
        requiredForTesting: true,
        requiredForProduction: true,
        detail:
          "In Notion, integrations have zero access by default until explicitly connected to each specific page or database via the page menu.",
      },
    ],
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Notion Developer Documentation: Sharing a page with your integration",
      sourceUrl:
        "https://developers.notion.com/guides/get-started/share-a-database-with-your-integration",
      whatSourceExplicitlyStates:
        "Before your integration can interact with a page or database, a user must explicitly share that page or database with the integration.",
    },
  },
  authSpec: {
    mode: "hybrid",
    pathDecisionGuide: {
      value:
        "Choose Internal Connection (Bearer Token) if your agent only needs to read/write pages in your own Notion workspace. Choose Public Connection (OAuth 2.0) if you are building a product where arbitrary Notion users grant your agent access to their respective workspaces.",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Notion Internal vs Public Connections",
        sourceUrl:
          "https://developers.notion.com/guides/get-started/internal-connections",
        whatSourceExplicitlyStates:
          "Internal integrations are scoped to a single workspace. If you want to share your integration with other Notion users, create a public integration.",
      },
    },
    directCredentialPath: {
      mode: "direct_credential",
      scheme: "BEARER_TOKEN",
      credentialLabel: "Internal Connection Token (secret_...)",
      whyOAuthIsNotRequired:
        "OAuth setup isn't required for this integration path. Notion Internal Connections provide a direct Bearer token that authenticates API calls within the host workspace.",
      headerOrParamFormat: {
        value: "Authorization: Bearer secret_..., Notion-Version: 2022-06-28",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Notion API Headers",
          sourceUrl:
            "https://developers.notion.com/reference/intro#versioning",
          whatSourceExplicitlyStates:
            "Requests must include Authorization: Bearer <secret> and Notion-Version header.",
        },
      },
      rotationAndExpiryRules: {
        value:
          "Internal tokens do not expire automatically; they remain valid until explicitly refreshed or deleted in Notion Settings -> Connections -> Develop or integrations portal.",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Notion Internal Connections",
          sourceUrl:
            "https://developers.notion.com/guides/get-started/internal-connections",
          whatSourceExplicitlyStates:
            "Internal integration secrets do not expire until revoked by a workspace administrator.",
        },
      },
      portalUrl: "https://www.notion.so/profile/integrations",
    },
    oauthPath: {
      mode: "oauth",
      scheme: "OAUTH2",
      providerEndpoints: {
        authorizationUrl: {
          value: "https://api.notion.com/v1/oauth/authorize",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Notion Public Connections OAuth",
            sourceUrl:
              "https://developers.notion.com/guides/get-started/public-connections#step-2-send-users-to-notions-authorization-url",
            whatSourceExplicitlyStates:
              "GET https://api.notion.com/v1/oauth/authorize",
          },
        },
        tokenUrl: {
          value: "https://api.notion.com/v1/oauth/token",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Notion Public Connections OAuth",
            sourceUrl:
              "https://developers.notion.com/guides/get-started/public-connections#step-3-exchange-the-code-for-an-access-token",
            whatSourceExplicitlyStates:
              "POST https://api.notion.com/v1/oauth/token with basic auth header containing client_id:client_secret.",
          },
        },
      },
      composioCallbackGuidance: {
        howToLocateAndVerify:
          "Navigate to Composio Dashboard -> Toolkits -> Notion -> Custom Auth Config. Copy the oauth_redirect_uri and add it to Notion's Integration settings under Public Connection -> Redirect URIs.",
        documentedReferenceNote: {
          value:
            "Documentation reference: Composio Custom Auth Configs guides cite 'https://backend.composio.dev/api/v3/toolkits/auth/callback'. Always verify against your active project dashboard.",
          evidence: {
            kind: "documented_not_tested",
            sourceTitle: "Composio Custom Auth Configs",
            sourceUrl:
              "https://docs.composio.dev/docs/auth-configuration/custom-auth-configs",
            whatSourceExplicitlyStates:
              "Enter the OAuth redirect URI from your Composio configuration into Notion integration settings.",
          },
        },
      },
      pkceRequired: {
        value: "not_mentioned_in_sources",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Notion Public Connections OAuth",
          sourceUrl:
            "https://developers.notion.com/guides/get-started/public-connections",
          whatSourceExplicitlyStates:
            "Notion OAuth exchange uses HTTP Basic Authorization with client ID and secret; PKCE is not mentioned.",
        },
      },
      tokenAndRefreshBehavior: {
        value:
          "Notion OAuth tokens are permanent bot access tokens returned in exchange for the authorization code; refresh tokens are not issued.",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Notion Public Connections OAuth",
          sourceUrl:
            "https://developers.notion.com/guides/get-started/public-connections",
          whatSourceExplicitlyStates:
            "The access token returned by Notion OAuth is permanent until disconnected by the workspace admin.",
        },
      },
      scopes: {
        value: [
          {
            scope: "read_content",
            category: "Content Capabilities",
            description: "Read content and pages that users have shared with the integration.",
          },
          {
            scope: "update_content",
            category: "Content Capabilities",
            description: "Update content and pages shared with the integration.",
          },
          {
            scope: "insert_content",
            category: "Content Capabilities",
            description: "Create new pages and blocks.",
          },
          {
            scope: "read_user_info",
            category: "User Capabilities",
            description: "Read basic user profile information (email and name).",
          },
        ],
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Notion Integration Capabilities",
          sourceUrl:
            "https://developers.notion.com/reference/capabilities",
          whatSourceExplicitlyStates:
            "Capabilities define what actions the integration is permitted to perform on shared pages.",
        },
      },
      reviewerSubmissionDraft: {
        scopeJustificationDraft:
          "Our AI assistant needs read and insert content capabilities to summarize databases and create structured project notes as instructed by the user.",
        reviewerNotes:
          "Public connection is deployed via direct OAuth redirect URL.",
      },
    },
  },
  setupRunbook: [
    {
      stepNumber: 1,
      title: "Decide: Internal Connection vs Public Connection",
      actor: "agent_prepared",
      estimatedDuration: {
        value: "~1 min",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Architecture choice based on single vs multi-user tenancy.",
          whatRemainsUnverified: "User product architecture decision.",
        },
      },
      instructions: [
        "If you are automating your own Notion workspace, choose the Internal Connection path (~2 mins, no OAuth setup required).",
        "If you are building a product for external users to connect their own Notion workspaces, choose the Public Connection path (~15 mins).",
      ],
    },
    {
      stepNumber: 2,
      title: "Create Integration in Notion Developer Portal",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~2 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Visiting portal and clicking New integration.",
          whatRemainsUnverified: "Portal loading speed.",
        },
      },
      portalUrl: "https://www.notion.so/profile/integrations",
      instructions: [
        "Navigate to https://www.notion.so/profile/integrations.",
        "Click '+ New integration'.",
        "Select the associated Notion workspace.",
        "Give your integration a name (e.g. 'Composio Notion Copilot').",
        "Choose Type: 'Internal' or 'Public'.",
      ],
      commonPitfall: {
        value:
          "CRITICAL PERMANENT LOCK-IN: When creating a Public Connection, the Installation Scope setting ('Any workspace' vs 'Selected workspaces only') is PERMANENT at creation time and cannot be changed later. If you select 'Selected workspaces only', you can never distribute to arbitrary public users without deleting and recreating the integration from scratch.",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Notion Public Connections Guide",
          sourceUrl:
            "https://developers.notion.com/guides/get-started/public-connections",
          whatSourceExplicitlyStates:
            "Installation scope cannot be updated after the integration is created.",
        },
      },
    },
    {
      stepNumber: 3,
      title: "Configure Capabilities & Redirect URI (Public Connection Only)",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~3 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Pasting redirect URI and checking capability boxes.",
          whatRemainsUnverified: "Form save latency.",
        },
      },
      instructions: [
        "In the 'Capabilities' tab, ensure 'Read content', 'Update content', and 'Insert content' are enabled as required.",
        "In the 'Configuration' tab, paste the Composio redirect URI into 'Redirect URIs'.",
        "Copy the 'Client ID' and 'Client Secret'.",
      ],
    },
    {
      stepNumber: 4,
      title: "Share Pages with the Integration (Mandatory for Access)",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~2 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Sharing a Notion page via the 3-dots menu.",
          whatRemainsUnverified: "Number of pages/databases to share.",
        },
      },
      instructions: [
        "In the Notion web or desktop app, open the specific database or page you want the agent to access.",
        "Click the '...' menu icon in the top-right corner of the page.",
        "Scroll down to 'Connect to' / 'Add connections' and select your integration name.",
        "Confirm the connection. The integration now has access to this page and all child sub-pages.",
      ],
      commonPitfall: {
        value:
          "The #1 cause of Notion API errors is 'object_not_found (404)'. Even with a valid token, the API cannot see any database or page until a user explicitly connects the integration to that specific page.",
        evidence: {
          kind: "documented_not_tested",
          sourceTitle: "Notion Status Codes and Errors",
          sourceUrl:
            "https://developers.notion.com/reference/status-codes#object_not_found",
          whatSourceExplicitlyStates:
            "Returns 404 object_not_found if the database or page has not been shared with the integration.",
        },
      },
    },
    {
      stepNumber: 5,
      title: "Configure Credentials in Composio Dashboard",
      actor: "agent_prepared",
      estimatedDuration: {
        value: "~2 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Entering token or client credentials into Composio.",
          whatRemainsUnverified: "Network latency.",
        },
      },
      instructions: [
        "Open Composio Dashboard -> Toolkits -> Notion.",
        "If using Internal Connection, select Bearer/Token auth and paste your secret_... token.",
        "If using Public Connection, select Custom OAuth and enter your Client ID and Client Secret.",
        "Save and execute a test read query.",
      ],
    },
  ],
  blockersAndPlaybooks: {
    value: [
      {
        blockerTitle: "object_not_found (404) - Page Not Connected",
        triggerCondition:
          "Agent attempts to read or write a Notion page/database that has not been explicitly shared with the integration.",
        errorCodeOrSymptom:
          "HTTP 404: 'Could not find database with ID: ...' or 'object_not_found'.",
        howToUnblock:
          "Open the target page in Notion -> click '...' menu -> 'Connect to' -> select your integration.",
        workaroundWhilstWaiting:
          "Verify connection status on parent pages; sharing a parent page automatically grants access to nested child pages.",
      },
      {
        blockerTitle: "Wrong Installation Scope Locked at Creation",
        triggerCondition:
          "Developer created a Public Connection with 'Selected workspaces only' and subsequently tries to distribute to outside workspaces.",
        errorCodeOrSymptom:
          "Users from non-selected workspaces cannot authorize the integration.",
        howToUnblock:
          "Notion does not permit altering installation scope post-creation. You must create a new integration with 'Any workspace' selected.",
        workaroundWhilstWaiting:
          "Manually add the target workspace to the selected workspaces list in Notion Developer Settings if you manage both workspaces.",
      },
    ],
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Notion Troubleshooting Guide",
      sourceUrl: "https://developers.notion.com/guides/get-started/troubleshooting",
      whatSourceExplicitlyStates:
        "404 object_not_found indicates the integration does not have access to the resource. Connect the integration to the page.",
    },
  },
  composioIntegration: {
    recommendedScheme: "BEARER_TOKEN",
    configurationSteps: {
      value: [
        "In Composio Dashboard, navigate to Toolkits -> Notion.",
        "For internal usage, supply the Internal Connection Token (secret_...).",
        "For multi-tenant applications, configure Custom OAuth with your Client ID and Client Secret.",
        "Ensure target pages are shared with the integration in Notion.",
      ],
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Composio Notion Integration",
        sourceUrl: "https://docs.composio.dev/toolkits/notion",
        whatSourceExplicitlyStates:
          "Composio supports connecting to Notion via API secret or OAuth.",
      },
    },
    sdkSnippets: [
      {
        language: "python",
        code: `from composio import ComposioToolSet, App

toolset = ComposioToolSet()

# Connect Notion via internal connection token or custom OAuth
connection = toolset.initiate_connection(
    app=App.NOTION,
    auth_config_id="YOUR_CUSTOM_NOTION_AUTH_CONFIG_ID"
)
print("Connect Notion at:", connection.redirectUrl)`,
        validationStatus: "adapted_from_docs_needs_validation",
        sourceDocUrl: "https://docs.composio.dev/toolkits/notion",
        validationNote:
          "Adapted from Composio Notion toolkit documentation.",
      },
      {
        language: "typescript",
        code: `import { Composio } from "composio-core";

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

async function connectNotion() {
  const connection = await composio.connectedAccounts.initiate({
    appName: "notion",
    authConfigId: "YOUR_CUSTOM_NOTION_AUTH_CONFIG_ID",
  });
  console.log("Authorize Notion connection:", connection.redirectUrl);
}

connectNotion();`,
        validationStatus: "adapted_from_docs_needs_validation",
        sourceDocUrl: "https://docs.composio.dev/toolkits/notion",
        validationNote:
          "Adapted from Composio TypeScript SDK documentation.",
      },
    ],
  },
};

export const PERPLEXITY_GUIDE: IntegrationReadinessGuide = {
  appId: "perplexity",
  appName: "Perplexity",
  websiteUrl: "https://www.perplexity.ai",
  composioToolkitSlug: "perplexity",
  supportedAuthSchemes: {
    value: ["API_KEY"],
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Perplexity API Getting Started",
      sourceUrl: "https://docs.perplexity.ai/guides/getting-started",
      whatSourceExplicitlyStates:
        "Perplexity API authenticates requests using API keys passed via Bearer Authorization headers.",
    },
  },
  composioManagedAuthStatus: {
    value: "bring_your_own_required",
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Composio Custom Auth Configs",
      sourceUrl:
        "https://docs.composio.dev/docs/auth-configuration/custom-auth-configs",
      whatSourceExplicitlyStates:
        "Toolkits such as Perplexity and Tavily require developers to bring their own API key.",
    },
  },
  readinessSummary: {
    authPathClassification: "direct_credential_only",
    oauthNecessityBanner:
      "OAuth setup isn't required for this integration path. Perplexity uses direct API key authentication.",
    activeSetupTime: {
      value: "~2–5 mins",
      evidence: {
        kind: "unverified_hypothesis",
        hypothesisBasis:
          "Inferred from logging into Perplexity account settings, adding billing credits, and generating an API key.",
        whatRemainsUnverified: "Payment method addition time.",
      },
    },
    approvalWaitTime: {
      value: "Not Applicable — No OAuth app or provider review exists",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Perplexity API Documentation",
        sourceUrl: "https://docs.perplexity.ai",
        whatSourceExplicitlyStates:
          "API keys are generated instantly in account settings without an application review process.",
      },
    },
    oneLineSummary:
      "Direct API key generation in account settings with zero OAuth endpoints, zero redirect URIs, and zero review gates.",
  },
  prerequisites: {
    value: [
      {
        item: "Perplexity Account",
        requiredForTesting: true,
        requiredForProduction: true,
        detail: "An active Perplexity user account.",
      },
      {
        item: "Active API Billing / Credits",
        requiredForTesting: true,
        requiredForProduction: true,
        detail:
          "Perplexity API requires funding your API account balance before API keys can process requests.",
      },
    ],
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Perplexity API Pricing and Billing",
      sourceUrl: "https://docs.perplexity.ai/guides/pricing",
      whatSourceExplicitlyStates:
        "API access requires purchasing credits in the API settings dashboard.",
    },
  },
  authSpec: {
    mode: "direct_credential",
    scheme: "API_KEY",
    credentialLabel: "API Key (pplx-...)",
    whyOAuthIsNotRequired:
      "OAuth setup isn't required for this integration path. Perplexity uses direct API key authentication for model inference and search. Zero OAuth endpoints, redirect URIs, or provider reviews exist.",
    headerOrParamFormat: {
      value: "Authorization: Bearer pplx-...",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Perplexity API Quickstart",
        sourceUrl: "https://docs.perplexity.ai/guides/getting-started",
        whatSourceExplicitlyStates:
          "All API requests should include your API key in an Authorization: Bearer HTTP header.",
      },
    },
    rotationAndExpiryRules: {
      value:
        "Keys do not expire automatically; they can be created, disabled, or regenerated anytime in Perplexity API settings.",
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Perplexity API Settings",
        sourceUrl: "https://www.perplexity.ai/settings/api",
        whatSourceExplicitlyStates:
          "Users can manage and revoke API keys directly from their API settings page.",
      },
    },
    portalUrl: "https://www.perplexity.ai/settings/api",
  },
  setupRunbook: [
    {
      stepNumber: 1,
      title: "Log in to Perplexity Settings",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~1 min",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Visiting settings page.",
          whatRemainsUnverified: "Login authentication time.",
        },
      },
      portalUrl: "https://www.perplexity.ai/settings/api",
      instructions: [
        "Go to https://www.perplexity.ai and log in.",
        "Click Settings in the left sidebar, then click the 'API' tab.",
      ],
    },
    {
      stepNumber: 2,
      title: "Fund API Account Balance",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~2 mins",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Entering payment card details.",
          whatRemainsUnverified: "Payment gateway confirmation latency.",
        },
      },
      instructions: [
        "Under the Billing section, click 'Add payment method'.",
        "Add credit balance (e.g. $5 or $10) to activate the API runtime.",
      ],
    },
    {
      stepNumber: 3,
      title: "Generate API Key",
      actor: "developer_portal_action",
      estimatedDuration: {
        value: "~1 min",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Clicking Generate API Key.",
          whatRemainsUnverified: "Browser rendering time.",
        },
      },
      instructions: [
        "Click 'Generate API Key'.",
        "Copy the newly generated key (starts with 'pplx-...').",
        "Store it securely in your password manager or secrets vault.",
      ],
      copyableAssets: [
        {
          label: "API Key Header Format",
          value: "Authorization: Bearer <YOUR_PPLX_KEY>",
          note: "Standard Bearer authorization header.",
        },
      ],
    },
    {
      stepNumber: 4,
      title: "Connect Credential in Composio",
      actor: "agent_prepared",
      estimatedDuration: {
        value: "~1 min",
        evidence: {
          kind: "unverified_hypothesis",
          hypothesisBasis: "Pasting key into Composio dashboard.",
          whatRemainsUnverified: "Composio API response time.",
        },
      },
      instructions: [
        "In the Composio Dashboard, navigate to Toolkits -> Perplexity.",
        "Under Authentication, select API Key.",
        "Paste your pplx-... API key and save.",
        "Trigger a test search query to verify balance and connectivity.",
      ],
    },
  ],
  blockersAndPlaybooks: {
    value: [
      {
        blockerTitle: "HTTP 401 Unauthorized / Invalid API Key",
        triggerCondition: "API key is miscopied or revoked.",
        errorCodeOrSymptom:
          "HTTP 401: 'Unauthorized: Invalid API Key'.",
        howToUnblock:
          "Generate a new API key in Perplexity Settings -> API and update the Composio auth config.",
        workaroundWhilstWaiting:
          "Confirm key starts with 'pplx-' and has no leading or trailing whitespace.",
      },
      {
        blockerTitle: "HTTP 402 Payment Required / Zero Balance",
        triggerCondition:
          "API account has exhausted available credits or has no active payment method.",
        errorCodeOrSymptom:
          "HTTP 402: 'Insufficient credits or payment method required'.",
        howToUnblock:
          "Add funds in Perplexity Settings -> API -> Billing.",
        workaroundWhilstWaiting:
          "Check account credit balance in the Perplexity developer dashboard.",
      },
    ],
    evidence: {
      kind: "documented_not_tested",
      sourceTitle: "Perplexity Error Codes",
      sourceUrl: "https://docs.perplexity.ai/guides/errors",
      whatSourceExplicitlyStates:
        "401 indicates invalid or missing API key; 402 indicates depleted credit balance.",
    },
  },
  composioIntegration: {
    recommendedScheme: "API_KEY",
    configurationSteps: {
      value: [
        "In Composio Dashboard, navigate to Toolkits -> Perplexity.",
        "Provide your Perplexity API key (starts with pplx-...).",
        "Execute a test search action via the Composio SDK.",
      ],
      evidence: {
        kind: "documented_not_tested",
        sourceTitle: "Composio Perplexity Toolkit",
        sourceUrl: "https://docs.composio.dev/toolkits/perplexity",
        whatSourceExplicitlyStates:
          "Composio connects to Perplexity via direct API key authentication.",
      },
    },
    sdkSnippets: [
      {
        language: "python",
        code: `from composio import ComposioToolSet, App

toolset = ComposioToolSet()

# Perplexity uses direct API key credentials
connection = toolset.initiate_connection(
    app=App.PERPLEXITY,
    auth_config_id="YOUR_PERPLEXITY_AUTH_CONFIG_ID"
)
print("Connected Perplexity toolset:", connection.id)`,
        validationStatus: "adapted_from_docs_needs_validation",
        sourceDocUrl: "https://docs.composio.dev/toolkits/perplexity",
        validationNote:
          "Adapted from Composio Perplexity toolkit docs; requires funded Perplexity API key.",
      },
      {
        language: "typescript",
        code: `import { Composio } from "composio-core";

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

async function connectPerplexity() {
  const connection = await composio.connectedAccounts.initiate({
    appName: "perplexity",
    authConfigId: "YOUR_PERPLEXITY_AUTH_CONFIG_ID",
  });
  console.log("Perplexity account connected:", connection.id);
}

connectPerplexity();`,
        validationStatus: "adapted_from_docs_needs_validation",
        sourceDocUrl: "https://docs.composio.dev/toolkits/perplexity",
        validationNote:
          "Adapted from Composio TypeScript SDK documentation.",
      },
    ],
  },
};

/**
 * Recursively deep freezes an object and its nested properties to guarantee immutability.
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== "object" || Object.isFrozen(obj)) {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.getOwnPropertyNames(obj)) {
    const val = (obj as Record<string, unknown>)[key];
    if (val !== null && (typeof val === "object" || typeof val === "function")) {
      deepFreeze(val);
    }
  }
  return obj;
}

/**
 * Record dictionary mapping app ID to guide.
 * Supports standard canonical IDs as well as hyphenated aliases (e.g. google-workspace).
 */
export const CURATED_GUIDES: Record<string, IntegrationReadinessGuide> = {
  github: GITHUB_GUIDE,
  slack: SLACK_GUIDE,
  google_workspace: GOOGLE_WORKSPACE_GUIDE,
  "google-workspace": GOOGLE_WORKSPACE_GUIDE,
  notion: NOTION_GUIDE,
  perplexity: PERPLEXITY_GUIDE,
};

/**
 * Array of 5 canonical curated guides.
 */
export const curatedGuides: IntegrationReadinessGuide[] = [
  GITHUB_GUIDE,
  SLACK_GUIDE,
  GOOGLE_WORKSPACE_GUIDE,
  NOTION_GUIDE,
  PERPLEXITY_GUIDE,
];

// Recursively deep-freeze all curated guides, dictionary, and array to defend immutability
deepFreeze(CURATED_GUIDES);
deepFreeze(curatedGuides);

/**
 * Helper to retrieve a curated guide by ID with case-insensitivity, alias support,
 * prototype property collision immunity, and defended immutability.
 */
export function getCuratedGuide(appId: string): IntegrationReadinessGuide | undefined {
  if (!appId || typeof appId !== "string") {
    return undefined;
  }
  const normalized = appId.toLowerCase().trim();
  const candidates = [
    normalized,
    normalized.replace(/-/g, "_"),
    normalized.replace(/_/g, "-"),
  ];
  for (const candidate of candidates) {
    if (Object.prototype.hasOwnProperty.call(CURATED_GUIDES, candidate)) {
      return CURATED_GUIDES[candidate];
    }
  }
  return undefined;
}

