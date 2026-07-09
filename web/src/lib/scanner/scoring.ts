import type { RuleSeverity, ScanIssue } from "@/lib/scanner/types";

const SEVERITY_WEIGHT: Record<RuleSeverity, number> = {
  high: 22,
  medium: 12,
  low: 5,
};

export function computeRiskScore(
  issues: ScanIssue[],
  imageWarningCount: number,
): number {
  let score = 8;

  for (const issue of issues) {
    score += SEVERITY_WEIGHT[issue.severity];
  }

  score += imageWarningCount * 8;

  return Math.min(100, Math.round(score));
}

export function severityLabelFromScore(score: number): string {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

export function computeBlocked(
  issues: ScanIssue[],
  riskScore: number,
): boolean {
  if (issues.some((issue) => issue.blocks_publish)) return true;
  if (riskScore >= 85) return true;
  return issues.filter((i) => i.severity === "high").length >= 2;
}

export function computeConfidenceScore(
  issues: ScanIssue[],
  rulesEvaluated: number,
  imageWarningCount: number,
): number {
  if (rulesEvaluated === 0) return 50;

  const matchCount = issues.length + imageWarningCount;

  if (matchCount === 0) {
    return 92;
  }

  const highCount = issues.filter((i) => i.severity === "high").length;
  const base = 58 + matchCount * 10 + highCount * 12;
  const coverage = Math.min(15, (matchCount / rulesEvaluated) * 30);

  return Math.min(98, Math.round(base + coverage));
}
