import React, { useState, useRef, useEffect } from "react";
import {
  Terminal,
  Search,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Lock,
  Layers,
  Key,
  Clock,
} from "lucide-react";
import type { InvestigationResponse } from "../agent/investigatorEngine";
import { CatalogAuthBaseline, IntegrationReadinessGuide } from "../types/guide";
import { CATALOG_100_APPS } from "../data/catalog100";
import { ClaimEvidenceBadge } from "./ClaimEvidenceBadge";
import { ExportEngine } from "./ExportEngine";
import { InvestigationRationale } from "./InvestigationRationale";
import { resolveDocumentationSourceUrl } from "../utils/investigationInput";

export interface LiveInvestigatorPanelProps {
  initialAppName?: string;
  initialWebsiteUrl?: string;
  initialCatalogBaseline?: CatalogAuthBaseline;
  onOpenFullGuide: (guide: IntegrationReadinessGuide) => void;
}

export const LiveInvestigatorPanel: React.FC<LiveInvestigatorPanelProps> = ({
  initialAppName = "",
  initialWebsiteUrl = "",
  initialCatalogBaseline,
  onOpenFullGuide,
}) => {
  const [appInput, setAppInput] = useState(initialAppName);
  const [urlInput, setUrlInput] = useState(initialWebsiteUrl);
  const [mode, setMode] = useState<"deterministic" | "ai_assisted">("deterministic");
  const [isRunning, setIsRunning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [investigationResult, setInvestigationResult] = useState<InvestigationResponse | null>(null);
  const [activeStep, setActiveStep] = useState<string>("IDLE");
  const [proxyStatus, setProxyStatus] = useState<"checking" | "online" | "offline">("checking");
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/health")
      .then((response) => {
        if (!response.ok) throw new Error(`Proxy health returned HTTP ${response.status}`);
        return response.json();
      })
      .then(() => { if (active) setProxyStatus("online"); })
      .catch(() => { if (active) setProxyStatus("offline"); });
    return () => { active = false; };
  }, []);

  // Auto-scroll terminal logs
  useEffect(() => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    logsEndRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  }, [terminalLogs]);

  // Handle presets
  const applyPreset = (name: string, url: string) => {
    setAppInput(name);
    setUrlInput(url);
  };

  const handleRunInvestigation = async () => {
    if (!appInput.trim()) return;

    setIsRunning(true);
    setInvestigationResult(null);
    setTerminalLogs([]);

    const timestamp = new Date().toISOString();
    const isUrl = /^https?:\/\//i.test(appInput.trim());
    const targetName = isUrl
      ? (() => {
          try {
            const labels = new URL(appInput.trim()).hostname.toLowerCase().replace(/^www\./, "").split(".");
            const compoundSuffix = labels.length >= 3 && ["co", "com", "org", "net"].includes(labels[labels.length - 2]) && labels[labels.length - 1].length === 2;
            const brand = labels[Math.max(0, labels.length - (compoundSuffix ? 3 : 2))] || "provider";
            return brand.charAt(0).toUpperCase() + brand.slice(1);
          } catch {
            return "Target Provider";
          }
        })()
      : appInput.trim();
    const normalizedAppName = targetName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const matchedCatalogApp = CATALOG_100_APPS.find((app) =>
      [app.name, app.appName, app.id, app.appId].some((candidate) =>
        candidate.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedAppName
      )
    );
    const initialNameNormalized = initialAppName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const initialBaselineMatches = Boolean(initialCatalogBaseline) && initialNameNormalized === normalizedAppName;
    const catalogBaseline: CatalogAuthBaseline | undefined = matchedCatalogApp
      ? {
          authPath: matchedCatalogApp.authPath,
          supportedAuthSchemes: [...matchedCatalogApp.supportedAuthSchemes],
          authDocUrl: matchedCatalogApp.authDocUrl,
        }
      : initialBaselineMatches
        ? initialCatalogBaseline
        : undefined;
    const targetUrl = matchedCatalogApp?.authDocUrl ||
      (initialBaselineMatches ? initialCatalogBaseline?.authDocUrl : undefined) ||
      resolveDocumentationSourceUrl(appInput, urlInput);

    setTerminalLogs([
      `[${timestamp}] [TRIAGE] Initializing live investigation for '${targetName}'...`,
      `[${timestamp}] [TRIAGE] Input classification: ${isUrl ? "URL-first query" : "App-name query"}`,
      `[${timestamp}] [TRIAGE] Requested mode: ${mode === "ai_assisted" ? "Mode B (optional AI)" : "Mode 2 (deterministic heuristic)"}`,
    ]);

    setActiveStep("ANALYZING");

    try {
      // Step 1: Check proxy health or fetch docs if URL provided
      if (targetUrl) {
        setTerminalLogs((prev) => [
          ...prev,
          `[${new Date().toISOString()}] [PROXY] Contacting server retrieval proxy for '${targetUrl}'...`,
        ]);
        setActiveStep("FETCHING");
      }

      // Step 2: Run the investigator on the server, not in the browser.
      setActiveStep(targetUrl ? "FETCHING" : "ANALYZING");
      setTerminalLogs((prev) => [
        ...prev,
        `[${new Date().toISOString()}] [PROXY] Sending request to same-origin /api/investigate...`,
      ]);
      const response = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appName: targetName, websiteUrl: targetUrl, mode, catalogBaseline }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || `Investigation API returned HTTP ${response.status}`);
      }
      const res = payload as InvestigationResponse;

      // Stream logs
      const combinedLogs = [...res.logs];
      setTerminalLogs((prev) => [...prev, ...combinedLogs]);
      setInvestigationResult(res);
      setActiveStep("COMPLETE");
    } catch (err: any) {
      setTerminalLogs((prev) => [
        ...prev,
        `[${new Date().toISOString()}] [ERROR] Investigation failed: ${err.message || String(err)}`,
      ]);
      setActiveStep("ERROR");
    } finally {
      setIsRunning(false);
    }
  };

  const getLogTagColor = (log: string) => {
    if (log.includes("[TRIAGE]")) return "text-cyan-400";
    if (log.includes("[PROXY]")) return "text-blue-400";
    if (log.includes("[PARSER]")) return "text-purple-400";
    if (log.includes("[ANALYZER]")) return "text-teal-400";
    if (log.includes("[EVIDENCE]")) return "text-amber-400";
    if (log.includes("[COMPOSIO]")) return "text-indigo-400";
    if (log.includes("[SYNTHESIS]")) return "text-emerald-400";
    if (log.includes("[ERROR]")) return "text-rose-400";
    return "text-slate-300";
  };

  const renderAuthPathBadge = (classification: string) => {
    switch (classification) {
      case "oauth_required":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-950/70 text-purple-300 border border-purple-500/40">
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span>OAuth Required</span>
          </span>
        );
      case "hybrid_oauth_or_direct":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-500/40">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hybrid Auth</span>
          </span>
        );
      case "direct_credential_only":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-950/70 text-teal-300 border border-teal-500/40">
            <Key className="w-3.5 h-3.5 text-teal-400" />
            <span>Direct Key Only</span>
          </span>
        );
      default:
        return (
          <span className="font-mono font-bold text-sm text-cyan-300">
            {classification}
          </span>
        );
    }
  };

  return (
    <div className="investigator-page space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Live Investigation Desk</h1>
          <span className={`api-health ${proxyStatus === "online" ? "is-online" : proxyStatus === "offline" ? "is-offline" : ""}`}>
            {proxyStatus === "online" ? "Proxy online" : proxyStatus === "offline" ? "Proxy unavailable" : "Checking proxy"}
          </span>
        </div>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
          Fetches provider pages through the server-side proxy when reachable, checks common auth patterns, and keeps unsupported claims marked as hypotheses. Composio-managed auth remains unknown unless independently verified.
        </p>
      </div>

      {/* Input Panel */}
      <section className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="investigator-app-input" className="block text-xs font-medium text-slate-300 mb-1.5">
              App Name or Documentation URL:
            </label>
            <input
              id="investigator-app-input"
              type="text"
              value={appInput}
              onChange={(e) => setAppInput(e.target.value)}
              placeholder="e.g. Linear, HubSpot, or https://developer.calendly.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition"
            />
          </div>

          <div>
            <label htmlFor="investigator-doc-url-input" className="block text-xs font-medium text-slate-300 mb-1.5">
              Documentation URL (Optional override):
            </label>
            <input
              id="investigator-doc-url-input"
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://docs.provider.com/api/auth"
              aria-describedby="investigator-doc-url-help"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition"
            />
            <p id="investigator-doc-url-help" className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
              If provided, this URL is fetched instead of a URL in the first field.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 text-[11px] font-medium">Quick Presets:</span>
          <button
            onClick={() =>
              applyPreset("Linear", "https://developer.linear.app/docs/oauth/authentication")
            }
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition text-[11px]"
          >
            Linear (OAuth)
          </button>
          <button
            onClick={() =>
              applyPreset("HubSpot", "https://developers.hubspot.com/docs/api/working-with-oauth")
            }
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition text-[11px]"
          >
            HubSpot (Hybrid)
          </button>
          <button
            onClick={() =>
              applyPreset("Resend", "https://resend.com/docs/api-reference/api-keys/create-api-key")
            }
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition text-[11px]"
          >
            Resend (API Key)
          </button>
          <button
            onClick={() =>
              applyPreset("Calendly", "https://developer.calendly.com/api-docs/oauth-2-0")
            }
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition text-[11px]"
          >
            Calendly (OAuth)
          </button>
          <button
            onClick={() =>
              applyPreset("Supabase", "https://supabase.com/docs/guides/getting-started/api-keys")
            }
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition text-[11px]"
          >
            Supabase (Direct Key)
          </button>
        </div>

        {/* Mode Selector and Launch Action */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Triage Engine:</span>
            <div className="inline-flex p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => setMode("deterministic")}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  mode === "deterministic"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Deterministic Rules (Fast)
              </button>
              <button
                onClick={() => setMode("ai_assisted")}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  mode === "ai_assisted"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                AI-Assisted (Mode B)
              </button>
            </div>
          </div>

          {mode === "ai_assisted" && (
            <p className="mode-note w-full">
              Mode B uses a server-side provider key only when configured. Without one, the response is explicitly labeled as a deterministic Mode 2 fallback.
            </p>
          )}

          <button
            onClick={handleRunInvestigation}
            disabled={isRunning || !appInput.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Investigating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Live Investigation</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Investigation Activity Log */}
      <section className="rounded-2xl glass-card overflow-hidden border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/70" />
              <div className="w-3 h-3 rounded-full bg-amber-500/70" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
            </div>
            <span className="font-mono text-xs font-semibold text-slate-300 ml-2">
              investigation-activity :: server response
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-slate-500">Status:</span>
            <span
              className={`px-2 py-0.5 rounded font-bold ${
                activeStep === "COMPLETE"
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  : activeStep === "ERROR"
                  ? "bg-rose-950 text-rose-400 border border-rose-800"
                  : isRunning
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {activeStep}
            </span>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="p-4 bg-black/95 font-mono text-xs min-h-[220px] max-h-[360px] overflow-y-auto space-y-1.5 text-slate-300" role="log" aria-live="polite" aria-label="Investigation progress log">
          {terminalLogs.length === 0 ? (
            <div className="text-slate-600 italic py-8 text-center">
              Awaiting app name or URL input to initiate research stream...
            </div>
          ) : (
            terminalLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed flex items-start gap-2">
                <span className="text-slate-600 select-none text-[10px] mt-0.5">
                  &gt;
                </span>
                <span className={getLogTagColor(log)}>{log}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </section>

      {/* Generated Guide Preview */}
      {investigationResult && (
        <section className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white">
                  Investigation Complete: {investigationResult.guide.appName}
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Resolved via{" "}
                <span className="font-mono text-cyan-300">
                  {investigationResult.modeUsed === "curated_fast_path"
                    ? "Mode 1 · curated fast path"
                    : investigationResult.modeUsed === "ai_assisted"
                    ? "Mode B · AI-assisted"
                    : mode === "ai_assisted"
                    ? "Mode B request · deterministic fallback"
                    : "Mode 2 · heuristic research"}
                </span>{" "}
                with strict schema enforcement.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ExportEngine guide={investigationResult.guide} />
              <button
                onClick={() => onOpenFullGuide(investigationResult.guide)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-medium hover:bg-cyan-500/30 transition"
              >
                <span>Open Full Guide</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">
                Auth Path Classification
              </span>
              <div className="mt-1">
                {renderAuthPathBadge(investigationResult.guide.readinessSummary.authPathClassification)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Active Setup Time</span>
                <ClaimEvidenceBadge
                  evidence={investigationResult.guide.readinessSummary.activeSetupTime.evidence}
                  compact
                />
              </div>
              <span className="font-mono font-bold text-sm text-white">
                {investigationResult.guide.readinessSummary.activeSetupTime.value}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Review Gate Wait</span>
                <ClaimEvidenceBadge
                  evidence={investigationResult.guide.readinessSummary.approvalWaitTime.evidence}
                  compact
                />
              </div>
              <span className="font-mono font-bold text-sm text-white">
                {investigationResult.guide.readinessSummary.approvalWaitTime.value}
              </span>
            </div>
          </div>

          <InvestigationRationale guide={investigationResult.guide} />

          {/* Necessity Banner */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <strong className="text-white block mb-0.5">Readiness Guidance:</strong>
            {investigationResult.guide.readinessSummary.oauthNecessityBanner}
          </div>
        </section>
      )}
    </div>
  );
};
export default LiveInvestigatorPanel;
