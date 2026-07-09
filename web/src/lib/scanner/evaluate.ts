import type {
  ConditionValue,
  ImageWarning,
  ListingScanContext,
  ListingScanRule,
  ScanIssue,
} from "@/lib/scanner/types";

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
  const match = text.match(regex);
  return match?.[0];
}

function buildIssue(rule: ListingScanRule, matchedValue?: string): ScanIssue {
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

function evaluateRule(
  rule: ListingScanRule,
  context: ListingScanContext,
): ScanIssue | ImageWarning | null {
  const value = rule.condition_value;

  switch (rule.condition_type) {
    case "title_regex": {
      const matched = firstMatch(context.title, buildRegex(value));
      if (!matched) return null;
      return buildIssue(rule, matched);
    }

    case "description_regex": {
      const matched = firstMatch(context.description, buildRegex(value));
      if (!matched) return null;
      return buildIssue(rule, matched);
    }

    case "combined_regex":
    case "restricted_claim": {
      const matched = firstMatch(
        `${context.title} ${context.description}`,
        buildRegex(value),
      );
      if (!matched) return null;
      return buildIssue(rule, matched);
    }

    case "price_invalid": {
      const min = value.min ?? 0.01;
      if (context.price >= min) return null;
      return buildIssue(rule, String(context.price));
    }

    case "price_below_min": {
      const min = value.min ?? 0;
      if (context.price >= min) return null;
      return buildIssue(rule, String(context.price));
    }

    case "price_above_max": {
      const max = value.max ?? Infinity;
      if (context.price <= max) return null;
      return buildIssue(rule, String(context.price));
    }

    case "title_min_length": {
      const min = value.min ?? 1;
      if (context.title.length >= min) return null;
      return buildIssue(rule, `${context.title.length} chars`);
    }

    case "description_min_length": {
      const min = value.min ?? 1;
      if (context.description.length >= min) return null;
      return buildIssue(rule, `${context.description.length} chars`);
    }

    case "category_mismatch": {
      const keywords = value.keywords ?? [];
      const disallowed = value.disallowed_categories ?? [];
      const haystack =
        `${context.title} ${context.description}`.toLowerCase();
      const matchedKeyword = keywords.find((keyword) =>
        haystack.includes(keyword.toLowerCase()),
      );
      if (!matchedKeyword || !disallowed.includes(context.category)) return null;
      return buildIssue(rule, matchedKeyword);
    }

    case "image_filename_regex": {
      const regex = buildRegex(value);
      if (!regex) return null;
      const matchedName = context.image_names.find((name) => regex.test(name));
      if (!matchedName) return null;
      return {
        image_name: matchedName,
        message: rule.remediation_tip,
        rule_id: rule.id,
      };
    }

    case "image_count_below_min": {
      const min = value.min ?? 1;
      if (context.image_names.length >= min) return null;
      return {
        image_name: "—",
        message: rule.remediation_tip,
        rule_id: rule.id,
      };
    }

    default:
      return null;
  }
}

export type RuleEvaluationResult = {
  issues: ScanIssue[];
  image_warnings: ImageWarning[];
  rules_evaluated: number;
};

export function evaluateRules(
  rules: ListingScanRule[],
  context: ListingScanContext,
): RuleEvaluationResult {
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
