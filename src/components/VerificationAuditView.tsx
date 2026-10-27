import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Filter,
  Check,
  Calendar,
  Layers,
} from "lucide-react";
import {
  VERIFICATION_AUDIT_DATA,
  VerificationAuditRecord,
} from "../data/verificationAudit";

export const VerificationAuditView: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<
    "tested" | "documented" | "corrections" | "uncertainties"
  >("tested");

  // Compute metrics across all audit records
  const metrics = useMemo(() => {
    let testedCount = 0;
    let documentedCount = 0;
    let correctionsCount = 0;
    let uncertaintiesCount = 0;
    let sourcesCount = 0;

    VERIFICATION_AUDIT_DATA.forEach((r) => {
      testedCount += (r.testedLive || []).length || (r.testedLiveActions || []).length;
      documentedCount += (r.documentedFacts || []).length;
      correctionsCount += (r.correctionsMade || []).length || (r.mythCorrections || []).length;
      uncertaintiesCount += (r.openHypothesesAndUncertainties || []).length || (r.openUncertainties || []).length;
      sourcesCount += (r.sourcesChecked || []).length;
    });

    return {
      testedCount,
      documentedCount,
      correctionsCount,
      uncertaintiesCount,
      sourcesCount,
    };
  }, []);

  // Filter records by selected platform
  const filteredRecords = useMemo(() => {
    if (selectedPlatform === "all") {
      return VERIFICATION_AUDIT_DATA;
    }
    return VERIFICATION_AUDIT_DATA.filter(
      (r) =>
        r.id === selectedPlatform ||
        r.platformId === selectedPlatform ||
        r.appId === selectedPlatform
    );
  }, [selectedPlatform]);

  return (
    <div className="space-y-8 pb-16">
      {/* View Header */}
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h1 className="text-2xl font-bold text-white">
            Forensic Verification Audit & Epistemic Scorecard
          </h1>
        </div>
        <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
          Radical transparency into source verification. We separate what was directly tested in
          live provider consoles from documented claims, record corrections made to prior
          assumptions, and explicitly disclose all open hypotheses.
        </p>
      </div>

      {/* Metrics Scorecard */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Sources Checked</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics.sourcesCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Official developer portals</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tested Live</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {metrics.testedCount}
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-0.5">Portal actions verified</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-blue-400 mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Documented Facts</span>
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono">
            {metrics.documentedCount}
          </div>
          <div className="text-[11px] text-blue-500/80 mt-0.5">Verbatim source citations</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-purple-400 mb-1">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Corrections Made</span>
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono">
            {metrics.correctionsCount}
          </div>
          <div className="text-[11px] text-purple-400/80 mt-0.5">Myths & assumptions fixed</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Open Hypotheses</span>
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">
            {metrics.uncertaintiesCount}
          </div>
          <div className="text-[11px] text-amber-500/80 mt-0.5">Explicitly flagged estimates</div>
        </div>
      </section>

      {/* Control Bar: Platform Filter & Tab Switcher */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Platform Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Platform Scope:</span>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
          >
            <option value="all">All 6 Key Platforms</option>
            <option value="composio_platform">Composio Platform</option>
            <option value="github">GitHub</option>
            <option value="slack">Slack</option>
            <option value="google_workspace">Google Workspace</option>
            <option value="notion">Notion</option>
            <option value="perplexity">Perplexity</option>
          </select>
        </div>

        {/* Audit Category Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("tested")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === "tested"
                ? "bg-emerald-950/70 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Tested Live Actions
          </button>
          <button
            onClick={() => setActiveTab("documented")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === "documented"
                ? "bg-blue-950/70 text-blue-300 border border-blue-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Documented Facts
          </button>
          <button
            onClick={() => setActiveTab("corrections")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === "corrections"
                ? "bg-purple-950/70 text-purple-300 border border-purple-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Corrections Made
          </button>
          <button
            onClick={() => setActiveTab("uncertainties")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === "uncertainties"
                ? "bg-amber-950/70 text-amber-300 border border-amber-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Open Uncertainties
          </button>
        </div>
      </div>

      {/* Main Audit Records List */}
      <div className="space-y-6">
        {filteredRecords.map((record) => (
          <div
            key={record.id}
            className="glass-card rounded-2xl border border-slate-800 p-6 space-y-5"
          >
            {/* Record Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-900 text-cyan-400 border border-slate-800">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-white">
                    {record.providerOrPlatform || record.platformName}
                  </h2>
                  <span className="text-[11px] font-mono text-slate-500">
                    ID: {record.platformId || record.id}
                  </span>
                </div>
              </div>

              {/* Sources Count Badge */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{(record.sourcesChecked || []).length} Sources Consulted</span>
              </div>
            </div>

            {/* Sources List Pill Carousel */}
            {record.sourcesChecked && record.sourcesChecked.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                {record.sourcesChecked.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition text-[11px]"
                  >
                    <span>{src.title}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                ))}
              </div>
            )}

            {/* TAB CONTENT */}

            {/* 1. Tested Live */}
            {activeTab === "tested" && (
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tested Live Actions & Results</span>
                </div>

                {record.testedLive && record.testedLive.length > 0 ? (
                  <div className="space-y-2.5">
                    {record.testedLive.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-300">
                            {item.action}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="text-slate-300 font-mono text-[11px]">
                          Outcome: {item.outcome}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : record.testedLiveActions && record.testedLiveActions.length > 0 ? (
                  <ul className="space-y-2 text-xs text-slate-300">
                    {record.testedLiveActions.map((action, idx) => (
                      <li
                        key={idx}
                        className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-2"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/40 text-xs text-slate-500 italic">
                    No live portal operations executed for this platform (relies on verified documentation).
                  </div>
                )}
              </div>
            )}

            {/* 2. Documented Facts */}
            {activeTab === "documented" && (
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Documented Facts Extracted From Official Sources</span>
                </div>

                <div className="space-y-2 text-xs">
                  {record.documentedFacts.map((fact, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 text-slate-300 leading-relaxed"
                    >
                      {fact}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Corrections Made */}
            {activeTab === "corrections" && (
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Corrections Made to Prior Assumptions & Common Myths</span>
                </div>

                {record.correctionsMade && record.correctionsMade.length > 0 ? (
                  <div className="space-y-3">
                    {record.correctionsMade.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/40 text-xs space-y-2"
                      >
                        <div>
                          <span className="text-rose-400 font-semibold block">
                            Prior Assumption / Myth:
                          </span>
                          <p className="text-slate-400 mt-0.5 line-through">
                            {c.priorBelief}
                          </p>
                        </div>
                        <div>
                          <span className="text-emerald-400 font-semibold block">
                            Corrected Fact:
                          </span>
                          <p className="text-slate-200 mt-0.5 font-medium">
                            {c.correctedFact}
                          </p>
                        </div>
                        <div className="text-[11px] text-purple-300 bg-purple-950/40 p-2 rounded border border-purple-900/50">
                          <span className="font-semibold">Evidence: </span>
                          {c.evidence}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : record.mythCorrections && record.mythCorrections.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {record.mythCorrections.map((myth, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-purple-950/20 border border-purple-900/40 text-slate-300"
                      >
                        {myth}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/40 text-xs text-slate-500 italic">
                    No prior assumptions required correction.
                  </div>
                )}
              </div>
            )}

            {/* 4. Open Uncertainties */}
            {activeTab === "uncertainties" && (
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Open Hypotheses & Areas Awaiting Live Verification</span>
                </div>

                <div className="space-y-2 text-xs">
                  {(record.openHypothesesAndUncertainties || record.openUncertainties).map(
                    (item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 text-slate-300 flex items-start gap-2"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default VerificationAuditView;
