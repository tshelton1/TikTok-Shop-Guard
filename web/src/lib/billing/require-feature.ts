import { NextResponse } from "next/server";

import { canRunScan, hasFeature } from "@/lib/billing/entitlements";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getProfile } from "@/lib/supabase/server";
import type { BillingFeature } from "@/lib/stripe";
import type { Profile } from "@/types/database";

export async function requireProfile(): Promise<Profile | null> {
  return getProfile();
}

export function featureDeniedResponse(
  feature: BillingFeature,
  message?: string,
) {
  const labels: Record<BillingFeature, string> = {
    unlimited_scans: "Unlimited scans",
    appeals: "Appeal generator",
    document_uploads: "Document uploads",
    alerts: "Alerts",
    team_members: "Team members",
  };

  return NextResponse.json(
    {
      error: message ?? `${labels[feature]} requires a paid plan.`,
      code: "UPGRADE_REQUIRED",
      feature,
    },
    { status: 402 },
  );
}

export async function requireFeature(feature: BillingFeature) {
  const profile = await requireProfile();

  if (!profile) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!hasFeature(profile, feature)) {
    return { error: featureDeniedResponse(feature) };
  }

  return { profile };
}

export async function requireScanAccess() {
  const profile = await requireProfile();

  if (!profile) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const access = canRunScan(profile);

  if (!access.allowed) {
    return {
      error: NextResponse.json(
        {
          error: access.reason ?? "Scan limit reached.",
          code: "UPGRADE_REQUIRED",
          feature: "unlimited_scans",
          entitlements: {
            scansUsed: access.entitlements.scansUsed,
            scansLimit: access.entitlements.scansLimit,
            scansRemaining: access.entitlements.scansRemaining,
          },
        },
        { status: 402 },
      ),
    };
  }

  return { profile, entitlements: access.entitlements };
}

export async function incrementScanUsage(userId: string) {
  const admin = createAdminClient();
  await admin.rpc("increment_scan_usage", { p_user_id: userId });
}

export async function countShopMembers(shopId: string): Promise<number> {
  if (shopId.startsWith("shop-")) {
    return 1;
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("shop_members")
    .select("*", { count: "exact", head: true })
    .eq("shop_id", shopId)
    .eq("status", "active");

  return count ?? 0;
}
