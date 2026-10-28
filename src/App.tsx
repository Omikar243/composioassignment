import React, { useEffect, useState } from "react";
import { ExternalLink, Github, ShieldCheck } from "lucide-react";
import { Navbar } from "./components/Navbar";
import type { ThemeMode, ViewType } from "./components/Navbar";
import { DirectoryView } from "./components/DirectoryView";
import { GuideDetailView } from "./components/GuideDetailView";
import { LiveInvestigatorPanel } from "./components/LiveInvestigatorPanel";
import { VerificationAuditView } from "./components/VerificationAuditView";
import { CatalogAuthBaseline, IntegrationReadinessGuide } from "./types/guide";
import type { CatalogApp } from "./data/catalog100";
import { GITHUB_GUIDE } from "./data/curatedGuides";

const getInitialTheme = (): ThemeMode => {
  try {
    return window.localStorage.getItem("oauth-copilot-theme") === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
};

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>("directory");
  const [selectedGuide, setSelectedGuide] = useState<IntegrationReadinessGuide | null>(GITHUB_GUIDE);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [investigatorPreset, setInvestigatorPreset] = useState<{
    appName: string;
    websiteUrl: string;
    catalogBaseline?: CatalogAuthBaseline;
  }>({ appName: "", websiteUrl: "" });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("oauth-copilot-theme", theme);
    } catch {
      // The app remains usable when storage is unavailable.
    }
  }, [theme]);

  const scrollToTop = () => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  const handleSelectView = (view: ViewType) => {
    setCurrentView(view);
    scrollToTop();
  };

  const handleSelectGuide = (guide: IntegrationReadinessGuide) => {
    setSelectedGuide(guide);
    setCurrentView("guide_detail");
    scrollToTop();
  };

  const handleInvestigateApp = (app?: CatalogApp) => {
    if (!app || !app.name) {
      setInvestigatorPreset({ appName: "", websiteUrl: "", catalogBaseline: undefined });
      setCurrentView("investigator");
      scrollToTop();
      return;
    }
    setInvestigatorPreset({
      appName: app.name,
      websiteUrl: app.authDocUrl || app.websiteUrl,
      catalogBaseline: {
        authPath: app.authPath,
        supportedAuthSchemes: [...app.supportedAuthSchemes],
        authDocUrl: app.authDocUrl,
      },
    });
    setCurrentView("investigator");
    scrollToTop();
  };

  return (
    <div className="app-shell min-h-screen flex flex-col" data-theme={theme}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navbar
        currentView={currentView}
        onSelectView={handleSelectView}
        hasActiveGuide={!!selectedGuide}
        activeGuideName={selectedGuide?.appName}
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")}
      />

      <main id="main-content" className="page-frame flex-1">
        {currentView === "directory" && (
          <DirectoryView
            onSelectGuide={handleSelectGuide}
            onInvestigateApp={handleInvestigateApp}
          />
        )}

        {currentView === "guide_detail" && (
          <GuideDetailView
            guide={selectedGuide || GITHUB_GUIDE}
            onBackToDirectory={() => handleSelectView("directory")}
          />
        )}

        {currentView === "investigator" && (
          <LiveInvestigatorPanel
            initialAppName={investigatorPreset.appName}
            initialWebsiteUrl={investigatorPreset.websiteUrl}
            initialCatalogBaseline={investigatorPreset.catalogBaseline}
            onOpenFullGuide={handleSelectGuide}
          />
        )}

        {currentView === "audit" && <VerificationAuditView />}
      </main>

      <footer className="app-footer" id="app-footer">
        <div className="app-footer-inner">
          <div className="footer-thesis">
            <ShieldCheck size={16} aria-hidden="true" />
            <span><strong>Evidence before certainty.</strong> Every claim stays marked as tested, documented, or unverified.</span>
          </div>
          <div className="footer-links">
            <a href="https://github.com/Omikar243/composioassignment" target="_blank" rel="noopener noreferrer">
              <Github size={14} aria-hidden="true" /><span>Source repository</span><ExternalLink size={11} aria-hidden="true" />
            </a>
            <a href="https://docs.composio.dev" target="_blank" rel="noopener noreferrer">
              <span>Composio docs</span><ExternalLink size={11} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="footer-baseline">
          <span>OAUTH / API KEYS / HYBRID PATHS</span>
          <span>ABOUT THIS RESEARCH DESK</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
