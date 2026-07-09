import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, FileText, Shield } from "lucide-react";

import { SavedAppealsTable } from "@/components/appeals/saved-appeals-table";
import {
  ViolationsAlertBanner,
  ViolationsTable,
} from "@/components/appeals/violations-table";
import { ShopSelector } from "@/components/dashboard/shop-selector";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchAppeals, fetchViolations } from "@/lib/appeals/repository";
import {
  getDashboardShops,
  resolveDefaultShopId,
} from "@/lib/dashboard/get-overview";

export const metadata = {
  title: "Appeals",
};

type AppealsPageProps = {
  searchParams: Promise<{ shop?: string; violation?: string }>;
};

const RECOVERY_STEPS = [
  {
    title: "Pick a violation",
    description: "Start from an open violation detected by your scans.",
  },
  {
    title: "Follow the guide",
    description: "Review strategy, evidence checklist, and a draft response.",
  },
  {
    title: "Attach proof",
    description: "Upload screenshots, invoices, and authenticity documents.",
  },
  {
    title: "Save your draft",
    description: "Return anytime to edit before submitting to TikTok Shop.",
  },
];

export default async function AppealsPage({ searchParams }: AppealsPageProps) {
  const params = await searchParams;
  const shops = await getDashboardShops();

  if (shops.length === 0) {
    return (
      <>
        <PageHeader />
        <EmptyState
          icon={Shield}
          title="No shops available"
          description="Join a shop workspace to manage violation appeals."
          actionLabel="Go to settings"
          actionHref="/dashboard/settings"
          className="mt-6"
        />
      </>
    );
  }

  const selectedShopId = resolveDefaultShopId(shops, params.shop)!;

  const [violations, appeals] = await Promise.all([
    fetchViolations(selectedShopId),
    fetchAppeals(selectedShopId),
  ]);

  const openViolations = violations.filter((v) => v.status === "open");

  return (
    <>
      <PageHeader
        shopSelector={
          <Suspense fallback={null}>
            <ShopSelector shops={shops} />
          </Suspense>
        }
      />

      <Card className="mb-6 border-brand/20 bg-brand/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-brand" />
            Guided appeal recovery
          </CardTitle>
          <CardDescription>
            Not a blank form — we walk you from violation to saved draft with
            suggested copy and evidence checklists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RECOVERY_STEPS.map((item, index) => (
              <li
                key={item.title}
                className="rounded-lg border bg-background p-4"
              >
                <p className="text-xs font-semibold text-brand">Step {index + 1}</p>
                <p className="mt-1 font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {openViolations.length > 0 && <ViolationsAlertBanner />}

      <Card className="mb-6">
        <CardHeader className="flex flex-col gap-3 border-b bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Open violations</CardTitle>
            <CardDescription>
              Select a violation to launch the appeal generator
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/scans?shop=${selectedShopId}`}>
              Run a scan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <ViolationsTable
            violations={openViolations}
            highlightId={params.violation}
            shopId={selectedShopId}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved appeal drafts</CardTitle>
          <CardDescription>
            Continue editing drafts you have already started
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <SavedAppealsTable appeals={appeals.filter((a) => a.status === "draft")} />
        </CardContent>
      </Card>
    </>
  );
}

function PageHeader({ shopSelector }: { shopSelector?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Appeals
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Generate and manage appeal packets for policy violations. Each workflow
          loads the violation, suggests a response, and helps you gather evidence.
        </p>
      </div>
      {shopSelector}
    </div>
  );
}
