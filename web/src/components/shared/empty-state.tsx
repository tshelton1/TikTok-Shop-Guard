import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
  compact?: boolean;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 text-center",
        compact ? "py-8" : "py-12 sm:py-16",
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 flex items-center justify-center rounded-full bg-muted",
          compact ? "h-10 w-10" : "h-12 w-12",
        )}
        aria-hidden
      >
        <Icon className={cn("text-muted-foreground", compact ? "h-4 w-4" : "h-5 w-5")} />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && actionHref && (
        <Button asChild variant="brand" className="mt-6">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
      {actionLabel && onAction && (
        <Button variant="brand" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
