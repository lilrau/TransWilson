// Supabase client for browser and server
import { createClient } from "@supabase/supabase-js"

// Make sure these environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables. Please check your .env file.")
}

// Factory function that creates a new Supabase client
export const supabase = () => {
  // Use service role key for server-side operations
  const key = typeof window === 'undefined' ? supabaseServiceKey : supabaseAnonKey
  return createClient(supabaseUrl, key || supabaseAnonKey)
}
