// Test SQLite Database Operations
import { getDatabase, initializeDatabase } from './sqlite'

export async function testSQLiteOperations() {
  console.log('🧪 Testing SQLite Database Operations...')
  
  try {
    // Initialize database
    await initializeDatabase()
    console.log('✅ Database initialized')
    
    // Get database connection
    const db = await getDatabase()
    console.log('✅ Database connection established')
    
    // Test basic query
    const stmt = await db.prepare(`SELECT COUNT(*) as count FROM products`)
    const result = await stmt.get() as { count: number }
    console.log('📊 Products count:', result.count)
    
    // Test insert
    const insertStmt = await db.prepare(`
      INSERT OR REPLACE INTO products 
      (name_ar, barcode, category, wholesale_price, stock_quantity, packaging, roast_level)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    const insertResult = await insertStmt.run(
      'Test Product',
      'TEST123',
      'قهوة عربية',
      5.50,
      50,
      '500جم',
      'خفيف'
    )
    
    console.log('✅ Test product inserted:', insertResult)
    
    // Test fetch
    const fetchStmt = await db.prepare(`SELECT * FROM products WHERE barcode = ?`)
    const product = await fetchStmt.get('TEST123')
    console.log('✅ Test product fetched:', product)
    
    console.log('🎉 All SQLite tests passed!')
    
  } catch (error) {
    console.error('❌ SQLite test failed:', error)
    throw error
  }
}

// Auto-run test in development
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  testSQLiteOperations().catch(console.error)
}
