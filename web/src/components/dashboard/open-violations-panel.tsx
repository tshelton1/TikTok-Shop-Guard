import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import type { OpenViolation, ViolationSeverity } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

type OpenViolationsPanelProps = {
  violations: OpenViolation[];
  shopId?: string;
};

const severityVariant: Record<
  ViolationSeverity,
  "destructive" | "warning" | "secondary"
> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

const severityBorder: Record<ViolationSeverity, string> = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-slate-300",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function OpenViolationsPanel({
  violations,
  shopId,
}: OpenViolationsPanelProps) {
  const appealsHref = shopId
    ? `/dashboard/appeals?shop=${shopId}`
    : "/dashboard/appeals";

  function violationHref(violationId: string) {
    const separator = appealsHref.includes("?") ? "&" : "?";
    return `${appealsHref}${separator}violation=${violationId}`;
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-3 border-b bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand" />
            Open violations
          </CardTitle>
          <CardDescription>
            {violations.length > 0
              ? `${violations.length} issue${violations.length === 1 ? "" : "s"} need attention`
              : "Issues that need your attention"}
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full shrink-0 sm:w-auto">
          <Link href={appealsHref}>Manage appeals</Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {violations.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="All clear"
            description="No open violations for this shop. Keep scanning listings to stay ahead of policy changes."
            actionLabel="Run a scan"
            actionHref={shopId ? `/dashboard/scans?shop=${shopId}` : "/dashboard/scans"}
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <div className="space-y-3">
            {violations.map((violation) => (
              <Link
                key={violation.id}
                href={violationHref(violation.id)}
                className={cn(
                  "block rounded-lg border border-l-4 bg-muted/20 p-4 transition-colors hover:bg-muted/40",
                  severityBorder[violation.severity],
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{violation.title}</p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {violation.listingTitle}
                    </p>
                    {violation.category && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {violation.category}
                      </p>
                    )}
                  </div>
                  <Badge variant={severityVariant[violation.severity]} className="shrink-0">
                    {violation.severity}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Detected {formatDate(violation.detectedAt)}
                  {violation.appealDeadlineAt && (
                    <span className="text-amber-700">
                      {" "}
                      · Appeal by {formatDate(violation.appealDeadlineAt)}
                    </span>
                  )}
                </p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
