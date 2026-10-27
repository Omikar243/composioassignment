import React, { useState } from "react";
import {
  Globe,
  Link2,
  Copy,
  Check,
  AlertTriangle,
  Info,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import {
  ProviderOAuthEndpoints,
  ComposioCallbackGuidance,
  Traceable,
} from "../types/guide";
import { ClaimEvidenceBadge } from "./ClaimEvidenceBadge";

export interface EndpointsAndCallbackBoxProps {
  endpoints: ProviderOAuthEndpoints;
  callbackGuidance: ComposioCallbackGuidance;
  pkceRequired?: Traceable<
    "required" | "supported_optional" | "not_mentioned_in_sources"
  >;
  appName?: string;
}

export const EndpointsAndCallbackBox: React.FC<EndpointsAndCallbackBoxProps> = ({
  endpoints,
  callbackGuidance,
  pkceRequired,
  appName = "Provider",
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Visual Separation Explainer Banner */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          <strong className="text-white">Strict Endpoint Isolation:</strong> To
          prevent configuration bugs, provider-owned authorization endpoints
          (Zone A) are physically decoupled from Composio redirect callback
          settings (Zone B).
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ==================================================================== */}
        {/* ZONE A: PROVIDER OAUTH ENDPOINTS (Purple Accent)                    */}
        {/* ==================================================================== */}
        <div className="rounded-xl p-5 bg-gradient-to-b from-purple-950/30 to-purple-950/10 border border-purple-500/30 shadow-purple-glow flex flex-col justify-between">
          <div>
            {/* Zone A Header */}
            <div className="flex items-center justify-between pb-3 border-b border-purple-800/40 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-900/60 text-purple-300 border border-purple-700/50">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-semibold">
                    Zone A · Provider-Owned
                  </div>
                  <h3 className="font-semibold text-sm text-purple-100">
                    {appName} OAuth Endpoints
                  </h3>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-700/40">
                Call Target
              </span>
            </div>

            {/* Anti-Copy Warning */}
            <div className="mb-4 p-3 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-start gap-2.5 text-xs text-purple-200 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-purple-300">Do NOT paste these as redirect URIs:</strong>{" "}
                These are endpoints your agent or Composio invokes to start the
                OAuth flow and exchange codes.
              </div>
            </div>

            {/* Endpoints List */}
            <div className="space-y-4">
              {/* Authorization URL */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">
                    Authorization URL
                  </span>
                  <ClaimEvidenceBadge evidence={endpoints.authorizationUrl.evidence} />
                </div>
                <div className="flex items-center gap-2 bg-slate-950/80 p-2.5 rounded-lg border border-purple-900/50 font-mono text-xs text-purple-200">
                  <span className="truncate flex-1 select-all">
                    {endpoints.authorizationUrl.value}
                  </span>
                  <button
                    onClick={() =>
                      handleCopy("auth_url", endpoints.authorizationUrl.value)
                    }
                    className="p-1 rounded bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 transition"
                    title="Copy Authorization URL"
                  >
                    {copiedKey === "auth_url" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Token URL */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">
                    Token Exchange URL
                  </span>
                  <ClaimEvidenceBadge evidence={endpoints.tokenUrl.evidence} />
                </div>
                <div className="flex items-center gap-2 bg-slate-950/80 p-2.5 rounded-lg border border-purple-900/50 font-mono text-xs text-purple-200">
                  <span className="truncate flex-1 select-all">
                    {endpoints.tokenUrl.value}
                  </span>
                  <button
                    onClick={() =>
                      handleCopy("token_url", endpoints.tokenUrl.value)
                    }
                    className="p-1 rounded bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 transition"
                    title="Copy Token Exchange URL"
                  >
                    {copiedKey === "token_url" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Revocation URL (if present) */}
              {endpoints.revocationUrl && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">
                      Token Revocation URL
                    </span>
                    <ClaimEvidenceBadge
                      evidence={endpoints.revocationUrl.evidence}
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950/80 p-2.5 rounded-lg border border-purple-900/50 font-mono text-xs text-purple-200">
                    <span className="truncate flex-1 select-all">
                      {endpoints.revocationUrl.value}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy("revocation_url", endpoints.revocationUrl!.value)
                      }
                      className="p-1 rounded bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 transition"
                      title="Copy Revocation URL"
                    >
                      {copiedKey === "revocation_url" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* UserInfo URL (if present) */}
              {endpoints.userInfoUrl && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">
                      UserInfo URL
                    </span>
                    <ClaimEvidenceBadge
                      evidence={endpoints.userInfoUrl.evidence}
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950/80 p-2.5 rounded-lg border border-purple-900/50 font-mono text-xs text-purple-200">
                    <span className="truncate flex-1 select-all">
                      {endpoints.userInfoUrl.value}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy("userinfo_url", endpoints.userInfoUrl!.value)
                      }
                      className="p-1 rounded bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 transition"
                      title="Copy UserInfo URL"
                    >
                      {copiedKey === "userinfo_url" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PKCE Status Pill */}
          {pkceRequired && (
            <div className="mt-5 pt-3 border-t border-purple-800/30 flex items-center justify-between text-xs">
              <span className="text-slate-400">PKCE Support:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-purple-300 font-medium">
                  {pkceRequired.value}
                </span>
                <ClaimEvidenceBadge evidence={pkceRequired.evidence} compact />
              </div>
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* ZONE B: COMPOSIO CALLBACK GUIDANCE (Cyan Accent)                     */}
        {/* ==================================================================== */}
        <div className="rounded-xl p-5 bg-gradient-to-b from-cyan-950/30 to-cyan-950/10 border border-cyan-500/30 shadow-cyan-glow flex flex-col justify-between">
          <div>
            {/* Zone B Header */}
            <div className="flex items-center justify-between pb-3 border-b border-cyan-800/40 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                    Zone B · Composio Callback
                  </div>
                  <h3 className="font-semibold text-sm text-cyan-100">
                    Redirect URI Guidance
                  </h3>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-700/40">
                Portal Setting
              </span>
            </div>

            {/* Instruction Banner */}
            <div className="mb-4 p-3 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-start gap-2.5 text-xs text-cyan-200 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-cyan-300">Paste into {appName} Portal:</strong>{" "}
                This is the exact Redirect URI that must be registered in the
                provider's developer portal settings.
              </div>
            </div>

            {/* Active Callback URI or Dashboard Lookup */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">
                    Active Config Callback URI
                  </span>
                  {callbackGuidance.activeConfigCallbackUri ? (
                    <ClaimEvidenceBadge
                      evidence={callbackGuidance.activeConfigCallbackUri.evidence}
                    />
                  ) : (
                    <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-900/60">
                      Lookup in Dashboard
                    </span>
                  )}
                </div>

                {callbackGuidance.activeConfigCallbackUri ? (
                  <div className="flex items-center gap-2 bg-slate-950/80 p-2.5 rounded-lg border border-cyan-900/50 font-mono text-xs text-cyan-200">
                    <span className="truncate flex-1 select-all font-semibold">
                      {callbackGuidance.activeConfigCallbackUri.value}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          "callback_uri",
                          callbackGuidance.activeConfigCallbackUri!.value
                        )
                      }
                      className="p-1 rounded bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 transition"
                      title="Copy Callback URI"
                    >
                      {copiedKey === "callback_uri" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-cyan-900/50 text-xs text-slate-300">
                    <p className="text-cyan-300 font-mono text-[11px] mb-1">
                      https://backend.composio.dev/api/v3/toolkits/auth/callback
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Copy the active configuration URI directly from your Composio workspace.
                    </p>
                  </div>
                )}
              </div>

              {/* How to Locate and Verify */}
              <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                <div className="font-semibold text-cyan-300 text-xs flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>How to locate & verify in Composio:</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {callbackGuidance.howToLocateAndVerify}
                </p>
              </div>
            </div>
          </div>

          {/* Reference Documentation Citation */}
          <div className="mt-5 pt-3 border-t border-cyan-800/30">
            <div className="flex items-start justify-between gap-2 text-[11px] text-slate-400">
              <p className="italic">
                "{callbackGuidance.documentedReferenceNote.value}"
              </p>
              <ClaimEvidenceBadge
                evidence={callbackGuidance.documentedReferenceNote.evidence}
                compact
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default EndpointsAndCallbackBox;
