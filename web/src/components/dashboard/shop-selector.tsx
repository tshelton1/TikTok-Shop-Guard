"use client";

import { ChevronDown, Store } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { DashboardShop } from "@/types/dashboard";
import { cn } from "@/lib/utils";

type ShopSelectorProps = {
  shops: DashboardShop[];
  className?: string;
};

export function ShopSelector({ shops, className }: ShopSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("shop") ?? shops[0]?.id ?? "";
  const selectedShop = shops.find((shop) => shop.id === selectedId) ?? shops[0];

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("shop", event.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  if (!selectedShop) {
    return null;
  }

  return (
    <div className={cn("relative max-w-[220px] sm:max-w-xs", className)}>
      <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <select
        value={selectedShop.id}
        onChange={handleChange}
        className="h-9 w-full max-w-full appearance-none truncate rounded-md border border-input bg-background pl-9 pr-8 text-sm font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Select shop"
      >
        {shops.map((shop) => (
          <option key={shop.id} value={shop.id}>
            {shop.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
