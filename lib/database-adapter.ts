// Database Adapter for Cloud Deployment (SQLite vs Supabase)
import { supabase, SUPABASE_SCHEMA } from './supabase-client'

export type DatabaseType = 'sqlite' | 'supabase'

// Determine which database to use based on environment
const isProduction = process.env.NODE_ENV === 'production'
const useLocalDB = process.env.NEXT_PUBLIC_USE_LOCAL_DB === 'true'
const databaseType: DatabaseType = (useLocalDB || !isProduction) ? 'sqlite' : 'supabase'

console.log(`🗄️ Using database: ${databaseType} (Production: ${isProduction}, Local: ${useLocalDB})`)

// Product interface for both databases
export interface ProductRecord {
  id: number
  name_ar: string
  barcode?: string
  category?: string
  wholesale_price: number
  stock_quantity: number
  packaging?: string
  roast_level?: string
  created_at: string
  updated_at: string
}

// Exchange Rate interface
export interface ExchangeRateRecord {
  id: number
  rate: number
  created_at: string
  updated_at: string
}

// SQLite Database Operations (Dynamic Import) - DISABLED FOR PRODUCTION
// class SQLiteAdapter {
//   private async getSQLiteDB() {
//     if (typeof window !== 'undefined') {
//       throw new Error('SQLite is only available on server side')
//     }
    
//     // Dynamic import to avoid bundling issues
//     const { getDatabase } = await import('./sqlite')
//     return await getDatabase()
//   }

//   async getProducts(): Promise<ProductRecord[]> {
//     const db = await this.getSQLiteDB()
//     const stmt = await db.prepare(`SELECT * FROM products ORDER BY created_at DESC`)
//     return await stmt.all() as ProductRecord[]
//   }

//   async getProduct(id: number): Promise<ProductRecord | null> {
//     const db = await this.getSQLiteDB()
//     const stmt = await db.prepare(`SELECT * FROM products WHERE id = ?`)
//     return await stmt.get(id) as ProductRecord | null
//   }

//   async createProduct(product: Partial<ProductRecord>): Promise<ProductRecord> {
//     // Open fresh connection for insert
//     const freshDb = await this.getSQLiteDB()
//     const stmt = await freshDb.prepare(`
//       INSERT INTO products (name_ar, barcode, category, wholesale_price, stock_quantity, packaging, roast_level)
//       VALUES (?, ?, ?, ?, ?, ?, ?)
//     `)
    
//     const result = await stmt.run(
//       product.name_ar,
//       product.barcode,
//       product.category,
//       product.wholesale_price,
//       product.stock_quantity,
//       product.packaging,
//       product.roast_level
//     )
    
//     console.log('✅ Product insert result:', result)
    
//     const newProduct = await this.getProduct(result.lastID as number)
//     if (!newProduct) throw new Error('Failed to retrieve created product')
//     return newProduct
//   }

//   async updateProduct(id: number, product: Partial<ProductRecord>): Promise<ProductRecord> {
//     // Open fresh connection for update
//     const freshDb = await this.getSQLiteDB()
//     const stmt = await freshDb.prepare(`
//       UPDATE products 
//       SET name_ar = ?, barcode = ?, category = ?, wholesale_price = ?, 
//           stock_quantity = ?, packaging = ?, roast_level = ?, updated_at = CURRENT_TIMESTAMP
//       WHERE id = ?
//     `)
    
//     await stmt.run(
//       product.name_ar,
//       product.barcode,
//       product.category,
//       product.wholesale_price,
//       product.stock_quantity,
//       product.packaging,
//       product.roast_level,
//       id
//     )
    
//     const updatedProduct = await this.getProduct(id)
//     if (!updatedProduct) throw new Error('Failed to retrieve updated product')
//     return updatedProduct
//   }

//   async deleteProduct(id: number): Promise<void> {
//     // Open fresh connection for delete
//     const freshDb = await this.getSQLiteDB()
//     const stmt = await freshDb.prepare(`DELETE FROM products WHERE id = ?`)
//     await stmt.run(id)
//   }

//   async getExchangeRate(): Promise<number> {
//     const db = await this.getSQLiteDB()
//     const stmt = await db.prepare(`
//       SELECT rate FROM exchange_rates 
//       ORDER BY created_at DESC 
//       LIMIT 1
//     `)
//     const result = await stmt.get() as { rate: number } | undefined
//     return result?.rate || 37500
//   }

//   async setExchangeRate(rate: number): Promise<void> {
//     // Open fresh connection for insert
//     const freshDb = await this.getSQLiteDB()
//     const stmt = await freshDb.prepare(`INSERT INTO exchange_rates (rate) VALUES (?)`)
//     await stmt.run(rate)
//   }
// }

// Supabase Database Operations
class SupabaseAdapter {
  async getProducts(): Promise<ProductRecord[]> {
    console.log("🌐 Fetching from Supabase...")
    const { data, error } = await supabase
      .from(SUPABASE_SCHEMA.products.table)
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw new Error(`Supabase error: ${error.message}`)
    return data as ProductRecord[] || []
  }

  async getProduct(id: number): Promise<ProductRecord | null> {
    console.log("🌐 Fetching single product from Supabase...")
    const { data, error } = await supabase
      .from(SUPABASE_SCHEMA.products.table)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Supabase error: ${error.message}`)
    }
    return data as ProductRecord
  }

  async createProduct(product: Partial<ProductRecord>): Promise<ProductRecord> {
    console.log("💾 Saving to Supabase...")
    
    // Strict Schema Mapping - Only send required columns
    const supabaseProduct = {
      name_ar: product.name_ar,
      barcode: product.barcode || null,
      wholesale_price: product.wholesale_price || 0,
      stock_quantity: product.stock_quantity || 0,
      category: product.category || null,
      packaging: product.packaging || null,
      roast_level: product.roast_level || null
    }
    
    console.log("📋 Sending to Supabase:", supabaseProduct)
    
    const { data, error } = await supabase
      .from(SUPABASE_SCHEMA.products.table)
      .insert(supabaseProduct)
      .select()
      .single()
    
    if (error) {
      console.error("❌ Supabase error details:", error)
      throw new Error(`Supabase error: ${error.message}`)
    }
    
    console.log("✅ Successfully saved to Supabase!")
    return data as ProductRecord
  }

  async updateProduct(id: number, product: Partial<ProductRecord>): Promise<ProductRecord> {
    console.log("🔄 Updating in Supabase...")
    const { data, error } = await supabase
      .from(SUPABASE_SCHEMA.products.table)
      .update({ ...product, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error(`Supabase error: ${error.message}`)
    console.log("✅ Successfully updated in Supabase!")
    return data as ProductRecord
  }

  async deleteProduct(id: number): Promise<void> {
    console.log("🗑️ Deleting from Supabase...")
    const { error } = await supabase
      .from(SUPABASE_SCHEMA.products.table)
      .delete()
      .eq('id', id)
    
    if (error) throw new Error(`Supabase error: ${error.message}`)
    console.log("✅ Successfully deleted from Supabase!")
  }

  async getExchangeRate(): Promise<number> {
    console.log("💱 Fetching exchange rate from Supabase...")
    const { data, error } = await supabase
      .from('settings')
      .select('rate')
      .eq('id', 'exchange_rate')
      .single()
    
    if (error) {
      console.error("❌ Supabase error details:", error)
      throw new Error(`Supabase error: ${error.message}`)
    }
    
    const rate = data?.rate || 37500
    console.log("✅ Exchange rate found:", rate)
    return rate
  }

  async setExchangeRate(rate: number): Promise<void> {
    console.log("💱 Setting exchange rate in Supabase...")
    
    // Use upsert to settings table with exchange_rate ID
    console.log("📋 Sending to Supabase settings:", { id: 'exchange_rate', rate })
    
    const { error } = await supabase
      .from('settings')
      .upsert({ 
        id: 'exchange_rate',
        rate: rate,
        updated_at: new Date().toISOString()
      }, 
      {
        onConflict: 'id'
      })
    
    if (error) {
      console.error("❌ Supabase error details:", error)
      throw new Error(`Supabase error: ${error.message}`)
    }
    
    console.log("✅ Successfully set exchange rate in Supabase!")
  }
}

// Export the appropriate adapter - ONLY SUPABASE FOR PRODUCTION
const adapter = new SupabaseAdapter() // Force Supabase for production

export const db = {
  getProducts: () => adapter.getProducts(),
  getProduct: (id: number) => adapter.getProduct(id),
  createProduct: (product: Partial<ProductRecord>) => adapter.createProduct(product),
  updateProduct: (id: number, product: Partial<ProductRecord>) => adapter.updateProduct(id, product),
  deleteProduct: (id: number) => adapter.deleteProduct(id),
  getExchangeRate: () => adapter.getExchangeRate(),
  setExchangeRate: (rate: number) => adapter.setExchangeRate(rate),
  type: 'supabase' // Always Supabase for production
}
