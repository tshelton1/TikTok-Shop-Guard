import { NextResponse } from "next/server";

import { requireFeature } from "@/lib/billing/require-feature";
import {
  fetchAppeals,
  saveAppealDraft,
} from "@/lib/appeals/repository";
import type { EvidenceChecklistItem, SaveAppealPayload, SupportingDocPlan } from "@/types/appeals";
import { createClient } from "@/lib/supabase/server";

function isValidPayload(body: unknown): body is SaveAppealPayload {
  if (!body || typeof body !== "object") return false;
  const v = body as Record<string, unknown>;
  return (
    typeof v.shop_id === "string" &&
    typeof v.violation_id === "string" &&
    typeof v.issue_category === "string" &&
    typeof v.recommended_response === "string" &&
    typeof v.draft_message === "string" &&
    Array.isArray(v.evidence_checklist) &&
    Array.isArray(v.supporting_docs)
  );
}

async function verifyShopAccess(shopId: string, userId: string) {
  if (shopId.startsWith("shop-")) {
    return true;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("shop_members")
    .select("shop_id")
    .eq("shop_id", shopId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  return Boolean(data);
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shopId = new URL(request.url).searchParams.get("shop_id");

    if (!shopId) {
      return NextResponse.json({ error: "shop_id is required" }, { status: 400 });
    }

    const allowed = await verifyShopAccess(shopId, user.id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const appeals = await fetchAppeals(shopId);

    return NextResponse.json({ appeals });
  } catch (error) {
    console.error("List appeals error:", error);
    return NextResponse.json({ error: "Failed to load appeals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();

    if (!isValidPayload(body)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const isMockShop = body.shop_id.startsWith("shop-");

    if (!isMockShop) {
      const featureCheck = await requireFeature("appeals");
      if ("error" in featureCheck && featureCheck.error) {
        return featureCheck.error;
      }
    }

    const allowed = await verifyShopAccess(body.shop_id, user.id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload: SaveAppealPayload = {
      shop_id: body.shop_id,
      violation_id: body.violation_id,
      issue_category: body.issue_category,
      recommended_response: body.recommended_response,
      evidence_checklist: body.evidence_checklist as EvidenceChecklistItem[],
      draft_message: body.draft_message,
      deadline_at: body.deadline_at ?? null,
      supporting_docs_notes: body.supporting_docs_notes ?? "",
      supporting_docs: body.supporting_docs as SupportingDocPlan[],
    };

    const result = await saveAppealDraft(user.id, payload);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Save appeal error:", error);
    return NextResponse.json({ error: "Failed to save appeal" }, { status: 500 });
  }
}
