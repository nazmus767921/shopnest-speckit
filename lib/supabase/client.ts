import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key is missing from environment variables.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function getMediaUrl(storagePath: string | undefined | null): string {
  if (!storagePath) return ""
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath
  }
  // Backwards compatibility: strip old product-images/ prefix
  const cleanPath = storagePath.replace(/^product-images\//, "")
  return supabase.storage.from("media").getPublicUrl(cleanPath).data.publicUrl
}

