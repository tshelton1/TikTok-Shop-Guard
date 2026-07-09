import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

type PilotDemoBannerProps = {
  shopName: string;
};

export function PilotDemoBanner({ shopName }: PilotDemoBannerProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-brand/20 bg-brand/5 p-4 sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10">
          <Sparkles className="h-4 w-4 text-brand" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            You&apos;re viewing pilot demo data for {shopName}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore scans, violations, and appeals with realistic sample data.
            Run your own scan anytime from the Scans page.
          </p>
        </div>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link href="/dashboard/scans?shop=shop-1">Try the scanner</Link>
      </Button>
    </div>
  );
}
