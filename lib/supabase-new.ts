import { createClient } from '@supabase/supabase-js'

// HARDCODED VALUES ONLY - NO LOGIC, NO PROCESS.ENV
const supabaseUrl = 'https://ecibyxdfklmdjupngjud.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjaWJ5eGRma2xtZGp1cG5nanVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDg2ODIsImV4cCI6MjA4NzA4NDY4Mn0.8byc8HPH-DueUy8uR4LaZxyguTysRyE7UhfT_Vgx5cM'

// CREATE CLIENT DIRECTLY
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// SIMPLE RECONNECT FUNCTION
export const reconnectSupabase = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const forceReconnect = reconnectSupabase
