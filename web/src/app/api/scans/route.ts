import { handleListingScan } from "@/lib/api/scans/handler";

export async function POST(request: Request) {
  return handleListingScan(request);
}
