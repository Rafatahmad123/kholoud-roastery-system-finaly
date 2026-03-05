import { supabase } from './supabase'

export const checkAndFixDatabaseSchema = async () => {
  console.log('🔍 Checking database schema...')
  
  try {
    // Check if products table exists and get its columns
    const { data: columns, error: columnsError } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    if (columnsError) {
      console.error('❌ Error accessing products table:', columnsError)
      return { success: false, error: columnsError.message }
    }

    console.log('✅ Products table accessible')

    // Get actual column names from the first row
    if (columns && columns.length > 0) {
      const existingColumns = Object.keys(columns[0])
      console.log('📋 Existing columns:', existingColumns)

      const requiredColumns = ['name', 'barcode', 'wholesale_price_usd', 'exchange_rate', 'expiry_date']
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))

      if (missingColumns.length > 0) {
        console.log('⚠️ Missing columns:', missingColumns)
        
        // Try to add missing columns one by one
        for (const column of missingColumns) {
          const result = await addColumn(column)
          if (!result.success) {
            return result
          }
        }
      } else {
        console.log('✅ All required columns exist')
      }

      return { success: true, existingColumns }
    } else {
      console.log('ℹ️ Products table is empty, checking schema via RPC...')
      return await checkSchemaViaRPC()
    }

  } catch (error) {
    console.error('❌ Database schema check failed:', error)
    return { success: false, error: (error as Error).message }
  }
}

const addColumn = async (columnName: string) => {
  console.log(`➕ Adding column: ${columnName}`)
  
  try {
    const columnDefinitions = {
      'wholesale_price_usd': 'NUMERIC DEFAULT 0',
      'exchange_rate': 'NUMERIC DEFAULT 0',
      'expiry_date': 'DATE'
    }

    const columnDef = columnDefinitions[columnName as keyof typeof columnDefinitions]
    
    if (!columnDef) {
      return { success: false, error: `Unknown column: ${columnName}` }
    }

    // Try to add column using raw SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS ${columnName} ${columnDef};`
    })

    if (error) {
      console.error(`❌ Failed to add column ${columnName}:`, error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Column ${columnName} added successfully`)
    return { success: true }

  } catch (error) {
    console.error(`❌ Error adding column ${columnName}:`, error)
    return { success: false, error: (error as Error).message }
  }
}

const checkSchemaViaRPC = async () => {
  try {
    // Try to get table information using information_schema
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'products')
      .eq('table_schema', 'public')

    if (error) {
      console.error('❌ RPC schema check failed:', error)
      return { success: false, error: error.message }
    }

    const existingColumns = data?.map(col => col.column_name) || []
    console.log('📋 Columns via RPC:', existingColumns)

    const requiredColumns = ['name', 'barcode', 'wholesale_price_usd', 'exchange_rate', 'expiry_date']
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))

    if (missingColumns.length > 0) {
      console.log('⚠️ Missing columns:', missingColumns)
      
      for (const column of missingColumns) {
        const result = await addColumn(column)
        if (!result.success) {
          return result
        }
      }
    }

    return { success: true, existingColumns }

  } catch (error) {
    console.error('❌ RPC schema check failed:', error)
    return { success: false, error: (error as Error).message }
  }
}

export const testProductInsert = async () => {
  console.log('🧪 Testing product insert...')
  
  try {
    const testProduct = {
      name: 'Test Product',
      barcode: 'TEST123',
      type: 'Test Type',
      roast_level: 'متوسط',
      packaging: '1 كجم',
      stock: 10,
      wholesale_price_usd: 5.00,
      exchange_rate: 37500,
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }

    const { data, error } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single()

    if (error) {
      console.error('❌ Test insert failed:', error)
      return { success: false, error: error.message, details: error }
    }

    console.log('✅ Test insert successful:', data)
    
    // Clean up test product
    if (data?.id) {
      await supabase.from('products').delete().eq('id', data.id)
    }

    return { success: true, data }

  } catch (error) {
    console.error('❌ Test insert failed:', error)
    return { success: false, error: (error as Error).message }
  }
}
