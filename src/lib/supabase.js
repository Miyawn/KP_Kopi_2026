import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = "https://zsyhevvtrwsdesxfiwcv.supabase.co"
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzeWhldnZ0cndzZGVzeGZpd2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNjAyODIsImV4cCI6MjA4MzYzNjI4Mn0.gSGuy_Moz8ujM3kV8KQH4Vjb-UYigPL4zamrE5grXek"

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)
