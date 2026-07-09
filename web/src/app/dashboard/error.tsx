"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        We couldn&apos;t load this page. Try again, or return to your overview.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="brand" onClick={reset}>
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard">Back to overview</a>
        </Button>
      </div>
    </div>
  );
}
