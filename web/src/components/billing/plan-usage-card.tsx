import { CalendarClock, ScanSearch, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BillingEntitlements } from "@/lib/billing/entitlements";

type PlanUsageCardProps = {
  entitlements: BillingEntitlements;
};

export function PlanUsageCard({ entitlements }: PlanUsageCardProps) {
  const scanLabel =
    entitlements.scansLimit === null
      ? `${entitlements.scansUsed} scans used this month`
      : `${entitlements.scansUsed} / ${entitlements.scansLimit} scans used this month`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan & usage</CardTitle>
        <CardDescription>
          Your current plan and monthly usage limits.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Current plan</p>
            <p className="mt-1 font-medium">{entitlements.planName}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <ScanSearch className="h-3 w-3" />
              Scans
            </p>
            <p className="mt-1 font-medium">{scanLabel}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              Team limit
            </p>
            <p className="mt-1 font-medium">
              {entitlements.teamMemberLimit === null
                ? "Unlimited"
                : `${entitlements.teamMemberLimit} members`}
            </p>
          </div>
        </div>

        {entitlements.isTrialing && entitlements.trialEndsAt && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Free trial active</p>
              <p className="mt-1 text-amber-800">
                Trial ends{" "}
                {new Date(entitlements.trialEndsAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                . Upgrade to unlock appeals, uploads, alerts, and team features.
              </p>
            </div>
          </div>
        )}

        {entitlements.trialExpired && !entitlements.isPaid && (
          <div className="rounded-lg border border-red-200 bg-red-50/60 p-4 text-sm text-red-800">
            Your free trial has ended. Subscribe to continue using paid features.
          </div>
        )}

        {!entitlements.isPaid && (
          <Button asChild variant="brand" className="w-full sm:w-auto">
            <Link href="/pricing">Upgrade plan</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
