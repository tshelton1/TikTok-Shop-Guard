import type { AppealDocument, AppealDocumentType } from "@/types/appeals";

export type UploadAppealDocumentInput = {
  shopId: string;
  violationId: string;
  appealId?: string;
  documentType: AppealDocumentType;
  file: File;
  onProgress?: (percent: number) => void;
};

export type UploadAppealDocumentResult = {
  document: AppealDocument;
  appeal_id: string;
};

const UPLOADS_API = "/api/uploads";

export function uploadAppealDocument({
  shopId,
  violationId,
  appealId,
  documentType,
  file,
  onProgress,
}: UploadAppealDocumentInput): Promise<UploadAppealDocumentResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("shop_id", shopId);
    formData.append("violation_id", violationId);
    formData.append("document_type", documentType);
    formData.append("file", file);
    if (appealId) {
      formData.append("appeal_id", appealId);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", UPLOADS_API);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      let data: {
        document?: AppealDocument;
        appeal_id?: string;
        error?: string;
      } = {};

      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Invalid server response"));
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300 || !data.document || !data.appeal_id) {
        reject(new Error(data.error ?? "Upload failed"));
        return;
      }

      resolve({
        document: data.document,
        appeal_id: data.appeal_id,
      });
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}

export async function fetchAppealDocumentsClient(
  appealId: string,
  shopId: string,
): Promise<AppealDocument[]> {
  const params = new URLSearchParams({ appeal_id: appealId, shop_id: shopId });
  const response = await fetch(`${UPLOADS_API}?${params.toString()}`);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to load documents");
  }

  const data = await response.json();
  return data.documents ?? [];
}

export async function deleteAppealDocumentClient(
  documentId: string,
  shopId: string,
): Promise<void> {
  const params = new URLSearchParams({ id: documentId, shop_id: shopId });
  const response = await fetch(`${UPLOADS_API}?${params.toString()}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to delete document");
  }
}

export async function ensureAppealDraftClient(input: {
  shopId: string;
  violationId: string;
  issueCategory?: string;
  recommendedResponse?: string;
  deadlineAt?: string | null;
}): Promise<string> {
  const response = await fetch("/api/appeals/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shop_id: input.shopId,
      violation_id: input.violationId,
      issue_category: input.issueCategory,
      recommended_response: input.recommendedResponse,
      deadline_at: input.deadlineAt,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to prepare appeal draft");
  }

  return data.appeal_id as string;
}
