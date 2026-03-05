import { supabase } from './supabase'

export const quickSchemaFix = async () => {
  console.log('🔥 URGENT: CHECKING PRODUCTS TABLE SCHEMA FOR PGRST204 FIX')
  
  try {
    // Try to get table info using a simple query
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ ERROR ACCESSING TABLE:', error)
      
      // If PGRST204, try to add the missing name column
      if (error.code === 'PGRST204') {
        console.log('🔧 PGRST204 DETECTED - ATTEMPTING TO ADD name COLUMN')
        
        // Try to add the name column via RPC
        const { data: addResult, error: addError } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS name text;'
        })
        
        if (addError) {
          console.error('❌ FAILED TO ADD COLUMN VIA RPC:', addError)
          console.log('📝 MANUAL SQL NEEDED: ALTER TABLE products ADD COLUMN IF NOT EXISTS name text;')
        } else {
          console.log('✅ NAME COLUMN ADDED SUCCESSFULLY')
        }
      }
      
      return { success: false, error: error.message, needsManualFix: true }
    }

    if (data && data.length > 0) {
      console.log('✅ FOUND PRODUCT ROW - ANALYZING COLUMNS:')
      const columns = Object.keys(data[0])
      console.log('📊 Available Columns:', columns)
      
      // Check specifically for name vs name_ar
      const hasName = columns.includes('name')
      const hasNameAr = columns.includes('name_ar')
      const hasBarcode = columns.includes('barcode')
      const hasWholesalePrice = columns.includes('wholesale_price_usd')
      
      console.log('🔍 Column Analysis:')
      console.log('  - name column:', hasName)
      console.log('  - name_ar column:', hasNameAr)
      console.log('  - barcode column:', hasBarcode)
      console.log('  - wholesale_price_usd column:', hasWholesalePrice)
      
      // Determine the correct column mapping
      const nameColumn = hasName ? 'name' : (hasNameAr ? 'name_ar' : null)
      
      return { 
        success: true, 
        columns, 
        nameColumn,
        hasName,
        hasNameAr,
        hasBarcode,
        hasWholesalePrice,
        sampleRow: data[0] 
      }
    } else {
      console.log('📊 Table is empty, but accessible')
      return { success: true, columns: [], message: 'Table is empty' }
    }

  } catch (err) {
    console.error('❌ CRITICAL ERROR:', err)
    return { success: false, error: (err as Error).message }
  }
}

// Auto-run schema check immediately
if (typeof window !== 'undefined') {
  setTimeout(() => {
    quickSchemaFix().then(result => {
      if (result.success) {
        console.log('🎉 SCHEMA ANALYSIS COMPLETE')
        if (result.nameColumn) {
          console.log('✅ NAME COLUMN FOUND:', result.nameColumn)
        } else {
          console.error('❌ NO NAME COLUMN FOUND - NEEDS MANUAL FIX')
        }
      } else {
        console.error('❌ SCHEMA ANALYSIS FAILED:', result.error)
        if (result.needsManualFix) {
          console.log('📝 RUN THIS SQL IN SUPABASE:')
          console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS name text;')
        }
      }
    })
  }, 1000)
}
