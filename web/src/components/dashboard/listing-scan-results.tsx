import { AlertTriangle, Ban, CheckCircle2, ImageIcon, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ListingScanResult } from "@/types/listing-scan";
import { cn } from "@/lib/utils";

type ListingScanResultsProps = {
  result: ListingScanResult;
};

function scoreColor(score: number) {
  if (score >= 70) return "text-red-600";
  if (score >= 40) return "text-amber-600";
  return "text-emerald-600";
}

function scoreRingColor(score: number) {
  if (score >= 70) return "stroke-red-500";
  if (score >= 40) return "stroke-amber-500";
  return "stroke-emerald-500";
}

function severityBadgeVariant(
  label: string,
): "destructive" | "warning" | "success" {
  if (label === "High") return "destructive";
  if (label === "Medium") return "warning";
  return "success";
}

const issueSeverityVariant = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
} as const;

export function ListingScanResults({ result }: ListingScanResultsProps) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (result.riskScore / 100) * circumference;

  return (
    <div className="space-y-4">
      <Card className={cn(result.blocked && "border-red-300")}>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Scan results</CardTitle>
            {result.blocked && (
              <Badge variant="destructive" className="gap-1">
                <Ban className="h-3 w-3" />
                Blocked
              </Badge>
            )}
          </div>
          <CardDescription>
            Scanned{" "}
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(result.scannedAt))}
            {" · "}
            {result.rulesEvaluated} rules evaluated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
            <div className="relative h-32 w-32 shrink-0">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className={scoreRingColor(result.riskScore)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={cn(
                    "text-3xl font-bold",
                    scoreColor(result.riskScore),
                  )}
                >
                  {result.riskScore}
                </span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <Badge variant={severityBadgeVariant(result.severityLabel)}>
                {result.severityLabel} risk
              </Badge>
              <p className="text-sm text-muted-foreground">
                {result.issues.length} issue
                {result.issues.length === 1 ? "" : "s"} found
                {result.imageWarnings.length > 0 &&
                  ` · ${result.imageWarnings.length} image warning${result.imageWarnings.length === 1 ? "" : "s"}`}
              </p>
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Confidence:{" "}
                  <span className="font-medium text-foreground">
                    {result.confidenceScore}%
                  </span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {result.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Issues found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.issues.map((issue) => (
              <div
                key={issue.id}
                className="rounded-lg border bg-muted/20 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{issue.title}</p>
                  <div className="flex shrink-0 gap-1">
                    <Badge variant={issueSeverityVariant[issue.severity]}>
                      {issue.severity}
                    </Badge>
                    {issue.blocksPublish && (
                      <Badge variant="destructive">blocks</Badge>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {issue.detail}
                </p>
                {issue.matchedValue && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Matched:{" "}
                    <code className="rounded bg-muted px-1 py-0.5">
                      {issue.matchedValue}
                    </code>
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {result.suggestedRewrites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Suggested rewrites
            </CardTitle>
            <CardDescription>
              Policy-safe alternatives for your listing copy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.suggestedRewrites.map((rewrite, index) => (
              <div key={`${rewrite.field}-${index}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {rewrite.field}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {rewrite.reason}
                  </span>
                </div>
                <p className="rounded-lg border bg-muted/10 p-3 text-xs text-muted-foreground line-through">
                  {rewrite.original}
                </p>
                <p className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-sm text-foreground">
                  {rewrite.suggested}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {result.imageWarnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4 text-amber-600" />
              Image warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.imageWarnings.map((warning, index) => (
              <div
                key={`${warning.ruleId}-${index}`}
                className="rounded-lg border border-amber-200 bg-amber-50/50 p-4"
              >
                <p className="text-sm font-medium text-foreground">
                  {warning.imageName}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {warning.message}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
