import { createClient } from '@supabase/supabase-js'

// FORCED HARDCODED CREDENTIALS - COMPLETE BYPASS OF ENVIRONMENT VARIABLES
const supabaseUrl = 'https://ecibyxdfklmdjupngjud.supabase.co'

// Standard Supabase Anon Key Format (eyJ... ending with ...M)
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjaWJ5eGRma2xtZGp1cG5nanVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDg2ODIsImV4cCI6MjA4NzA4NDY4Mn0.8byc8HPH-DueUy8uR4LaZxyguTysRyE7UhfT_Vgx5cM'

// CRITICAL VERIFICATION
console.log('🚀 FORCED SUPABASE INITIALIZATION')
console.log('🔧 URL:', supabaseUrl)
console.log('🔑 KEY LENGTH:', supabaseAnonKey.length)
console.log('🔑 KEY PREFIX:', supabaseAnonKey.substring(0, 30) + '...')
console.log('🔑 KEY SUFFIX:', '...' + supabaseAnonKey.substring(supabaseAnonKey.length - 20))

// ABSOLUTE VALIDATION - NO PROCESS.ENV
if (!supabaseUrl || supabaseUrl.includes('process.env')) {
  throw new Error('CRITICAL: Supabase URL is invalid or still using process.env')
}
if (!supabaseAnonKey || supabaseAnonKey.includes('process.env')) {
  throw new Error('CRITICAL: Supabase Anon Key is invalid or still using process.env')
}

// Validate JWT format (should start with eyJ and end with M)
if (!supabaseAnonKey.startsWith('eyJ') || !supabaseAnonKey.endsWith('M')) {
  console.error('❌ INVALID JWT FORMAT DETECTED!')
  console.error('❌ Key starts with eyJ:', supabaseAnonKey.startsWith('eyJ'))
  console.error('❌ Key ends with M:', supabaseAnonKey.endsWith('M'))
  throw new Error('CRITICAL: Supabase Anon Key has invalid JWT format')
}

console.log('✅ CREDENTIALS VALIDATED - CREATING CLIENT...')

// CREATE CLIENT WITH SCHEMA CACHE REFRESH
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  // Add headers to refresh schema cache
  global: {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  },
})

console.log('✅ SUPABASE CLIENT CREATED SUCCESSFULLY')

// SIMPLE RECONNECT FUNCTION
export const reconnectSupabase = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    },
  })
}

export const forceReconnect = reconnectSupabase
