/**
 * Static plan definitions for marketing UI.
 * Wire to Stripe price IDs via STRIPE_*_PRICE_ID env vars when enabling billing.
 */
export const PLACEHOLDER_PLANS = [
  {
    id: "trial",
    name: "Free trial",
    description: "Explore core compliance tools for 14 days.",
    price: 0,
    popular: false,
    cta: "Start free trial",
    features: [
      "14-day free trial",
      "Listing compliance scans",
      "Compliance overview dashboard",
      "Email support",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    description: "Essential protection for growing shops.",
    price: 29,
    popular: false,
    cta: "Get started",
    features: [
      "100 listing scans per month",
      "Appeal workflow",
      "Document uploads",
      "Email alerts",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Advanced monitoring for serious sellers.",
    price: 79,
    popular: true,
    cta: "Get started",
    features: [
      "Unlimited listing scans",
      "Appeal workflow",
      "Document uploads",
      "Priority support",
    ],
  },
] as const;
