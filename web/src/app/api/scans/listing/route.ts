import { handleListingScan } from "@/lib/api/scans/handler";

/** @deprecated Prefer POST /api/scans */
export async function POST(request: Request) {
  return handleListingScan(request);
}
