import { createClient } from "@/lib/supabase/server";

import type {
  ConditionType,
  ConditionValue,
  ImageWarning,
  ListingScanResult,
  RuleSeverity,
  ScanContext,
  ScanIssue,
  ScanRule,
  SuggestedRewrite,
} from "@/lib/scan/types";

// ---------------------------------------------------------------------------
// Default rules (used when DB is empty or unreachable)
// ---------------------------------------------------------------------------

export const DEFAULT_SCAN_RULES: ScanRule[] = [
  {
    id: "default-title-cure",
    name: "Medical cure claim in title",
    severity: "high",
    condition_type: "title_restricted_claim",
    condition_value: {
      pattern: "\\b(cure|cures|heal|heals|treats)\\b",
      flags: "i",
      rewrite_from: "\\b(cure|cures|heal|heals|treats)\\b",
      rewrite_to: "supports",
    },
    remediation_tip:
      'Remove medical cure language from the title. Use "supports" or "helps maintain" instead.',
    active: true,
    blocks_publish: true,
  },
  {
    id: "default-title-fda",
    name: "Unverified FDA claim in title",
    severity: "high",
    condition_type: "title_restricted_claim",
    condition_value: {
      pattern: "\\b(fda approved|fda-approved)\\b",
      flags: "i",
      rewrite_from: "\\b(FDA approved|FDA-approved)\\b",
      rewrite_to: "",
    },
    remediation_tip: "Do not reference FDA approval in the title without documented proof.",
    active: true,
    blocks_publish: true,
  },
  {
    id: "default-title-superlative",
    name: "Unsubstantiated superlative in title",
    severity: "medium",
    condition_type: "title_restricted_claim",
    condition_value: {
      pattern: "\\b(#1|best|top rated|miracle)\\b",
      flags: "i",
      rewrite_from: "\\b(#1|best|top rated|miracle)\\b",
      rewrite_to: "",
    },
    remediation_tip: "Remove superlatives from the title unless substantiated with proof.",
    active: true,
    blocks_publish: false,
  },
  {
    id: "default-desc-guarantee",
    name: "Absolute guarantee in description",
    severity: "medium",
    condition_type: "description_restricted_claim",
    condition_value: {
      pattern: "\\b(100%|guaranteed|guarantee|money back)\\b",
      flags: "i",
      rewrite_from: "\\b(guaranteed|100%)\\b",
      rewrite_to: "designed to",
    },
    remediation_tip:
      'Replace absolute guarantees with qualified statements such as "designed to" or "may help".',
    active: true,
    blocks_publish: false,
  },
  {
    id: "default-desc-health",
    name: "Restricted health outcome in description",
    severity: "high",
    condition_type: "description_restricted_claim",
    condition_value: {
      pattern: "\\b(weight loss|lose weight|fat burn|clinically proven)\\b",
      flags: "i",
    },
    remediation_tip:
      "Health outcome claims are restricted. Focus on product features and materials.",
    active: true,
    blocks_publish: true,
  },
  {
    id: "default-desc-short",
    name: "Description lacks detail",
    severity: "low",
    condition_type: "description_restricted_claim",
    condition_value: {
      pattern: "^.{0,49}$",
      flags: "s",
    },
    remediation_tip:
      "Add materials, usage instructions, and compliance-friendly product details (50+ characters).",
    active: true,
    blocks_publish: false,
  },
  {
    id: "default-cat-beauty",
    name: "Beauty keywords in wrong category",
    severity: "medium",
    condition_type: "category_mismatch",
    condition_value: {
      keywords: ["serum", "moisturizer", "skincare", "vitamin c", "spf", "lip balm"],
      disallowed_categories: ["electronics", "home", "fashion", "food"],
    },
    remediation_tip:
      "Move this listing to Beauty & Personal Care or remove beauty-specific terms.",
    active: true,
    blocks_publish: false,
  },
  {
    id: "default-cat-electronics",
    name: "Electronics keywords in wrong category",
    severity: "medium",
    condition_type: "category_mismatch",
    condition_value: {
      keywords: ["bluetooth", "earbuds", "charger", "watt", "usb-c", "wireless"],
      disallowed_categories: ["beauty", "food", "health", "fashion"],
    },
    remediation_tip:
      "Move this listing to Electronics or remove tech-specific terms.",
    active: true,
    blocks_publish: false,
  },
  {
    id: "default-price-invalid",
    name: "Invalid or zero price",
    severity: "high",
    condition_type: "price_pattern",
    condition_value: { min: 0.01 },
    remediation_tip: "Set a valid price greater than zero before publishing.",
    active: true,
    blocks_publish: true,
  },
  {
    id: "default-price-high",
    name: "Unusually high price",
    severity: "low",
    condition_type: "price_pattern",
    condition_value: { max: 500 },
    remediation_tip:
      "High-ticket items may require additional seller verification on TikTok Shop.",
    active: true,
    blocks_publish: false,
  },
  {
    id: "default-price-bait",
    name: "Suspicious charm pricing",
    severity: "medium",
    condition_type: "price_pattern",
    condition_value: { suspicious_suffixes: [".99", ".95", ".00"] },
    remediation_tip:
      "Charm pricing is allowed, but extremely low prices combined with bold claims may trigger manual review.",
    active: true,
    blocks_publish: false,
  },
  {
    id: "default-img-overlay",
    name: "Image text overlay indicator",
    severity: "medium",
    condition_type: "image_text_warning",
    condition_value: {
      pattern: "text|overlay|banner|promo|sale",
      flags: "i",
    },
    remediation_tip: "Use clean product photos without heavy promotional text overlays.",
    active: true,
    blocks_publish: false,
  },
  {
    id: "default-img-before-after",
    name: "Before/after image indicator",
    severity: "high",
    condition_type: "image_text_warning",
    condition_value: {
      pattern: "before.?after|results|transformation",
      flags: "i",
    },
    remediation_tip: "Avoid before/after imagery in beauty and health categories.",
    active: true,
    blocks_publish: false,
  },
  {
    id: "default-img-missing",
    name: "Missing product images",
    severity: "high",
    condition_type: "image_text_warning",
    condition_value: { min: 1 },
    remediation_tip: "Upload at least one clear product image before publishing.",
    active: true,
    blocks_publish: true,
  },
];

// ---------------------------------------------------------------------------
// Rule loading
// ---------------------------------------------------------------------------

type DbScanRule = {
  id: string;
  name: string;
  severity: string;
  condition_type: string;
  condition_value: Record<string, unknown>;
  remediation_tip: string;
  active: boolean;
  blocks_publish: boolean;
  created_at: string;
  updated_at: string;
};

function mapDbRule(row: DbScanRule): ScanRule {
  return {
    id: row.id,
    name: row.name,
    severity: row.severity as RuleSeverity,
    condition_type: row.condition_type as ConditionType,
    condition_value: row.condition_value as ConditionValue,
    remediation_tip: row.remediation_tip,
    active: row.active,
    blocks_publish: row.blocks_publish,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export type RuleLoadResult = {
  rules: ScanRule[];
  source: "database" | "defaults";
};

export async function loadScanRules(): Promise<RuleLoadResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("scan_rules")
      .select("*")
      .eq("active", true)
      .order("severity", { ascending: true });

    if (error || !data?.length) {
      return { rules: DEFAULT_SCAN_RULES, source: "defaults" };
    }

    return {
      rules: data.map((row) => mapDbRule(row as DbScanRule)),
      source: "database",
    };
  } catch {
    return { rules: DEFAULT_SCAN_RULES, source: "defaults" };
  }
}

export async function countActiveScanRules(): Promise<{
  count: number;
  source: RuleLoadResult["source"];
}> {
  const { rules, source } = await loadScanRules();
  return { count: rules.length, source };
}

// ---------------------------------------------------------------------------
// Rule evaluation
// ---------------------------------------------------------------------------

const SEVERITY_WEIGHT: Record<RuleSeverity, number> = {
  high: 22,
  medium: 12,
  low: 5,
};

function buildRegex(value: ConditionValue): RegExp | null {
  if (!value.pattern) return null;
  try {
    return new RegExp(value.pattern, value.flags ?? "i");
  } catch {
    return null;
  }
}

function firstMatch(text: string, regex: RegExp | null): string | undefined {
  if (!regex) return undefined;
  return text.match(regex)?.[0];
}

function buildIssue(rule: ScanRule, matchedValue?: string): ScanIssue {
  return {
    rule_id: rule.id,
    rule_name: rule.name,
    severity: rule.severity,
    condition_type: rule.condition_type,
    message: rule.name,
    remediation_tip: rule.remediation_tip,
    blocks_publish: rule.blocks_publish,
    matched_value: matchedValue,
  };
}

function evaluateTitleRestrictedClaim(
  rule: ScanRule,
  context: ScanContext,
): ScanIssue | null {
  const matched = firstMatch(context.title, buildRegex(rule.condition_value));
  if (!matched) return null;
  return buildIssue(rule, matched);
}

function evaluateDescriptionRestrictedClaim(
  rule: ScanRule,
  context: ScanContext,
): ScanIssue | null {
  const value = rule.condition_value;

  // Short-description check uses full-string pattern
  if (value.pattern === "^.{0,49}$") {
    if (context.description.length >= 50) return null;
    return buildIssue(rule, `${context.description.length} chars`);
  }

  const matched = firstMatch(context.description, buildRegex(value));
  if (!matched) return null;
  return buildIssue(rule, matched);
}

function evaluateCategoryMismatch(
  rule: ScanRule,
  context: ScanContext,
): ScanIssue | null {
  const { keywords = [], disallowed_categories = [] } = rule.condition_value;
  const haystack = `${context.title} ${context.description}`.toLowerCase();
  const matchedKeyword = keywords.find((keyword) =>
    haystack.includes(keyword.toLowerCase()),
  );

  if (!matchedKeyword || !disallowed_categories.includes(context.category)) {
    return null;
  }

  return buildIssue(rule, matchedKeyword);
}

function evaluatePricePattern(
  rule: ScanRule,
  context: ScanContext,
): ScanIssue | null {
  const { min, max, suspicious_suffixes = [] } = rule.condition_value;
  const priceStr = context.price.toFixed(2);

  if (min != null && context.price < min) {
    return buildIssue(rule, String(context.price));
  }

  if (max != null && context.price > max) {
    return buildIssue(rule, String(context.price));
  }

  if (suspicious_suffixes.length > 0) {
    const matchesCharmPrice = suspicious_suffixes.some((suffix) => {
      const normalized = suffix.startsWith(".") ? suffix : `.${suffix}`;
      return priceStr.endsWith(normalized);
    });
    const hasBoldClaims = /\b(free|miracle|guaranteed)\b/i.test(
      `${context.title} ${context.description}`,
    );

    if (matchesCharmPrice && hasBoldClaims && context.price < 25) {
      return buildIssue(rule, priceStr);
    }
  }

  return null;
}

function evaluateImageTextWarning(
  rule: ScanRule,
  context: ScanContext,
): ScanIssue | ImageWarning | null {
  const { min, pattern, flags } = rule.condition_value;

  if (min != null && context.image_names.length < min) {
    return {
      image_name: "—",
      message: rule.remediation_tip,
      rule_id: rule.id,
    };
  }

  if (!pattern) return null;

  const regex = buildRegex({ pattern, flags });
  if (!regex) return null;

  const matchedName = context.image_names.find((name) => regex.test(name));
  if (!matchedName) return null;

  return {
    image_name: matchedName,
    message: rule.remediation_tip,
    rule_id: rule.id,
  };
}

function evaluateRule(
  rule: ScanRule,
  context: ScanContext,
): ScanIssue | ImageWarning | null {
  switch (rule.condition_type) {
    case "title_restricted_claim":
      return evaluateTitleRestrictedClaim(rule, context);
    case "description_restricted_claim":
      return evaluateDescriptionRestrictedClaim(rule, context);
    case "category_mismatch":
      return evaluateCategoryMismatch(rule, context);
    case "price_pattern":
      return evaluatePricePattern(rule, context);
    case "image_text_warning":
      return evaluateImageTextWarning(rule, context);
    default:
      return null;
  }
}

export function evaluateScanRules(
  rules: ScanRule[],
  context: ScanContext,
): {
  issues: ScanIssue[];
  image_warnings: ImageWarning[];
  rules_evaluated: number;
} {
  const activeRules = rules.filter((rule) => rule.active);
  const issues: ScanIssue[] = [];
  const image_warnings: ImageWarning[] = [];

  for (const rule of activeRules) {
    const result = evaluateRule(rule, context);
    if (!result) continue;

    if ("image_name" in result) {
      image_warnings.push(result);
    } else {
      issues.push(result);
    }
  }

  return {
    issues,
    image_warnings,
    rules_evaluated: activeRules.length,
  };
}

// ---------------------------------------------------------------------------
// Scoring & rewrites
// ---------------------------------------------------------------------------

export function computeRiskScore(
  issues: ScanIssue[],
  imageWarningCount: number,
): number {
  let score = 8;

  for (const issue of issues) {
    score += SEVERITY_WEIGHT[issue.severity];
  }

  score += imageWarningCount * 8;

  return Math.min(100, Math.round(score));
}

export function severityLabelFromScore(score: number): string {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

export function computeBlocked(
  issues: ScanIssue[],
  riskScore: number,
): boolean {
  if (issues.some((issue) => issue.blocks_publish)) return true;
  if (riskScore >= 85) return true;
  return issues.filter((issue) => issue.severity === "high").length >= 2;
}

export function computeConfidence(
  issues: ScanIssue[],
  rulesEvaluated: number,
  imageWarningCount: number,
): number {
  if (rulesEvaluated === 0) return 50;

  const matchCount = issues.length + imageWarningCount;

  if (matchCount === 0) return 92;

  const highCount = issues.filter((issue) => issue.severity === "high").length;
  const base = 58 + matchCount * 10 + highCount * 12;
  const coverage = Math.min(15, (matchCount / rulesEvaluated) * 30);

  return Math.min(98, Math.round(base + coverage));
}

function applyRewrite(text: string, pattern: string, replacement: string): string {
  try {
    return text
      .replace(new RegExp(pattern, "gi"), replacement)
      .replace(/\s{2,}/g, " ")
      .trim();
  } catch {
    return text;
  }
}

export function buildSuggestedRewrites(
  context: ScanContext,
  issues: ScanIssue[],
  rules: ScanRule[],
): SuggestedRewrite[] {
  const rulesById = new Map(rules.map((rule) => [rule.id, rule]));
  const rewrites: SuggestedRewrite[] = [];

  let suggestedTitle = context.title;
  let suggestedDescription = context.description;
  let titleChanged = false;
  let descriptionChanged = false;

  for (const issue of issues) {
    const rule = rulesById.get(issue.rule_id);
    if (!rule?.condition_value.rewrite_from) continue;

    const { rewrite_from, rewrite_to = "" } = rule.condition_value;

    if (rule.condition_type === "title_restricted_claim") {
      const next = applyRewrite(suggestedTitle, rewrite_from, rewrite_to);
      if (next !== suggestedTitle) {
        suggestedTitle = next;
        titleChanged = true;
      }
    }

    if (rule.condition_type === "description_restricted_claim") {
      const next = applyRewrite(suggestedDescription, rewrite_from, rewrite_to);
      if (next !== suggestedDescription) {
        suggestedDescription = next;
        descriptionChanged = true;
      }
    }
  }

  if (titleChanged) {
    rewrites.push({
      field: "title",
      original: context.title,
      suggested: suggestedTitle || context.title,
      reason: "Removed or replaced policy-sensitive title language.",
    });
  }

  if (descriptionChanged) {
    rewrites.push({
      field: "description",
      original: context.description,
      suggested: suggestedDescription,
      reason: "Softened restricted claims in the description.",
    });
  }

  if (context.description.length < 50 && !descriptionChanged) {
    rewrites.push({
      field: "description",
      original: context.description,
      suggested:
        `${context.description.trim()} Includes usage instructions and complies with TikTok Shop listing requirements. Results may vary.`.trim(),
      reason: "Expanded thin description with compliance-friendly context.",
    });
  }

  return rewrites;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function runListingScan(
  context: ScanContext,
): Promise<ListingScanResult & { confidence_score: number }> {
  const { rules } = await loadScanRules();
  const { issues, image_warnings, rules_evaluated } = evaluateScanRules(
    rules,
    context,
  );

  const risk_score = computeRiskScore(issues, image_warnings.length);
  const blocked = computeBlocked(issues, risk_score);
  const confidence = computeConfidence(
    issues,
    rules_evaluated,
    image_warnings.length,
  );
  const suggested_rewrites = buildSuggestedRewrites(context, issues, rules);

  return {
    id: `scan-${crypto.randomUUID()}`,
    shop_id: context.shop_id,
    risk_score,
    severity_label: severityLabelFromScore(risk_score),
    confidence,
    confidence_score: confidence,
    blocked,
    issues,
    suggested_rewrites,
    image_warnings,
    scanned_at: new Date().toISOString(),
    rules_evaluated,
  };
}
