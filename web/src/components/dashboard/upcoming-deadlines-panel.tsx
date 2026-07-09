import { CalendarClock } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DeadlineType, UpcomingDeadline } from "@/types/dashboard";
import { cn } from "@/lib/utils";

type UpcomingDeadlinesPanelProps = {
  deadlines: UpcomingDeadline[];
  shopId?: string;
};

const typeLabels: Record<DeadlineType, string> = {
  appeal: "Appeal",
  remediation: "Remediation",
  policy_update: "Policy",
};

const typeAccent: Record<DeadlineType, string> = {
  appeal: "bg-violet-100 text-violet-700",
  remediation: "bg-amber-100 text-amber-800",
  policy_update: "bg-sky-100 text-sky-800",
};

export function UpcomingDeadlinesPanel({
  deadlines,
  shopId,
}: UpcomingDeadlinesPanelProps) {
  const appealsHref = shopId
    ? `/dashboard/appeals?shop=${shopId}`
    : "/dashboard/appeals";

  const sorted = [...deadlines].sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
  );

  return (
    <Card className="h-full">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-brand" />
              Upcoming appeal deadlines
            </CardTitle>
            <CardDescription>
              Appeals, remediations, and policy dates in the next 30 days
            </CardDescription>
          </div>
          {sorted.length > 0 && (
            <Badge variant="secondary" className="shrink-0">
              {sorted.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {sorted.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No deadlines soon"
            description="Appeal and remediation due dates will appear here when violations are detected."
            actionLabel="View appeals"
            actionHref={appealsHref}
            compact
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <div className="space-y-3">
            {sorted.map((deadline) => (
              <div
                key={deadline.id}
                className={cn(
                  "rounded-lg border p-4",
                  deadline.isUrgent
                    ? "border-amber-200 bg-amber-50/60"
                    : "bg-muted/20",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{deadline.title}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
                      typeAccent[deadline.type],
                    )}
                  >
                    {typeLabels[deadline.type]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {deadline.description}
                </p>
                <p
                  className={cn(
                    "mt-2 text-xs font-semibold",
                    deadline.isUrgent ? "text-amber-800" : "text-muted-foreground",
                  )}
                >
                  {deadline.dueLabel}
                </p>
              </div>
            ))}
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href={appealsHref}>View all appeals</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
