"use client";

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { FileUploader } from "@/components/appeals/file-uploader";
import { AppealPreview } from "@/components/appeals/appeal-preview";
import { EvidenceChecklist } from "@/components/appeals/evidence-checklist";
import { UpgradeGate } from "@/components/billing/upgrade-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { generateAppealPacket } from "@/lib/appeals/generate-packet";
import { showError, showSuccess, showWarning } from "@/lib/toast";
import { canAdvanceAppealStep, validateAppealDraft } from "@/lib/validation/appeals";
import type {
  AppealDocument,
  AppealPacket,
  AppealRecord,
  EvidenceChecklistItem,
  ViolationRecord,
} from "@/types/appeals";

const STEP_LABELS = [
  "Understand the violation",
  "Review appeal strategy",
  "Gather evidence",
  "Edit your response",
  "Attach documents",
  "Save your draft",
] as const;

type AppealFormProps = {
  violation: ViolationRecord;
  existingAppeal?: AppealRecord | null;
  canUploadDocuments?: boolean;
  canUseAppeals?: boolean;
};

export function AppealForm({
  violation,
  existingAppeal,
  canUploadDocuments = true,
  canUseAppeals = true,
}: AppealFormProps) {
  const router = useRouter();
  const generatedPacket = useMemo(
    () => generateAppealPacket(violation),
    [violation],
  );

  const initialPacket: AppealPacket = useMemo(() => {
    if (!existingAppeal) return generatedPacket;
    return {
      ...generatedPacket,
      issue_category: existingAppeal.issue_category ?? generatedPacket.issue_category,
      recommended_response:
        existingAppeal.recommended_response ?? generatedPacket.recommended_response,
      evidence_checklist:
        existingAppeal.evidence_checklist?.length > 0
          ? existingAppeal.evidence_checklist
          : generatedPacket.evidence_checklist,
      draft_message: existingAppeal.draft_message ?? generatedPacket.draft_message,
      deadline_at: existingAppeal.deadline_at ?? generatedPacket.deadline_at,
      deadline_label: generatedPacket.deadline_label,
    };
  }, [existingAppeal, generatedPacket]);

  const [step, setStep] = useState(1);
  const [packet] = useState<AppealPacket>(initialPacket);
  const [draftMessage, setDraftMessage] = useState(initialPacket.draft_message);
  const [checklist, setChecklist] = useState<EvidenceChecklistItem[]>(
    initialPacket.evidence_checklist,
  );
  const [uploadedDocuments, setUploadedDocuments] = useState<AppealDocument[]>([]);
  const [docsNotes, setDocsNotes] = useState(
    existingAppeal?.supporting_docs_notes ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [savedAppealId, setSavedAppealId] = useState<string | null>(
    existingAppeal?.id ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  if (!canUseAppeals) {
    return <UpgradeGate feature="appeals" />;
  }

  async function handleSave() {
    const draftError = validateAppealDraft(draftMessage);
    if (draftError) {
      setError(draftError);
      showWarning(draftError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_id: violation.shop_id,
          violation_id: violation.id,
          issue_category: packet.issue_category,
          recommended_response: packet.recommended_response,
          evidence_checklist: checklist,
          draft_message: draftMessage,
          deadline_at: packet.deadline_at,
          supporting_docs_notes: docsNotes,
          supporting_docs: packet.supporting_docs,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save appeal");
      }

      setSavedAppealId(data.appeal?.id ?? savedAppealId);
      showSuccess("Appeal draft saved. You can return anytime to continue.");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  }

  const requiredUnchecked = checklist.filter(
    (item) => item.required && !item.checked,
  ).length;

  function handleContinue() {
    const blockReason = canAdvanceAppealStep(step, checklist, draftMessage);
    if (blockReason) {
      showWarning(blockReason);
      setError(blockReason);
      return;
    }

    setError(null);
    setStep((current) => Math.min(6, current + 1));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/30 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Guided recovery
          </Badge>
          <span className="text-sm text-muted-foreground">
            Step {step} of {STEP_LABELS.length}: {STEP_LABELS[step - 1]}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>What was flagged?</CardTitle>
                <CardDescription>
                  We pulled the violation details so you know exactly what TikTok
                  Shop flagged on your listing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Listing
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    {violation.listing_title ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
                    Violation
                  </p>
                  <p className="mt-1 font-medium text-foreground">{violation.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {violation.details ?? packet.violation_summary}
                  </p>
                </div>
                <div className="rounded-lg border bg-brand/5 p-4 text-sm text-foreground">
                  <p className="font-medium">Suggested appeal summary</p>
                  <p className="mt-2 text-muted-foreground">{packet.violation_summary}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>How to respond</CardTitle>
                <CardDescription>
                  Recommended framing for {packet.issue_category} appeals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-brand/20 bg-brand/5 p-4 text-sm leading-relaxed">
                  {packet.recommended_response}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  In the next steps you will gather evidence, draft your message, and
                  attach supporting files before saving.
                </p>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Evidence checklist</CardTitle>
                <CardDescription>
                  Check off each item as you collect it. Required items should be
                  complete before you submit to TikTok Shop.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EvidenceChecklist items={checklist} onChange={setChecklist} />
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Draft your appeal</CardTitle>
                <CardDescription>
                  We generated a starting draft. Edit it in your own voice before saving.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  className="min-h-[320px] font-mono text-sm leading-relaxed"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {draftMessage.length} characters
                </p>
              </CardContent>
            </Card>
          )}

          {step === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>Supporting documents</CardTitle>
                <CardDescription>
                  Upload screenshots, invoices, and authenticity proofs linked to this
                  appeal draft.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {canUploadDocuments ? (
                  <FileUploader
                    shopId={violation.shop_id}
                    violationId={violation.id}
                    appealId={existingAppeal?.id}
                    issueCategory={packet.issue_category}
                    recommendedResponse={packet.recommended_response}
                    deadlineAt={packet.deadline_at}
                    docsNotes={docsNotes}
                    onDocsNotesChange={setDocsNotes}
                    onDocumentsChange={setUploadedDocuments}
                  />
                ) : (
                  <UpgradeGate feature="document_uploads" />
                )}
              </CardContent>
            </Card>
          )}

          {step === 6 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & save draft</CardTitle>
                <CardDescription>
                  Confirm your appeal packet. You can return later to edit or submit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                  <p className="font-medium text-foreground">{violation.title}</p>
                  <p className="mt-2 line-clamp-4 text-muted-foreground">{draftMessage}</p>
                </div>

                {error && (
                  <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </p>
                )}

                {savedAppealId && (
                  <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    Draft saved. Appeal ID: {savedAppealId.slice(0, 8)}…
                  </p>
                )}

                <Button
                  variant="brand"
                  className="w-full"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving draft...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {savedAppealId ? "Update appeal draft" : "Save appeal draft"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              disabled={step === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            {step < 6 ? (
              <Button variant="brand" onClick={handleContinue}>
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/dashboard/appeals">Back to violations</Link>
              </Button>
            )}
          </div>
        </div>

        <AppealPreview
          violation={violation}
          packet={packet}
          draftMessage={draftMessage}
          checklist={checklist}
          documentCount={uploadedDocuments.length}
          currentStep={step}
          className="lg:sticky lg:top-20"
        />
      </div>

      {step < 6 && requiredUnchecked > 0 && step >= 3 && (
        <p className="text-center text-xs text-muted-foreground">
          Tip: complete required evidence items before your final review.
        </p>
      )}
    </div>
  );
}
