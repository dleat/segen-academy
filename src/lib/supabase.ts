import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Null until the Supabase project is set up. The public pages still work
// without it (they fall back to the built-in catalogue), so the site can be
// previewed before any accounts exist.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

export const isConnected = supabase !== null
