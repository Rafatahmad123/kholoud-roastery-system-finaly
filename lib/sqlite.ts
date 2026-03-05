import sqlite3 from 'sqlite3'
import { Database, open } from 'sqlite'

let databaseInstance: Database | null = null

export async function getDatabase(): Promise<Database> {
  // Always return a fresh connection for each API call
  console.log('🗄️ Opening fresh database connection...')
  
  try {
    const db = await open({
      filename: './database/local.db',
      driver: sqlite3.Database
    })
    
    console.log('✅ Database connection opened successfully')
    return db
  } catch (error) {
    console.error('❌ Failed to open database:', error)
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function closeDatabase(db: Database): Promise<void> {
  try {
    if (db) {
      await db.close()
      console.log('🔓 Database connection closed')
    }
  } catch (error) {
    console.warn('⚠️ Error closing database:', error)
  }
}

// Initialize database with tables
export async function initializeDatabase(): Promise<void> {
  console.log('🚀 Initializing database...')
  
  try {
    const db = await getDatabase()
    
    // Create products table with exact schema
    await db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_ar TEXT NOT NULL,
        barcode TEXT UNIQUE,
        category TEXT,
        wholesale_price REAL DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        packaging TEXT,
        roast_level TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create exchange_rates table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS exchange_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rate REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    console.log('✅ Database initialized successfully')
    await closeDatabase(db)
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}
