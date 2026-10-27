import React, { useState } from "react";
import { Navbar, ViewType } from "./components/Navbar";
import { DirectoryView } from "./components/DirectoryView";
import { GuideDetailView } from "./components/GuideDetailView";
import { LiveInvestigatorPanel } from "./components/LiveInvestigatorPanel";
import { VerificationAuditView } from "./components/VerificationAuditView";
import { IntegrationReadinessGuide } from "./types/guide";
import { GITHUB_GUIDE } from "./data/curatedGuides";
import { Sparkles, ExternalLink, ShieldCheck, Github } from "lucide-react";

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>("directory");
  const [selectedGuide, setSelectedGuide] = useState<IntegrationReadinessGuide | null>(GITHUB_GUIDE);
  const [investigatorPreset, setInvestigatorPreset] = useState<{
    appName: string;
    websiteUrl?: string;
  }>({
    appName: "",
    websiteUrl: "",
  });

  const handleSelectGuide = (guide: IntegrationReadinessGuide) => {
    setSelectedGuide(guide);
    setCurrentView("guide_detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleInvestigateApp = (appName: string, websiteUrl?: string) => {
    setInvestigatorPreset({ appName, websiteUrl });
    setCurrentView("investigator");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-canvas text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onSelectView={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        hasActiveGuide={!!selectedGuide}
        activeGuideName={selectedGuide ? selectedGuide.appName : undefined}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentView === "directory" && (
          <DirectoryView
            onSelectGuide={handleSelectGuide}
            onInvestigateApp={handleInvestigateApp}
          />
        )}

        {currentView === "guide_detail" && (
          <GuideDetailView
            guide={selectedGuide || GITHUB_GUIDE}
            onBackToDirectory={() => {
              setCurrentView("directory");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}

        {currentView === "investigator" && (
          <LiveInvestigatorPanel
            initialAppName={investigatorPreset.appName}
            initialWebsiteUrl={investigatorPreset.websiteUrl}
            onOpenFullGuide={handleSelectGuide}
          />
        )}

        {currentView === "audit" && <VerificationAuditView />}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/60 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              <strong>APM Integrations:</strong> Strict epistemic honesty. Every
              claim is tagged tested live, documented, or unverified hypothesis.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <a
              href="https://manus.im/share/2EL46n4hLbL7XhQ67J2BWx?replay=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-purple-300 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Manus Task 2EL46n4hLbL7XhQ67J2BWx</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>

            <a
              href="https://github.com/Omikar243/composioassignment"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-white transition"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Repository</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>

            <a
              href="https://docs.composio.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-300 transition"
            >
              Composio Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
