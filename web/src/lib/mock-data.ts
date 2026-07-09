import type { AppealRecord, ViolationRecord } from "@/types/appeals";
import type {
  DashboardOverview,
  DashboardShop,
  DashboardStats,
  OpenViolation,
  RecentScan,
  UpcomingDeadline,
  ViolationSeverity,
} from "@/types/dashboard";
import type { ListingScanHistoryEntry } from "@/types/listing-scan";

/**
 * Mock shop fixtures. Replace `getMockOverview` with Supabase queries per shop_id.
 */
export const MOCK_SHOPS: DashboardShop[] = [
  { id: "shop-1", name: "Glow Beauty Co.", platform: "tiktok_shop" },
  { id: "shop-2", name: "Urban Essentials", platform: "tiktok_shop" },
];

/** Default demo shop for pilot onboarding — shows rich sample data on first visit. */
export const PILOT_DEMO_SHOP_ID = "shop-1";

const MOCK_STATS: Record<string, DashboardStats> = {
  "shop-1": {
    totalScans: 48,
    highRiskListings: 7,
    openViolations: 3,
    pendingAppeals: 1,
  },
  "shop-2": {
    totalScans: 31,
    highRiskListings: 4,
    openViolations: 1,
    pendingAppeals: 0,
  },
};

const MOCK_SCANS: RecentScan[] = [
  {
    id: "scan-101",
    shopId: "shop-1",
    label: "Vitamin C Brightening Serum",
    type: "Listing scan",
    status: "succeeded",
    startedAt: "2026-07-08T14:30:00Z",
    completedAt: "2026-07-08T14:42:00Z",
    issuesFound: 5,
    riskScore: 72,
  },
  {
    id: "scan-102",
    shopId: "shop-1",
    label: "Wireless Earbuds Pro",
    type: "Listing scan",
    status: "succeeded",
    startedAt: "2026-07-07T09:15:00Z",
    completedAt: "2026-07-07T09:18:00Z",
    issuesFound: 2,
    riskScore: 38,
  },
  {
    id: "scan-103",
    shopId: "shop-1",
    label: "Organic Face Mask 5-Pack",
    type: "Bulk scan",
    status: "running",
    startedAt: "2026-07-09T12:00:00Z",
    completedAt: null,
    issuesFound: 0,
    riskScore: null,
  },
  {
    id: "scan-104",
    shopId: "shop-1",
    label: "Hydrating Lip Balm Set",
    type: "Listing scan",
    status: "succeeded",
    startedAt: "2026-07-05T11:20:00Z",
    completedAt: "2026-07-05T11:24:00Z",
    issuesFound: 1,
    riskScore: 24,
  },
  {
    id: "scan-201",
    shopId: "shop-2",
    label: "Bluetooth Speaker Mini",
    type: "Listing scan",
    status: "succeeded",
    startedAt: "2026-07-06T16:00:00Z",
    completedAt: "2026-07-06T16:11:00Z",
    issuesFound: 3,
    riskScore: 55,
  },
  {
    id: "scan-202",
    shopId: "shop-2",
    label: "Organic Protein Powder",
    type: "Listing scan",
    status: "queued",
    startedAt: "2026-07-09T08:00:00Z",
    completedAt: null,
    issuesFound: 0,
    riskScore: null,
  },
];

export const MOCK_VIOLATIONS: ViolationRecord[] = [
  {
    id: "vio-001",
    shop_id: "shop-1",
    shop_name: "Glow Beauty Co.",
    listing_title: "Vitamin C Brightening Serum",
    title: "Unsubstantiated health claim",
    details:
      "Listing description includes language implying the product cures or treats skin conditions.",
    issue_category: "Health & Medical Claims",
    severity: 5,
    status: "open",
    detected_at: "2026-07-08T14:42:00Z",
    appeal_deadline_at: "2026-07-15T23:59:00Z",
  },
  {
    id: "vio-002",
    shop_id: "shop-1",
    shop_name: "Glow Beauty Co.",
    listing_title: "Wireless Earbuds Pro",
    title: "Missing CE certification reference",
    details: "Electronics listing does not reference required certification details.",
    issue_category: "Product Certification",
    severity: 3,
    status: "open",
    detected_at: "2026-07-07T09:18:00Z",
    appeal_deadline_at: "2026-07-12T17:00:00Z",
  },
  {
    id: "vio-003",
    shop_id: "shop-1",
    shop_name: "Glow Beauty Co.",
    listing_title: "Organic Face Mask 5-Pack",
    title: "Promotional text on product image",
    details: "Product images include promotional text overlays.",
    issue_category: "Image & Media Policy",
    severity: 2,
    status: "open",
    detected_at: "2026-07-06T11:00:00Z",
    appeal_deadline_at: "2026-07-14T23:59:00Z",
  },
  {
    id: "vio-004",
    shop_id: "shop-2",
    shop_name: "Urban Essentials",
    listing_title: "Bluetooth Speaker Mini",
    title: "Category mismatch",
    details: "Listing keywords do not match the selected category.",
    issue_category: "Category & Listing Accuracy",
    severity: 3,
    status: "open",
    detected_at: "2026-07-05T16:30:00Z",
    appeal_deadline_at: "2026-07-11T23:59:00Z",
  },
];

export const MOCK_APPEALS: AppealRecord[] = [
  {
    id: "appeal-001",
    shop_id: "shop-1",
    violation_id: "vio-002",
    status: "draft",
    issue_category: "Product Certification",
    recommended_response:
      "Provide supplier certification documents and update listing copy.",
    evidence_checklist: [],
    draft_message:
      "We have updated our listing to include CE certification references.",
    deadline_at: "2026-07-12T17:00:00Z",
    supporting_docs_notes: "CE certificate attached.",
    reason: "Certification documentation provided",
    notes: null,
    created_at: "2026-07-07T10:00:00Z",
    updated_at: "2026-07-08T09:30:00Z",
  },
];

const MOCK_DEADLINES_RAW = [
  {
    id: "dead-1",
    shopId: "shop-1",
    title: "Appeal response due",
    description: "Vitamin C Brightening Serum — health claim violation",
    dueAt: "2026-07-15T23:59:00Z",
    type: "appeal" as const,
  },
  {
    id: "dead-2",
    shopId: "shop-1",
    title: "Remediate listing copy",
    description: "Wireless Earbuds Pro — add certification details",
    dueAt: "2026-07-12T17:00:00Z",
    type: "remediation" as const,
  },
  {
    id: "dead-3",
    shopId: "shop-1",
    title: "New category policy effective",
    description: "Beauty & Personal Care updated requirements",
    dueAt: "2026-07-15T00:00:00Z",
    type: "policy_update" as const,
  },
  {
    id: "dead-4",
    shopId: "shop-2",
    title: "Appeal response due",
    description: "Bluetooth Speaker Mini — category mismatch",
    dueAt: "2026-07-11T23:59:00Z",
    type: "appeal" as const,
  },
];

export const MOCK_SCAN_HISTORY: ListingScanHistoryEntry[] = [
  {
    id: "lst-001",
    shopId: "shop-1",
    listingTitle: "Vitamin C Brightening Serum",
    category: "beauty",
    riskScore: 72,
    severityLabel: "High",
    issueCount: 4,
    blocked: true,
    scannedAt: "2026-07-08T14:30:00Z",
  },
  {
    id: "lst-002",
    shopId: "shop-1",
    listingTitle: "Wireless Earbuds Pro",
    category: "electronics",
    riskScore: 38,
    severityLabel: "Low",
    issueCount: 2,
    blocked: false,
    scannedAt: "2026-07-07T10:15:00Z",
  },
  {
    id: "lst-003",
    shopId: "shop-2",
    listingTitle: "Organic Protein Powder",
    category: "health",
    riskScore: 55,
    severityLabel: "Medium",
    issueCount: 3,
    blocked: false,
    scannedAt: "2026-07-06T16:45:00Z",
  },
];

function formatDueLabel(dueAt: string, now: number): string {
  const date = new Date(dueAt);
  const diffDays = Math.ceil((date.getTime() - now) / (1000 * 60 * 60 * 24));
  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  if (diffDays < 0) return `${formatted} · overdue`;
  if (diffDays === 0) return `${formatted} · today`;
  if (diffDays === 1) return `${formatted} · tomorrow`;
  return `${formatted} · ${diffDays} days`;
}

function enrichDeadline(
  deadline: (typeof MOCK_DEADLINES_RAW)[number],
  now: number,
): UpcomingDeadline {
  const dueTime = new Date(deadline.dueAt).getTime();
  return {
    ...deadline,
    isUrgent: dueTime - now < 2 * 24 * 60 * 60 * 1000,
    dueLabel: formatDueLabel(deadline.dueAt, now),
  };
}

function severityFromScore(score: number): ViolationSeverity {
  if (score >= 4) return "high";
  if (score >= 3) return "medium";
  return "low";
}

function toOpenViolation(violation: ViolationRecord): OpenViolation {
  return {
    id: violation.id,
    shopId: violation.shop_id,
    listingTitle: violation.listing_title ?? "—",
    severity: severityFromScore(violation.severity),
    title: violation.title,
    category: violation.issue_category,
    detectedAt: violation.detected_at,
    appealDeadlineAt: violation.appeal_deadline_at,
  };
}

export function isMockShopId(shopId: string) {
  return shopId.startsWith("shop-");
}

/** @deprecated Use isMockShopId */
export const isSampleShopId = isMockShopId;

/**
 * Returns mock overview data for a shop. Swap this implementation for
 * `supabase.from(...)` queries keyed by shop_id.
 */
export function getMockOverview(shopId: string): DashboardOverview | null {
  const shop = MOCK_SHOPS.find((entry) => entry.id === shopId);
  if (!shop) return null;

  const now = Date.now();
  const violations = MOCK_VIOLATIONS.filter((v) => v.shop_id === shopId);

  return {
    shop,
    stats: MOCK_STATS[shopId] ?? {
      totalScans: 0,
      highRiskListings: 0,
      openViolations: 0,
      pendingAppeals: 0,
    },
    recentScans: MOCK_SCANS.filter((scan) => scan.shopId === shopId),
    openViolations: violations.map(toOpenViolation),
    upcomingDeadlines: MOCK_DEADLINES_RAW.filter(
      (deadline) => deadline.shopId === shopId,
    ).map((deadline) => enrichDeadline(deadline, now)),
  };
}

export function getMockScanHistory(shopId: string) {
  return MOCK_SCAN_HISTORY.filter((entry) => entry.shopId === shopId);
}

export function getMockViolations(shopId?: string) {
  if (shopId) {
    return MOCK_VIOLATIONS.filter((v) => v.shop_id === shopId);
  }
  return MOCK_VIOLATIONS;
}

export function getMockAppeals(shopId?: string) {
  if (shopId) {
    return MOCK_APPEALS.filter((a) => a.shop_id === shopId);
  }
  return MOCK_APPEALS;
}
