import { getBillingEntitlements } from "@/lib/billing/entitlements";
import { getProfile } from "@/lib/supabase/server";

export async function getServerEntitlements() {
  const profile = await getProfile();
  if (!profile) {
    return null;
  }

  return getBillingEntitlements(profile);
}
