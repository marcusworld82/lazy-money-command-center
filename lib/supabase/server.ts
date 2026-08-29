import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Service-role Supabase client. Server-only by construction: SUPABASE_SERVICE_ROLE_KEY
 * has no NEXT_PUBLIC_ prefix, so it's never bundled for the browser, and the
 * `server-only` import throws at build time if this file is ever pulled into a
 * Client Component. This is the sole path the app uses to reach Supabase — nothing
 * runs client-side, which is what lets RLS stay policy-free without a login screen.
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local.",
    );
  }

  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
