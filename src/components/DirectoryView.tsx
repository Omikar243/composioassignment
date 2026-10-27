import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Key,
  Layers,
  Lock,
  Clock,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  Zap,
} from "lucide-react";
import {
  CATALOG_100_APPS,
  CatalogApp,
  CatalogCategory,
  ReviewGateStatus,
  SetupDifficulty,
  getCatalogStats,
} from "../data/catalog100";
import { curatedGuides, getCuratedGuide } from "../data/curatedGuides";
import { IntegrationReadinessGuide, AuthPathClassification } from "../types/guide";
import { ClaimEvidenceBadge } from "./ClaimEvidenceBadge";

export interface DirectoryViewProps {
  onSelectGuide: (guide: IntegrationReadinessGuide) => void;
  onInvestigateApp: (appName: string, websiteUrl?: string) => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  onSelectGuide,
  onInvestigateApp,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAuthPath, setSelectedAuthPath] = useState<string>("all");
  const [selectedReviewGate, setSelectedReviewGate] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  const stats = useMemo(() => getCatalogStats(), []);

  // Filter 100-app catalog based on user selections
  const filteredApps = useMemo(() => {
    return CATALOG_100_APPS.filter((app) => {
      // Text search
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase().trim();
        const matchesName =
          app.name.toLowerCase().includes(query) ||
          app.appName.toLowerCase().includes(query);
        const matchesCategory = app.category.toLowerCase().includes(query);
        const matchesSlug = app.composioToolkitSlug
          ? app.composioToolkitSlug.toLowerCase().includes(query)
          : false;
        const matchesNuance = app.keyNuanceOrPitfall
          .toLowerCase()
          .includes(query);
        if (!matchesName && !matchesCategory && !matchesSlug && !matchesNuance) {
          return false;
        }
      }

      // Auth Path Filter
      if (selectedAuthPath !== "all" && app.authPath !== selectedAuthPath) {
        return false;
      }

      // Review Gate Filter
      if (
        selectedReviewGate !== "all" &&
        app.reviewGate !== selectedReviewGate
      ) {
        return false;
      }

      // Category Filter
      if (selectedCategory !== "all" && app.category !== selectedCategory) {
        return false;
      }

      // Difficulty Filter
      if (
        selectedDifficulty !== "all" &&
        app.difficulty !== selectedDifficulty
      ) {
        return false;
      }

      return true;
    });
  }, [
    searchTerm,
    selectedAuthPath,
    selectedReviewGate,
    selectedCategory,
    selectedDifficulty,
  ]);

  const handleAppClick = (app: CatalogApp) => {
    const curated = getCuratedGuide(app.appId) || getCuratedGuide(app.id);
    if (curated) {
      onSelectGuide(curated);
    } else {
      // Open in Live Investigator for dynamic research
      onInvestigateApp(app.name, app.websiteUrl);
    }
  };

  const getAuthBadge = (authPath: AuthPathClassification) => {
    switch (authPath) {
      case "oauth_required":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-950/60 text-purple-300 border border-purple-500/40">
            <Lock className="w-3 h-3 text-purple-400" />
            <span>OAuth Required</span>
          </span>
        );
      case "hybrid_oauth_or_direct":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-500/40">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>Hybrid Auth</span>
          </span>
        );
      case "direct_credential_only":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-950/60 text-teal-300 border border-teal-500/40">
            <Key className="w-3 h-3 text-teal-400" />
            <span>Direct Key Only</span>
          </span>
        );
    }
  };

  const getReviewGateBadge = (gate: ReviewGateStatus) => {
    switch (gate) {
      case "no_gate":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/60">
            <CheckCircle className="w-3 h-3" />
            <span>No Gate</span>
          </span>
        );
      case "conditional_gate":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-950/40 text-amber-300 border border-amber-800/60">
            <AlertCircle className="w-3 h-3" />
            <span>Conditional Gate</span>
          </span>
        );
      case "mandatory_enterprise_gate":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-950/40 text-rose-300 border border-rose-800/60">
            <ShieldAlert className="w-3 h-3" />
            <span>Mandatory Gate</span>
          </span>
        );
      case "unknown":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-900/60 text-slate-400 border border-slate-800">
            <HelpCircle className="w-3 h-3" />
            <span>Unknown Gate</span>
          </span>
        );
    }
  };

  const getDifficultyBadge = (difficulty: SetupDifficulty) => {
    switch (difficulty) {
      case "easy":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono text-emerald-300 bg-emerald-950/50 border border-emerald-800/50">
            Easy
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono text-amber-300 bg-amber-950/50 border border-amber-800/50">
            Medium
          </span>
        );
      case "hard":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono text-rose-300 bg-rose-950/50 border border-rose-800/50">
            Hard
          </span>
        );
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* ==================================================================== */}
      {/* 1. HERO BANNER                                                       */}
      {/* ==================================================================== */}
      <section className="relative rounded-3xl p-6 sm:p-10 overflow-hidden glass-card border border-slate-800">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Composio Agent Integration Directory</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            OAuth Readiness Copilot
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
            Eliminating authentication guesswork for agent builders. Know your
            exact auth path, developer portal registration steps, required
            scopes, and whether review gates require wait times.
          </p>

          {/* Epistemic Honesty Guarantee Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Epistemic Standard:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 font-medium">
              [Tested Live]
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950/50 text-blue-400 border border-blue-500/30 font-medium">
              [Documented]
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/50 text-amber-400 border border-amber-500/30 font-medium">
              [Hypothesis]
            </span>
            <span className="text-slate-400 text-[11px]">
              (Silence in documentation is never assumed to be instant approval)
            </span>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. STATS BAR                                                         */}
      {/* ==================================================================== */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400">Catalog Size</div>
          <div className="text-2xl font-bold text-white mt-1">
            {stats.totalApps} Apps
          </div>
          <div className="text-xs text-cyan-400 mt-1">10 Domain Categories</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400">OAuth Required</div>
          <div className="text-2xl font-bold text-purple-300 mt-1">
            {stats.byAuthPath.oauth_required} Apps
          </div>
          <div className="text-xs text-purple-400 mt-1">
            {Math.round((stats.byAuthPath.oauth_required / stats.totalApps) * 100)}% of Catalog
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400">Hybrid Auth Path</div>
          <div className="text-2xl font-bold text-cyan-300 mt-1">
            {stats.byAuthPath.hybrid_oauth_or_direct} Apps
          </div>
          <div className="text-xs text-cyan-400 mt-1">
            {Math.round((stats.byAuthPath.hybrid_oauth_or_direct / stats.totalApps) * 100)}% (Token or OAuth)
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400">Direct Key Only</div>
          <div className="text-2xl font-bold text-teal-300 mt-1">
            {stats.byAuthPath.direct_credential_only} Apps
          </div>
          <div className="text-xs text-teal-400 mt-1">
            {Math.round((stats.byAuthPath.direct_credential_only / stats.totalApps) * 100)}% Zero OAuth Setup
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. FEATURED CURATED GUIDES (5 Spotlight Apps)                        */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">
              Featured Curated Guides (Verified Runbooks)
            </h2>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Tested & Verified against Official Provider Consoles
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {curatedGuides.map((guide) => (
            <div
              key={guide.appId}
              onClick={() => onSelectGuide(guide)}
              className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800 cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition flex items-center gap-1.5">
                    <span>{guide.appName}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-cyan-400" />
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {guide.composioToolkitSlug}
                  </span>
                </div>

                <div>{getAuthBadge(guide.readinessSummary.authPathClassification)}</div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {guide.readinessSummary.oneLineSummary}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Setup:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-200 font-mono text-[11px]">
                        {guide.readinessSummary.activeSetupTime.value}
                      </span>
                      <ClaimEvidenceBadge
                        evidence={guide.readinessSummary.activeSetupTime.evidence}
                        compact
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Review Wait:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-200 font-mono text-[11px]">
                        {guide.readinessSummary.approvalWaitTime.value}
                      </span>
                      <ClaimEvidenceBadge
                        evidence={guide.readinessSummary.approvalWaitTime.evidence}
                        compact
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-cyan-400 font-medium">
                <span>View Full Runbook</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. 100-APP CATALOG DIRECTORY INDEX                                   */}
      {/* ==================================================================== */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>100-App Catalog Directory Index</span>
              <span className="text-xs font-normal text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-800">
                {filteredApps.length} results
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Popular AI agent integrations categorized by authentication model, review gate, and setup complexity.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search 100 apps (e.g. Linear, HubSpot)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filter Catalog:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Auth Path Filter */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Auth Path Model:
              </label>
              <select
                value={selectedAuthPath}
                onChange={(e) => setSelectedAuthPath(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500/60"
              >
                <option value="all">All Auth Paths (100)</option>
                <option value="oauth_required">OAuth Required (50)</option>
                <option value="hybrid_oauth_or_direct">Hybrid Auth (25)</option>
                <option value="direct_credential_only">Direct Key Only (25)</option>
              </select>
            </div>

            {/* Review Gate Filter */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Review Gate Status:
              </label>
              <select
                value={selectedReviewGate}
                onChange={(e) => setSelectedReviewGate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500/60"
              >
                <option value="all">All Review Gate States</option>
                <option value="no_gate">No Gate Identified</option>
                <option value="conditional_gate">Conditional Gate</option>
                <option value="mandatory_enterprise_gate">Mandatory Gate</option>
                <option value="unknown">Unknown Gate</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Domain Category:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500/60"
              >
                <option value="all">All 10 Categories</option>
                <option value="Developer Tools">Developer Tools</option>
                <option value="Communication">Communication</option>
                <option value="Productivity">Productivity</option>
                <option value="CRM & Sales">CRM & Sales</option>
                <option value="AI & Search">AI & Search</option>
                <option value="Social & Marketing">Social & Marketing</option>
                <option value="Finance & Payments">Finance & Payments</option>
                <option value="Cloud Storage">Cloud Storage</option>
                <option value="E-Commerce">E-Commerce</option>
                <option value="HR & Operations">HR & Operations</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Setup Difficulty:
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500/60"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Catalog Table */}
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">App & Toolkit</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Auth Model</th>
                  <th className="py-3.5 px-4">Active Setup</th>
                  <th className="py-3.5 px-4">Review Gate</th>
                  <th className="py-3.5 px-4">Wait Time</th>
                  <th className="py-3.5 px-4">Difficulty</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-normal">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No integrations match the current search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => handleAppClick(app)}
                      className="hover:bg-slate-800/40 cursor-pointer transition"
                    >
                      {/* Name & Toolkit */}
                      <td className="py-3 px-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span>{app.name}</span>
                          {app.hasCuratedDeepGuide && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                              Curated
                            </span>
                          )}
                        </div>
                        {app.composioToolkitSlug && (
                          <div className="text-[10px] font-mono text-slate-500">
                            toolkit: {app.composioToolkitSlug}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-400">
                        {app.category}
                      </td>

                      {/* Auth Model */}
                      <td className="py-3 px-4">
                        {getAuthBadge(app.authPath)}
                      </td>

                      {/* Setup Time */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-200">
                            {app.setupTimeEstimate.value}
                          </span>
                          <ClaimEvidenceBadge
                            evidence={app.setupTimeEstimate.evidence}
                            compact
                          />
                        </div>
                      </td>

                      {/* Review Gate */}
                      <td className="py-3 px-4">
                        {getReviewGateBadge(app.reviewGate)}
                      </td>

                      {/* Wait Time */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-200">
                            {app.approvalWaitEstimate.value}
                          </span>
                          <ClaimEvidenceBadge
                            evidence={app.approvalWaitEstimate.evidence}
                            compact
                          />
                        </div>
                      </td>

                      {/* Difficulty */}
                      <td className="py-3 px-4">
                        {getDifficultyBadge(app.difficulty)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAppClick(app);
                          }}
                          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition"
                        >
                          <span>{app.hasCuratedDeepGuide ? "Runbook" : "Triage"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
export default DirectoryView;
