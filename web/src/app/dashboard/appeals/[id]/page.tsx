import Link from "next/link";
import { notFound } from "next/navigation";

import { AppealForm } from "@/components/appeals/appeal-form";
import { Button } from "@/components/ui/button";
import {
  fetchAppealDraftForViolation,
  fetchViolation,
} from "@/lib/appeals/repository";
import { getServerEntitlements } from "@/lib/billing/server";

export const metadata = {
  title: "Appeal generator",
};

type AppealDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AppealDetailPage({ params }: AppealDetailPageProps) {
  const { id } = await params;
  const violation = await fetchViolation(id);

  if (!violation) {
    notFound();
  }

  const [existingAppeal, entitlements] = await Promise.all([
    fetchAppealDraftForViolation(id),
    getServerEntitlements(),
  ]);

  const isMockShop = violation.shop_id.startsWith("shop-");
  const canUseAppeals = isMockShop || Boolean(entitlements?.features.appeals);
  const canUploadDocuments =
    isMockShop || Boolean(entitlements?.features.document_uploads);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/dashboard/appeals" className="hover:text-foreground">
              ← Appeals
            </Link>
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Appeal generator
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Building recovery packet for{" "}
            <span className="font-medium text-foreground">
              {violation.listing_title ?? violation.title}
            </span>
            {existingAppeal?.id && (
              <span className="text-muted-foreground">
                {" "}
                · Draft in progress
              </span>
            )}
          </p>
          {canUploadDocuments && (
            <p className="mt-2 text-xs text-muted-foreground">
              Step 5 supports secure uploads (screenshots, invoices, authenticity proofs)
              stored in private Supabase Storage.
            </p>
          )}
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/dashboard/appeals">All violations</Link>
        </Button>
      </div>

      <AppealForm
        violation={violation}
        existingAppeal={existingAppeal}
        canUseAppeals={canUseAppeals}
        canUploadDocuments={canUploadDocuments}
      />
    </>
  );
}
