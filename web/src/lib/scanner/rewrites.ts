import type {
  ListingScanContext,
  ListingScanRule,
  ScanIssue,
  SuggestedRewrite,
} from "@/lib/scanner/types";

function applyRewrite(
  text: string,
  pattern: string,
  replacement: string,
): string {
  try {
    return text.replace(new RegExp(pattern, "gi"), replacement).replace(/\s{2,}/g, " ").trim();
  } catch {
    return text;
  }
}

export function buildSuggestedRewrites(
  context: ListingScanContext,
  issues: ScanIssue[],
  rules: ListingScanRule[],
): SuggestedRewrite[] {
  const rewrites: SuggestedRewrite[] = [];
  const rulesById = new Map(rules.map((rule) => [rule.id, rule]));

  let suggestedTitle = context.title;
  let suggestedDescription = context.description;
  let titleChanged = false;
  let descriptionChanged = false;

  for (const issue of issues) {
    const rule = rulesById.get(issue.rule_id);
    if (!rule?.condition_value.rewrite_from) continue;

    const { rewrite_from, rewrite_to = "" } = rule.condition_value;

    if (
      rule.condition_type === "title_regex" ||
      (rule.condition_type === "combined_regex" &&
        rule.condition_value.pattern &&
        new RegExp(rule.condition_value.pattern, "i").test(context.title))
    ) {
      const next = applyRewrite(suggestedTitle, rewrite_from, rewrite_to);
      if (next !== suggestedTitle) {
        suggestedTitle = next;
        titleChanged = true;
      }
    }

    if (
      rule.condition_type === "description_regex" ||
      rule.condition_type === "restricted_claim" ||
      rule.condition_type === "combined_regex"
    ) {
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
      suggested: `${context.description.trim()} Includes usage instructions and complies with TikTok Shop listing requirements. Results may vary.`.trim(),
      reason: "Expanded thin description with compliance-friendly context.",
    });
  }

  if (rewrites.length === 0) {
    rewrites.push({
      field: "title",
      original: context.title,
      suggested: context.title,
      reason: "No copy changes required based on current rules.",
    });
  }

  return rewrites;
}
