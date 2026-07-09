"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ImageIcon,
  Loader2,
  ScanSearch,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  resultToHistoryEntry,
  scanListingViaApi,
} from "@/lib/dashboard/scan-listing";
import { showError, showSuccess } from "@/lib/toast";
import type {
  ListingCategory,
  ListingScanHistoryEntry,
  ListingScanResult,
} from "@/types/listing-scan";
import { LISTING_CATEGORIES } from "@/types/listing-scan";

import { ListingScanHistoryTable } from "./listing-scan-history-table";
import { ListingScanResults } from "./listing-scan-results";

type ListingScannerProps = {
  shopId: string;
  shopName: string;
  initialHistory: ListingScanHistoryEntry[];
  scansUsed?: number;
  scansLimit?: number | null;
  unlimitedScans?: boolean;
  isActive?: boolean;
};

export function ListingScanner({
  shopId,
  shopName,
  initialHistory,
  scansUsed = 0,
  scansLimit = null,
  unlimitedScans = false,
  isActive = true,
}: ListingScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<ListingCategory>("beauty");
  const [images, setImages] = useState<File[]>([]);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ListingScanResult | null>(null);
  const [history, setHistory] = useState(initialHistory);
  const [scanError, setScanError] = useState<string | null>(null);

  const scansRemaining =
    scansLimit === null || unlimitedScans
      ? null
      : Math.max(scansLimit - scansUsed, 0);
  const atScanLimit = !unlimitedScans && scansRemaining === 0;

  const handleImages = useCallback((files: FileList | null) => {
    if (!files) return;
    const next = [...images, ...Array.from(files)].slice(0, 3);
    setImages(next);
  }, [images]);

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleScan(event: React.FormEvent) {
    event.preventDefault();
    setScanning(true);
    setResult(null);
    setScanError(null);

    try {
      const scanResult = await scanListingViaApi({
        shopId,
        title,
        description,
        price: parseFloat(price) || 0,
        category,
        imageNames: images.map((file) => file.name),
      });

      setResult(scanResult);
      const entry = resultToHistoryEntry(scanResult);
      setHistory((prev) => [entry, ...prev]);
      showSuccess("Listing scan completed.");
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
        {/* Left: scan form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanSearch className="h-5 w-5 text-brand" />
              Scan a listing
            </CardTitle>
            <CardDescription>
              Paste your listing details to check for policy violations before
              publishing.
            </CardDescription>
            {!unlimitedScans && scansLimit !== null && (
              <p className="text-sm text-muted-foreground">
                {isActive
                  ? `${scansUsed} / ${scansLimit} scans used this month`
                  : "Your trial has ended. Upgrade to continue scanning."}
                {scansRemaining !== null && scansRemaining > 0
                  ? ` · ${scansRemaining} remaining`
                  : ""}
              </p>
            )}
            {unlimitedScans && (
              <p className="text-sm text-brand">Unlimited scans included on your plan.</p>
            )}
          </CardHeader>
          <CardContent>
            {!isActive && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Your free trial has ended.{" "}
                <Link href="/pricing" className="font-medium underline">
                  Upgrade your plan
                </Link>{" "}
                to continue scanning listings.
              </div>
            )}
            {atScanLimit && isActive && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                You&apos;ve reached your monthly scan limit.{" "}
                <Link href="/pricing" className="font-medium underline">
                  Upgrade to Pro
                </Link>{" "}
                for unlimited scans.
              </div>
            )}
            {scanError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {scanError}
              </div>
            )}
            <Form onSubmit={handleScan}>
              <FormItem>
                <FormLabel>Shop</FormLabel>
                <div className="flex h-10 items-center rounded-md border border-input bg-muted/30 px-3">
                  <Badge variant="outline">{shopName}</Badge>
                  <span className="ml-2 text-xs text-muted-foreground">
                    Change shop using the selector above
                  </span>
                </div>
              </FormItem>

              <FormItem>
                <FormLabel htmlFor="title">Product title</FormLabel>
                <FormControl>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Vitamin C Brightening Serum 30ml"
                    required
                  />
                </FormControl>
              </FormItem>

              <FormItem>
                <FormLabel htmlFor="description">Description</FormLabel>
                <FormControl>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your product, ingredients, usage, and benefits..."
                    required
                  />
                </FormControl>
              </FormItem>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormItem>
                  <FormLabel htmlFor="price">Price (USD)</FormLabel>
                  <FormControl>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="29.99"
                      required
                    />
                  </FormControl>
                </FormItem>

                <FormItem>
                  <FormLabel htmlFor="category">Category</FormLabel>
                  <FormControl>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as ListingCategory)
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {LISTING_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                </FormItem>
              </div>

              <FormItem>
                <FormLabel>Product images</FormLabel>
                <FormControl>
                  <div
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 py-8 transition-colors hover:bg-muted/40"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        fileInputRef.current?.click();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      Click to upload images
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Up to 3 images (PNG, JPG)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        handleImages(e.target.files);
                        e.target.value = "";
                      }}
                      disabled={images.length >= 3}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  {images.length}/3 images selected
                </FormDescription>

                {images.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {images.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="ml-2 text-muted-foreground hover:text-foreground"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </FormItem>

              <Button
                type="submit"
                variant="brand"
                className="w-full"
                disabled={scanning || atScanLimit || !isActive}
              >
                {scanning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <ScanSearch className="h-4 w-4" />
                    Scan listing
                  </>
                )}
              </Button>
            </Form>
          </CardContent>
        </Card>

        {/* Right: scan results */}
        <div className="lg:sticky lg:top-20">
          {scanning ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Analyzing listing against policy rules...
                </p>
              </CardContent>
            </Card>
          ) : result ? (
            <ListingScanResults result={result} />
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <CheckCircle2 className="mb-4 h-10 w-10 text-muted-foreground/50" />
                <p className="font-medium text-foreground">No scan results yet</p>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  Fill in your listing details and click Scan to see risk score,
                  issues, and suggested rewrites.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Full-width history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            Scan history
          </CardTitle>
          <CardDescription>
            Previous listing scans for the selected shop
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ListingScanHistoryTable history={history} />
        </CardContent>
      </Card>
    </div>
  );
}
