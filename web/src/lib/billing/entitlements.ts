import {
  getPlanById,
  getPlanByPriceId,
  type BillingFeature,
  type PlanId,
} from "@/lib/stripe";
import type { Profile, SubscriptionStatus } from "@/types/database";

export type BillingEntitlements = {
  planId: PlanId;
  planName: string;
  isPaid: boolean;
  isTrialing: boolean;
  isActive: boolean;
  trialEndsAt: string | null;
  trialExpired: boolean;
  scansUsed: number;
  scansLimit: number | null;
  scansRemaining: number | null;
  features: Record<BillingFeature, boolean>;
  teamMemberLimit: number | null;
};

export function normalizeProfile(
  profile: Partial<Profile> & {
    id: string;
    subscription_status: SubscriptionStatus;
  },
): Profile {
  return {
    id: profile.id,
    email: profile.email ?? null,
    full_name: profile.full_name ?? null,
    stripe_customer_id: profile.stripe_customer_id ?? null,
    subscription_status: profile.subscription_status,
    subscription_id: profile.subscription_id ?? null,
    price_id: profile.price_id ?? null,
    plan_id: profile.plan_id ?? "trial",
    trial_ends_at: profile.trial_ends_at ?? null,
    scans_used_this_period: profile.scans_used_this_period ?? 0,
    usage_period_start: profile.usage_period_start ?? new Date().toISOString(),
    created_at: profile.created_at ?? new Date().toISOString(),
    updated_at: profile.updated_at ?? new Date().toISOString(),
  };
}

function resolvePlanId(profile: Profile): PlanId {
  if (profile.price_id) {
    const fromPrice = getPlanByPriceId(profile.price_id);
    if (fromPrice) {
      return fromPrice.id;
    }
  }

  if (profile.plan_id === "starter" || profile.plan_id === "pro") {
    return profile.plan_id;
  }

  return "trial";
}

function isSubscriptionActive(status: SubscriptionStatus) {
  return status === "active" || status === "trialing";
}

function isTrialExpired(profile: Profile) {
  if (!profile.trial_ends_at) {
    return false;
  }

  return new Date(profile.trial_ends_at).getTime() < Date.now();
}

export function getBillingEntitlements(profile: Profile): BillingEntitlements {
  const normalized = normalizeProfile(profile);
  const planId = resolvePlanId(normalized);
  const plan = getPlanById(planId);
  const trialExpired =
    planId === "trial" &&
    isTrialExpired(normalized) &&
    !isSubscriptionActive(normalized.subscription_status);

  const isPaidPlan = planId === "starter" || planId === "pro";
  const isTrialing =
    normalized.subscription_status === "trialing" &&
    planId === "trial" &&
    !trialExpired;
  const isPaid =
    isPaidPlan && isSubscriptionActive(normalized.subscription_status);
  const isActive = isPaid || isTrialing;

  const scansLimit = isActive ? plan.limits.scansPerMonth : 0;
  const scansUsed = normalized.scans_used_this_period ?? 0;
  const scansRemaining =
    scansLimit === null ? null : Math.max(scansLimit - scansUsed, 0);

  const features = { ...plan.features };

  if (!isActive) {
    (Object.keys(features) as BillingFeature[]).forEach((feature) => {
      features[feature] = false;
    });
  }

  if (trialExpired && !isPaid) {
    features.unlimited_scans = false;
  }

  return {
    planId,
    planName: plan.name,
    isPaid,
    isTrialing,
    isActive,
    trialEndsAt: normalized.trial_ends_at,
    trialExpired,
    scansUsed,
    scansLimit,
    scansRemaining,
    features,
    teamMemberLimit: isActive ? plan.limits.teamMembers : 1,
  };
}

export function hasFeature(
  profile: Profile,
  feature: BillingFeature,
): boolean {
  return getBillingEntitlements(profile).features[feature];
}

export function canRunScan(profile: Profile): {
  allowed: boolean;
  reason?: string;
  entitlements: BillingEntitlements;
} {
  const entitlements = getBillingEntitlements(profile);

  if (!entitlements.isActive) {
    return {
      allowed: false,
      reason: "Your free trial has ended. Upgrade to continue scanning listings.",
      entitlements,
    };
  }

  if (entitlements.features.unlimited_scans) {
    return { allowed: true, entitlements };
  }

  if (
    entitlements.scansLimit !== null &&
    entitlements.scansUsed >= entitlements.scansLimit
  ) {
    return {
      allowed: false,
      reason: `You've used all ${entitlements.scansLimit} scans this month. Upgrade to Pro for unlimited scans.`,
      entitlements,
    };
  }

  return { allowed: true, entitlements };
}
