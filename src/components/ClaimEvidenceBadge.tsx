import React, { useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  BookOpen,
  HelpCircle,
  ExternalLink,
  X,
  Info,
  Calendar,
  Layers,
  Activity,
} from "lucide-react";
import { ClaimEvidence } from "../types/guide";

export interface ClaimEvidenceBadgeProps {
  evidence: ClaimEvidence;
  compact?: boolean;
  className?: string;
}

export const ClaimEvidenceBadge: React.FC<ClaimEvidenceBadgeProps> = ({
  evidence,
  compact = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  if (!evidence) {
    return null;
  }

  const renderBadgeContent = () => {
    switch (evidence.kind) {
      case "tested_live":
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900/60 hover:border-emerald-400/60 ${className}`}
            title="Click to view live test verification proof"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{compact ? "Tested" : "[Tested Live]"}</span>
          </span>
        );
      case "documented_not_tested":
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors bg-blue-950/60 text-blue-400 border border-blue-500/40 hover:bg-blue-900/60 hover:border-blue-400/60 ${className}`}
            title="Click to view official documentation citation"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>{compact ? "Docs" : "[Documented]"}</span>
          </span>
        );
      case "unverified_hypothesis":
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors bg-amber-950/60 text-amber-400 border border-amber-500/40 hover:bg-amber-900/60 hover:border-amber-400/60 ${className}`}
            title="Click to view hypothesis rationale & unverified items"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{compact ? "Hypoth" : "[Hypothesis]"}</span>
          </span>
        );
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {renderBadgeContent()}

      {isOpen && (
        <div
          className="absolute z-50 mt-2 w-80 sm:w-96 right-0 sm:right-auto sm:left-0 p-4 rounded-xl glass-card text-left text-slate-200 border border-slate-700/60 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-3">
            <div className="flex items-center gap-2">
              {evidence.kind === "tested_live" && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-sm text-emerald-400">
                    Tested Live Verification
                  </span>
                </>
              )}
              {evidence.kind === "documented_not_tested" && (
                <>
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-sm text-blue-400">
                    Official Documentation Citation
                  </span>
                </>
              )}
              {evidence.kind === "unverified_hypothesis" && (
                <>
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-sm text-amber-400">
                    Unverified Hypothesis & Estimate
                  </span>
                </>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-100 p-1 rounded-md hover:bg-slate-800/60 transition"
              aria-label="Close popover"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            {evidence.kind === "tested_live" && (
              <>
                <div className="flex items-start gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 font-medium">Timestamp:</span>{" "}
                    <span className="font-mono text-slate-200">
                      {evidence.testedAt}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 font-medium">Action Performed:</span>
                    <p className="mt-0.5 text-slate-200">
                      {evidence.whatWasPerformed}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 font-medium">Observed Outcome:</span>
                    <p className="mt-0.5 text-emerald-300 font-mono text-[11px] bg-emerald-950/40 p-2 rounded border border-emerald-900/60">
                      {evidence.observedOutcome}
                    </p>
                  </div>
                </div>

                {evidence.referenceUrl && (
                  <div className="pt-2 border-t border-slate-800">
                    <a
                      href={evidence.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 hover:underline"
                    >
                      <span>Verified Portal / Console Reference</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </>
            )}

            {evidence.kind === "documented_not_tested" && (
              <>
                <div>
                  <span className="text-slate-400 font-medium">Source Document:</span>
                  <div className="mt-0.5 font-medium text-slate-100 flex items-center gap-1.5">
                    <span>{evidence.sourceTitle}</span>
                  </div>
                  {evidence.sourceUrl && (
                    <a
                      href={evidence.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline mt-0.5 break-all"
                    >
                      <span>{evidence.sourceUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Verbatim Statement:</span>
                  <blockquote className="mt-1 pl-2.5 py-1.5 border-l-2 border-blue-500/60 text-slate-300 bg-blue-950/30 rounded-r text-[11px] italic">
                    "{evidence.whatSourceExplicitlyStates}"
                  </blockquote>
                </div>

                {evidence.whyNotTestedLive && (
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800 text-slate-400">
                    <span className="font-medium text-slate-300">Why not tested live: </span>
                    {evidence.whyNotTestedLive}
                  </div>
                )}
              </>
            )}

            {evidence.kind === "unverified_hypothesis" && (
              <>
                <div className="bg-amber-950/30 p-2.5 rounded border border-amber-900/50">
                  <div className="flex items-center gap-1.5 text-amber-400 font-medium mb-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>Hypothesis Rationale</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    {evidence.hypothesisBasis}
                  </p>
                </div>

                <div>
                  <span className="text-amber-400 font-medium">What Remains Unverified:</span>
                  <p className="mt-1 text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px]">
                    {evidence.whatRemainsUnverified}
                  </p>
                </div>

                {evidence.relatedSourceUrl && (
                  <div className="pt-2 border-t border-slate-800">
                    <a
                      href={evidence.relatedSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 hover:underline"
                    >
                      <span>Related Context Documentation</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default ClaimEvidenceBadge;
