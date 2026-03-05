import { supabase } from './supabase'

export const initializeDatabaseSchema = async () => {
  try {
    // Check if columns exist and add them if they don't
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'products' })

    if (columnsError) {
      console.error('Error checking table columns:', columnsError)
      return false
    }

    const existingColumns = columns?.map((col: any) => col.column_name) || []
    const requiredColumns = ['wholesale_price_usd', 'exchange_rate', 'expiry_date']
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))

    if (missingColumns.length > 0) {
      console.log('Adding missing columns:', missingColumns)
      
      // Add wholesale_price_usd column
      if (!existingColumns.includes('wholesale_price_usd')) {
        await supabase.rpc('add_column', {
          table_name: 'products',
          column_name: 'wholesale_price_usd',
          column_type: 'numeric',
          default_value: '0'
        })
      }

      // Add exchange_rate column
      if (!existingColumns.includes('exchange_rate')) {
        await supabase.rpc('add_column', {
          table_name: 'products',
          column_name: 'exchange_rate',
          column_type: 'numeric',
          default_value: '0'
        })
      }

      // Add expiry_date column
      if (!existingColumns.includes('expiry_date')) {
        await supabase.rpc('add_column', {
          table_name: 'products',
          column_name: 'expiry_date',
          column_type: 'date'
        })
      }
    }

    return true
  } catch (error) {
    console.error('Error initializing database schema:', error)
    return false
  }
}

// Alternative approach using direct SQL if RPC doesn't work
export const addMissingColumns = async () => {
  try {
    // Add wholesale_price_usd column
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS wholesale_price_usd NUMERIC DEFAULT 0;
      `
    })

    // Add exchange_rate column
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 0;
      `
    })

    // Add expiry_date column
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS expiry_date DATE;
      `
    })

    return true
  } catch (error) {
    console.error('Error adding columns:', error)
    return false
  }
}
