import { NextResponse } from "next/server";

import { requireFeature } from "@/lib/billing/require-feature";
import { ensureAppealDraft } from "@/lib/appeals/repository";
import { createClient } from "@/lib/supabase/server";

type DraftRequestBody = {
  shop_id: string;
  violation_id: string;
  issue_category?: string;
  recommended_response?: string;
  deadline_at?: string | null;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as DraftRequestBody;

    if (!body.shop_id || !body.violation_id) {
      return NextResponse.json(
        { error: "Missing shop_id or violation_id" },
        { status: 400 },
      );
    }

    const isMockShop = body.shop_id.startsWith("shop-");

    if (!isMockShop) {
      const featureCheck = await requireFeature("appeals");
      if ("error" in featureCheck && featureCheck.error) {
        return featureCheck.error;
      }

      const { data: membership } = await supabase
        .from("shop_members")
        .select("shop_id")
        .eq("shop_id", body.shop_id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const appeal = await ensureAppealDraft(user.id, {
      shop_id: body.shop_id,
      violation_id: body.violation_id,
      issue_category: body.issue_category ?? null,
      recommended_response: body.recommended_response ?? null,
      deadline_at: body.deadline_at ?? null,
    });

    return NextResponse.json({ appeal_id: appeal.id });
  } catch (error) {
    console.error("Ensure appeal draft error:", error);
    return NextResponse.json({ error: "Failed to create appeal draft" }, { status: 500 });
  }
}
