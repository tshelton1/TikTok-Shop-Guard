import { NextResponse } from "next/server";

/**
 * @deprecated Use /api/auth/callback — kept for existing Supabase redirect URLs.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = new URL("/api/auth/callback", url.origin);
  target.search = url.search;
  return NextResponse.redirect(target);
}
