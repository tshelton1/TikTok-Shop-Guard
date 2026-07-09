import { UserMenu } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";
import type { UserShop } from "@/lib/supabase/shops";

type TopbarProps = {
  email: string;
  displayName: string;
  shops?: UserShop[];
  title?: string;
};

export function Topbar({
  email,
  displayName,
  shops = [],
  title = "Dashboard",
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground sm:text-base">
            {title}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {displayName}
            {shops.length > 0 && (
              <span className="hidden sm:inline">
                {" "}
                · {shops.length} shop{shops.length === 1 ? "" : "s"}
              </span>
            )}
          </p>
        </div>
        <Badge variant="secondary" className="hidden shrink-0 lg:inline-flex">
          Signed in
        </Badge>
      </div>
      <UserMenu email={email} displayName={displayName} />
    </header>
  );
}
