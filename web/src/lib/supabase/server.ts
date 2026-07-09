import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";
import type { UserProfile } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — middleware handles refresh.
          }
        },
      },
    },
  );
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users_profile")
    .select("id, email, full_name, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return profile;
  }

  // Fallback when legacy `profiles` table exists without users_profile row yet
  const { data: legacy } = await supabase
    .from("profiles")
    .select("id, email, full_name, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  return legacy;
}

import { ensureBillingProfile } from "@/lib/billing/profile";

/** Billing-aware profile (`profiles` table). */
export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return profile;
  }

  return ensureBillingProfile(
    user.id,
    user.email,
    user.user_metadata?.full_name as string | undefined,
  );
}
