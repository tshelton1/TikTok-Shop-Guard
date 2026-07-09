"use client";

import {
  ExternalLink,
  FileText,
  FileUp,
  ImageIcon,
  Loader2,
  Paperclip,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteAppealDocumentClient,
  ensureAppealDraftClient,
  fetchAppealDocumentsClient,
  uploadAppealDocument,
} from "@/lib/appeals/upload-document";
import { APPEAL_DOCUMENT_TYPES, isImageMimeType } from "@/lib/storage";
import { showError, showInfo, showSuccess } from "@/lib/toast";
import type { AppealDocument, AppealDocumentType } from "@/types/appeals";
import { cn } from "@/lib/utils";

type FileUploaderProps = {
  shopId: string;
  violationId: string;
  appealId?: string;
  issueCategory?: string;
  recommendedResponse?: string;
  deadlineAt?: string | null;
  docsNotes?: string;
  onDocsNotesChange?: (value: string) => void;
  onAppealId?: (appealId: string) => void;
  onDocumentsChange?: (documents: AppealDocument[]) => void;
  disabled?: boolean;
  className?: string;
};

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function documentTypeLabel(type: string) {
  return APPEAL_DOCUMENT_TYPES.find((item) => item.value === type)?.label ?? type;
}

export function FileUploader({
  shopId,
  violationId,
  appealId: initialAppealId,
  issueCategory,
  recommendedResponse,
  deadlineAt,
  docsNotes = "",
  onDocsNotesChange,
  onAppealId,
  onDocumentsChange,
  disabled = false,
  className,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [appealId, setAppealId] = useState<string | undefined>(initialAppealId);
  const [documents, setDocuments] = useState<AppealDocument[]>([]);
  const [documentType, setDocumentType] = useState<AppealDocumentType>("screenshot");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncDocuments = useCallback(
    (next: AppealDocument[]) => {
      setDocuments(next);
      onDocumentsChange?.(next);
    },
    [onDocumentsChange],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const draftId =
          initialAppealId ??
          (await ensureAppealDraftClient({
            shopId,
            violationId,
            issueCategory,
            recommendedResponse,
            deadlineAt,
          }));

        if (cancelled) return;

        setAppealId(draftId);
        onAppealId?.(draftId);

        const existing = await fetchAppealDocumentsClient(draftId, shopId);
        if (!cancelled) {
          syncDocuments(existing);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load documents");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    shopId,
    violationId,
    initialAppealId,
    issueCategory,
    recommendedResponse,
    deadlineAt,
    onAppealId,
    syncDocuments,
  ]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || disabled || uploading) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const result = await uploadAppealDocument({
        shopId,
        violationId,
        appealId,
        documentType,
        file,
        onProgress: setUploadProgress,
      });

      setAppealId(result.appeal_id);
      onAppealId?.(result.appeal_id);
      syncDocuments([result.document, ...documents]);
      setUploadProgress(100);
      showSuccess(`${file.name} uploaded successfully.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      showError(message);
    } finally {
      setUploading(false);
      window.setTimeout(() => setUploadProgress(0), 800);
    }
  }

  async function handleRemove(documentId: string) {
    setRemovingId(documentId);
    setError(null);

    try {
      await deleteAppealDocumentClient(documentId, shopId);
      syncDocuments(documents.filter((doc) => doc.id !== documentId));
      showInfo("Document removed.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove file";
      setError(message);
      showError(message);
    } finally {
      setRemovingId(null);
    }
  }

  const selectedType = APPEAL_DOCUMENT_TYPES.find((item) => item.value === documentType);

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 rounded-lg border py-12 text-sm text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading secure document storage…
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="rounded-lg border border-dashed bg-muted/10 p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
          <Paperclip className="h-4 w-4 text-brand" />
          Upload supporting files
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-type">Document type</Label>
            <select
              id="document-type"
              value={documentType}
              onChange={(event) =>
                setDocumentType(event.target.value as AppealDocumentType)
              }
              disabled={disabled || uploading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {APPEAL_DOCUMENT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {selectedType && (
              <p className="text-xs text-muted-foreground">{selectedType.description}</p>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled || uploading}
          />

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading… {uploadProgress}%
              </>
            ) : (
              <>
                <FileUp className="h-4 w-4" />
                Choose file to upload
              </>
            )}
          </Button>

          {uploading && (
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-brand transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Screenshots, invoices, authenticity proofs, and PDFs up to 10 MB. Files are
            stored in private Supabase Storage and only visible to your shop members.
          </p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-foreground">
          Uploaded files ({documents.length})
        </p>

        {documents.length === 0 ? (
          <div className="rounded-lg border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            No documents yet. Upload evidence to strengthen your appeal.
          </div>
        ) : (
          <ul className="space-y-3">
            {documents.map((document) => {
              const isImage = isImageMimeType(document.mime_type);
              const previewUrl = document.preview_url;

              return (
                <li
                  key={document.id}
                  className="flex gap-4 rounded-lg border p-4"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
                    {isImage && previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt={document.file_name}
                        className="h-full w-full object-cover"
                      />
                    ) : isImage ? (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-foreground">
                        {document.file_name}
                      </p>
                      <Badge variant="outline">
                        {documentTypeLabel(document.document_type)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatBytes(document.size_bytes)} ·{" "}
                      {new Date(document.created_at).toLocaleString()}
                    </p>
                    {previewUrl && (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                      >
                        Preview file
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-red-600"
                    disabled={disabled || removingId === document.id}
                    onClick={() => handleRemove(document.id)}
                    aria-label={`Remove ${document.file_name}`}
                  >
                    {removingId === document.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {onDocsNotesChange && (
        <div>
          <p className="mb-2 text-sm font-medium">Notes about your documents</p>
          <Textarea
            value={docsNotes}
            onChange={(event) => onDocsNotesChange(event.target.value)}
            placeholder="Optional context about invoices, certificates, or screenshots…"
            className="min-h-[100px]"
            disabled={disabled}
          />
        </div>
      )}

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
