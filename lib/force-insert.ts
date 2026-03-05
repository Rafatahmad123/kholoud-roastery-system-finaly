import { supabase } from './supabase'

// Hardcode the URL and key for direct access
const SUPABASE_URL = 'https://ecibyxdfklmdjupngjud.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjaWJ5eGRma2xtZGp1cG5nanVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDg2ODIsImV4cCI6MjA4NzA4NDY4Mn0.8byc8HPH-DueUy8uR4LaZxyguTysRyE7UhfT_Vgx5cM'

export const forceInsertHel = async () => {
  console.log('🚨 FORCE INSERT: هيل حب - MINIMALIST APPROACH')
  
  // MINIMALIST: Only name_ar and barcode
  const minimalData = {
    name_ar: 'هيل حب',
    barcode: 'FORCE_INSERT_123'
  }

  console.log('🗄️ MINIMALIST DATA:', minimalData)

  let lastError: any = null

  try {
    // ATTEMPT 1: Direct Supabase insert
    console.log('🔥 ATTEMPT 1: Direct Supabase Insert')
    const { data, error } = await supabase
      .from('products')
      .insert(minimalData)
      .select()
      .single()

    if (!error) {
      console.log('✅✅✅ SUCCESS! هيل حب INSERTED via Supabase:', data)
      alert('✅ SUCCESS! هيل حب saved to database!')
      return { success: true, data, method: 'supabase' }
    }

    lastError = error
    console.error('❌ Supabase failed:', error)
    console.error('❌ ERROR CODE:', error.code)
    console.error('❌ ERROR MESSAGE:', error.message)
    console.error('❌ ERROR DETAILS:', error.details)

    // ATTEMPT 2: Raw SQL via RPC
    console.log('🔥 ATTEMPT 2: Raw SQL via RPC')
    const sqlQuery = `INSERT INTO products (name_ar, barcode) VALUES ('هيل حب', 'FORCE_INSERT_123') RETURNING *;`
    
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', {
      sql: sqlQuery
    })

    if (!rpcError) {
      console.log('✅✅✅ SUCCESS! هيل حب INSERTED via RPC:', rpcData)
      alert('✅ SUCCESS! هيل حب saved via RPC!')
      return { success: true, data: rpcData, method: 'rpc' }
    }

    lastError = rpcError
    console.error('❌ RPC failed:', rpcError)

    // ATTEMPT 3: Direct REST API
    console.log('🔥 ATTEMPT 3: Direct REST API')
    const url = `${SUPABASE_URL}/rest/v1/products`
    const headers = {
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      'Cache-Control': 'no-cache'
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(minimalData)
    })

    if (response.ok) {
      const restData = await response.json()
      console.log('✅✅✅ SUCCESS! هيل حب INSERTED via REST API:', restData)
      alert('✅ SUCCESS! هيل حب saved via REST API!')
      return { success: true, data: restData, method: 'rest' }
    }

    const errorText = await response.text()
    lastError = { message: `REST API Error: ${response.status} - ${errorText}` }
    console.error('❌ REST API failed:', response.status, errorText)

  } catch (err) {
    lastError = err
    console.error('❌ CATCH ERROR:', err)
  }

  // SHOW BIG ERROR ALERT
  const errorMessage = `
🚨 FORCE INSERT FAILED! 🚨
  
METHODS TRIED:
1. Direct Supabase Insert
2. Raw SQL via RPC  
3. Direct REST API

LAST ERROR: ${lastError?.message || 'Unknown error'}

DATABASE COLUMNS: Check if name_ar and barcode exist!
  `
  
  console.error(errorMessage)
  alert(errorMessage)
  
  return { success: false, error: errorMessage }
}

// Auto-run force insert
if (typeof window !== 'undefined') {
  // Add to window for manual trigger
  (window as any).forceInsertHel = forceInsertHel
  
  console.log('🔥 FORCE INSERT READY! Run: forceInsertHel() in console')
  console.log('🔥 Or call this function manually from your component')
}
