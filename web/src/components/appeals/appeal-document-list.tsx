"use client";

import { ExternalLink, FileText, ImageIcon, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteAppealDocumentClient } from "@/lib/appeals/upload-document";
import { APPEAL_DOCUMENT_TYPES, isImageMimeType } from "@/lib/appeals/storage";
import type { AppealDocument } from "@/types/appeals";

type AppealDocumentListProps = {
  documents: AppealDocument[];
  shopId: string;
  onRemove: (documentId: string) => void;
  disabled?: boolean;
};

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) {
    return "—";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function documentTypeLabel(type: string) {
  return APPEAL_DOCUMENT_TYPES.find((item) => item.value === type)?.label ?? type;
}

export function AppealDocumentList({
  documents,
  shopId,
  onRemove,
  disabled,
}: AppealDocumentListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove(documentId: string) {
    setRemovingId(documentId);
    setError(null);

    try {
      await deleteAppealDocumentClient(documentId, shopId);
      onRemove(documentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove file");
    } finally {
      setRemovingId(null);
    }
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        No documents uploaded yet. Add screenshots, invoices, or authenticity proofs above.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => {
        const isImage = isImageMimeType(document.mime_type);
        const previewUrl = document.preview_url;

        return (
          <div
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
                <p className="truncate font-medium text-foreground">{document.file_name}</p>
                <Badge variant="outline">{documentTypeLabel(document.document_type)}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatBytes(document.size_bytes)} · Uploaded{" "}
                {new Date(document.created_at).toLocaleString()}
              </p>
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                >
                  View file
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
          </div>
        );
      })}

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
