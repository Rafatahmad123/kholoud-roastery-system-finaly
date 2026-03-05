import { supabase } from './supabase'

export const debugBarcodeColumn = async () => {
  console.log('🔍 Debugging barcode column...')
  
  try {
    // Test 1: Check if we can access the products table
    console.log('1️⃣ Testing products table access...')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    if (productsError) {
      console.error('❌ Products table access failed:', productsError)
      return { success: false, error: productsError.message }
    }

    console.log('✅ Products table accessible')

    // Test 2: Check if barcode column exists
    if (products && products.length > 0) {
      const columns = Object.keys(products[0])
      console.log('📋 Available columns:', columns)
      
      if (columns.includes('barcode')) {
        console.log('✅ Barcode column exists')
      } else {
        console.error('❌ Barcode column NOT found')
        return { success: false, error: 'Barcode column not found in products table' }
      }
    } else {
      console.log('ℹ️ Products table is empty, testing barcode query directly...')
    }

    // Test 3: Try a barcode query with a known non-existent barcode
    console.log('2️⃣ Testing barcode query with non-existent barcode...')
    const testBarcode = 'NON_EXISTENT_TEST_BARCODE'
    const { data: barcodeData, error: barcodeError } = await supabase
      .from('products')
      .select('id, barcode')
      .eq('barcode', testBarcode)
      .single()

    console.log('📊 Barcode query result:', { data: barcodeData, error: barcodeError })

    if (barcodeError && barcodeError.code === 'PGRST116') {
      console.log('✅ Barcode query works correctly (PGRST116 = not found)')
    } else if (barcodeError) {
      console.error('❌ Barcode query failed:', barcodeError)
      return { success: false, error: `Barcode query failed: ${barcodeError.message}` }
    } else {
      console.log('ℹ️ Barcode found (unexpected for test barcode)')
    }

    // Test 4: Try to insert a test product with barcode
    console.log('3️⃣ Testing product insertion with barcode...')
    const testProduct = {
      name: 'Debug Test Product',
      barcode: 'DEBUG_TEST_' + Date.now(),
      type: 'Test',
      roast_level: 'متوسط',
      packaging: '1 كجم',
      stock: 1,
      wholesale_price_usd: 1.00,
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
      console.error('❌ Product insertion failed:', insertError)
      return { success: false, error: `Insert failed: ${insertError.message}` }
    }

    console.log('✅ Product insertion successful:', insertData)

    // Test 5: Clean up - delete the test product
    if (insertData?.id) {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', insertData.id)

      if (deleteError) {
        console.warn('⚠️ Could not clean up test product:', deleteError)
      } else {
        console.log('✅ Test product cleaned up')
      }
    }

    console.log('🎉 All barcode tests passed!')
    return { success: true, message: 'Barcode column and queries working correctly' }

  } catch (error) {
    console.error('❌ Debug failed:', error)
    return { 
      success: false, 
      error: (error as Error).message,
      details: error 
    }
  }
}

// Auto-run debug when imported
if (typeof window !== 'undefined') {
  debugBarcodeColumn().then(result => {
    if (result.success) {
      console.log('✅ Barcode debug completed successfully')
    } else {
      console.error('❌ Barcode debug failed:', result.message)
    }
  })
}
