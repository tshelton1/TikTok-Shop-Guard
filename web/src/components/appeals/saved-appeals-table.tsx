import Link from "next/link";
import { FileText } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { appealTitle, formatDateTime } from "@/lib/format";
import type { AppealRecord } from "@/types/appeals";

type SavedAppealsTableProps = {
  appeals: AppealRecord[];
};

export function SavedAppealsTable({ appeals }: SavedAppealsTableProps) {
  if (appeals.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No saved drafts yet"
        description="When you start an appeal, your draft will appear here so you can pick up where you left off."
        compact
        className="m-4 border-0 bg-transparent"
      />
    );
  }

  return (
    <>
      <ul className="divide-y md:hidden">
        {appeals.map((appeal) => (
          <li key={appeal.id} className="space-y-2 px-4 py-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{appealTitle(appeal)}</p>
                <p className="text-xs text-muted-foreground">
                  Violation {appeal.violation_id.slice(0, 8)}
                </p>
              </div>
              <Badge variant="secondary">{appeal.status}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{formatDateTime(appeal.updated_at)}</span>
              <Link
                href={`/dashboard/appeals/${appeal.violation_id}`}
                className="font-medium text-brand hover:underline"
              >
                Continue
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <Table>
          <caption className="sr-only">Saved appeal drafts</caption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Appeal</TableHead>
              <TableHead scope="col">Category</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col">Last updated</TableHead>
              <TableHead scope="col">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appeals.map((appeal) => (
              <TableRow key={appeal.id}>
                <TableCell>
                  <p className="font-medium text-foreground">{appealTitle(appeal)}</p>
                  <p className="text-xs text-muted-foreground">
                    Violation {appeal.violation_id.slice(0, 8)}…
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{appeal.issue_category ?? "—"}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{appeal.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(appeal.updated_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/dashboard/appeals/${appeal.violation_id}`}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    Continue
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
