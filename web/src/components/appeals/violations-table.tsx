"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AlertTriangle, ArrowRight, ScanSearch } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ViolationRecord } from "@/types/appeals";

type ViolationsTableProps = {
  violations: ViolationRecord[];
  highlightId?: string;
  shopId?: string;
};

function severityLabel(level: number) {
  if (level >= 4) return { label: "High", variant: "destructive" as const };
  if (level >= 3) return { label: "Medium", variant: "warning" as const };
  return { label: "Low", variant: "secondary" as const };
}

function ViolationCard({
  violation,
  highlighted,
}: {
  violation: ViolationRecord;
  highlighted: boolean;
}) {
  const severity = severityLabel(violation.severity);

  return (
    <div
      id={`violation-${violation.id}`}
      className={cn(
        "rounded-lg border bg-card p-4 md:hidden",
        highlighted && "ring-2 ring-brand",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{violation.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {violation.listing_title ?? "—"}
          </p>
        </div>
        <Badge variant={severity.variant}>{severity.label}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="outline">{violation.issue_category}</Badge>
        {violation.appeal_deadline_at && (
          <span className="text-xs text-muted-foreground">
            Due {formatDate(violation.appeal_deadline_at)}
          </span>
        )}
      </div>
      <Button asChild variant="brand" size="sm" className="mt-4 w-full">
        <Link href={`/dashboard/appeals/${violation.id}`}>
          Generate appeal
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

export function ViolationsTable({
  violations,
  highlightId,
  shopId,
}: ViolationsTableProps) {
  const highlightRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (!highlightId) return;

    const element =
      highlightRef.current ?? document.getElementById(`violation-${highlightId}`);

    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId]);

  if (violations.length === 0) {
    const scansHref = shopId
      ? `/dashboard/scans?shop=${shopId}`
      : "/dashboard/scans";

    return (
      <EmptyState
        icon={ScanSearch}
        title="No open violations"
        description="Great news — nothing needs an appeal right now. Run a listing scan to catch policy issues early."
        actionLabel="Run a scan"
        actionHref={scansHref}
        compact
        className="m-4 border-0 bg-transparent"
      />
    );
  }

  return (
    <>
      <div className="space-y-3 p-4 md:hidden">
        {violations.map((violation) => (
          <ViolationCard
            key={violation.id}
            violation={violation}
            highlighted={violation.id === highlightId}
          />
        ))}
      </div>

      <div className="hidden md:block">
        <Table>
          <caption className="sr-only">Open policy violations for this shop</caption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Violation</TableHead>
              <TableHead scope="col">Listing</TableHead>
              <TableHead scope="col">Category</TableHead>
              <TableHead scope="col">Severity</TableHead>
              <TableHead scope="col">Deadline</TableHead>
              <TableHead scope="col">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {violations.map((violation) => {
              const severity = severityLabel(violation.severity);
              const highlighted = violation.id === highlightId;

              return (
                <TableRow
                  key={violation.id}
                  id={`violation-${violation.id}`}
                  ref={highlighted ? highlightRef : undefined}
                  className={cn(highlighted && "bg-brand/5 ring-1 ring-inset ring-brand/30")}
                >
                  <TableCell>
                    <div className="font-medium text-foreground">{violation.title}</div>
                    <div className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                      {violation.details}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {violation.listing_title ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{violation.issue_category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={severity.variant}>{severity.label}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {violation.appeal_deadline_at
                      ? formatDate(violation.appeal_deadline_at)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="brand" size="sm">
                      <Link href={`/dashboard/appeals/${violation.id}`}>
                        Generate appeal
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export function ViolationsAlertBanner() {
  return (
    <div
      className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4"
      role="status"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
      <div>
        <p className="font-medium text-foreground">Open violations need attention</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a violation below to start the guided appeal workflow.
        </p>
      </div>
    </div>
  );
}

export const ViolationsEmptyBanner = ViolationsAlertBanner;
