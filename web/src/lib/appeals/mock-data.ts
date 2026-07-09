import type { AppealRecord, ViolationRecord } from "@/types/appeals";
import {
  getSampleAppeals,
  getSampleViolationById,
  getSampleViolations,
} from "@/lib/sample-data";

export async function getViolations(shopId?: string): Promise<ViolationRecord[]> {
  return getSampleViolations(shopId);
}

export async function getViolationById(
  id: string,
): Promise<ViolationRecord | null> {
  return getSampleViolationById(id);
}

export async function getAppeals(shopId?: string): Promise<AppealRecord[]> {
  return getSampleAppeals(shopId);
}

// Re-export for backwards compatibility
export { SAMPLE_VIOLATIONS as MOCK_VIOLATIONS } from "@/lib/sample-data";
