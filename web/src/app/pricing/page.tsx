import { PricingCards } from "@/components/pricing/pricing-cards";
import { PublicLayout } from "@/components/layout/public-layout";
import { getBillingEntitlements } from "@/lib/billing/entitlements";
import { getProfile, getUser } from "@/lib/supabase/server";
import { isStripeConfigured } from "@/lib/stripe";

export const metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for TikTok Shop compliance monitoring.",
};

export default async function PricingPage() {
  const user = await getUser();
  let currentPlanId: string | undefined;

  if (user) {
    const profile = await getProfile();
    if (profile) {
      currentPlanId = getBillingEntitlements(profile).planId;
    }
  }

  return (
    <PublicLayout>
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Start with a 14-day free trial, then choose Starter or Pro as your
              shop grows. Cancel anytime from the billing portal.
            </p>
            {!isStripeConfigured() && (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Stripe is not fully configured. Set{" "}
                <code className="text-xs">STRIPE_SECRET_KEY</code>,{" "}
                <code className="text-xs">STRIPE_WEBHOOK_SECRET</code>, price
                IDs, and{" "}
                <code className="text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>{" "}
                to enable checkout.
              </p>
            )}
          </div>

          <div className="mt-16">
            <PricingCards
              isAuthenticated={Boolean(user)}
              currentPlanId={currentPlanId}
            />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
