"use client";

import {
  ImageIcon,
  Loader2,
  ScanSearch,
  Store,
  X,
} from "lucide-react";
import { useCallback, useRef } from "react";

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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ScannerFieldErrors } from "@/lib/validation/scanner";
import type { ListingCategory } from "@/types/listing-scan";
import { LISTING_CATEGORIES } from "@/types/listing-scan";
import { cn } from "@/lib/utils";

export type ScannerShop = {
  id: string;
  name: string;
};

export type ScannerFormValues = {
  shopId: string;
  title: string;
  description: string;
  price: string;
  category: ListingCategory;
  images: File[];
};

type ScannerFormProps = {
  shops: ScannerShop[];
  values: ScannerFormValues;
  onChange: (values: ScannerFormValues) => void;
  onSubmit: () => void;
  scanning?: boolean;
  disabled?: boolean;
  error?: string | null;
  fieldErrors?: ScannerFieldErrors;
};

export function ScannerForm({
  shops,
  values,
  onChange,
  onSubmit,
  scanning = false,
  disabled = false,
  error,
  fieldErrors = {},
}: ScannerFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = useCallback(
    (patch: Partial<ScannerFormValues>) => {
      onChange({ ...values, ...patch });
    },
    [onChange, values],
  );

  const handleImages = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const next = [...values.images, ...Array.from(files)].slice(0, 3);
      update({ images: next });
    },
    [update, values.images],
  );

  function removeImage(index: number) {
    update({ images: values.images.filter((_, i) => i !== index) });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanSearch className="h-5 w-5 text-brand" />
          Scan a listing
        </CardTitle>
        <CardDescription>
          Paste your listing details to check for policy violations before
          publishing on TikTok Shop.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        )}

        <Form onSubmit={handleSubmit} noValidate>
          <FormItem>
            <FormLabel htmlFor="shop">Shop</FormLabel>
            <FormControl>
              <div className="relative">
                <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  id="shop"
                  value={values.shopId}
                  onChange={(event) => update({ shopId: event.target.value })}
                  className="flex h-10 w-full appearance-none rounded-md border border-input bg-background pl-9 pr-8 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={scanning || disabled}
                  aria-invalid={Boolean(fieldErrors.shopId)}
                >
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              </div>
            </FormControl>
            {fieldErrors.shopId && <FormMessage>{fieldErrors.shopId}</FormMessage>}
          </FormItem>

          <FormItem>
            <FormLabel htmlFor="title">Product title</FormLabel>
            <FormControl>
              <Input
                id="title"
                value={values.title}
                onChange={(event) => update({ title: event.target.value })}
                placeholder="Vitamin C Brightening Serum 30ml"
                disabled={scanning || disabled}
                aria-invalid={Boolean(fieldErrors.title)}
                aria-describedby={fieldErrors.title ? "title-error" : undefined}
              />
            </FormControl>
            {fieldErrors.title ? (
              <FormMessage id="title-error">{fieldErrors.title}</FormMessage>
            ) : (
              <FormDescription>3–200 characters</FormDescription>
            )}
          </FormItem>

          <FormItem>
            <FormLabel htmlFor="description">Description</FormLabel>
            <FormControl>
              <Textarea
                id="description"
                value={values.description}
                onChange={(event) => update({ description: event.target.value })}
                placeholder="Describe your product, ingredients, usage, and benefits..."
                disabled={scanning || disabled}
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={
                  fieldErrors.description ? "description-error" : "description-hint"
                }
              />
            </FormControl>
            {fieldErrors.description ? (
              <FormMessage id="description-error">{fieldErrors.description}</FormMessage>
            ) : (
              <FormDescription id="description-hint">
                At least 20 characters · {values.description.trim().length} entered
              </FormDescription>
            )}
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
                  inputMode="decimal"
                  value={values.price}
                  onChange={(event) => update({ price: event.target.value })}
                  placeholder="29.99"
                  disabled={scanning || disabled}
                  aria-invalid={Boolean(fieldErrors.price)}
                />
              </FormControl>
              {fieldErrors.price && <FormMessage>{fieldErrors.price}</FormMessage>}
            </FormItem>

            <FormItem>
              <FormLabel htmlFor="category">Category</FormLabel>
              <FormControl>
                <select
                  id="category"
                  value={values.category}
                  onChange={(event) =>
                    update({ category: event.target.value as ListingCategory })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={scanning || disabled}
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
              <button
                type="button"
                className={cn(
                  "flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 py-8 transition-colors hover:bg-muted/40",
                  (disabled || scanning) && "cursor-not-allowed opacity-60",
                )}
                onClick={() => !disabled && !scanning && fileInputRef.current?.click()}
                disabled={disabled || scanning}
                aria-label="Upload product images"
              >
                <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium text-foreground">
                  Click to upload images
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Up to 3 images (PNG, JPG, WebP)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    handleImages(event.target.files);
                    event.target.value = "";
                  }}
                  disabled={values.images.length >= 3 || scanning || disabled}
                />
              </button>
            </FormControl>
            <FormDescription>{values.images.length}/3 images selected</FormDescription>

            {values.images.length > 0 && (
              <ul className="mt-3 space-y-2">
                {values.images.map((file, index) => (
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
                      disabled={scanning}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {values.images.length === 0 && (
              <FormMessage className="text-muted-foreground">
                Image filenames are checked for policy issues (e.g. promotional overlays).
              </FormMessage>
            )}
          </FormItem>

          <Button
            type="submit"
            variant="brand"
            className="w-full"
            disabled={scanning || disabled}
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
  );
}
