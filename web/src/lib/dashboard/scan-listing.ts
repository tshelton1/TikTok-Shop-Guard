import {
  getMockScanHistory,
  isMockShopId,
} from "@/lib/mock-data";
import {
  mapApiResult,
  type ListingScanApiResult,
  type ListingScanHistoryEntry,
  type ListingScanInput,
  type ListingScanResult,
} from "@/types/listing-scan";

export async function scanListingViaApi(
  input: ListingScanInput,
): Promise<ListingScanResult> {
  const response = await fetch("/api/scans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shop_id: input.shopId,
      title: input.title,
      description: input.description,
      price: input.price,
      category: input.category,
      image_names: input.imageNames,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Scan failed");
  }

  return mapApiResult(data as ListingScanApiResult, input);
}

export async function getListingScanHistory(
  shopId: string,
): Promise<ListingScanHistoryEntry[]> {
  if (isMockShopId(shopId)) {
    return getMockScanHistory(shopId);
  }
  return [];
}

export function resultToHistoryEntry(
  result: ListingScanResult,
): ListingScanHistoryEntry {
  return {
    id: result.id,
    shopId: result.shopId,
    listingTitle: result.input.title,
    category: result.input.category,
    riskScore: result.riskScore,
    severityLabel: result.severityLabel,
    issueCount: result.issues.length,
    blocked: result.blocked,
    scannedAt: result.scannedAt,
  };
}
