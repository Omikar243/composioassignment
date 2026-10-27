import React, { useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  Clock,
  Layers,
  Key,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  Copy,
  Check,
  Code,
  FileCheck,
} from "lucide-react";
import {
  IntegrationReadinessGuide,
  PrerequisiteItem,
  BlockerPlaybookItem,
  SetupStep,
} from "../types/guide";
import { ClaimEvidenceBadge } from "./ClaimEvidenceBadge";
import { EndpointsAndCallbackBox } from "./EndpointsAndCallbackBox";
import { CodeSnippetSpec } from "./CodeSnippetSpec";
import { ExportEngine } from "./ExportEngine";

export interface GuideDetailViewProps {
  guide: IntegrationReadinessGuide;
  onBackToDirectory: () => void;
}

export const GuideDetailView: React.FC<GuideDetailViewProps> = ({
  guide,
  onBackToDirectory,
}) => {
  const [hybridTab, setHybridTab] = useState<"direct" | "oauth">("direct");
  const [expandedBlocker, setExpandedBlocker] = useState<number | null>(null);
  const [copiedAssetKey, setCopiedAssetKey] = useState<string | null>(null);

  const handleCopyAsset = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedAssetKey(key);
    setTimeout(() => setCopiedAssetKey(null), 2000);
  };

  // Safely extract prerequisites array
  const prereqList: PrerequisiteItem[] = React.useMemo(() => {
    if (!guide.prerequisites) return [];
    if (Array.isArray(guide.prerequisites)) {
      return guide.prerequisites.map((p: any) => p.value || p);
    }
    if ((guide.prerequisites as any).value && Array.isArray((guide.prerequisites as any).value)) {
      return (guide.prerequisites as any).value;
    }
    return [];
  }, [guide.prerequisites]);

  // Safely extract blockers array
  const blockerList: BlockerPlaybookItem[] = React.useMemo(() => {
    if (!guide.blockersAndPlaybooks) return [];
    if (Array.isArray(guide.blockersAndPlaybooks)) {
      return guide.blockersAndPlaybooks.map((b: any) => b.value || b);
    }
    if (
      (guide.blockersAndPlaybooks as any).value &&
      Array.isArray((guide.blockersAndPlaybooks as any).value)
    ) {
      return (guide.blockersAndPlaybooks as any).value;
    }
    return [];
  }, [guide.blockersAndPlaybooks]);

  const authMode = guide.authSpec.mode;

  return (
    <div className="guide-detail-page space-y-8 pb-16">
      {/* ==================================================================== */}
      {/* 1. TOP BREADCRUMB & ACTIONS                                          */}
      {/* ==================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBackToDirectory}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Directory</span>
        </button>

        {/* Export Actions */}
        <ExportEngine guide={guide} />
      </div>

      {/* ==================================================================== */}
      {/* 2. APP HEADER & READINESS SUMMARY HERO                               */}
      {/* ==================================================================== */}
      <section className="rounded-2xl p-6 sm:p-8 glass-card border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {guide.appName}
              </h1>
              {guide.composioToolkitSlug && (
                <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-900 text-cyan-300 border border-slate-800">
                  toolkit: {guide.composioToolkitSlug}
                </span>
              )}
            </div>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              {guide.readinessSummary.oneLineSummary}
            </p>
          </div>

          {guide.websiteUrl && (
            <a
              href={guide.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition w-fit"
            >
              <span>Provider Documentation</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Dynamic Auth Path Necessity Callout Banner */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            authMode === "direct_credential"
              ? "bg-teal-950/40 border-teal-500/40 text-teal-200"
              : authMode === "hybrid"
              ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-200"
              : "bg-purple-950/40 border-purple-500/40 text-purple-200"
          }`}
        >
          {authMode === "direct_credential" ? (
            <Key className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          ) : authMode === "hybrid" ? (
            <Layers className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          ) : (
            <Lock className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs sm:text-sm leading-relaxed">
            <strong className="font-semibold block mb-0.5">
              {authMode === "direct_credential"
                ? "OAuth Setup Isn't Required"
                : authMode === "hybrid"
                ? "Hybrid Authentication Available"
                : "OAuth Registration Required"}
            </strong>
            <span>{guide.readinessSummary.oauthNecessityBanner}</span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Active Setup Time */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Active Setup Time</span>
              <ClaimEvidenceBadge
                evidence={guide.readinessSummary.activeSetupTime.evidence}
                compact
              />
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {guide.readinessSummary.activeSetupTime.value}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Hands-on portal config
            </div>
          </div>

          {/* Approval Wait Time */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Review Gate Wait</span>
              <ClaimEvidenceBadge
                evidence={guide.readinessSummary.approvalWaitTime.evidence}
                compact
              />
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {guide.readinessSummary.approvalWaitTime.value}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Provider approval queue
            </div>
          </div>

          {/* Composio Managed Auth */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Composio Managed</span>
              <ClaimEvidenceBadge
                evidence={guide.composioManagedAuthStatus.evidence}
                compact
              />
            </div>
            <div className="text-lg font-bold text-cyan-300 font-mono capitalize">
              {guide.composioManagedAuthStatus.value.replace(/_/g, " ")}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Pre-configured app availability
            </div>
          </div>

          {/* Supported Schemes */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Supported Schemes</span>
              <ClaimEvidenceBadge
                evidence={guide.supportedAuthSchemes.evidence}
                compact
              />
            </div>
            <div className="text-sm font-semibold text-white truncate font-mono">
              {guide.supportedAuthSchemes.value.join(", ")}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Verified auth protocols
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. PREREQUISITES CHECKLIST                                           */}
      {/* ==================================================================== */}
      {prereqList.length > 0 && (
        <section className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-cyan-400" />
              <span>Prerequisites & Account Requirements</span>
            </h2>
            <span className="text-xs text-slate-400">
              Dev Testing vs Production Gate
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {prereqList.map((prereq, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3"
              >
                <div className="p-1 rounded bg-slate-800 text-cyan-400 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs">
                      {prereq.item}
                    </span>
                    <div className="flex items-center gap-1">
                      {prereq.requiredForTesting && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
                          Dev Required
                        </span>
                      )}
                      {prereq.requiredForProduction && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-950/60 text-amber-300 border border-amber-800/40">
                          Prod Required
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    {prereq.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* 4. TECHNICAL SPECIFICATION (Dynamic by Auth Mode)                    */}
      {/* ==================================================================== */}
      <section className="space-y-6">
        {/* HYBRID AUTH SWITCHER */}
        {authMode === "hybrid" && (
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  <span>Choose Your Authentication Path</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  This integration supports both direct access tokens and public OAuth 2.0.
                </p>
              </div>

              {/* Tab Selector */}
              <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <button
                  onClick={() => setHybridTab("direct")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    hybridTab === "direct"
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Direct Token Path
                </button>
                <button
                  onClick={() => setHybridTab("oauth")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    hybridTab === "oauth"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Public OAuth 2.0 Path
                </button>
              </div>
            </div>

            {/* Path Decision Guide Box */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 text-xs leading-relaxed">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">
                  Path Decision Guide:
                </strong>
                <p className="text-slate-300">
                  {guide.authSpec.pathDecisionGuide.value}
                </p>
              </div>
            </div>

            {/* Hybrid Active Tab Content */}
            {hybridTab === "direct" ? (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-teal-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-teal-300">
                    Option 1: {guide.authSpec.directCredentialPath.credentialLabel}
                  </span>
                  <span className="text-xs font-mono text-teal-400 bg-teal-950/50 px-2 py-0.5 rounded border border-teal-800">
                    {guide.authSpec.directCredentialPath.scheme}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {guide.authSpec.directCredentialPath.whyOAuthIsNotRequired}
                </p>
                <div className="p-3 bg-slate-900 rounded border border-slate-800 font-mono text-xs text-teal-200">
                  {guide.authSpec.directCredentialPath.headerOrParamFormat.value}
                </div>
              </div>
            ) : (
              <EndpointsAndCallbackBox
                endpoints={guide.authSpec.oauthPath.providerEndpoints}
                callbackGuidance={guide.authSpec.oauthPath.composioCallbackGuidance}
                pkceRequired={guide.authSpec.oauthPath.pkceRequired}
                appName={guide.appName}
              />
            )}
          </div>
        )}

        {/* PURE DIRECT CREDENTIAL MODE */}
        {authMode === "direct_credential" && (
          <div className="glass-card p-6 rounded-2xl border border-teal-500/30 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-teal-400" />
                <h2 className="text-lg font-bold text-white">
                  Direct Credential Specification (Zero OAuth Endpoints)
                </h2>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                {guide.authSpec.scheme}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-500/20 text-xs text-slate-300 space-y-2">
              <p className="font-medium text-teal-200">
                {guide.authSpec.whyOAuthIsNotRequired}
              </p>
              <p className="text-slate-400">
                This integration path requires generating a personal access key
                directly in the developer console. No client IDs, client secrets,
                redirect URIs, or review approvals are required.
              </p>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Header / Param Format:</span>
                <div className="mt-1 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-teal-300">
                  {guide.authSpec.headerOrParamFormat.value}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Rotation & Expiry Rules:</span>
                <p className="mt-1 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300">
                  {guide.authSpec.rotationAndExpiryRules.value}
                </p>
              </div>

              {guide.authSpec.portalUrl && (
                <div className="pt-2">
                  <a
                    href={guide.authSpec.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 hover:underline"
                  >
                    <span>Generate API Key in Developer Console</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PURE OAUTH MODE */}
        {authMode === "oauth" && (
          <div className="space-y-6">
            <EndpointsAndCallbackBox
              endpoints={guide.authSpec.providerEndpoints}
              callbackGuidance={guide.authSpec.composioCallbackGuidance}
              pkceRequired={guide.authSpec.pkceRequired}
              appName={guide.appName}
            />

            {/* Scopes Table */}
            {guide.authSpec.scopes && guide.authSpec.scopes.value.length > 0 && (
              <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span>Requested Scopes & Permissions</span>
                  </h3>
                  <ClaimEvidenceBadge evidence={guide.authSpec.scopes.evidence} />
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Scope Identifier</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Sensitive?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {guide.authSpec.scopes.value.map((scope, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 text-purple-300 font-semibold">
                            {scope.scope}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 font-sans">
                            {scope.category}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 font-sans">
                            {scope.description}
                          </td>
                          <td className="py-2.5 px-3 text-right font-sans">
                            {scope.isSensitiveOrRestricted ? (
                              <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 text-[11px]">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Sensitive</span>
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Standard</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* 5. STEP-BY-STEP SETUP RUNBOOK                                        */}
      {/* ==================================================================== */}
      <section className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>Step-by-Step Setup Runbook</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Follow these verified steps in your developer portal and Composio configuration.
          </p>
        </div>

        <div className="space-y-6">
          {guide.setupRunbook.map((step) => (
            <div
              key={step.stepNumber}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center font-bold text-xs font-mono">
                    {step.stepNumber}
                  </div>
                  <h3 className="font-bold text-sm text-white">{step.title}</h3>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                    {step.actor.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-slate-300">
                    <span>{step.estimatedDuration.value}</span>
                    <ClaimEvidenceBadge
                      evidence={step.estimatedDuration.evidence}
                      compact
                    />
                  </div>
                </div>
              </div>

              {/* Instructions list */}
              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                {step.instructions.map((ins, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="font-mono text-cyan-400 text-[11px] mt-0.5">
                      {i + 1}.
                    </span>
                    <span>{ins}</span>
                  </div>
                ))}
              </div>

              {/* Copyable Assets */}
              {step.copyableAssets && step.copyableAssets.length > 0 && (
                <div className="pt-2 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Copyable Assets:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {step.copyableAssets.map((asset, aIdx) => {
                      const key = `asset-${step.stepNumber}-${aIdx}`;
                      return (
                        <div
                          key={aIdx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono"
                        >
                          <div className="truncate mr-2">
                            <span className="text-slate-400 font-sans text-[11px] block">
                              {asset.label}
                            </span>
                            <span className="text-cyan-300 select-all">
                              {asset.value}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopyAsset(key, asset.value)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
                            title={`Copy ${asset.label}`}
                          >
                            {copiedAssetKey === key ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Common Pitfall Callout */}
              {step.commonPitfall && (
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-900/50 flex items-start gap-2 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="text-amber-300">Common Pitfall: </strong>
                    <span>{step.commonPitfall.value}</span>
                  </div>
                  <ClaimEvidenceBadge
                    evidence={step.commonPitfall.evidence}
                    compact
                  />
                </div>
              )}

              {/* Step Portal Link */}
              {step.portalUrl && (
                <div className="pt-1">
                  <a
                    href={step.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
                  >
                    <span>Open Developer Portal Step</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. BLOCKERS & TROUBLESHOOTING PLAYBOOKS                             */}
      {/* ==================================================================== */}
      {blockerList.length > 0 && (
        <section className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Known Blockers & Error Playbooks</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {blockerList.length} documented scenarios
            </span>
          </div>

          <div className="space-y-3">
            {blockerList.map((blocker, idx) => {
              const isExpanded = expandedBlocker === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedBlocker(isExpanded ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-xs sm:text-sm text-slate-200">
                          {blocker.blockerTitle}
                        </span>
                        {blocker.errorCodeOrSymptom && (
                          <span className="ml-2 font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700">
                            {blocker.errorCodeOrSymptom}
                          </span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-slate-800/80 space-y-3 text-xs bg-slate-950/40">
                      <div>
                        <span className="text-slate-400 font-medium">Trigger Condition:</span>
                        <p className="mt-0.5 text-slate-300">
                          {blocker.triggerCondition}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
                        <span className="font-semibold text-emerald-400">How to Unblock:</span>
                        <p className="mt-1 text-slate-200 leading-relaxed">
                          {blocker.howToUnblock}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="font-semibold text-cyan-400">
                          Workaround While Waiting:
                        </span>
                        <p className="mt-1 text-slate-300 leading-relaxed">
                          {blocker.workaroundWhilstWaiting}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* 7. COMPOSIO SDK CODE SNIPPETS                                       */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <CodeSnippetSpec
          snippets={guide.composioIntegration.sdkSnippets}
          title={`${guide.appName} — Composio Integration Code Snippets`}
        />
      </section>
    </div>
  );
};
export default GuideDetailView;
