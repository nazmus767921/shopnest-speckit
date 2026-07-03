import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase URL or Service Role Key is missing from environment variables.");
}

/**
 * Server-side Supabase admin client.
 * Uses SERVICE_ROLE_KEY for full storage access (bypasses RLS).
 * Falls back to anon key if service role key is not configured.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
