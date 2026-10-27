import React from "react";
import {
  Compass,
  FileText,
  Terminal,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Github,
  Zap,
} from "lucide-react";

export type ViewType = "directory" | "guide_detail" | "investigator" | "audit";

export interface NavbarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  hasActiveGuide?: boolean;
  activeGuideName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  hasActiveGuide = false,
  activeGuideName = "Guide Detail",
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-canvas/80 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Live Status */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onSelectView("directory")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 p-0.5 shadow-glass-glow flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center group-hover:bg-slate-900 transition">
                <Zap className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white group-hover:text-cyan-300 transition">
                  OAuth Readiness Copilot
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                  APM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Composio Agent Integration Platform
              </p>
            </div>
          </div>

          {/* Live Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-slate-800 text-[11px] text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 font-medium">Ready</span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <button
            onClick={() => onSelectView("directory")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              currentView === "directory"
                ? "bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Directory</span>
          </button>

          <button
            onClick={() => onSelectView("guide_detail")}
            disabled={!hasActiveGuide}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              currentView === "guide_detail"
                ? "bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60"
                : hasActiveGuide
                ? "text-slate-400 hover:text-slate-200"
                : "text-slate-600 cursor-not-allowed opacity-50"
            }`}
            title={hasActiveGuide ? `View ${activeGuideName}` : "Select an app from Directory first"}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="truncate max-w-[100px] sm:max-w-none">
              {activeGuideName || "Guide"}
            </span>
          </button>

          <button
            onClick={() => onSelectView("investigator")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              currentView === "investigator"
                ? "bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Investigator</span>
          </button>

          <button
            onClick={() => onSelectView("audit")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              currentView === "audit"
                ? "bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit</span>
          </button>
        </nav>

        {/* External Links: Manus Live Link & GitHub */}
        <div className="flex items-center gap-2">
          {/* Manus Live Task Button */}
          <a
            href="https://manus.im/share/2EL46n4hLbL7XhQ67J2BWx?replay=1"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-950/60 to-indigo-950/60 text-purple-300 border border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-900/40 transition shadow-sm"
            title="Manus Autonomous Live Task: 2EL46n4hLbL7XhQ67J2BWx"
          >
            <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
            <span className="font-mono text-[11px]">Manus Live</span>
            <ExternalLink className="w-2.5 h-2.5 text-purple-400 ml-0.5" />
          </a>

          {/* GitHub Repo */}
          <a
            href="https://github.com/Omikar243/composioassignment"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
            title="View GitHub Repository: Omikar243/composioassignment"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
