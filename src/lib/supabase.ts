// Supabase client for browser and server
import { createClient } from "@supabase/supabase-js"

// Make sure these environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Please check your .env file.")
}

// Factory function that creates a new Supabase client
export const supabase = () => createClient(supabaseUrl, supabaseAnonKey)
