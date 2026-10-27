import type {
  AuthPathClassification,
  ClaimEvidence,
  InvestigationAnalysis,
  InvestigationEvidenceFinding,
  IntegrationReadinessGuide,
} from "../types/guide.js";

const evidenceKinds = new Set([
  "tested_live",
  "documented_not_tested",
  "unverified_hypothesis",
]);

function isClaimEvidence(value: unknown): value is ClaimEvidence {
  return Boolean(
    value &&
      typeof value === "object" &&
      "kind" in value &&
      evidenceKinds.has(String((value as { kind?: unknown }).kind))
  );
}

function humanizePath(parts: string[]): string {
  return parts
    .filter((part) => !/^\d+$/.test(part) && part !== "value" && part !== "evidence")
    .map((part) =>
      part
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/^\w/, (character) => character.toUpperCase())
    )
    .join(" / ");
}

function summarizeValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string" ? item : JSON.stringify(item)
      )
      .filter(Boolean)
      .join("; ");
  }
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "Not provided");
}

function uniqueFindings(findings: InvestigationEvidenceFinding[]): InvestigationEvidenceFinding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.title.toLowerCase()}|${finding.statement.toLowerCase()}`;
    if (!finding.statement || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Builds a public-facing audit summary from the guide's own traceable fields.
 * It never requests or stores private chain-of-thought; it exposes conclusions,
 * source-linked evidence labels, and questions that remain unverified.
 */
export function buildInvestigationAnalysis(
  guide: IntegrationReadinessGuide,
  engine: InvestigationAnalysis["engine"]
): InvestigationAnalysis {
  const findings: InvestigationEvidenceFinding[] = [];

  const visit = (value: unknown, path: string[]): void => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, [...path, String(index)]));
      return;
    }
    if (!value || typeof value !== "object") return;

    const candidate = value as Record<string, unknown>;
    if ("value" in candidate && isClaimEvidence(candidate.evidence)) {
      findings.push({
        title: humanizePath(path) || "Finding",
        statement: summarizeValue(candidate.value).slice(0, 600),
        evidence: candidate.evidence,
      });
      return;
    }

    for (const [key, nested] of Object.entries(candidate)) {
      if (key !== "investigationAnalysis") visit(nested, [...path, key]);
    }
  };

  visit(guide, []);
  const unique = uniqueFindings(findings);
  const openQuestions = unique
    .filter((finding) => finding.evidence.kind === "unverified_hypothesis")
    .map((finding) => {
      const evidence = finding.evidence;
      return {
        ...finding,
        title: `${finding.title} — open question`,
        statement:
          evidence.kind === "unverified_hypothesis"
            ? evidence.whatRemainsUnverified
            : finding.statement,
      };
    });

  const evidenceCounts = unique.reduce(
    (counts, finding) => {
      if (finding.evidence.kind === "tested_live") counts.testedLive += 1;
      else if (finding.evidence.kind === "documented_not_tested") counts.documented += 1;
      else counts.hypothesis += 1;
      return counts;
    },
    { testedLive: 0, documented: 0, hypothesis: 0 }
  );

  const decision: AuthPathClassification =
    guide.readinessSummary.authPathClassification;

  return {
    engine,
    decision,
    decisionSummary: guide.readinessSummary.oneLineSummary,
    findings: unique,
    openQuestions,
    evidenceCounts,
  };
}
