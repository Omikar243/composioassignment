import React from "react";
import { AlertTriangle, ExternalLink, Sparkles } from "lucide-react";
import type { ClaimEvidence, IntegrationReadinessGuide } from "../types/guide";
import { ClaimEvidenceBadge } from "./ClaimEvidenceBadge";

export interface InvestigationRationaleProps {
  guide: IntegrationReadinessGuide;
}

function evidenceBasis(evidence: ClaimEvidence): string {
  if (evidence.kind === "tested_live") {
    return `Performed: ${evidence.whatWasPerformed}. Observed: ${evidence.observedOutcome}`;
  }
  if (evidence.kind === "documented_not_tested") {
    return `Source states: “${evidence.whatSourceExplicitlyStates}”`;
  }
  return `Inference basis: ${evidence.hypothesisBasis} Still unverified: ${evidence.whatRemainsUnverified}`;
}

function sourceUrl(evidence: ClaimEvidence): string | undefined {
  const candidate =
    evidence.kind === "documented_not_tested"
      ? evidence.sourceUrl
      : evidence.kind === "tested_live"
      ? evidence.referenceUrl
      : evidence.relatedSourceUrl;
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function FindingCard({
  title,
  statement,
  evidence,
}: {
  title: string;
  statement: string;
  evidence: ClaimEvidence;
}) {
  const href = sourceUrl(evidence);
  return (
    <li className="rounded-md border border-slate-800 bg-slate-950/40 p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-xs font-semibold text-white">{title}</h4>
        <ClaimEvidenceBadge evidence={evidence} compact />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-200">{statement}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{evidenceBasis(evidence)}</p>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 hover:text-white"
          aria-label={`Open source for ${title}`}
        >
          {evidence.kind === "documented_not_tested" ? evidence.sourceTitle : "Open related source"}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      )}
    </li>
  );
}

export const InvestigationRationale: React.FC<InvestigationRationaleProps> = ({ guide }) => {
  const analysis = guide.investigationAnalysis;
  if (!analysis) return null;

  const engineLabel =
    analysis.engine === "gemini_mode_b" ? "Gemini · Mode B" : "Deterministic · Mode 2";
  const decisionLabel = analysis.decision.replace(/_/g, " ");
  const visibleFindings = analysis.findings.slice(0, 4);
  const remainingFindings = analysis.findings.slice(4);

  return (
    <section
      className="glass-card space-y-4 rounded-xl border border-slate-800 p-5 sm:p-6"
      aria-labelledby="investigation-rationale-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-300" aria-hidden="true" />
          <div>
            <h3 id="investigation-rationale-heading" className="text-lg font-bold text-white">
              Decision rationale & evidence
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-400">{engineLabel}</p>
          </div>
        </div>
        <span className="rounded border border-slate-700 px-2 py-1 font-mono text-[10px] text-slate-300">
          {analysis.evidenceCounts.documented} documented · {analysis.evidenceCounts.hypothesis} hypotheses · {analysis.evidenceCounts.testedLive} live tests
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Proposed auth path</p>
          <p className="mt-1 text-sm font-semibold text-white">{decisionLabel}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-200">{analysis.decisionSummary}</p>
        </div>
        <span className="rounded border border-amber-700/60 bg-amber-950/30 px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-amber-200">
          Summary is not source evidence
        </span>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-400">
        This is a concise, evidence-linked rationale—not raw private chain-of-thought. The auth path is a proposal; only each finding’s provenance badge indicates what is documented, tested, or still a hypothesis.
      </p>

      {visibleFindings.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2" aria-label="Key evidence findings">
          {visibleFindings.map((finding, index) => (
            <FindingCard key={`${finding.title}-${index}`} {...finding} />
          ))}
        </ul>
      )}

      {remainingFindings.length > 0 && (
        <details className="rounded-md border border-slate-800 bg-slate-950/30 p-3">
          <summary className="cursor-pointer text-xs font-semibold text-slate-200">
            View all {analysis.findings.length} findings and evidence notes
          </summary>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2" aria-label="All evidence findings">
            {remainingFindings.map((finding, index) => (
              <FindingCard key={`${finding.title}-${index + 4}`} {...finding} />
            ))}
          </ul>
        </details>
      )}

      {analysis.openQuestions.length > 0 && (
        <div className="rounded-md border border-amber-800/60 bg-amber-950/20 p-3.5">
          <h4 className="flex items-center gap-2 text-xs font-semibold text-amber-100">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Still to verify ({analysis.openQuestions.length})
          </h4>
          <ul className="mt-2 space-y-2">
            {analysis.openQuestions.slice(0, 6).map((question, index) => (
              <li key={`${question.title}-${index}`} className="flex items-start justify-between gap-2 text-xs text-amber-50/90">
                <span className="leading-relaxed">{question.statement}</span>
                <ClaimEvidenceBadge evidence={question.evidence} compact />
              </li>
            ))}
          </ul>
          {analysis.openQuestions.length > 6 && (
            <p className="mt-2 text-[11px] text-amber-200/80">
              {analysis.openQuestions.length - 6} additional open questions are included in the detailed findings and exports.
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default InvestigationRationale;
