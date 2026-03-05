import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/database-adapter'

// GET /api/products - Fetch all products
export async function GET() {
  console.log(' Fetching products via API...')
  
  try {
    const products = await db.getProducts()
    
    // Map database records to frontend format
    const mappedProducts = products.map(product => ({
      ...product,
      name: product.name_ar,
      wholesale_price_usd: product.wholesale_price,
      stock: product.stock_quantity
    }))
    
    console.log('✅ Products fetched successfully:', mappedProducts.length)
    return NextResponse.json(mappedProducts)
    
  } catch (error) {
    console.error('❌ Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  console.log('📝 Creating product via API...')
  
  try {
    const productData = await request.json()
    
    // Map to database schema
    const newProduct = {
      name_ar: productData.name,
      barcode: productData.barcode,
      category: productData.category || productData.type,
      wholesale_price: Number(productData.wholesale_price_usd),
      stock_quantity: Number(productData.stock),
      packaging: productData.packaging,
      roast_level: productData.roast_level
    }

    console.log('🗄️ Database Data for Insert:', newProduct)

    // Create product using adapter
    const createdProduct = await db.createProduct(newProduct)
    
    console.log('✅✅✅ SUCCESS! Product CREATED:', createdProduct)
    
    // Return mapped product for frontend
    const mappedProduct = {
      ...createdProduct,
      name: createdProduct.name_ar,
      wholesale_price_usd: createdProduct.wholesale_price,
      stock: createdProduct.stock_quantity
    }
    
    return NextResponse.json(mappedProduct)
    
  } catch (error) {
    console.error('❌ PRODUCT CREATE ERROR:', error)
    return NextResponse.json({ 
      error: `Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
