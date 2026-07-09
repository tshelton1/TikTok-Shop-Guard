import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ListingScanHistoryEntry } from "@/types/listing-scan";
import { LISTING_CATEGORIES } from "@/types/listing-scan";

type ListingScanHistoryTableProps = {
  history: ListingScanHistoryEntry[];
};

function severityVariant(
  label: string,
): "destructive" | "warning" | "success" {
  if (label === "High") return "destructive";
  if (label === "Medium") return "warning";
  return "success";
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
  return (
    LISTING_CATEGORIES.find((cat) => cat.value === value)?.label ?? value
  );
}

export function ListingScanHistoryTable({
  history,
}: ListingScanHistoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Listing</TableHead>
          <TableHead className="hidden sm:table-cell">Category</TableHead>
          <TableHead>Risk</TableHead>
          <TableHead className="hidden md:table-cell">Severity</TableHead>
          <TableHead className="hidden lg:table-cell">Issues</TableHead>
          <TableHead className="hidden md:table-cell">Blocked</TableHead>
          <TableHead className="hidden sm:table-cell">Scanned</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="h-24 text-center text-muted-foreground"
            >
              No scan history yet. Run a scan above to get started.
            </TableCell>
          </TableRow>
        ) : (
          history.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="max-w-[200px] truncate font-medium">
                {entry.listingTitle}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {categoryLabel(entry.category)}
              </TableCell>
              <TableCell className="font-medium">{entry.riskScore}</TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant={severityVariant(entry.severityLabel)}>
                  {entry.severityLabel}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">{entry.issueCount}</TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant={entry.blocked ? "destructive" : "success"}>
                  {entry.blocked ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {formatDate(entry.scannedAt)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
