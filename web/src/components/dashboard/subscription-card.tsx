"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { showError } from "@/lib/toast";
import type { SubscriptionStatus } from "@/types/database";

type SubscriptionCardProps = {
  status: SubscriptionStatus;
  planName?: string;
  trialEndsAt?: string | null;
  isPaid?: boolean;
};

const statusLabels: Record<SubscriptionStatus, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Past due",
  canceled: "Canceled",
  unpaid: "Unpaid",
  inactive: "No subscription",
};

export function SubscriptionCard({
  status,
  planName,
  trialEndsAt,
  isPaid = false,
}: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);
  const isSubscribed = status === "active" || status === "trialing";

  async function openPortal() {
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not open billing portal");
      }

      window.location.href = data.url;
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription & billing</CardTitle>
        <CardDescription>
          Manage your Stripe subscription and payment methods.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium text-foreground">{statusLabels[status]}</p>
          </div>
          {planName && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="font-medium text-foreground">{planName}</p>
            </div>
          )}
        </div>

        {trialEndsAt && !isPaid && (
          <p className="text-sm text-muted-foreground">
            Free trial ends{" "}
            {new Date(trialEndsAt).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            .
          </p>
        )}

        {isPaid && isSubscribed ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={openPortal}
            disabled={loading}
          >
            {loading ? "Opening..." : "Manage billing"}
          </Button>
        ) : (
          <Button asChild variant="brand" className="w-full">
            <Link href="/pricing">Upgrade plan</Link>
          </Button>
        )}

        {isPaid && isSubscribed && (
          <p className="text-xs text-muted-foreground">
            Update payment methods, view invoices, or cancel via the Stripe customer portal.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
