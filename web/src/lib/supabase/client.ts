import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

/**
 * Browser Supabase client for Client Components (auth forms, sign-out).
 */
export function createClient() {
  return createBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
  );
}
