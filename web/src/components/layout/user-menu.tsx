"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { showInfo } from "@/lib/toast";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  email: string;
  displayName?: string;
  showDashboardLink?: boolean;
  className?: string;
};

export function UserMenu({
  email,
  displayName,
  showDashboardLink = false,
  className,
}: UserMenuProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await supabase.auth.signOut();
    showInfo("Signed out successfully.");
    router.push("/login");
    router.refresh();
  }

  return (
    <div className={cn("flex items-center gap-2 sm:gap-3", className)}>
      <div className="hidden text-right sm:block">
        {displayName && (
          <p className="max-w-[160px] truncate text-sm font-medium text-foreground">
            {displayName}
          </p>
        )}
        <p className="max-w-[200px] truncate text-xs text-muted-foreground">
          {email}
        </p>
      </div>
      {showDashboardLink && (
        <Button asChild variant="brand" size="sm">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        disabled={loading}
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">
          {loading ? "Signing out..." : "Sign out"}
        </span>
      </Button>
    </div>
  );
}
