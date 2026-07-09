import type { EvidenceChecklistItem } from "@/types/appeals";

const DRAFT_MIN_LENGTH = 40;

export function validateAppealDraft(draftMessage: string): string | null {
  const trimmed = draftMessage.trim();

  if (!trimmed) {
    return "Write an appeal message before saving your draft.";
  }

  if (trimmed.length < DRAFT_MIN_LENGTH) {
    return `Your appeal should be at least ${DRAFT_MIN_LENGTH} characters. Add more detail about your remediation.`;
  }

  return null;
}

export function getRequiredEvidenceCount(checklist: EvidenceChecklistItem[]) {
  return checklist.filter((item) => item.required && !item.checked).length;
}

export function canAdvanceAppealStep(
  step: number,
  checklist: EvidenceChecklistItem[],
  draftMessage: string,
): string | null {
  if (step === 3 && getRequiredEvidenceCount(checklist) > 0) {
    return "Complete all required evidence items before continuing.";
  }

  if (step === 4) {
    return validateAppealDraft(draftMessage);
  }

  return null;
}
