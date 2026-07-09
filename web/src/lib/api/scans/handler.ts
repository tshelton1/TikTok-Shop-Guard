import { NextResponse } from "next/server";

import {
  incrementScanUsage,
  requireScanAccess,
} from "@/lib/billing/require-feature";
import { runListingScan } from "@/lib/scan/rules-engine";
import type { ScanContext } from "@/lib/scan/types";
import { createClient } from "@/lib/supabase/server";

export type ScanRequestBody = {
  shop_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_names?: string[];
};

export function isValidScanBody(body: unknown): body is ScanRequestBody {
  if (!body || typeof body !== "object") return false;
  const value = body as Record<string, unknown>;
  return (
    typeof value.shop_id === "string" &&
    value.shop_id.length > 0 &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.price === "number" &&
    Number.isFinite(value.price) &&
    value.price >= 0 &&
    typeof value.category === "string" &&
    value.category.length > 0
  );
}

/**
 * Validates auth, shop access, and billing; runs the policy rules engine.
 */
export async function handleListingScan(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();

    if (!isValidScanBody(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    if (body.image_names && body.image_names.length > 3) {
      return NextResponse.json(
        { error: "Maximum 3 images allowed" },
        { status: 400 },
      );
    }

    const isMockShop = body.shop_id.startsWith("shop-");

    if (!isMockShop) {
      const { data: membership } = await supabase
        .from("shop_members")
        .select("shop_id")
        .eq("shop_id", body.shop_id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!membership) {
        return NextResponse.json(
          { error: "You do not have access to this shop" },
          { status: 403 },
        );
      }

      const scanAccess = await requireScanAccess();
      if ("error" in scanAccess && scanAccess.error) {
        return scanAccess.error;
      }
    }

    const context: ScanContext = {
      shop_id: body.shop_id,
      title: body.title.trim(),
      description: body.description.trim(),
      price: body.price,
      category: body.category,
      image_names: body.image_names ?? [],
    };

    if (!context.title || !context.description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 },
      );
    }

    const result = await runListingScan(context);

    try {
      if (!isMockShop) {
        await incrementScanUsage(user.id);
      }
    } catch {
      // Non-fatal when billing tables are not configured yet.
    }

    // TODO: persist scan result to violation_scans + violations tables
    return NextResponse.json(result);
  } catch (error) {
    console.error("Listing scan error:", error);
    return NextResponse.json(
      { error: "Failed to run listing scan" },
      { status: 500 },
    );
  }
}
