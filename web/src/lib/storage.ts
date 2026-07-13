import type { AppealDocumentType } from "@/types/appeals";

/** Private Supabase Storage bucket for appeal evidence files. */
export const APPEAL_DOCUMENTS_BUCKET = "appeal-uploads";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const APPEAL_DOCUMENT_TYPES: {
  value: AppealDocumentType;
  label: string;
  description: string;
}[] = [
  {
    value: "screenshot",
    label: "Screenshot",
    description: "Listing screenshots, policy pages, or platform UI captures.",
  },
  {
    value: "invoice",
    label: "Invoice",
    description: "Supplier invoices, receipts, or purchase records.",
  },
  {
    value: "authenticity",
    label: "Authenticity proof",
    description: "Brand authorization, certificates, or supplier letters.",
  },
  {
    value: "other",
    label: "Other evidence",
    description: "Any additional supporting documentation.",
  },
];

const ALLOWED_MIME_SET = new Set<string>(ALLOWED_UPLOAD_MIME_TYPES);

/**
 * Storage object path: `{shopId}/{appealId}/{documentId}/{safeFileName}`
 * First segment enforces shop membership in storage RLS policies.
 */
export function buildAppealStoragePath(
  shopId: string,
  appealId: string,
  documentId: string,
  fileName: string,
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${shopId}/${appealId}/${documentId}/${safeName}`;
}

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function validateUploadFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return "File must be 10 MB or smaller.";
  }

  if (!ALLOWED_MIME_SET.has(file.type)) {
    return "File type not allowed. Upload images or PDF/Word documents.";
  }

  return null;
}

export function isImageMimeType(mimeType: string | null | undefined): boolean {
  return Boolean(mimeType?.startsWith("image/"));
}

export function storageObjectUrl(storagePath: string): string {
  return `storage://${APPEAL_DOCUMENTS_BUCKET}/${storagePath}`;
}

export function isMockShopId(shopId: string): boolean {
  return shopId.startsWith("shop-");
}
