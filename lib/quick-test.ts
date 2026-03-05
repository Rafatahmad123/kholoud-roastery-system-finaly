import { supabase } from './supabase'

export const quickTest = async () => {
  console.log('🚀 Quick Supabase Test')
  
  try {
    // Test 1: Simple connection test
    console.log('1️⃣ Testing basic connection...')
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ Connection failed:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Connection successful')

    // Test 2: Test barcode query
    console.log('2️⃣ Testing barcode query...')
    const testBarcode = 'TEST_' + Date.now()
    
    const { data: barcodeData, error: barcodeError } = await supabase
      .from('products')
      .select('id')
      .eq('barcode', testBarcode)
      .single()

    if (barcodeError && barcodeError.code === 'PGRST116') {
      console.log('✅ Barcode query works (not found as expected)')
    } else if (barcodeError) {
      console.error('❌ Barcode query failed:', barcodeError)
      return { success: false, error: `Barcode query failed: ${barcodeError.message}` }
    } else {
      console.log('ℹ️ Barcode found (unexpected)')
    }

    // Test 3: Test insert with barcode
    console.log('3️⃣ Testing insert with barcode...')
    const testProduct = {
      name: 'Quick Test Product',
      barcode: testBarcode,
      type: 'Test',
      roast_level: 'متوسط',
      packaging: '1 كجم',
      stock: 1,
      wholesale_price_usd: 5.00,
      exchange_rate: 37500,
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'Test'
    }

    const { data: insertData, error: insertError } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Insert failed:', insertError)
      return { success: false, error: `Insert failed: ${insertError.message}` }
    }

    console.log('✅ Insert successful:', insertData?.name)

    // Test 4: Clean up
    if (insertData?.id) {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', insertData.id)

      if (deleteError) {
        console.warn('⚠️ Cleanup failed:', deleteError)
      } else {
        console.log('✅ Cleanup successful')
      }
    }

    console.log('🎉 All tests passed!')
    return { success: true, message: 'Supabase is working correctly' }

  } catch (error) {
    console.error('❌ Test failed:', error)
    return { 
      success: false, 
      error: (error as Error).message 
    }
  }
}

// Auto-run test
if (typeof window !== 'undefined') {
  setTimeout(() => {
    quickTest().then(result => {
      if (result.success) {
        console.log('✅ Quick test completed successfully')
      } else {
        console.error('❌ Quick test failed:', result.error)
      }
    })
  }, 2000) // Wait 2 seconds for app to load
}
