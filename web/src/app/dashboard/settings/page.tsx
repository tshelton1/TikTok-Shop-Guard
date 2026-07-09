import { Suspense } from "react";

import { CheckoutSuccessBanner } from "@/components/billing/checkout-success-banner";
import { FeatureAccessCard } from "@/components/billing/feature-access-card";
import { PlanUsageCard } from "@/components/billing/plan-usage-card";
import { TeamMembersCard } from "@/components/billing/team-members-card";
import { SubscriptionCard } from "@/components/dashboard/subscription-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServerEntitlements } from "@/lib/billing/server";
import { createClient, getProfile, getUser, getUserProfile } from "@/lib/supabase/server";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await getUser();
  const userProfile = await getUserProfile();
  const profile = await getProfile();
  const entitlements = await getServerEntitlements();

  let teamMemberCount = 1;

  if (user) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("shop_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (count !== null) {
      teamMemberCount = count;
    }
  }

  return (
    <>
      <Suspense fallback={null}>
        <CheckoutSuccessBanner />
      </Suspense>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, subscription, and feature access.
        </p>
      </div>

      <div className="grid max-w-4xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your signed-in profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-4">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium text-foreground">
                  {userProfile?.email ?? user?.email}
                </dd>
              </div>
              {userProfile?.full_name && (
                <div className="flex justify-between border-b pb-4">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium text-foreground">
                    {userProfile.full_name}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {entitlements ? (
          <>
            <PlanUsageCard entitlements={entitlements} />

            <SubscriptionCard
              status={profile?.subscription_status ?? "inactive"}
              planName={entitlements.planName}
              trialEndsAt={profile?.trial_ends_at}
              isPaid={entitlements.isPaid}
            />

            <FeatureAccessCard entitlements={entitlements} />

            <TeamMembersCard
              enabled={entitlements.features.team_members}
              memberCount={teamMemberCount}
              memberLimit={entitlements.teamMemberLimit}
            />
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Billing unavailable</CardTitle>
              <CardDescription>
                We couldn&apos;t load your subscription details. Refresh the page or
                check that billing migrations have been applied.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </>
  );
}
