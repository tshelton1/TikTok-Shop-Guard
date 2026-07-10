import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  isGuestOnlyRoute,
  isProtectedRoute,
  isPublicApiRoute,
} from "@/lib/auth/routes";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isAuthCallbackPath,
} from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never block or rewrite auth callbacks — they must reach the route handlers
  // that exchange the `code` for a session.
  if (isAuthCallbackPath(pathname) || isPublicApiRoute(pathname)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  let url: string;
  let key: string;
  try {
    url = getSupabaseUrl();
    key = getSupabasePublishableKey();
  } catch {
    // Misconfigured env — skip auth refresh rather than crash every request.
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedRoute(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isGuestOnlyRoute(pathname)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}
