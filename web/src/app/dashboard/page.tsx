import Link from "next/link";
import { Suspense } from "react";
import { Plus, Sparkles } from "lucide-react";

import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { OpenViolationsPanel } from "@/components/dashboard/open-violations-panel";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { PilotDemoBanner } from "@/components/dashboard/pilot-demo-banner";
import { RecentScansTable } from "@/components/dashboard/recent-scans-table";
import { ShopSelector } from "@/components/dashboard/shop-selector";
import { UpcomingDeadlinesPanel } from "@/components/dashboard/upcoming-deadlines-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getDashboardOverview,
  getDashboardShops,
  isEmptyOverview,
  resolveDefaultShopId,
} from "@/lib/dashboard/get-overview";
import { isMockShopId } from "@/lib/mock-data";
import { getUserProfile, getUser } from "@/lib/supabase/server";
import { Store } from "lucide-react";

export const metadata = {
  title: "Overview",
};

type DashboardPageProps = {
  searchParams: Promise<{ shop?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const user = await getUser();
  const profile = await getUserProfile();
  const shops = await getDashboardShops();

  const greeting =
    profile?.full_name?.trim() || user?.email?.split("@")[0] || "there";

  const selectedShopId = resolveDefaultShopId(shops, params.shop);

  const overview = selectedShopId
    ? await getDashboardOverview(selectedShopId)
    : null;

  const isPreviewData = selectedShopId ? isMockShopId(selectedShopId) : false;

  if (shops.length === 0) {
    return (
      <EmptyState
        icon={Store}
        title="No shops yet"
        description="Your default shop is created when you sign up. If nothing appears here, confirm the database migration ran successfully."
        actionLabel="Account settings"
        actionHref="/dashboard/settings"
        className="mt-4"
      />
    );
  }

  if (!overview) {
    return (
      <EmptyState
        icon={Store}
        title="Shop not found"
        description="That shop isn't in your workspace. Pick another shop from the selector."
        actionLabel="Back to overview"
        actionHref="/dashboard"
      />
    );
  }

  const scansHref = `/dashboard/scans?shop=${overview.shop.id}`;
  const showEmptyRealShopBanner =
    !isPreviewData && isEmptyOverview(overview);

  return (
    <div className="space-y-6">
      <OnboardingChecklist
        shopId={overview.shop.id}
        completedSteps={{
          scan: overview.stats.totalScans > 0,
          violations: overview.openViolations.length > 0,
        }}
      />

      {isPreviewData && <PilotDemoBanner shopName={overview.shop.name} />}

      {showEmptyRealShopBanner && (
        <div
          className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground"
          role="status"
        >
          <p className="font-medium text-foreground">Your shop is ready</p>
          <p className="mt-1">
            Run your first listing scan to populate violations, deadlines, and
            compliance metrics. Switch to{" "}
            <span className="font-medium text-foreground">Glow Beauty Co.</span>{" "}
            in the shop selector to explore pilot demo data.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back, {greeting}
            </h1>
            {isPreviewData && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Preview data
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Compliance snapshot for{" "}
            <span className="font-medium text-foreground">{overview.shop.name}</span>
            {" · "}
            {overview.stats.openViolations > 0
              ? `${overview.stats.openViolations} open violation${overview.stats.openViolations === 1 ? "" : "s"} need attention`
              : "No open violations right now"}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Suspense fallback={<div className="h-9 w-40 animate-pulse rounded-md bg-muted" />}>
            <ShopSelector shops={shops} />
          </Suspense>
          <Button asChild variant="brand" size="sm" className="w-full sm:w-auto">
            <Link href={scansHref}>
              <Plus className="h-4 w-4" />
              New scan
            </Link>
          </Button>
        </div>
      </div>

      <OverviewCards stats={overview.stats} shopId={overview.shop.id} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentScansTable
            scans={overview.recentScans}
            shopId={overview.shop.id}
          />
        </div>

        <div className="space-y-6">
          <UpcomingDeadlinesPanel
            deadlines={overview.upcomingDeadlines}
            shopId={overview.shop.id}
          />
        </div>
      </div>

      <OpenViolationsPanel
        violations={overview.openViolations}
        shopId={overview.shop.id}
      />
    </div>
  );
}
