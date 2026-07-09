import { Check, Lock } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FEATURE_LABELS } from "@/lib/billing/profile";
import type { BillingEntitlements } from "@/lib/billing/entitlements";
import type { BillingFeature } from "@/lib/stripe";
import { cn } from "@/lib/utils";

const FEATURE_ORDER: BillingFeature[] = [
  "unlimited_scans",
  "appeals",
  "document_uploads",
  "alerts",
  "team_members",
];

type FeatureAccessCardProps = {
  entitlements: BillingEntitlements;
};

export function FeatureAccessCard({ entitlements }: FeatureAccessCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature access</CardTitle>
        <CardDescription>
          Paid features are unlocked on Starter and Pro plans.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {FEATURE_ORDER.map((feature) => {
            const enabled = entitlements.features[feature];
            return (
              <li
                key={feature}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-4 py-3 text-sm",
                  enabled ? "border-emerald-200 bg-emerald-50/40" : "bg-muted/20",
                )}
              >
                <span className="font-medium text-foreground">
                  {FEATURE_LABELS[feature]}
                </span>
                {enabled ? (
                  <span className="flex items-center gap-1 text-emerald-700">
                    <Check className="h-4 w-4" />
                    Included
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" />
                    Upgrade
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
