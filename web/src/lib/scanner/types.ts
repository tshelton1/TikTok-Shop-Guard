export type RuleSeverity = "high" | "medium" | "low";

export type ConditionType =
  | "title_regex"
  | "description_regex"
  | "combined_regex"
  | "restricted_claim"
  | "price_below_min"
  | "price_above_max"
  | "price_invalid"
  | "category_mismatch"
  | "title_min_length"
  | "description_min_length"
  | "image_filename_regex"
  | "image_count_below_min";

export type ConditionValue = {
  pattern?: string;
  flags?: string;
  min?: number;
  max?: number;
  keywords?: string[];
  disallowed_categories?: string[];
  expected_categories?: string[];
  rewrite_from?: string;
  rewrite_to?: string;
};

export type ListingScanRule = {
  id: string;
  shop_id: string | null;
  name: string;
  severity: RuleSeverity;
  condition_type: ConditionType;
  condition_value: ConditionValue;
  remediation_tip: string;
  active: boolean;
  blocks_publish: boolean;
};

export type ListingScanContext = {
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

export type SuggestedRewrite = {
  field: "title" | "description";
  original: string;
  suggested: string;
  reason: string;
};

export type ImageWarning = {
  image_name: string;
  message: string;
  rule_id: string;
};

export type ListingScanEngineResult = {
  id: string;
  shop_id: string;
  risk_score: number;
  severity_label: string;
  confidence_score: number;
  blocked: boolean;
  issues: ScanIssue[];
  suggested_rewrites: SuggestedRewrite[];
  image_warnings: ImageWarning[];
  scanned_at: string;
  rules_evaluated: number;
};
