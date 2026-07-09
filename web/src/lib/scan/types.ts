export type RuleSeverity = "high" | "medium" | "low";

/**
 * Supported rule condition types. Add new entries here and a matching branch in
 * `evaluateRule` inside rules-engine.ts.
 */
export type ConditionType =
  | "title_restricted_claim"
  | "description_restricted_claim"
  | "category_mismatch"
  | "price_pattern"
  | "image_text_warning";

export type ConditionValue = {
  /** Regex pattern for claim / image checks */
  pattern?: string;
  flags?: string;
  /** Minimum allowed price */
  min?: number;
  /** Maximum allowed price */
  max?: number;
  /** Price values ending with these suffixes are flagged (e.g. "99" → $19.99 bait) */
  suspicious_suffixes?: string[];
  /** Category mismatch: keywords that imply a different category */
  keywords?: string[];
  disallowed_categories?: string[];
  /** Rewrite helpers applied when a rule fires */
  rewrite_from?: string;
  rewrite_to?: string;
};

/** Row shape for `public.scan_rules` */
export type ScanRule = {
  id: string;
  name: string;
  severity: RuleSeverity;
  condition_type: ConditionType;
  condition_value: ConditionValue;
  remediation_tip: string;
  active: boolean;
  blocks_publish: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ScanContext = {
  shop_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_names: string[];
};

export type ScanIssue = {
  rule_id: string;
  rule_name: string;
  severity: RuleSeverity;
  condition_type: ConditionType;
  message: string;
  remediation_tip: string;
  blocks_publish: boolean;
  matched_value?: string;
};

export type ImageWarning = {
  image_name: string;
  message: string;
  rule_id: string;
};

export type SuggestedRewrite = {
  field: "title" | "description";
  original: string;
  suggested: string;
  reason: string;
};

/** Structured engine output returned by POST /api/scans */
export type ListingScanResult = {
  id: string;
  shop_id: string;
  risk_score: number;
  severity_label: string;
  confidence: number;
  blocked: boolean;
  issues: ScanIssue[];
  suggested_rewrites: SuggestedRewrite[];
  image_warnings: ImageWarning[];
  scanned_at: string;
  rules_evaluated: number;
};

/** @deprecated Alias for API handlers migrating from lib/scanner */
export type ListingScanContext = ScanContext;

/** @deprecated Alias for API handlers migrating from lib/scanner */
export type ListingScanEngineResult = ListingScanResult & {
  confidence_score: number;
};
