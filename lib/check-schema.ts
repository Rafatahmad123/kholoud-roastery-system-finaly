import { supabase } from './supabase'

export const checkProductsSchema = async () => {
  console.log('🔍 CHECKING PRODUCTS TABLE SCHEMA...')
  
  try {
    // Try to get table info
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ ERROR CHECKING SCHEMA:', error)
      return { success: false, error: error.message }
    }

    if (data && data.length > 0) {
      console.log('✅ FOUND PRODUCT ROW - ANALYZING COLUMNS:')
      const columns = Object.keys(data[0])
      console.log('📊 Available Columns:', columns)
      
      // Check for specific columns
      const requiredColumns = ['name', 'barcode', 'wholesale_price_usd', 'exchange_rate', 'expiry_date', 'category']
      const missingColumns = requiredColumns.filter(col => !columns.includes(col))
      const alternativeColumns = requiredColumns.map(col => {
        const alternatives = columns.filter(c => c.toLowerCase().includes(col.toLowerCase()))
        return alternatives.length > 0 ? { original: col, found: alternatives } : null
      }).filter(Boolean)

      console.log('❌ Missing Columns:', missingColumns)
      console.log('🔄 Alternative Columns Found:', alternativeColumns)

      return { 
        success: true, 
        columns, 
        missingColumns, 
        alternativeColumns,
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

// Auto-run schema check
if (typeof window !== 'undefined') {
  setTimeout(() => {
    checkProductsSchema().then(result => {
      if (result.success) {
        console.log('🎉 SCHEMA CHECK COMPLETE')
        if (result.alternativeColumns && result.alternativeColumns.length > 0) {
          console.log('🔄 COLUMN MAPPING NEEDED:', result.alternativeColumns)
        }
      } else {
        console.error('❌ SCHEMA CHECK FAILED:', result.error)
      }
    })
  }, 2000)
}
