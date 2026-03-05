import { supabase } from './supabase'

// Hardcode the URL and key for direct access
const SUPABASE_URL = 'https://ecibyxdfklmdjupngjud.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjaWJ5eGRma2xtZGp1cG5nanVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDg2ODIsImV4cCI6MjA4NzA4NDY4Mn0.8byc8HPH-DueUy8uR4LaZxyguTysRyE7UhfT_Vgx5cM'

export const rawSQLInsert = async (productData: any) => {
  console.log('🔪 RAW SQL INSERT - BYPASSING LIBRARY')
  console.log('📊 Product Data:', productData)
  
  try {
    // Use Supabase RPC to call a raw SQL function
    const { data, error } = await supabase.rpc('insert_product_raw', {
      p_name: productData.name,
      p_barcode: productData.barcode,
      p_type: productData.type,
      p_roast_level: productData.roast_level,
      p_packaging: productData.packaging,
      p_stock: Number(productData.stock),
      p_wholesale_price_usd: Number(productData.wholesale_price_usd),
      p_exchange_rate: Number(productData.exchange_rate),
      p_expiry_date: productData.expiry_date || null,
      p_category: productData.category || productData.type
    })

    if (error) {
      console.error('❌ RAW SQL INSERT FAILED:', error)
      throw error
    }

    console.log('✅ RAW SQL INSERT SUCCESS:', data)
    return data

  } catch (err) {
    console.error('❌ RAW SQL ERROR:', err)
    throw err
  }
}

// Fallback: Direct REST API call
export const directRESTInsert = async (productData: any) => {
  console.log('🌐 DIRECT REST API INSERT')
  
  const url = `${SUPABASE_URL}/rest/v1/products`
  const headers = {
    'apikey': SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }

  console.log('🌐 URL:', url)
  console.log('🔑 Headers:', { ...headers, apikey: '***' })
  console.log('📊 Body:', JSON.stringify(productData, null, 2))

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(productData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ REST API ERROR:', response.status, errorText)
      throw new Error(`REST API Error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ REST API SUCCESS:', data)
    return data

  } catch (err) {
    console.error('❌ REST API ERROR:', err)
    throw err
  }
}
