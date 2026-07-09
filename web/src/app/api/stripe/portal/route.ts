import { NextResponse } from "next/server";

import { ensureBillingProfile } from "@/lib/billing/profile";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { getURL } from "@/lib/utils";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await ensureBillingProfile(
      user.id,
      user.email,
      user.user_metadata?.full_name,
    );

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found. Subscribe to a plan first." },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${getURL()}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
}
