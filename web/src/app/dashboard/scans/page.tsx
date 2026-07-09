import { Suspense } from "react";

import { ScannerWorkspace } from "@/components/scans/scanner-workspace";
import { ShopSelector } from "@/components/dashboard/shop-selector";
import { EmptyState } from "@/components/shared/empty-state";
import { DashboardPageSkeleton } from "@/components/shared/dashboard-skeleton";
import { Badge } from "@/components/ui/badge";
import {
  getDashboardShops,
  resolveDefaultShopId,
} from "@/lib/dashboard/get-overview";
import { getListingScanHistory } from "@/lib/dashboard/scan-listing";
import { countActiveScanRules } from "@/lib/scan/rules-engine";
import { Shield, Store } from "lucide-react";

export const metadata = {
  title: "Listing scans",
};

type ScansPageProps = {
  searchParams: Promise<{ shop?: string }>;
};

export default async function ScansPage({ searchParams }: ScansPageProps) {
  const params = await searchParams;
  const [shops, ruleMeta] = await Promise.all([
    getDashboardShops(),
    countActiveScanRules(),
  ]);

  if (shops.length === 0) {
    return (
      <>
        <PageHeader ruleCount={ruleMeta.count} ruleSource={ruleMeta.source} />
        <EmptyState
          icon={Store}
          title="No shops available"
          description="Create or join a shop to start scanning listings for policy violations."
          actionLabel="Go to settings"
          actionHref="/dashboard/settings"
          className="mt-6"
        />
      </>
    );
  }

  const selectedShopId = resolveDefaultShopId(shops, params.shop)!;
  const initialHistory = await getListingScanHistory(selectedShopId);

  return (
    <>
      <PageHeader
        ruleCount={ruleMeta.count}
        ruleSource={ruleMeta.source}
        shopSelector={
          <Suspense fallback={<div className="h-9 w-40 animate-pulse rounded-md bg-muted" />}>
            <ShopSelector shops={shops} />
          </Suspense>
        }
      />
      <Suspense fallback={<DashboardPageSkeleton />}>
        <ScannerWorkspace
          key={selectedShopId}
          shops={shops.map((shop) => ({ id: shop.id, name: shop.name }))}
          initialShopId={selectedShopId}
          initialHistory={initialHistory}
        />
      </Suspense>
    </>
  );
}

function PageHeader({
  ruleCount,
  ruleSource,
  shopSelector,
}: {
  ruleCount: number;
  ruleSource: "database" | "defaults";
  shopSelector?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Listing scans
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Scan product listings against TikTok Shop policy rules before you
          publish. We check restricted claims, category fit, pricing patterns,
          and image filenames.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:items-end">
        {shopSelector}
        <Badge variant="secondary" className="shrink-0 gap-1 self-start sm:self-end">
          <Shield className="h-3 w-3" />
          {ruleCount} active rule{ruleCount === 1 ? "" : "s"}
          <span className="text-muted-foreground">
            · {ruleSource === "database" ? "database" : "built-in defaults"}
          </span>
        </Badge>
      </div>
    </div>
  );
}
