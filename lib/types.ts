export interface Product {
  id: number
  name: string
  barcode: string
  type: string
  roast_level: string
  packaging: string
  stock: number
  price: number // Legacy field - calculated from wholesale_price_usd
  wholesale_price_usd: number
  exchange_rate: number
  expiry_date: string
  category?: string
  created_at: string
  updated_at: string
}

export interface Sale {
  id: number
  total_amount: number
  payment_method: string
  created_at: string
  updated_at: string
}

export interface SaleItem {
  id: number
  sale_id: number
  product_id: number
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
}

export interface DashboardStats {
  daily_sales: number
  total_orders: number
  stock_levels: number
  profit: number
}
