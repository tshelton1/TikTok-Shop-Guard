import { Badge } from "@/components/ui/badge";
import type { AccountStatus } from "@/types/dashboard";
import { cn } from "@/lib/utils";

type AccountStatusBadgeProps = {
  account: AccountStatus;
  className?: string;
};

export function AccountStatusBadge({
  account,
  className,
}: AccountStatusBadgeProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant={account.isActive ? "success" : "warning"}>
        {account.isTrialing ? "Trial" : account.isActive ? "Active" : "Inactive"}
      </Badge>
      {account.planName && (
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {account.planName}
          {account.isTrialing && account.trialEndsAt
            ? ` · ends ${new Date(account.trialEndsAt).toLocaleDateString()}`
            : ""}
        </span>
      )}
    </div>
  );
}
