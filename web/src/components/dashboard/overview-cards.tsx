import Link from "next/link";
import {
  AlertTriangle,
  FileWarning,
  ScanSearch,
  ShieldAlert,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardStats } from "@/types/dashboard";
import { cn } from "@/lib/utils";

type OverviewCardsProps = {
  stats: DashboardStats;
  shopId?: string;
};

type StatConfig = {
  key: keyof DashboardStats;
  title: string;
  description: string;
  icon: typeof ScanSearch;
  href: string;
  accent: string;
  iconBg: string;
  valueVariant?: "default" | "warning" | "danger";
};

const valueStyles = {
  default: "text-foreground",
  warning: "text-amber-600",
  danger: "text-red-600",
};

function buildCards(shopId?: string): StatConfig[] {
  const scansHref = shopId ? `/dashboard/scans?shop=${shopId}` : "/dashboard/scans";
  const appealsHref = shopId
    ? `/dashboard/appeals?shop=${shopId}`
    : "/dashboard/appeals";

  return [
    {
      key: "totalScans",
      title: "Total scans",
      description: "All-time listing checks",
      icon: ScanSearch,
      href: scansHref,
      accent: "text-brand",
      iconBg: "bg-brand/10",
    },
    {
      key: "highRiskListings",
      title: "High-risk listings",
      description: "Score 60+ or blocked",
      icon: AlertTriangle,
      href: scansHref,
      accent: "text-amber-600",
      iconBg: "bg-amber-100",
      valueVariant: "warning",
    },
    {
      key: "openViolations",
      title: "Open violations",
      description: "Needs remediation",
      icon: ShieldAlert,
      href: appealsHref,
      accent: "text-red-600",
      iconBg: "bg-red-100",
      valueVariant: "danger",
    },
    {
      key: "pendingAppeals",
      title: "Pending appeals",
      description: "Draft or submitted",
      icon: FileWarning,
      href: appealsHref,
      accent: "text-violet-600",
      iconBg: "bg-violet-100",
    },
  ];
}

export function OverviewCards({ stats, shopId }: OverviewCardsProps) {
  const cards = buildCards(shopId);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key];

        return (
          <Link key={card.key} href={card.href} className="group block">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    card.iconBg,
                  )}
                >
                  <Icon className={cn("h-4 w-4", card.accent)} />
                </div>
              </CardHeader>
              <CardContent>
                <p
                  className={cn(
                    "text-3xl font-bold tracking-tight",
                    valueStyles[card.valueVariant ?? "default"],
                  )}
                >
                  {value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.description}
                </p>
                <p className="mt-3 text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
                  View details →
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
