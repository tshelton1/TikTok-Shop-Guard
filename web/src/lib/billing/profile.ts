import type { BillingFeature } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

const DEFAULT_TRIAL_DAYS = 14;

/** Ensures a billing `profiles` row exists for the authenticated user. */
export async function ensureBillingProfile(
  userId: string,
  email?: string | null,
  fullName?: string | null,
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    return existing as Profile;
  }

  const admin = createAdminClient();
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + DEFAULT_TRIAL_DAYS);

  const { data: created, error } = await admin
    .from("profiles")
    .insert({
      id: userId,
      email: email ?? null,
      full_name: fullName ?? null,
      plan_id: "trial",
      subscription_status: "trialing",
      trial_ends_at: trialEnds.toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    console.error("ensureBillingProfile error:", error);
    return null;
  }

  return created as Profile;
}

export const FEATURE_LABELS: Record<BillingFeature, string> = {
  unlimited_scans: "Unlimited scans",
  appeals: "Appeal generator",
  document_uploads: "Document uploads",
  alerts: "Compliance alerts",
  team_members: "Team members",
};
