"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AppealDocumentList } from "@/components/appeals/appeal-document-list";
import { AppealDocumentUploader } from "@/components/appeals/appeal-document-uploader";
import { Textarea } from "@/components/ui/textarea";
import {
  ensureAppealDraftClient,
  fetchAppealDocumentsClient,
} from "@/lib/appeals/upload-document";
import type { AppealDocument } from "@/types/appeals";

type AppealDocumentsPanelProps = {
  shopId: string;
  violationId: string;
  issueCategory?: string;
  recommendedResponse?: string;
  deadlineAt?: string | null;
  docsNotes: string;
  onDocsNotesChange: (value: string) => void;
  onDocumentsChange?: (documents: AppealDocument[]) => void;
};

export function AppealDocumentsPanel({
  shopId,
  violationId,
  issueCategory,
  recommendedResponse,
  deadlineAt,
  docsNotes,
  onDocsNotesChange,
  onDocumentsChange,
}: AppealDocumentsPanelProps) {
  const [appealId, setAppealId] = useState<string | undefined>();
  const [documents, setDocuments] = useState<AppealDocument[]>([]);
  const [loading, setLoading] = useState(true);
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
        const draftId = await ensureAppealDraftClient({
          shopId,
          violationId,
          issueCategory,
          recommendedResponse,
          deadlineAt,
        });

        if (cancelled) {
          return;
        }

        setAppealId(draftId);
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
    issueCategory,
    recommendedResponse,
    deadlineAt,
    syncDocuments,
  ]);

  function handleUploaded(document: AppealDocument) {
    syncDocuments([document, ...documents]);
  }

  function handleRemove(documentId: string) {
    syncDocuments(documents.filter((item) => item.id !== documentId));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border py-12 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Preparing document uploads…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {error}
        </p>
      )}

      <AppealDocumentUploader
        shopId={shopId}
        violationId={violationId}
        appealId={appealId}
        onAppealId={setAppealId}
        onUploaded={handleUploaded}
      />

      <div>
        <p className="mb-3 text-sm font-medium text-foreground">Uploaded files</p>
        <AppealDocumentList
          documents={documents}
          shopId={shopId}
          onRemove={handleRemove}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Additional notes</p>
        <Textarea
          value={docsNotes}
          onChange={(event) => onDocsNotesChange(event.target.value)}
          placeholder="Any extra context about your supporting documentation..."
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
}
