import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import type { ListingScanHistoryEntry } from "@/types/listing-scan";
import { LISTING_CATEGORIES } from "@/types/listing-scan";
import { cn } from "@/lib/utils";
import { History } from "lucide-react";

type ScanHistoryTableProps = {
  history: ListingScanHistoryEntry[];
};

function severityVariant(
  label: string,
): "destructive" | "warning" | "success" {
  if (label === "High") return "destructive";
  if (label === "Medium") return "warning";
  return "success";
}

function riskColor(score: number) {
  if (score >= 70) return "text-red-600";
  if (score >= 40) return "text-amber-600";
  return "text-emerald-600";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function categoryLabel(value: string) {
  return LISTING_CATEGORIES.find((cat) => cat.value === value)?.label ?? value;
}

export function ScanHistoryTable({ history }: ScanHistoryTableProps) {
  return (
    <Card>
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-muted-foreground" />
          Scan history
        </CardTitle>
        <CardDescription>Previous listing scans for the selected shop</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {history.length === 0 ? (
          <EmptyState
            icon={History}
            title="No scan history"
            description="Completed scans will appear here with risk scores and issue counts."
            className="border-0 bg-transparent py-10"
          />
        ) : (
          <>
            <ul className="divide-y md:hidden">
              {history.map((entry) => (
                <li key={entry.id} className="space-y-2 px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-medium text-foreground">
                      {entry.listingTitle}
                    </p>
                    <Badge variant={entry.blocked ? "destructive" : "success"}>
                      {entry.blocked ? "Blocked" : "Safe"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn("font-semibold", riskColor(entry.riskScore))}>
                      Risk {entry.riskScore}
                    </span>
                    <span>·</span>
                    <Badge variant={severityVariant(entry.severityLabel)}>
                      {entry.severityLabel}
                    </Badge>
                    <span>·</span>
                    <span>{entry.issueCount} issues</span>
                    <span>·</span>
                    <span>{formatDate(entry.scannedAt)}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scanned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="max-w-[220px] truncate font-medium">
                        {entry.listingTitle}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {categoryLabel(entry.category)}
                      </TableCell>
                      <TableCell
                        className={cn("font-semibold", riskColor(entry.riskScore))}
                      >
                        {entry.riskScore}
                      </TableCell>
                      <TableCell>
                        <Badge variant={severityVariant(entry.severityLabel)}>
                          {entry.severityLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.issueCount}</TableCell>
                      <TableCell>
                        <Badge variant={entry.blocked ? "destructive" : "success"}>
                          {entry.blocked ? "Blocked" : "Safe"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(entry.scannedAt)}
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
