export type ViolationStatus = "open" | "resolved" | "dismissed" | "appealed";

export type AppealStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "withdrawn";

export type EvidenceChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
};

export type SupportingDocPlan = {
  id: string;
  label: string;
  description: string;
  file_name?: string;
};

export type ViolationRecord = {
  id: string;
  shop_id: string;
  shop_name?: string;
  listing_title: string | null;
  title: string;
  details: string | null;
  issue_category: string;
  severity: number;
  status: ViolationStatus;
  detected_at: string;
  appeal_deadline_at: string | null;
};

export type AppealPacket = {
  violation_summary: string;
  issue_category: string;
  recommended_response: string;
  evidence_checklist: EvidenceChecklistItem[];
  draft_message: string;
  supporting_docs: SupportingDocPlan[];
  deadline_at: string | null;
  deadline_label: string;
};

export type AppealDocumentType =
  | "screenshot"
  | "invoice"
  | "authenticity"
  | "other";

export type AppealDocument = {
  id: string;
  appeal_id: string;
  shop_id: string;
  file_name: string;
  file_url: string;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  document_type: AppealDocumentType;
  status: string;
  preview_url?: string | null;
  created_at: string;
};

export type AppealRecord = {
  id: string;
  shop_id: string;
  violation_id: string;
  status: AppealStatus;
  issue_category: string | null;
  recommended_response: string | null;
  evidence_checklist: EvidenceChecklistItem[];
  draft_message: string | null;
  deadline_at: string | null;
  supporting_docs_notes: string | null;
  reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SaveAppealPayload = {
  shop_id: string;
  violation_id: string;
  issue_category: string;
  recommended_response: string;
  evidence_checklist: EvidenceChecklistItem[];
  draft_message: string;
  deadline_at: string | null;
  supporting_docs_notes: string;
  supporting_docs: SupportingDocPlan[];
};
