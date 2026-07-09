"use client";

import { Loader2, ScanSearch } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import {
  ScannerForm,
  type ScannerFormValues,
  type ScannerShop,
} from "@/components/scans/scanner-form";
import { ScanHistoryTable } from "@/components/scans/scan-history-table";
import { ScanResults } from "@/components/scans/scan-results";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  resultToHistoryEntry,
  scanListingViaApi,
} from "@/lib/dashboard/scan-listing";
import { showError, showSuccess, showWarning } from "@/lib/toast";
import {
  hasScannerErrors,
  validateScannerForm,
  type ScannerFieldErrors,
} from "@/lib/validation/scanner";
import type { ListingScanHistoryEntry, ListingScanResult } from "@/types/listing-scan";

type ScannerWorkspaceProps = {
  shops: ScannerShop[];
  initialShopId: string;
  initialHistory: ListingScanHistoryEntry[];
};

const defaultFormValues = (shopId: string): ScannerFormValues => ({
  shopId,
  title: "",
  description: "",
  price: "",
  category: "beauty",
  images: [],
});

export function ScannerWorkspace({
  shops,
  initialShopId,
  initialHistory,
}: ScannerWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formValues, setFormValues] = useState<ScannerFormValues>(() =>
    defaultFormValues(initialShopId),
  );
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ListingScanResult | null>(null);
  const [history, setHistory] = useState(initialHistory);
  const [scanError, setScanError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ScannerFieldErrors>({});

  const syncShopToUrl = useCallback(
    (shopId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("shop", shopId);
      router.replace(`/dashboard/scans?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleFormChange = useCallback(
    (values: ScannerFormValues) => {
      if (values.shopId !== formValues.shopId) {
        syncShopToUrl(values.shopId);
      }
      setFormValues(values);
    },
    [formValues.shopId, syncShopToUrl],
  );

  async function handleScan() {
    const errors = validateScannerForm(formValues);
    setFieldErrors(errors);

    if (hasScannerErrors(errors)) {
      const firstError =
        errors.title ??
        errors.description ??
        errors.price ??
        errors.form ??
        "Please fix the highlighted fields.";
      showWarning(firstError);
      return;
    }

    setScanning(true);
    setResult(null);
    setScanError(null);

    try {
      const scanResult = await scanListingViaApi({
        shopId: formValues.shopId,
        title: formValues.title.trim(),
        description: formValues.description.trim(),
        price: parseFloat(formValues.price) || 0,
        category: formValues.category,
        imageNames: formValues.images.map((file) => file.name),
      });

      setResult(scanResult);
      setHistory((prev) => [resultToHistoryEntry(scanResult), ...prev]);
      showSuccess(
        scanResult.blocked
          ? "Scan complete — listing has blocking issues."
          : "Scan complete — listing looks safe.",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scan failed";
      setScanError(message);
      showError(message);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <ScannerForm
          shops={shops}
          values={formValues}
          onChange={handleFormChange}
          onSubmit={handleScan}
          scanning={scanning}
          error={scanError}
          fieldErrors={fieldErrors}
        />

        <div className="lg:sticky lg:top-20">
          {scanning ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
                <p className="mt-4 text-sm font-medium text-foreground">
                  Analyzing listing...
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Checking title, description, price, category, and images
                </p>
              </CardContent>
            </Card>
          ) : result ? (
            <ScanResults result={result} />
          ) : (
            <EmptyState
              icon={ScanSearch}
              title="No scan results yet"
              description="Fill in your listing details and click Scan to see risk score, flagged issues, suggested rewrites, and image warnings."
              className="border-dashed bg-transparent py-16"
            />
          )}
        </div>
      </div>

      <ScanHistoryTable history={history} />
    </div>
  );
}
