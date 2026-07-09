import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Refreshes the Supabase session on every matched request and enforces
 * auth redirects for dashboard routes.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
