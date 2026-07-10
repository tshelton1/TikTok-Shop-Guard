import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

/**
 * Browser Supabase client for Client Components (auth forms, sign-out).
 * Call inside event handlers / effects — not during render.
 */
export function createClient() {
  return createBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
  );
}
