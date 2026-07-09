"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  LogOut,
  ScanSearch,
  Settings,
} from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export const DASHBOARD_NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/scans", label: "Scans", icon: ScanSearch },
  { href: "/dashboard/appeals", label: "Appeals", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

type SidebarProps = {
  email: string;
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ email, className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside
      className={cn("flex w-64 flex-col border-r bg-card", className)}
    >
      <div className="flex h-16 items-center border-b px-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Dashboard">
        {DASHBOARD_NAV.map((link) => {
          const Icon = link.icon;
          const isActive =
            "exact" in link && link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <p className="mb-2 truncate px-3 text-xs text-muted-foreground">{email}</p>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={handleSignOut}
          disabled={loading}
        >
          <LogOut className="h-4 w-4" />
          {loading ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </aside>
  );
}
