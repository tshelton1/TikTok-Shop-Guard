"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { showError } from "@/lib/toast";

type CheckoutButtonProps = {
  priceId: string;
  planId: string;
  planName: string;
};

export function CheckoutButton({ priceId, planId, planName }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (!priceId) {
      showError("Stripe price ID is not configured for this plan.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Checkout failed");
      }

      window.location.href = data.url;
    } catch (error) {
      showError(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="brand"
      className="w-full"
      onClick={handleCheckout}
      disabled={loading || !priceId}
    >
      {loading ? "Redirecting..." : `Start ${planName}`}
    </Button>
  );
}
