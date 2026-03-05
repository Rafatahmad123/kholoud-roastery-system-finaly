import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/database-adapter'

// PUT /api/products/[id] - Update product
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('📝 Updating product via API:', params.id)
  
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }
    
    const productData = await request.json()
    
    // Map to exact database schema
    const updateData = {
      name_ar: productData.name,
      barcode: productData.barcode,
      category: productData.category || productData.type,
      wholesale_price: Number(productData.wholesale_price_usd),
      stock_quantity: Number(productData.stock),
      packaging: productData.packaging,
      roast_level: productData.roast_level
    }

    console.log('🗄️ Database Data for Update:', updateData)

    // Update product using adapter
    const updatedProduct = await db.updateProduct(id, updateData)
    
    console.log('✅✅✅ SUCCESS! Product UPDATED:', updatedProduct)
    
    // Return mapped product for frontend
    const mappedProduct = {
      ...updatedProduct,
      name: updatedProduct.name_ar,
      wholesale_price_usd: updatedProduct.wholesale_price,
      stock: updatedProduct.stock_quantity
    }
    
    return NextResponse.json(mappedProduct)
    
  } catch (error) {
    console.error('❌ PRODUCT UPDATE ERROR:', error)
    return NextResponse.json({ 
      error: `Failed to update product: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('🗑️ Deleting product via API:', params.id)
  console.log('🆔 ID Type:', typeof params.id, 'Value:', params.id)
  
  try {
    const id = parseInt(params.id)
    console.log('🔢 Parsed ID:', id, 'Is NaN:', isNaN(id))
    
    if (isNaN(id)) {
      console.error('❌ Invalid product ID - not a number')
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }
    
    // First get product to return it
    const productToDelete = await db.getProduct(id)
    
    console.log('📋 Product to delete:', productToDelete)
    
    if (!productToDelete) {
      console.error('❌ Product not found for ID:', id)
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    // Delete product using adapter
    await db.deleteProduct(id)
    
    console.log('✅✅✅ SUCCESS! Product DELETED')
    
    // Return deleted product
    const mappedProduct = {
      ...productToDelete,
      name: productToDelete.name_ar,
      wholesale_price_usd: productToDelete.wholesale_price,
      stock: productToDelete.stock_quantity
    }
    
    return NextResponse.json({ 
      message: 'Product deleted successfully',
      product: mappedProduct 
    })
    
  } catch (error) {
    console.error('❌ PRODUCT DELETE ERROR:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available')
    return NextResponse.json({ 
      error: `Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
