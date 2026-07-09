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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RecentScan } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { ScanSearch } from "lucide-react";

type RecentScansTableProps = {
  scans: RecentScan[];
  shopId?: string;
};

const statusVariant: Record<
  RecentScan["status"],
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  queued: "secondary",
  running: "warning",
  succeeded: "success",
  failed: "destructive",
};

const statusLabel: Record<RecentScan["status"], string> = {
  queued: "Queued",
  running: "Running",
  succeeded: "Complete",
  failed: "Failed",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function riskBadgeVariant(score: number | null | undefined) {
  if (score == null) return "secondary" as const;
  if (score >= 60) return "destructive" as const;
  if (score >= 40) return "warning" as const;
  return "success" as const;
}

function riskLabel(score: number | null | undefined) {
  if (score == null) return "—";
  if (score >= 60) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

export function RecentScansTable({ scans, shopId }: RecentScansTableProps) {
  const scansHref = shopId ? `/dashboard/scans?shop=${shopId}` : "/dashboard/scans";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 border-b bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Recent scan history</CardTitle>
          <CardDescription>
            Latest compliance checks and issue counts for this shop
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full shrink-0 sm:w-auto">
          <Link href={scansHref}>View all scans</Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {scans.length === 0 ? (
          <EmptyState
            icon={ScanSearch}
            title="No scans yet"
            description="Run your first listing scan to see risk scores and flagged issues here."
            actionLabel="Run a scan"
            actionHref={scansHref}
            className="border-0 bg-transparent py-10"
          />
        ) : (
          <>
            {/* Mobile: card list */}
            <ul className="divide-y md:hidden">
              {scans.map((scan) => (
                <li key={scan.id} className="space-y-2 px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {scan.label ?? scan.id}
                      </p>
                      <p className="text-xs text-muted-foreground">{scan.type}</p>
                    </div>
                    <Badge variant={statusVariant[scan.status]}>
                      {statusLabel[scan.status]}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(scan.startedAt)}</span>
                    <span>·</span>
                    <span>{scan.issuesFound} issues</span>
                    {scan.riskScore != null && (
                      <>
                        <span>·</span>
                        <Badge variant={riskBadgeVariant(scan.riskScore)} className="text-xs">
                          {riskLabel(scan.riskScore)} ({scan.riskScore})
                        </Badge>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden md:block">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing / scan</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead className="text-right">Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell>
                      <p className="max-w-[200px] truncate font-medium lg:max-w-xs">
                        {scan.label ?? scan.id}
                      </p>
                      <p className="text-xs text-muted-foreground">{scan.id}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{scan.type}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[scan.status]}>
                        {statusLabel[scan.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {scan.riskScore != null ? (
                        <Badge variant={riskBadgeVariant(scan.riskScore)}>
                          {riskLabel(scan.riskScore)} · {scan.riskScore}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(scan.startedAt)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold",
                        scan.issuesFound > 0 && "text-amber-600",
                      )}
                    >
                      {scan.issuesFound}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
