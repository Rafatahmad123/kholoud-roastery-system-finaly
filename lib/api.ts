import { Product, Sale, SaleItem, DashboardStats } from './types'
import { calculateAllPrices, formatDualCurrency } from './currency'

// Products API - Now using fetch to call server-side API routes
export const fetchProducts = async (): Promise<Product[]> => {
  console.log('📊 Fetching products via API...')
  
  try {
    const response = await fetch('/api/products')
    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }
    
    const products = await response.json()
    console.log('✅ Products fetched:', products.length)
    return products
  } catch (error) {
    console.error('❌ Error fetching products:', error)
    return []
  }
}

export const fetchProductByBarcode = async (barcode: string): Promise<Product | null> => {
  console.log('🔍 Fetching product by barcode via API:', barcode)
  
  try {
    const response = await fetch('/api/products')
    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }
    
    const products = await response.json()
    const product = products.find((p: Product) => p.barcode === barcode)
    
    if (product) {
      console.log('✅ Product found:', product.name)
      return product
    }
    
    console.log('❌ Product not found')
    return null
  } catch (error) {
    console.error('❌ Error fetching product by barcode:', error)
    return null
  }
}

export const createProduct = async (productData: {
  name: string
  barcode: string
  type: string
  roast_level: string
  packaging: string
  stock: number
  wholesale_price_usd: number
  exchange_rate: number
  expiry_date?: string
  category?: string
}): Promise<Product> => {
  console.log('📝 CREATING PRODUCT VIA API - FINAL SUCCESS!')
  console.log('📊 Product Data:', productData)
  
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create product')
    }
    
    const createdProduct = await response.json()
    console.log('✅✅✅ SUCCESS! هيل حب CREATED via API:', createdProduct)
    console.log('🎉 PRODUCT CREATED SUCCESSFULLY!')
    
    return createdProduct
    
  } catch (error) {
    console.error('❌ PRODUCT INSERT ERROR:', error)
    throw error
  }
}

export const updateProduct = async (id: number, productData: {
  name: string
  barcode: string
  type: string
  roast_level: string
  packaging: string
  stock: number
  wholesale_price_usd: number
  exchange_rate: number
  expiry_date?: string
  category?: string
}): Promise<Product> => {
  console.log('📝 UPDATING PRODUCT VIA API:', id)
  console.log('📊 Product Data:', productData)
  
  try {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update product')
    }
    
    const updatedProduct = await response.json()
    console.log('✅✅✅ SUCCESS! Product UPDATED via API:', updatedProduct)
    
    return updatedProduct
    
  } catch (error) {
    console.error('❌ PRODUCT UPDATE ERROR:', error)
    throw error
  }
}

export const deleteProduct = async (id: number): Promise<{ message: string; product: Product }> => {
  console.log('🗑️ DELETING PRODUCT VIA API:', id)
  
  try {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete product')
    }
    
    const result = await response.json()
    console.log('✅✅✅ SUCCESS! Product DELETED via API:', result)
    
    return result
    
  } catch (error) {
    console.error('❌ PRODUCT DELETE ERROR:', error)
    throw error
  }
}

export const checkBarcodeExists = async (barcode: string): Promise<boolean> => {
  console.log('🔍 Checking barcode existence via API:', barcode)
  
  try {
    const response = await fetch('/api/products/check-barcode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ barcode }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to check barcode')
    }
    
    const result = await response.json()
    console.log('📊 Barcode exists:', result.exists)
    return result.exists
  } catch (error) {
    console.error('❌ Error checking barcode:', error)
    return false
  }
}

// Sales API - Real Supabase Implementation
export const createSale = async (saleData: {
  total_amount: number
  payment_method: string
  items: Array<{
    product_id: number
    quantity: number
    unit_price: number
    total_price: number
  }>
}): Promise<Sale> => {
  console.log('💳 Creating sale via Supabase API...')
  console.log('📊 Sale Data:', saleData)
  
  try {
    const response = await fetch('/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saleData),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Sale creation failed:', errorData)
      throw new Error(errorData.error || 'Failed to create sale')
    }
    
    const createdSale = await response.json()
    console.log('✅✅✅ SUCCESS! Sale created via Supabase:', createdSale)
    
    // Trigger dashboard refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('saleCompleted', { detail: createdSale }))
    }
    
    return createdSale
    
  } catch (error) {
    console.error('❌ SALE INSERT ERROR:', error)
    throw error
  }
}

export const fetchSales = async (): Promise<Sale[]> => {
console.log(' Fetching sales (placeholder)...')
return [] // Placeholder
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  console.log('📊 Fetching dashboard stats via API...')
  
  try {
    const response = await fetch('/api/dashboard/stats')
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats')
    }
    
    const stats = await response.json()
    console.log('✅ Dashboard stats fetched:', stats)
    return stats as DashboardStats
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error)
    return {
      totalProducts: 0,
      totalSales: 0,
      totalRevenue: 0,
      lowStockProducts: 0,
      stockValue: 0,
      daily_sales: 0,
      total_orders: 0,
      profit: 0,
      recent_sales: [],
      stock_levels: { totalStock: 0, lowStockCount: 0, lowStockProducts: [] },
      exchange_rate: 2500,
      formatted_values: { daily_sales: '0 ل.س', profit: '0 ل.س', stock_value: '0 ل.س' }
    } as DashboardStats
  }
}

// ✅ POS Trigger: Update POS payment logic to insert inventory audit records
export async function createInventoryAudit(saleId: string, items: any[]) {
  try {
    console.log('📊 Creating inventory audit records for sale:', saleId)
    
    const auditItems = items.map(item => {
      console.log('🔍 DEBUG: Processing audit item:', JSON.stringify(item, null, 2))
      console.log('🔍 DEBUG: item.product_id:', item.product_id, 'Type:', typeof item.product_id)
      
      // ✅ POS FIX: Ensure product_id is correctly mapped from cart items
      const productId = item.product_id || item.id // Fallback to item.id if product_id is null
      console.log('🔍 DEBUG: Final productId for audit:', productId, 'Type:', typeof productId)
      
      return {
        product_id: productId, // ✅ Use the correct product_id (must be Integer)
        product_name: item.product_name || item.name_ar || `Product ${productId}`,
        quantity_sold: item.quantity,
        remaining_stock: item.remaining_stock || item.stock_quantity || 0,
        sale_id: saleId
      }
    })

    console.log('📝 Inventory audit items to create:', auditItems)
    
    // ✅ CONFIRMATION: Print final success log
    const hasValidIds = auditItems.every(item => item.product_id !== null && item.product_id !== undefined)
    if (hasValidIds) {
      console.log('🚀 SUCCESS: POS IS SENDING VALID IDS')
    } else {
      console.log('❌ ERROR: POS IS SENDING INVALID IDS')
    }

    const response = await fetch('/api/inventory-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: auditItems, saleId }),
    })

    const result = await response.json()
    console.log('📊 Inventory audit creation result:', result)
    
    if (!result.success) {
      console.warn('⚠️ Inventory audit logging failed but sale completed:', result.error)
    }
    
    return result
  } catch (error) {
    console.error('❌ Error creating inventory audit:', error)
    // ✅ Safe Integration: Don't fail the sale if audit logging fails
    return { success: false, error: error.message, logged: false }
  }
}

// ✅ Audit View: Fetch daily/monthly audit data
export async function fetchAuditData(date?: string, mode: 'daily' | 'monthly' = 'daily') {
  try {
    console.log('📊 Fetching audit data for date:', date, 'Mode:', mode)
    
    const params = new URLSearchParams()
    if (date) params.append('date', date)
    params.append('mode', mode)
    
    const url = `/api/inventory-logs?${params.toString()}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error('Failed to fetch audit data')
    }
    
    const data = await response.json()
    console.log('📊 Audit data fetched:', data)
    return data.data || []
  } catch (error) {
    console.error('❌ Error fetching audit data:', error)
    throw error
  }
}
