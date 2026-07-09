export type ListingCategory =
  | "beauty"
  | "electronics"
  | "home"
  | "fashion"
  | "health"
  | "food"
  | "other";

export type IssueSeverity = "high" | "medium" | "low";

export type ListingScanInput = {
  shopId: string;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  imageNames: string[];
};

export type ListingScanIssue = {
  id: string;
  ruleId: string;
  severity: IssueSeverity;
  title: string;
  detail: string;
  remediationTip: string;
  blocksPublish: boolean;
  matchedValue?: string;
};

export type SuggestedRewrite = {
  field: "title" | "description";
  original: string;
  suggested: string;
  reason: string;
};

export type ImageWarning = {
  imageName: string;
  message: string;
  ruleId: string;
};

/** API / engine response shape (snake_case from server). */
export type ListingScanApiResult = {
  id: string;
  shop_id: string;
  risk_score: number;
  severity_label: string;
  confidence: number;
  confidence_score: number;
  blocked: boolean;
  issues: Array<{
    rule_id: string;
    rule_name: string;
    severity: IssueSeverity;
    condition_type: string;
    message: string;
    remediation_tip: string;
    blocks_publish: boolean;
    matched_value?: string;
  }>;
  suggested_rewrites: SuggestedRewrite[];
  image_warnings: Array<{
    image_name: string;
    message: string;
    rule_id: string;
  }>;
  scanned_at: string;
  rules_evaluated: number;
};

/** UI-friendly result after mapping from API. */
export type ListingScanResult = {
  id: string;
  shopId: string;
  riskScore: number;
  severityLabel: string;
  confidenceScore: number;
  blocked: boolean;
  issues: ListingScanIssue[];
  suggestedRewrites: SuggestedRewrite[];
  imageWarnings: ImageWarning[];
  scannedAt: string;
  rulesEvaluated: number;
  input: ListingScanInput;
};

export type ListingScanHistoryEntry = {
  id: string;
  shopId: string;
  listingTitle: string;
  category: ListingCategory;
  riskScore: number;
  severityLabel: string;
  issueCount: number;
  blocked: boolean;
  scannedAt: string;
};

export const LISTING_CATEGORIES: { value: ListingCategory; label: string }[] = [
  { value: "beauty", label: "Beauty & Personal Care" },
  { value: "electronics", label: "Electronics" },
  { value: "home", label: "Home & Living" },
  { value: "fashion", label: "Fashion" },
  { value: "health", label: "Health & Wellness" },
  { value: "food", label: "Food & Beverage" },
  { value: "other", label: "Other" },
];

export function mapApiResult(
  api: ListingScanApiResult,
  input: ListingScanInput,
): ListingScanResult {
  return {
    id: api.id,
    shopId: api.shop_id,
    riskScore: api.risk_score,
    severityLabel: api.severity_label,
    confidenceScore: api.confidence_score ?? api.confidence,
    blocked: api.blocked,
    issues: api.issues.map((issue, index) => ({
      id: `${api.id}-issue-${index}`,
      ruleId: issue.rule_id,
      severity: issue.severity,
      title: issue.rule_name,
      detail: issue.message,
      remediationTip: issue.remediation_tip,
      blocksPublish: issue.blocks_publish,
      matchedValue: issue.matched_value,
    })),
    suggestedRewrites: api.suggested_rewrites,
    imageWarnings: api.image_warnings.map((warning) => ({
      imageName: warning.image_name,
      message: warning.message,
      ruleId: warning.rule_id,
    })),
    scannedAt: api.scanned_at,
    rulesEvaluated: api.rules_evaluated,
    input,
  };
}
