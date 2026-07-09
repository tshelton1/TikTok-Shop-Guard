import type {
  AppealPacket,
  EvidenceChecklistItem,
  SupportingDocPlan,
  ViolationRecord,
} from "@/types/appeals";

const CATEGORY_CHECKLISTS: Record<string, EvidenceChecklistItem[]> = {
  "Health & Medical Claims": [
    { id: "ev-1", label: "Updated product description without medical claims", required: true, checked: false },
    { id: "ev-2", label: "Ingredient list or supplement facts panel", required: true, checked: false },
    { id: "ev-3", label: "Third-party lab testing certificate (if applicable)", required: false, checked: false },
    { id: "ev-4", label: "Screenshots of corrected listing copy", required: true, checked: false },
  ],
  "Product Certification": [
    { id: "ev-1", label: "CE / FCC / UL certification documents", required: true, checked: false },
    { id: "ev-2", label: "Product specification sheet", required: true, checked: false },
    { id: "ev-3", label: "Updated listing with certification references", required: true, checked: false },
  ],
  "Image & Media Policy": [
    { id: "ev-1", label: "Replacement product images without text overlays", required: true, checked: false },
    { id: "ev-2", label: "Image alt text updates", required: false, checked: false },
    { id: "ev-3", label: "Before/after image removal confirmation", required: true, checked: false },
  ],
  "Category & Listing Accuracy": [
    { id: "ev-1", label: "Correct category selection screenshot", required: true, checked: false },
    { id: "ev-2", label: "Updated title and description", required: true, checked: false },
    { id: "ev-3", label: "Product packaging showing category-appropriate labeling", required: false, checked: false },
  ],
};

const CATEGORY_RESPONSES: Record<string, string> = {
  "Health & Medical Claims":
    "Acknowledge the flagged claim, explain corrective copy changes, and provide documentation showing the listing no longer makes restricted health outcome statements.",
  "Product Certification":
    "Reference valid certification numbers, attach compliance documents, and confirm listing copy matches certified product specifications.",
  "Image & Media Policy":
    "Confirm non-compliant images were removed or replaced, and describe steps taken to ensure future uploads meet TikTok Shop media guidelines.",
  "Category & Listing Accuracy":
    "Explain the correct product category, show updated listing metadata, and clarify how the product fits the selected category requirements.",
};

const DEFAULT_CHECKLIST: EvidenceChecklistItem[] = [
  { id: "ev-1", label: "Corrected listing copy", required: true, checked: false },
  { id: "ev-2", label: "Supporting product documentation", required: true, checked: false },
  { id: "ev-3", label: "Screenshots of remediation steps", required: false, checked: false },
];

function defaultSupportingDocs(category: string): SupportingDocPlan[] {
  return [
    {
      id: "doc-1",
      label: "Corrected listing screenshots",
      description: `Screenshots showing the updated ${category.toLowerCase()} listing on TikTok Shop.`,
    },
    {
      id: "doc-2",
      label: "Compliance documentation",
      description: "Certificates, test reports, or supplier documentation supporting your appeal.",
    },
    {
      id: "doc-3",
      label: "Internal remediation notes",
      description: "Brief summary of changes made to resolve the violation.",
    },
  ];
}

function formatDeadlineLabel(deadline: string | null): string {
  if (!deadline) return "No deadline on file — submit as soon as possible.";
  const date = new Date(deadline);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  if (diffDays < 0) return `${formatted} — overdue`;
  if (diffDays === 0) return `${formatted} — due today`;
  if (diffDays === 1) return `${formatted} — due tomorrow`;
  return `${formatted} — ${diffDays} days remaining`;
}

function buildDraftMessage(violation: ViolationRecord): string {
  return `Dear TikTok Shop Trust & Safety Team,

I am writing to appeal the violation flagged on my listing "${violation.listing_title ?? "our product"}" (Violation: ${violation.title}).

Summary of issue:
${violation.details ?? "Our listing was flagged for a policy concern."}

Corrective actions taken:
- We have reviewed TikTok Shop policies for ${violation.issue_category.toLowerCase()}.
- We updated the listing copy to remove any non-compliant language.
- We attached supporting documentation referenced in this appeal packet.

We respectfully request reinstatement of the listing and confirmation that our remediation meets platform requirements. Please let us know if additional information is needed.

Thank you for your review.`;
}

export function generateAppealPacket(violation: ViolationRecord): AppealPacket {
  const issue_category = violation.issue_category;
  const evidence_checklist =
    CATEGORY_CHECKLISTS[issue_category] ?? DEFAULT_CHECKLIST;

  return {
    violation_summary: `${violation.title}${violation.details ? ` — ${violation.details}` : ""}`,
    issue_category,
    recommended_response:
      CATEGORY_RESPONSES[issue_category] ??
      "Provide a clear explanation of the violation, document remediation steps, and attach evidence supporting compliance.",
    evidence_checklist: evidence_checklist.map((item) => ({ ...item })),
    draft_message: buildDraftMessage(violation),
    supporting_docs: defaultSupportingDocs(issue_category),
    deadline_at: violation.appeal_deadline_at,
    deadline_label: formatDeadlineLabel(violation.appeal_deadline_at),
  };
}
