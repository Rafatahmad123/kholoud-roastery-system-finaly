import { createProduct, checkBarcodeExists, fetchProducts } from './api'

export const testCompleteFlow = async () => {
  console.log('🧪 Testing complete Add Product flow...')
  
  const testBarcode = 'TEST_FLOW_' + Date.now()
  const testProduct = {
    name: 'Test Product Flow',
    barcode: testBarcode,
    type: 'Test Type',
    roast_level: 'متوسط',
    packaging: '1 كجم',
    stock: 5,
    wholesale_price_usd: 10.00,
    exchange_rate: 37500,
    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    category: 'Test Type'
  }

  try {
    // Step 1: Check barcode exists (should be false)
    console.log('1️⃣ Testing barcode check...')
    const barcodeExists = await checkBarcodeExists(testBarcode)
    console.log(`   Barcode ${testBarcode} exists: ${barcodeExists}`)
    
    if (barcodeExists) {
      throw new Error('Test barcode should not exist yet')
    }

    // Step 2: Create product
    console.log('2️⃣ Testing product creation...')
    const createdProduct = await createProduct(testProduct)
    console.log('   ✅ Product created:', createdProduct)

    // Step 3: Verify barcode exists now (should be true)
    console.log('3️⃣ Testing barcode check after creation...')
    const barcodeExistsAfter = await checkBarcodeExists(testBarcode)
    console.log(`   Barcode ${testBarcode} exists after creation: ${barcodeExistsAfter}`)
    
    if (!barcodeExistsAfter) {
      throw new Error('Test barcode should exist after creation')
    }

    // Step 4: Fetch all products to verify it appears in list
    console.log('4️⃣ Testing product fetch...')
    const allProducts = await fetchProducts()
    const foundProduct = allProducts.find(p => p.barcode === testBarcode)
    
    if (!foundProduct) {
      throw new Error('Created product not found in product list')
    }
    
    console.log('   ✅ Product found in list:', foundProduct.name)

    // Step 5: Verify all required fields are present
    const requiredFields = ['name', 'barcode', 'wholesale_price_usd', 'exchange_rate', 'expiry_date', 'category']
    const missingFields = requiredFields.filter(field => !(field in foundProduct))
    
    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(', ')}`)
    }

    console.log('   ✅ All required fields present')

    // Cleanup: Remove test product
    console.log('5️⃣ Cleaning up test product...')
    const { supabase } = await import('./supabase')
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('barcode', testBarcode)

    if (deleteError) {
      console.warn('⚠️ Could not clean up test product:', deleteError)
    } else {
      console.log('   ✅ Test product cleaned up')
    }

    console.log('🎉 Complete flow test PASSED!')
    return { success: true, message: 'All tests passed' }

  } catch (error) {
    console.error('❌ Flow test FAILED:', error)
    return { 
      success: false, 
      message: (error as Error).message,
      error: error 
    }
  }
}

// Auto-run test when imported in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  testCompleteFlow().then(result => {
    if (result.success) {
      console.log('✅ Database connection test completed successfully')
    } else {
      console.error('❌ Database connection test failed:', result.message)
    }
  })
}
