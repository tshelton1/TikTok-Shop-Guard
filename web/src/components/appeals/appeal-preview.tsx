import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessageSquare,
  Paperclip,
  Shield,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  AppealPacket,
  EvidenceChecklistItem,
  ViolationRecord,
} from "@/types/appeals";
import { cn } from "@/lib/utils";

type AppealPreviewProps = {
  violation: ViolationRecord;
  packet: AppealPacket;
  draftMessage: string;
  checklist: EvidenceChecklistItem[];
  documentCount?: number;
  currentStep?: number;
  className?: string;
};

const STEPS = [
  { id: 1, label: "Violation", icon: Shield },
  { id: 2, label: "Strategy", icon: MessageSquare },
  { id: 3, label: "Evidence", icon: ClipboardList },
  { id: 4, label: "Draft", icon: FileText },
  { id: 5, label: "Documents", icon: Paperclip },
  { id: 6, label: "Review", icon: CheckCircle2 },
] as const;

function severityLabel(level: number) {
  if (level >= 4) return "High";
  if (level >= 3) return "Medium";
  return "Low";
}

export function AppealPreview({
  violation,
  packet,
  draftMessage,
  checklist,
  documentCount = 0,
  currentStep = 1,
  className,
}: AppealPreviewProps) {
  const checkedCount = checklist.filter((item) => item.checked).length;

  return (
    <div className={cn("space-y-4", className)}>
      <Card className="border-amber-200 bg-amber-50/40">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4 text-amber-700" />
            Deadline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-medium text-amber-900">{packet.deadline_label}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recovery progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;
              return (
                <li
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                    isActive && "bg-brand/10 font-medium text-brand",
                    isComplete && "text-emerald-700",
                    !isActive && !isComplete && "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {step.label}
                  {isComplete && (
                    <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" />
                  )}
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Appeal summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground">Violation</p>
            <p className="font-medium text-foreground">{violation.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {violation.listing_title ?? "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{packet.issue_category}</Badge>
            <Badge variant="secondary">
              Severity {severityLabel(violation.severity)}
            </Badge>
          </div>
          <dl className="grid gap-2 border-t pt-3">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Evidence ready</dt>
              <dd className="font-medium">
                {checkedCount}/{checklist.length}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Documents</dt>
              <dd className="font-medium">{documentCount}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Draft length</dt>
              <dd className="font-medium">{draftMessage.length} chars</dd>
            </div>
          </dl>
          {draftMessage && (
            <p className="line-clamp-4 rounded-md border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
              {draftMessage}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
