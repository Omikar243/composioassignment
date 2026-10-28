import React from "react";
import { ArrowUpRight, FileText, Github, Moon, Search, ShieldCheck, Sun } from "lucide-react";

export type ViewType = "directory" | "guide_detail" | "investigator" | "audit";
export type ThemeMode = "dark" | "light";

export interface NavbarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  hasActiveGuide?: boolean;
  activeGuideName?: string;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  hasActiveGuide = false,
  activeGuideName = "Guide",
  theme = "dark",
  onToggleTheme = () => undefined,
}) => {
  const scrollToAbout = () => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("app-footer")?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const linkClass = (active: boolean) => `nav-link${active ? " is-active" : ""}`;

  return (
    <header className="app-navbar">
      <div className="navbar-inner">
        <button
          type="button"
          className="brand-link"
          onClick={() => onSelectView("directory")}
          aria-label="Auth Copilot home"
        >
          <span className="brand-mark" aria-hidden="true">A/</span>
          <span className="brand-wordmark">AUTH / COPILOT</span>
        </button>

        <nav className="nav-links" aria-label="Primary navigation">
          <button
            type="button"
            className={linkClass(currentView === "investigator")}
            onClick={() => onSelectView("investigator")}
            aria-current={currentView === "investigator" ? "page" : undefined}
          >
            Research
          </button>
          <button
            type="button"
            className={linkClass(currentView === "directory")}
            onClick={() => onSelectView("directory")}
            aria-current={currentView === "directory" ? "page" : undefined}
          >
            Integration Directory
          </button>
          <button
            type="button"
            className={linkClass(currentView === "audit")}
            onClick={() => onSelectView("audit")}
            aria-current={currentView === "audit" ? "page" : undefined}
          >
            Evidence Log
          </button>
          <button type="button" className="nav-link" onClick={scrollToAbout}>
            About
          </button>
          {hasActiveGuide && (
            <button
              type="button"
              className={`nav-guide-link${currentView === "guide_detail" ? " is-active" : ""}`}
              onClick={() => onSelectView("guide_detail")}
              aria-current={currentView === "guide_detail" ? "page" : undefined}
              title={`Current guide: ${activeGuideName}`}
            >
              <FileText size={13} aria-hidden="true" />
              <span>{activeGuideName}</span>
            </button>
          )}
        </nav>

        <div className="navbar-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            aria-pressed={theme === "light"}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
          <a
            className="nav-cta"
            href="#investigate"
            onClick={(event) => {
              event.preventDefault();
              onSelectView("investigator");
            }}
          >
            <Search size={14} aria-hidden="true" />
            <span>Investigate an App</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <a
            href="https://github.com/Omikar243/composioassignment"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
            aria-label="View the source repository on GitHub"
            title="GitHub repository"
          >
            <Github size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
