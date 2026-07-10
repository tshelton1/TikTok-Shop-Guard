import {
  AUTH_CALLBACK_LEGACY_PATH,
  AUTH_CALLBACK_PATH,
} from "@/lib/supabase/env";

export const GUEST_ONLY_ROUTES = ["/login", "/signup", "/forgot-password"] as const;

export const AUTH_ROUTES = [
  ...GUEST_ONLY_ROUTES,
  "/reset-password",
  "/auth/update-password",
] as const;

export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/api/stripe/checkout",
  "/api/stripe/portal",
  "/api/scans",
  "/api/appeals",
  "/api/uploads",
  "/api/violations",
] as const;

/** Routes that must bypass auth redirects (webhooks + auth callbacks + signout). */
export const PUBLIC_API_PREFIXES = [
  "/api/stripe/webhook",
  AUTH_CALLBACK_PATH,
  AUTH_CALLBACK_LEGACY_PATH,
  "/auth/signout",
] as const;

export function isGuestOnlyRoute(pathname: string) {
  return GUEST_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isPublicApiRoute(pathname: string) {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
