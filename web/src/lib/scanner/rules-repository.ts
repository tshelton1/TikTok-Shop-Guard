import { createClient } from "@/lib/supabase/server";
import { DEFAULT_LISTING_SCAN_RULES } from "@/lib/scanner/default-rules";
import type { ListingScanRule } from "@/lib/scanner/types";

type DbRule = {
  id: string;
  shop_id: string | null;
  name: string;
  severity: string;
  condition_type: string;
  condition_value: Record<string, unknown>;
  remediation_tip: string;
  active: boolean;
  blocks_publish: boolean;
};

function mapDbRule(row: DbRule): ListingScanRule {
  return {
    id: row.id,
    shop_id: row.shop_id,
    name: row.name,
    severity: row.severity as ListingScanRule["severity"],
    condition_type: row.condition_type as ListingScanRule["condition_type"],
    condition_value: row.condition_value,
    remediation_tip: row.remediation_tip,
    active: row.active,
    blocks_publish: row.blocks_publish,
  };
}

/**
 * Loads active rules for a shop: global rules + shop-specific overrides.
 * Falls back to in-code defaults when DB is empty or unreachable.
 */
export async function getListingScanRules(
  shopId: string,
): Promise<ListingScanRule[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("listing_scan_rules")
      .select("*")
      .eq("active", true)
      .or(`shop_id.is.null,shop_id.eq.${shopId}`)
      .order("severity", { ascending: true });

    if (error || !data?.length) {
      return DEFAULT_LISTING_SCAN_RULES;
    }

    return data.map((row) => mapDbRule(row as DbRule));
  } catch {
    return DEFAULT_LISTING_SCAN_RULES;
  }
}
