/**
 * @deprecated Import from `@/lib/mock-data` instead.
 * Re-exports kept for appeals and scan modules not yet migrated.
 */
export {
  getMockAppeals as getSampleAppeals,
  getMockOverview as getSampleOverview,
  getMockScanHistory as getSampleScanHistory,
  getMockViolations as getSampleViolations,
  isMockShopId as isSampleShopId,
  MOCK_APPEALS as SAMPLE_APPEALS,
  MOCK_SCAN_HISTORY as SAMPLE_SCAN_HISTORY,
  MOCK_SHOPS as SAMPLE_SHOPS,
  MOCK_VIOLATIONS as SAMPLE_VIOLATIONS,
} from "@/lib/mock-data";

import { MOCK_VIOLATIONS } from "@/lib/mock-data";

export function getSampleViolationById(id: string) {
  return MOCK_VIOLATIONS.find((v) => v.id === id) ?? null;
}
