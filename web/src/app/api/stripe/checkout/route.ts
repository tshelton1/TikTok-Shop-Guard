import { NextResponse } from "next/server";

import { ensureBillingProfile } from "@/lib/billing/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPlanByPriceId, getStripe } from "@/lib/stripe";
import { getURL } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { priceId, planId } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: "Price ID is required" }, { status: 400 });
    }

    const plan = getPlanByPriceId(priceId);
    if (!plan) {
      return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stripe = getStripe();

    let profile = await ensureBillingProfile(
      user.id,
      user.email,
      user.user_metadata?.full_name,
    );

    if (!profile) {
      const { data } = await supabase
        .from("profiles")
        .select("stripe_customer_id, email, full_name, subscription_status, price_id")
        .eq("id", user.id)
        .maybeSingle();
      profile = data as typeof profile;
    }

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email ?? undefined,
        name: profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });

      customerId = customer.id;

      const admin = createAdminClient();
      await admin.rpc("update_profile_billing", {
        p_user_id: user.id,
        p_stripe_customer_id: customerId,
      });
    }

    const hadPaidSubscription =
      profile?.subscription_status === "active" ||
      profile?.subscription_status === "trialing" ||
      Boolean(profile?.price_id);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${getURL()}/dashboard/settings?checkout=success&plan=${planId ?? plan.id}`,
      cancel_url: `${getURL()}/pricing?checkout=canceled`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_id: planId ?? plan.id,
        },
        trial_period_days:
          !hadPaidSubscription && plan.trialDays ? plan.trialDays : undefined,
      },
      metadata: {
        supabase_user_id: user.id,
        plan_id: planId ?? plan.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
