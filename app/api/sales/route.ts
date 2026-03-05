import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase-client'

// POST /api/sales - Create a new sale with items
export async function POST(request: NextRequest) {
  console.log('💳 Creating sale in Supabase...')
  
  try {
    const saleData = await request.json()
    console.log('📊 Sale Data Received:', saleData)
    
    // Validate required fields
    if (!saleData.total_amount || !saleData.items || saleData.items.length === 0) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: 'Missing required fields: total_amount and items'
      }, { status: 400 })
    }
    
    // Generate UUID for the sale
    const saleId = crypto.randomUUID()
    console.log('🆔 Generated Sale ID:', saleId)
    console.log('🔍 Sale ID type:', typeof saleId, 'Sale ID value:', saleId)
    
    // Insert the sale header
    let saleInsertData = {
      id: saleId,
      total_amount: saleData.total_amount,
      payment_method: saleData.payment_method || 'cash',
      created_at: new Date().toISOString()
    }
    
    console.log('📋 Sale insert data:', saleInsertData)
    
    let sale, saleError
    try {
      const result = await supabase
        .from('sales')
        .insert(saleInsertData)
        .select()
        .single()
      
      sale = result.data
      saleError = result.error
      
      console.log('📊 Supabase result:', { sale, saleError })
      
    } catch (supabaseError) {
      console.error('❌ Supabase call failed:', supabaseError)
      saleError = supabaseError
    }
    
    if (saleError) {
      console.error('❌ Error creating sale header:', saleError)
      
      // Try without created_at if that's the issue
      if (saleError.message?.includes('created_at') || saleError.code === 'PGRST204') {
        console.log('🔄 Retrying without created_at...')
        const retryData = {
          id: saleId,
          total_amount: saleData.total_amount,
          payment_method: saleData.payment_method || 'cash'
        }
        
        const retryResult = await supabase
          .from('sales')
          .insert(retryData)
          .select()
          .single()
        
        sale = retryResult.data
        saleError = retryResult.error
      }
      
      if (saleError) {
        return NextResponse.json({ 
          error: 'Failed to create sale header',
          details: saleError.message || saleError.toString(),
          code: saleError.code,
          hint: saleError.hint
        }, { status: 500 })
      }
    }
    
    console.log('✅ Sale header created:', sale)
    console.log('🔍 Returned sale ID:', sale?.id, 'Type:', typeof sale?.id)
    
    // Verify we have the exact UUID from the database
    const finalSaleId = sale?.id || saleId
    console.log('🔫 Final sale ID for items:', finalSaleId, 'Type:', typeof finalSaleId)
    
    // Insert sale items with proper UUID foreign key
    const saleItems = saleData.items.map((item: any) => {
      console.log('📦 Processing item:', item)
      
      // Validate product_id - should be integer, not UUID
      let productId = item.product_id
      console.log('🔍 Original product_id:', productId, 'Type:', typeof productId)
      
      // ✅ STOP UUID conversion - send as simple integer
      if (typeof productId === 'string') {
        // If it's a string, try to convert to integer directly
        const numericId = parseInt(productId)
        if (!isNaN(numericId)) {
          productId = numericId
          console.log('🔄 Converted string to integer:', productId, 'Type:', typeof productId)
        } else {
          console.error('❌ Cannot convert product_id to integer:', productId)
          productId = 0 // Fallback
        }
      }
      
      // Ensure productId is a number
      if (typeof productId !== 'number') {
        console.error('❌ Product ID is not a number:', productId, 'Type:', typeof productId)
        productId = parseInt(productId) || 0
      }
      
      console.log('✅ Final product_id:', productId, 'Type:', typeof productId)
      
      return {
        id: crypto.randomUUID(),
        sale_id: finalSaleId,  // ✅ Use the exact UUID returned from database
        product_id: productId,  // ✅ Send as INTEGER
        quantity: item.quantity,
        unit_price: item.unit_price,
        wholesale_price: item.wholesale_price || 0, // ✅ Wholesale price from product data
        total_price: item.total_price || (item.unit_price * item.quantity)
        // ✅ REMOVE created_at - only send required columns
      }
    })
    
    console.log('📋 Final sale items to insert:', saleItems)
    
    let items, itemsError
    try {
      const itemsResult = await supabase
        .from('sale_items')
        .insert(saleItems)
        .select()
      
      items = itemsResult.data
      itemsError = itemsResult.error
      
      console.log('📊 Items result:', { items, itemsError })
      
    } catch (supabaseError) {
      console.error('❌ Supabase items call failed:', supabaseError)
      itemsError = supabaseError
    }
    
    if (itemsError) {
      console.error('❌ Error creating sale items:', itemsError)
      console.error('❌ Full error object:', JSON.stringify(itemsError, null, 2))
      console.error('❌ Failed item data:', JSON.stringify(saleItems, null, 2))
      console.error('🔍 DEEP ERROR INSPECTION:')
      console.dir(itemsError, { depth: null })
      
      // ✅ NO RETRY - Database schema is now correct
      // Just return the error immediately for debugging
      try {
        await supabase.from('sales').delete().eq('id', finalSaleId)
        console.log('🗑️ Rolled back sale header due to items failure')
      } catch (rollbackError) {
        console.error('❌ Failed to rollback sale header:', rollbackError)
      }
      
      return NextResponse.json({ 
        error: 'Failed to create sale items',
        details: itemsError.message || itemsError.toString(),
        code: itemsError.code,
        hint: itemsError.hint,
        fullError: itemsError,              // ✅ ENTIRE error object
        failedItems: saleItems,
        errorInspection: {
          code: itemsError.code,
          message: itemsError.message,
          details: itemsError.details,
          hint: itemsError.hint
        }
      }, { status: 500 })
    }
    
    console.log('✅ Sale items created:', items)
    
    // Update product stock quantities
    for (const item of saleData.items) {
      try {
        let productId = item.product_id
        if (typeof productId === 'string' && productId.includes('-')) {
          productId = parseInt(productId.replace(/[^0-9]/g, ''))
        }
        
        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            stock_quantity: supabase.rpc('decrement_stock', { 
              product_id: productId, 
              quantity: item.quantity 
            })
          })
          .eq('id', productId)
        
        if (stockError) {
          console.error('❌ Error updating stock:', stockError)
          // Don't throw error here, just log it
        }
      } catch (stockError) {
        console.error('❌ Stock update exception:', stockError)
      }
    }
    
    const result = {
      ...sale,
      items: items,
      message: 'Sale created successfully'
    }
    
    console.log('✅✅✅ SUCCESS! Complete sale created:', result)
    console.log('🎉 FINAL SUCCESS RESPONSE:', JSON.stringify(result, null, 2))
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ ERROR: Failed to create sale:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      constructor: error?.constructor?.name
    })
    
    return NextResponse.json({ 
      error: 'Failed to create sale',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET /api/sales - Fetch all sales
export async function GET() {
  console.log('📊 Fetching all sales from Supabase...')
  
  try {
    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        id,
        total_amount,
        payment_method,
        created_at,
        updated_at,
        sale_items (
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          products (
            id,
            name_ar,
            barcode,
            wholesale_price
          )
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching sales:', error)
      throw new Error(`Failed to fetch sales: ${error.message}`)
    }
    
    console.log('✅ Sales fetched:', sales?.length || 0)
    
    return NextResponse.json(sales || [])
    
  } catch (error) {
    console.error('❌ ERROR: Failed to fetch sales:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch sales',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
