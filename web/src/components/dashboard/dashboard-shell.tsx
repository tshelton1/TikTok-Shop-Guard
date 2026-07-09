"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import type { UserShop } from "@/lib/supabase/shops";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/scans": "Listing scans",
  "/dashboard/appeals": "Appeals",
  "/dashboard/settings": "Settings",
};

function resolvePageTitle(pathname: string) {
  if (pathname.startsWith("/dashboard/appeals/")) {
    return "Appeal generator";
  }

  return PAGE_TITLES[pathname] ?? "Dashboard";
}

type DashboardShellProps = {
  email: string;
  displayName: string;
  shops?: UserShop[];
  children: React.ReactNode;
};

export function DashboardShell({
  email,
  displayName,
  shops = [],
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = resolvePageTitle(pathname);

  return (
    <div className="flex min-h-screen bg-muted/20">
      <div className="hidden lg:flex lg:w-64 lg:shrink-0">
        <Sidebar email={email} className="fixed inset-y-0 left-0 z-30" />
      </div>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar
          email={email}
          onNavigate={() => setMobileOpen(false)}
          className="h-full shadow-xl"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <div className="flex items-center gap-3 border-b bg-background px-4 py-3 lg:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <span className="truncate text-sm font-medium text-foreground">
            {pageTitle}
          </span>
        </div>

        <Topbar
          email={email}
          displayName={displayName}
          shops={shops}
          title={pageTitle}
        />

        <main id="main-content" className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
