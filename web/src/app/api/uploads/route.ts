import { NextResponse } from "next/server";

import {
  createAppealDocument,
  deleteAppealDocument,
  ensureAppealDraft,
  fetchAppealDocuments,
} from "@/lib/appeals/repository";
import { requireFeature } from "@/lib/billing/require-feature";
import {
  APPEAL_DOCUMENTS_BUCKET,
  buildAppealStoragePath,
  isMockShopId,
  validateUploadFile,
} from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AppealDocumentType } from "@/types/appeals";

async function verifyShopMembership(shopId: string, userId: string) {
  if (isMockShopId(shopId)) {
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

async function requireUploadAccess(shopId: string) {
  if (isMockShopId(shopId)) {
    return null;
  }

  const featureCheck = await requireFeature("document_uploads");
  if ("error" in featureCheck && featureCheck.error) {
    return featureCheck.error;
  }

  return null;
}

/** List documents linked to an appeal. */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const appealId = url.searchParams.get("appeal_id");
    const shopId = url.searchParams.get("shop_id");

    if (!appealId || !shopId) {
      return NextResponse.json(
        { error: "appeal_id and shop_id are required" },
        { status: 400 },
      );
    }

    const denied = await requireUploadAccess(shopId);
    if (denied) return denied;

    const allowed = await verifyShopMembership(shopId, user.id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const documents = await fetchAppealDocuments(appealId, shopId, user.id);
    return NextResponse.json({ documents });
  } catch (error) {
    console.error("List uploads error:", error);
    return NextResponse.json({ error: "Failed to list documents" }, { status: 500 });
  }
}

/** Upload a file to Supabase Storage and persist appeal_documents metadata. */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const shopId = String(formData.get("shop_id") ?? "");
    const violationId = String(formData.get("violation_id") ?? "");
    let appealId = String(formData.get("appeal_id") ?? "");
    const documentType = String(
      formData.get("document_type") ?? "other",
    ) as AppealDocumentType;
    const file = formData.get("file");

    if (!shopId || !violationId || !(file instanceof File)) {
      return NextResponse.json({ error: "Invalid upload payload" }, { status: 400 });
    }

    const denied = await requireUploadAccess(shopId);
    if (denied) return denied;

    const validationError = validateUploadFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const allowed = await verifyShopMembership(shopId, user.id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!appealId) {
      const appeal = await ensureAppealDraft(user.id, {
        shop_id: shopId,
        violation_id: violationId,
      });
      appealId = appeal.id;
    }

    const documentId = crypto.randomUUID();
    const storagePath = buildAppealStoragePath(
      shopId,
      appealId,
      documentId,
      file.name,
    );
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from(APPEAL_DOCUMENTS_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    const document = await createAppealDocument({
      id: documentId,
      appeal_id: appealId,
      shop_id: shopId,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
      document_type: documentType,
      uploaded_by: user.id,
    });

    return NextResponse.json({ document, appeal_id: appealId });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}

/** Delete storage object and metadata row. */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const documentId = url.searchParams.get("id");
    const shopId = url.searchParams.get("shop_id");

    if (!documentId || !shopId) {
      return NextResponse.json({ error: "id and shop_id are required" }, { status: 400 });
    }

    const denied = await requireUploadAccess(shopId);
    if (denied) return denied;

    const allowed = await verifyShopMembership(shopId, user.id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteAppealDocument(documentId, shopId, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete upload error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
