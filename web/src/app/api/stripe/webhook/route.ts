import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanByPriceId, getStripe, mapStripeSubscriptionStatus } from "@/lib/stripe";

async function updateProfileFromSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.supabase_user_id;

  if (!userId) return;

  const priceId = subscription.items.data[0]?.price.id ?? null;
  const planFromPrice = priceId ? getPlanByPriceId(priceId) : null;
  const planId =
    (subscription.metadata.plan_id as "starter" | "pro" | undefined) ??
    planFromPrice?.id ??
    null;

  const supabase = createAdminClient();

  if (subscription.status === "canceled") {
    await supabase.rpc("update_profile_billing", {
      p_user_id: userId,
      p_subscription_status: "inactive",
      p_subscription_id: null,
      p_price_id: null,
      p_plan_id: "trial",
    });
    return;
  }

  await supabase.rpc("update_profile_billing", {
    p_user_id: userId,
    p_subscription_status: mapStripeSubscriptionStatus(subscription.status),
    p_subscription_id: subscription.id,
    p_price_id: priceId,
    p_plan_id: planId,
    p_trial_ends_at:
      subscription.status === "trialing" && subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          await updateProfileFromSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await updateProfileFromSubscription(subscription);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
