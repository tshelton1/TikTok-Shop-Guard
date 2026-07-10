/**
 * Shared Supabase env + auth redirect helpers.
 * Keeps browser/server/middleware clients and signup redirects consistent.
 */

const ENV_NAME_RE = /^NEXT_PUBLIC_[A-Z0-9_]+$/;

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Rejects missing values and accidental use of the env var *name* as the value. */
function requireEnvValue(name: string, value: string | undefined): string {
  const trimmed = trimEnv(value);
  if (!trimmed || ENV_NAME_RE.test(trimmed)) {
    throw new Error(
      `Invalid or missing ${name}. Set it in .env.local to a real value (not the variable name).`,
    );
  }
  return trimmed;
}

/**
 * Project URL only — never concatenate keys or path segments onto this.
 * Strips trailing slashes so callers can safely append `/auth/v1/...`.
 */
export function getSupabaseUrl(): string {
  const raw = requireEnvValue(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );

  // Catch accidental URL+key concatenation (common copy/paste mistake).
  if (
    raw.includes("eyJ") ||
    raw.includes("sb_publishable_") ||
    raw.includes("NEXT_PUBLIC_")
  ) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL looks malformed (includes a key or env var name). Use only https://<project-ref>.supabase.co",
    );
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL must be a valid URL (got "${raw}").`,
    );
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL must use http(s) (got "${raw}").`,
    );
  }

  if (url.pathname !== "/" && url.pathname !== "") {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL must be the project origin only (no path). Got "${raw}".`,
    );
  }

  if (url.search || url.hash) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL must not include query params or a hash. Got "${raw}".`,
    );
  }

  if (ENV_NAME_RE.test(url.hostname) || url.hostname.includes("NEXT_PUBLIC_")) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL looks like an env var name was pasted as the host (got "${raw}").`,
    );
  }

  return `${url.protocol}//${url.host}`;
}

/**
 * Browser/server public key for Supabase Auth.
 *
 * Prefer the legacy anon JWT when present. New `sb_publishable_...` keys are
 * not JWTs; supabase-js still sends them as `Authorization: Bearer ...`, which
 * can make Auth requests fail in the browser as "Load Failed" / "Failed to fetch".
 * Fall back to the publishable key only when anon is unset.
 */
export function getSupabasePublishableKey(): string {
  const key =
    trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    trimEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  return requireEnvValue(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)",
    key,
  );
}

export function getSupabaseServiceRoleKey(): string {
  return requireEnvValue(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Canonical email-confirm / OAuth code exchange route.
 * Must match Supabase Auth → URL Configuration redirect allowlist.
 */
export const AUTH_CALLBACK_PATH = "/api/auth/callback" as const;

/** Legacy path still allowlisted in some Supabase projects; redirects to AUTH_CALLBACK_PATH. */
export const AUTH_CALLBACK_LEGACY_PATH = "/auth/callback" as const;

export const PASSWORD_UPDATE_PATH = "/auth/update-password" as const;

export const AUTH_CALLBACK_PATHS = [
  AUTH_CALLBACK_PATH,
  AUTH_CALLBACK_LEGACY_PATH,
] as const;

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, "");
}

/**
 * Absolute redirect URL for auth emails.
 * Pass `window.location.origin` from the browser so localhost vs prod stays correct.
 */
export function getAuthCallbackUrl(origin: string): string {
  return `${normalizeOrigin(origin)}${AUTH_CALLBACK_PATH}`;
}

export function getPasswordUpdateUrl(origin: string): string {
  return `${normalizeOrigin(origin)}${PASSWORD_UPDATE_PATH}`;
}

export function isAuthCallbackPath(pathname: string): boolean {
  return AUTH_CALLBACK_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
