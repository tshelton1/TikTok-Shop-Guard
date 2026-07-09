import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAppeals, getViolationById, getViolations } from "@/lib/appeals/mock-data";
import {
  APPEAL_DOCUMENTS_BUCKET,
  storageObjectUrl,
} from "@/lib/storage";
import type {
  AppealDocument,
  AppealDocumentType,
  AppealRecord,
  SaveAppealPayload,
  ViolationRecord,
} from "@/types/appeals";

type DraftInput = {
  shop_id: string;
  violation_id: string;
  issue_category?: string | null;
  recommended_response?: string | null;
  deadline_at?: string | null;
};

type CreateDocumentInput = {
  id: string;
  appeal_id: string;
  shop_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  document_type: AppealDocumentType;
  uploaded_by: string;
};

const mockDocuments = new Map<string, AppealDocument[]>();

function isMockShop(shopId: string) {
  return shopId.startsWith("shop-");
}

function mockAppealId(violationId: string) {
  return `appeal-draft-${violationId}`;
}

async function verifyShopAccess(
  shopId: string,
  userId: string,
): Promise<boolean> {
  if (isMockShop(shopId)) {
    return true;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("shop_members")
    .select("shop_id")
    .eq("shop_id", shopId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  return Boolean(data);
}

async function signedPreviewUrl(storagePath: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(APPEAL_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);

  if (error) {
    return null;
  }

  return data.signedUrl;
}

function mapDocumentRow(
  row: Record<string, unknown>,
  shopId: string,
  previewUrl?: string | null,
): AppealDocument {
  return {
    id: row.id as string,
    appeal_id: row.appeal_id as string,
    shop_id: shopId,
    file_name: row.file_name as string,
    file_url: row.file_url as string,
    storage_path: (row.storage_path as string | null) ?? null,
    mime_type: (row.mime_type as string | null) ?? null,
    size_bytes: (row.size_bytes as number | null) ?? null,
    document_type: ((row.document_type as AppealDocumentType) ?? "other"),
    status: row.status as string,
    preview_url: previewUrl ?? null,
    created_at: (row.created_at as string) ?? new Date().toISOString(),
  };
}

export async function ensureAppealDraft(
  userId: string,
  input: DraftInput,
): Promise<{ id: string }> {
  if (isMockShop(input.shop_id)) {
    return { id: mockAppealId(input.violation_id) };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("appeals")
    .select("id")
    .eq("violation_id", input.violation_id)
    .eq("status", "draft")
    .maybeSingle();

  if (existing?.id) {
    return { id: existing.id };
  }

  const { data, error } = await supabase
    .from("appeals")
    .insert({
      shop_id: input.shop_id,
      violation_id: input.violation_id,
      status: "draft",
      issue_category: input.issue_category ?? null,
      recommended_response: input.recommended_response ?? null,
      deadline_at: input.deadline_at ?? null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create appeal draft");
  }

  return { id: data.id };
}

export async function createAppealDocument(
  input: CreateDocumentInput,
): Promise<AppealDocument> {
  const fileUrl = storageObjectUrl(input.storage_path);
  const previewUrl = await signedPreviewUrl(input.storage_path);

  if (isMockShop(input.shop_id)) {
    const document: AppealDocument = {
      id: input.id,
      appeal_id: input.appeal_id,
      shop_id: input.shop_id,
      file_name: input.file_name,
      file_url: fileUrl,
      storage_path: input.storage_path,
      mime_type: input.mime_type,
      size_bytes: input.size_bytes,
      document_type: input.document_type,
      status: "uploaded",
      preview_url: previewUrl,
      created_at: new Date().toISOString(),
    };

    const existing = mockDocuments.get(input.appeal_id) ?? [];
    mockDocuments.set(input.appeal_id, [...existing, document]);
    return document;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appeal_documents")
    .insert({
      id: input.id,
      appeal_id: input.appeal_id,
      file_name: input.file_name,
      file_url: fileUrl,
      storage_path: input.storage_path,
      mime_type: input.mime_type,
      size_bytes: input.size_bytes,
      document_type: input.document_type,
      status: "uploaded",
      uploaded_by: input.uploaded_by,
      metadata: { document_type: input.document_type },
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to save document metadata");
  }

  return mapDocumentRow(data, input.shop_id, previewUrl);
}

export async function fetchAppealDocuments(
  appealId: string,
  shopId: string,
  userId: string,
): Promise<AppealDocument[]> {
  const allowed = await verifyShopAccess(shopId, userId);
  if (!allowed) {
    throw new Error("Forbidden");
  }

  if (isMockShop(shopId)) {
    const docs = mockDocuments.get(appealId) ?? [];
    return Promise.all(
      docs.map(async (doc) => ({
        ...doc,
        preview_url:
          doc.storage_path
            ? await signedPreviewUrl(doc.storage_path)
            : doc.preview_url ?? null,
      })),
    );
  }

  const supabase = await createClient();
  const { data: appeal } = await supabase
    .from("appeals")
    .select("id, shop_id")
    .eq("id", appealId)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (!appeal) {
    return [];
  }

  const { data, error } = await supabase
    .from("appeal_documents")
    .select("*")
    .eq("appeal_id", appealId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return Promise.all(
    data.map(async (row) =>
      mapDocumentRow(
        row,
        shopId,
        row.storage_path ? await signedPreviewUrl(row.storage_path) : null,
      ),
    ),
  );
}

export async function deleteAppealDocument(
  documentId: string,
  shopId: string,
  userId: string,
): Promise<void> {
  const allowed = await verifyShopAccess(shopId, userId);
  if (!allowed) {
    throw new Error("Forbidden");
  }

  if (isMockShop(shopId)) {
    for (const [appealId, docs] of mockDocuments.entries()) {
      const doc = docs.find((item) => item.id === documentId);
      if (!doc) {
        continue;
      }

      if (doc.storage_path) {
        const admin = createAdminClient();
        await admin.storage
          .from(APPEAL_DOCUMENTS_BUCKET)
          .remove([doc.storage_path]);
      }

      mockDocuments.set(
        appealId,
        docs.filter((item) => item.id !== documentId),
      );
      return;
    }

    return;
  }

  const supabase = await createClient();
  const { data: document } = await supabase
    .from("appeal_documents")
    .select("id, storage_path, appeal_id")
    .eq("id", documentId)
    .maybeSingle();

  if (!document) {
    return;
  }

  const { data: appeal } = await supabase
    .from("appeals")
    .select("shop_id")
    .eq("id", document.appeal_id)
    .maybeSingle();

  if (!appeal || appeal.shop_id !== shopId) {
    throw new Error("Forbidden");
  }

  if (document.storage_path) {
    const admin = createAdminClient();
    await admin.storage
      .from(APPEAL_DOCUMENTS_BUCKET)
      .remove([document.storage_path]);
  }

  await supabase.from("appeal_documents").delete().eq("id", documentId);
}

export async function fetchViolations(
  shopId: string,
): Promise<ViolationRecord[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("violations")
      .select(
        "id, shop_id, listing_title, title, details, issue_category, severity, status, detected_at, appeal_deadline_at",
      )
      .eq("shop_id", shopId)
      .eq("status", "open")
      .order("detected_at", { ascending: false });

    if (error || !data?.length) {
      return getViolations(shopId);
    }

    return data.map((row) => ({
      id: row.id,
      shop_id: row.shop_id,
      listing_title: row.listing_title,
      title: row.title,
      details: row.details,
      issue_category: row.issue_category ?? "General Policy",
      severity: row.severity,
      status: row.status as ViolationRecord["status"],
      detected_at: row.detected_at,
      appeal_deadline_at: row.appeal_deadline_at,
    }));
  } catch {
    return getViolations(shopId);
  }
}

export async function fetchViolation(
  violationId: string,
): Promise<ViolationRecord | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("violations")
      .select(
        "id, shop_id, listing_title, title, details, issue_category, severity, status, detected_at, appeal_deadline_at",
      )
      .eq("id", violationId)
      .single();

    if (error || !data) {
      return getViolationById(violationId);
    }

    return {
      id: data.id,
      shop_id: data.shop_id,
      listing_title: data.listing_title,
      title: data.title,
      details: data.details,
      issue_category: data.issue_category ?? "General Policy",
      severity: data.severity,
      status: data.status as ViolationRecord["status"],
      detected_at: data.detected_at,
      appeal_deadline_at: data.appeal_deadline_at,
    };
  } catch {
    return getViolationById(violationId);
  }
}

export async function saveAppealDraft(
  userId: string,
  payload: SaveAppealPayload,
): Promise<{ appeal: AppealRecord; saved: boolean }> {
  try {
    const supabase = await createClient();

    const appealRow = {
      shop_id: payload.shop_id,
      violation_id: payload.violation_id,
      status: "draft" as const,
      issue_category: payload.issue_category,
      recommended_response: payload.recommended_response,
      evidence_checklist: payload.evidence_checklist,
      draft_message: payload.draft_message,
      deadline_at: payload.deadline_at,
      supporting_docs_notes: payload.supporting_docs_notes,
      reason: payload.draft_message.slice(0, 500),
      notes: payload.supporting_docs_notes,
      created_by: userId,
    };

    const { data: existing } = await supabase
      .from("appeals")
      .select("id")
      .eq("violation_id", payload.violation_id)
      .eq("status", "draft")
      .maybeSingle();

    let appeal;

    if (existing?.id) {
      const { data, error } = await supabase
        .from("appeals")
        .update(appealRow)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      appeal = data;
    } else {
      const { data, error } = await supabase
        .from("appeals")
        .insert(appealRow)
        .select()
        .single();
      if (error) throw error;
      appeal = data;
    }

    if (!appeal) {
      throw new Error("Failed to save appeal");
    }

    await supabase
      .from("violations")
      .update({ status: "appealed" })
      .eq("id", payload.violation_id);

    return {
      saved: true,
      appeal: mapAppealRow(appeal),
    };
  } catch {
    // Mock fallback when DB unavailable
    const mockAppeal: AppealRecord = {
      id: `appeal-${Date.now()}`,
      shop_id: payload.shop_id,
      violation_id: payload.violation_id,
      status: "draft",
      issue_category: payload.issue_category,
      recommended_response: payload.recommended_response,
      evidence_checklist: payload.evidence_checklist,
      draft_message: payload.draft_message,
      deadline_at: payload.deadline_at,
      supporting_docs_notes: payload.supporting_docs_notes,
      reason: payload.draft_message.slice(0, 500),
      notes: payload.supporting_docs_notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return { appeal: mockAppeal, saved: true };
  }
}

function mapAppealRow(row: Record<string, unknown>): AppealRecord {
  return {
    id: row.id as string,
    shop_id: row.shop_id as string,
    violation_id: row.violation_id as string,
    status: row.status as AppealRecord["status"],
    issue_category: (row.issue_category as string) ?? null,
    recommended_response: (row.recommended_response as string) ?? null,
    evidence_checklist: (row.evidence_checklist as AppealRecord["evidence_checklist"]) ?? [],
    draft_message: (row.draft_message as string) ?? null,
    deadline_at: (row.deadline_at as string) ?? null,
    supporting_docs_notes: (row.supporting_docs_notes as string) ?? null,
    reason: (row.reason as string) ?? null,
    notes: (row.notes as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function fetchAppealDraftForViolation(
  violationId: string,
): Promise<AppealRecord | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("appeals")
      .select("*")
      .eq("violation_id", violationId)
      .eq("status", "draft")
      .maybeSingle();

    if (error || !data) {
      const appeals = await getAppeals();
      return (
        appeals.find(
          (appeal) =>
            appeal.violation_id === violationId && appeal.status === "draft",
        ) ?? null
      );
    }

    return mapAppealRow(data);
  } catch {
    const appeals = await getAppeals();
    return (
      appeals.find(
        (appeal) =>
          appeal.violation_id === violationId && appeal.status === "draft",
      ) ?? null
    );
  }
}

export async function fetchAppeals(shopId: string): Promise<AppealRecord[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("appeals")
      .select("*")
      .eq("shop_id", shopId)
      .order("updated_at", { ascending: false });

    if (error || !data) {
      return getAppeals(shopId);
    }

    return data.map(mapAppealRow);
  } catch {
    return getAppeals(shopId);
  }
}
