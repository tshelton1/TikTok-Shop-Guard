import { Check } from "lucide-react";
import Link from "next/link";

import { CheckoutButton } from "@/components/pricing/checkout-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLANS } from "@/lib/stripe";
import { cn } from "@/lib/utils";

type PricingCardsProps = {
  isAuthenticated?: boolean;
  currentPlanId?: string;
};

export function PricingCards({
  isAuthenticated = false,
  currentPlanId,
}: PricingCardsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PLANS.map((plan) => {
        const isCurrent = currentPlanId === plan.id;
        const isPaidPlan = plan.priceId !== null;

        return (
          <Card
            key={plan.id}
            className={cn(
              "flex flex-col",
              plan.popular && "border-brand shadow-md",
            )}
          >
            {plan.popular && (
              <div className="px-6 pt-6">
                <span className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                  Most popular
                </span>
              </div>
            )}

            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="pt-2">
                {plan.price === 0 ? (
                  <span className="text-4xl font-bold text-foreground">Free</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </>
                )}
              </div>
              {plan.trialDays && isPaidPlan && (
                <p className="text-sm text-brand">
                  Includes {plan.trialDays}-day free trial
                </p>
              )}
            </CardHeader>

            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plan.featureList.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              {isCurrent ? (
                <Button variant="outline" className="w-full" disabled>
                  Current plan
                </Button>
              ) : isPaidPlan ? (
                isAuthenticated ? (
                  <CheckoutButton
                    priceId={plan.priceId!}
                    planId={plan.id}
                    planName={plan.name}
                  />
                ) : (
                  <Button
                    asChild
                    variant={plan.popular ? "brand" : "outline"}
                    className="w-full"
                  >
                    <Link href={`/signup?plan=${plan.id}`}>Get started</Link>
                  </Button>
                )
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <Link href={isAuthenticated ? "/dashboard" : "/signup"}>
                    {isAuthenticated ? "Go to dashboard" : "Start free trial"}
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
