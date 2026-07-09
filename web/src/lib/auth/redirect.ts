/**
 * Validates post-auth redirect paths to prevent open redirects.
 */
export function getSafeRedirectPath(next: string | null, fallback = "/dashboard") {
  if (!next) {
    return fallback;
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  return next;
}
