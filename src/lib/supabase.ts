// Supabase client for browser and server
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Factory function that creates a new Supabase client
export const supabase = () => createClient(supabaseUrl, supabaseAnonKey)
