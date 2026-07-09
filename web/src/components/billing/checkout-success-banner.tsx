"use client";

import { Button } from "@/components/ui/button";
import { getPlanById } from "@/lib/stripe";
import { CheckCircle2, X } from "lucide-react";
import { useSearchParams } from "next/navigation";

export function CheckoutSuccessBanner() {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("checkout") === "success";

  if (!isSuccess) {
    return null;
  }

  const planId = searchParams.get("plan");
  const planName = planId
    ? getPlanById(planId as "starter" | "pro" | "trial").name
    : "your plan";

  function dismiss() {
    const url = new URL(window.location.href);
    url.searchParams.delete("checkout");
    url.searchParams.delete("plan");
    window.history.replaceState({}, "", url.toString());
    window.location.reload();
  }

  return (
    <div className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-medium">Subscription activated</p>
          <p className="mt-1">
            You&apos;re now on {planName}. Paid features are unlocked for your account.
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={dismiss} aria-label="Dismiss">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
