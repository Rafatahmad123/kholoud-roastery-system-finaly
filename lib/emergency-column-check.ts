import { supabase } from './supabase'

export const emergencyColumnCheck = async () => {
  console.log('🚨 EMERGENCY: CHECKING EXACT COLUMN NAMES')
  
  try {
    // Test each column individually to find the exact names
    const columnsToTest = [
      'wholesale_price',
      'wholesale_price_usd',
      'price',
      'name_ar',
      'name',
      'stock_quantity',
      'stock',
      'barcode',
      'packaging',
      'roast_level',
      'category'
    ]
    
    const results: { [key: string]: boolean } = {}
    
    for (const column of columnsToTest) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(column)
          .limit(1)
        
        if (error && error.code === 'PGRST204') {
          results[column] = false
          console.log(`❌ Column '${column}' does NOT exist`)
        } else {
          results[column] = true
          console.log(`✅ Column '${column}' EXISTS`)
        }
      } catch (err) {
        results[column] = false
        console.log(`❌ Column '${column}' ERROR:`, err)
      }
    }
    
    console.log('📊 FINAL COLUMN RESULTS:', results)
    
    // Determine the correct column names
    const correctColumns = {
      name: results.name_ar ? 'name_ar' : (results.name ? 'name' : null),
      price: results.wholesale_price ? 'wholesale_price' : (results.wholesale_price_usd ? 'wholesale_price_usd' : (results.price ? 'price' : null)),
      stock: results.stock_quantity ? 'stock_quantity' : (results.stock ? 'stock' : null),
      barcode: results.barcode ? 'barcode' : null,
      packaging: results.packaging ? 'packaging' : null,
      roast_level: results.roast_level ? 'roast_level' : null,
      category: results.category ? 'category' : null
    }
    
    console.log('🎯 CORRECT COLUMN MAPPING:', correctColumns)
    
    return { success: true, results, correctColumns }
    
  } catch (err) {
    console.error('❌ EMERGENCY CHECK FAILED:', err)
    return { success: false, error: (err as Error).message }
  }
}

// Auto-run emergency check
if (typeof window !== 'undefined') {
  setTimeout(() => {
    emergencyColumnCheck().then(result => {
      if (result.success) {
        console.log('🎉 EMERGENCY COLUMN CHECK COMPLETE')
        console.log('🎯 USE THESE COLUMN NAMES:', result.correctColumns)
      } else {
        console.error('❌ EMERGENCY COLUMN CHECK FAILED:', result.error)
      }
    })
  }, 1000)
}
