"use client";

import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">Page not found</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        This dashboard page doesn&apos;t exist or may have been moved.
      </p>
      <Button asChild variant="brand" className="mt-6">
        <Link href="/dashboard">Back to overview</Link>
      </Button>
    </div>
  );
}
