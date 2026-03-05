import { supabase } from './supabase'

export const testDirectProductCreation = async () => {
  console.log('🧪 TESTING DIRECT PRODUCT CREATION...')
  
  // EXACT PRODUCT: هيل حب with barcode 123456
  const testProduct = {
    name: 'هيل حب',
    barcode: '123456',
    type: 'قهوة عربية',
    roast_level: 'متوسط',
    packaging: '250 جم',
    stock: 50,
    wholesale_price_usd: 8.50,
    exchange_rate: 37500,
    expiry_date: '2025-12-31',
    category: 'قهوة عربية',
    price: 10.20, // Retail price (8.50 * 1.20)
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  console.log('📊 Test Product Data:', testProduct)
  console.log('🔢 wholesale_price_usd type:', typeof testProduct.wholesale_price_usd)
  console.log('🔢 exchange_rate type:', typeof testProduct.exchange_rate)

  try {
    const { data, error } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single()

    if (error) {
      console.error('❌ DIRECT INSERT FAILED:', error)
      console.error('❌ ERROR CODE:', error.code)
      console.error('❌ ERROR MESSAGE:', error.message)
      console.error('❌ ERROR DETAILS:', error.details)
      return { success: false, error: error.message }
    }

    console.log('✅ PRODUCT CREATED SUCCESSFULLY!')
    console.log('📊 Created Product:', data)
    
    // Clean up test product
    if (data?.id) {
      await supabase
        .from('products')
        .delete()
        .eq('id', data.id)
      console.log('🧹 Test product cleaned up')
    }

    return { success: true, data }
    
  } catch (err) {
    console.error('❌ CRITICAL ERROR:', err)
    return { success: false, error: (err as Error).message }
  }
}

// Auto-run test
if (typeof window !== 'undefined') {
  setTimeout(() => {
    testDirectProductCreation().then(result => {
      if (result.success) {
        console.log('🎉 DIRECT PRODUCT CREATION TEST PASSED!')
        console.log('✅ Ready to save "هيل حب" with barcode "123456"!')
      } else {
        console.error('❌ DIRECT PRODUCT CREATION TEST FAILED:', result.error)
      }
    })
  }, 3000)
}
