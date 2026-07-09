import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  rows?: number;
  className?: string;
};

export function LoadingState({ rows = 4, className }: LoadingStateProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="rounded-xl border p-6 space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
