import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "warning" | "danger";
};

const variantStyles = {
  default: "text-foreground",
  warning: "text-amber-600",
  danger: "text-red-600",
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", variantStyles[variant])}>
          {value}
        </div>
        {(description || trend) && (
          <p className="mt-1 text-xs text-muted-foreground">
            {trend ?? description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
