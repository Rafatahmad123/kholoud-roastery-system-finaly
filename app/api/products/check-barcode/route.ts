import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/database-adapter'

// POST /api/products/check-barcode - Check if barcode exists
export async function POST(request: NextRequest) {
  console.log('🔍 Checking barcode existence via API...')
  
  try {
    const { barcode } = await request.json()
    
    if (!barcode) {
      return NextResponse.json({ error: 'Barcode is required' }, { status: 400 })
    }
    
    console.log('🔍 Checking barcode:', barcode)
    
    // Get all products and check for barcode
    const products = await db.getProducts()
    const existingProduct = products.find(p => p.barcode === barcode)
    
    const exists = !!existingProduct
    
    console.log('✅ Barcode check result:', { barcode, exists })
    
    return NextResponse.json({ 
      exists,
      product: existingProduct ? {
        id: existingProduct.id,
        name: existingProduct.name_ar,
        barcode: existingProduct.barcode
      } : null
    })
    
  } catch (error) {
    console.error('❌ Error checking barcode:', error)
    return NextResponse.json({ error: 'Failed to check barcode' }, { status: 500 })
  }
}
