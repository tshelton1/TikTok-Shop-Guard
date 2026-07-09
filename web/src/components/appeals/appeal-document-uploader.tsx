"use client";

import { FileUp, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { APPEAL_DOCUMENT_TYPES } from "@/lib/appeals/storage";
import { uploadAppealDocument } from "@/lib/appeals/upload-document";
import type { AppealDocument, AppealDocumentType } from "@/types/appeals";
import { cn } from "@/lib/utils";

type AppealDocumentUploaderProps = {
  shopId: string;
  violationId: string;
  appealId?: string;
  onAppealId?: (appealId: string) => void;
  onUploaded: (document: AppealDocument) => void;
  disabled?: boolean;
};

export function AppealDocumentUploader({
  shopId,
  violationId,
  appealId,
  onAppealId,
  onUploaded,
  disabled,
}: AppealDocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<AppealDocumentType>("screenshot");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || disabled || uploading) {
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const result = await uploadAppealDocument({
        shopId,
        violationId,
        appealId,
        documentType,
        file,
        onProgress: setProgress,
      });

      onAppealId?.(result.appeal_id);
      onUploaded(result.document);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      window.setTimeout(() => setProgress(0), 800);
    }
  }

  const selectedType = APPEAL_DOCUMENT_TYPES.find((item) => item.value === documentType);

  return (
    <div className="space-y-4 rounded-lg border border-dashed p-4">
      <div className="space-y-2">
        <Label htmlFor="document-type">Document type</Label>
        <select
          id="document-type"
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value as AppealDocumentType)}
          disabled={disabled || uploading}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
            Uploading… {progress}%
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
            className={cn("h-full bg-brand transition-all duration-200")}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Images or PDFs up to 10 MB. Files are stored securely and only visible to your shop members.
      </p>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
