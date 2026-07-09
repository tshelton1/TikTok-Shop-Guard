export type ScanStatus = "queued" | "running" | "succeeded" | "failed";

export type ViolationSeverity = "high" | "medium" | "low";

export type DeadlineType = "appeal" | "remediation" | "policy_update";

export type DashboardShop = {
  id: string;
  name: string;
  platform: string;
};

export type DashboardStats = {
  totalScans: number;
  highRiskListings: number;
  openViolations: number;
  pendingAppeals: number;
};

export type RecentScan = {
  id: string;
  shopId: string;
  /** Human-readable label — listing title or scan name from DB */
  label?: string;
  type: string;
  status: ScanStatus;
  startedAt: string;
  completedAt: string | null;
  issuesFound: number;
  riskScore?: number | null;
};

export type OpenViolation = {
  id: string;
  shopId: string;
  listingTitle: string;
  severity: ViolationSeverity;
  title: string;
  category?: string;
  detectedAt: string;
  appealDeadlineAt?: string | null;
};

export type UpcomingDeadline = {
  id: string;
  shopId: string;
  title: string;
  description: string;
  dueAt: string;
  type: DeadlineType;
  isUrgent: boolean;
  dueLabel: string;
};

export type DashboardOverview = {
  shop: DashboardShop;
  stats: DashboardStats;
  recentScans: RecentScan[];
  openViolations: OpenViolation[];
  upcomingDeadlines: UpcomingDeadline[];
};

export type AccountStatus = {
  status: string;
  planName?: string;
  isActive: boolean;
  isTrialing?: boolean;
  trialEndsAt?: string | null;
};
