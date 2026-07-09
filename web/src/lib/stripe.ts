import Stripe from "stripe";

export type BillingFeature =
  | "unlimited_scans"
  | "appeals"
  | "document_uploads"
  | "alerts"
  | "team_members";

export type PlanId = "trial" | "starter" | "pro";

export type PlanConfig = {
  id: PlanId;
  name: string;
  description: string;
  price: number | null;
  priceId: string | null;
  popular: boolean;
  trialDays: number | null;
  features: Record<BillingFeature, boolean>;
  limits: {
    scansPerMonth: number | null;
    teamMembers: number | null;
  };
  featureList: string[];
};

export const PLANS: PlanConfig[] = [
  {
    id: "trial",
    name: "Free trial",
    description: "Explore core compliance tools for 14 days.",
    price: 0,
    priceId: null,
    popular: false,
    trialDays: 14,
    features: {
      unlimited_scans: false,
      appeals: false,
      document_uploads: false,
      alerts: false,
      team_members: false,
    },
    limits: {
      scansPerMonth: 10,
      teamMembers: 1,
    },
    featureList: [
      "14-day free trial",
      "Up to 10 listing scans",
      "1 shop connection",
      "Compliance overview dashboard",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    description: "Essential protection for growing shops.",
    price: 29,
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? "",
    popular: false,
    trialDays: 14,
    features: {
      unlimited_scans: false,
      appeals: true,
      document_uploads: true,
      alerts: true,
      team_members: true,
    },
    limits: {
      scansPerMonth: 100,
      teamMembers: 3,
    },
    featureList: [
      "100 listing scans per month",
      "Appeal generator workflow",
      "Document uploads for appeals",
      "Email compliance alerts",
      "Up to 3 team members",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Advanced monitoring for serious sellers.",
    price: 79,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    popular: true,
    trialDays: 14,
    features: {
      unlimited_scans: true,
      appeals: true,
      document_uploads: true,
      alerts: true,
      team_members: true,
    },
    limits: {
      scansPerMonth: null,
      teamMembers: null,
    },
    featureList: [
      "Unlimited listing scans",
      "Appeal generator workflow",
      "Document uploads for appeals",
      "Email & Slack alerts",
      "Unlimited team members",
      "Priority support",
    ],
  },
];

export function getPlanById(planId: PlanId) {
  return PLANS.find((plan) => plan.id === planId) ?? PLANS[0];
}

export function getPlanByPriceId(priceId: string) {
  return PLANS.find((plan) => plan.priceId === priceId);
}

export function getPaidPlans() {
  return PLANS.filter((plan) => plan.priceId !== null && plan.priceId.length > 0);
}

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );
}

// ---------------------------------------------------------------------------
// Stripe SDK singleton
// ---------------------------------------------------------------------------

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-06-24.dahlia",
      typescript: true,
    });
  }

  return stripeClient;
}

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): "inactive" | "active" | "trialing" | "past_due" | "canceled" | "unpaid" {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "unpaid";
    default:
      return "inactive";
  }
}
