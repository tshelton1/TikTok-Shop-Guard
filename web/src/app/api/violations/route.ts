import { NextResponse } from "next/server";

import { fetchViolations } from "@/lib/appeals/repository";
import { createClient } from "@/lib/supabase/server";

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

    const violations = await fetchViolations(shopId);

    return NextResponse.json({ violations });
  } catch (error) {
    console.error("List violations error:", error);
    return NextResponse.json({ error: "Failed to load violations" }, { status: 500 });
  }
}
