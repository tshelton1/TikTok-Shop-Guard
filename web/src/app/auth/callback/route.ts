import { NextResponse } from "next/server";

import { AUTH_CALLBACK_PATH } from "@/lib/supabase/env";

/**
 * Legacy redirect shim for older Supabase allowlisted URLs.
 * Canonical callback is AUTH_CALLBACK_PATH (`/api/auth/callback`).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = new URL(AUTH_CALLBACK_PATH, url.origin);
  target.search = url.search;
  return NextResponse.redirect(target);
}
