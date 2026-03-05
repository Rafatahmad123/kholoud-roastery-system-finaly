import { supabase } from './supabase'

export const runDatabaseDiagnostic = async () => {
  console.log('🚀 Starting database diagnostic...')
  const results = {
    connection: false,
    tableExists: false,
    columns: [] as string[],
    canInsert: false,
    errors: [] as string[]
  }

  try {
    // Test 1: Connection
    console.log('1️⃣ Testing Supabase connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('products')
      .select('count')
      .limit(1)

    if (connectionError) {
      results.errors.push(`Connection failed: ${connectionError.message}`)
      console.error('❌ Connection failed:', connectionError)
      return results
    }
    results.connection = true
    console.log('✅ Connection successful')

    // Test 2: Table exists and get columns
    console.log('2️⃣ Checking products table structure...')
    const { data: tableData, error: tableError } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    if (tableError) {
      results.errors.push(`Table access failed: ${tableError.message}`)
      console.error('❌ Table access failed:', tableError)
      return results
    }

    results.tableExists = true
    console.log('✅ Products table accessible')

    if (tableData && tableData.length > 0) {
      results.columns = Object.keys(tableData[0])
      console.log('📋 Found columns:', results.columns)
    } else {
      console.log('ℹ️ Table is empty, trying to get schema...')
      // Try to get column info from information_schema
      try {
        const { data: schemaData, error: schemaError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'products')
          .eq('table_schema', 'public')

        if (!schemaError && schemaData) {
          results.columns = schemaData.map(col => col.column_name)
          console.log('📋 Columns from schema:', results.columns)
        }
      } catch (schemaErr) {
        console.log('⚠️ Could not get schema info, proceeding with test insert...')
      }
    }

    // Test 3: Try to add missing columns
    console.log('3️⃣ Checking for required columns...')
    const requiredColumns = ['name', 'barcode', 'wholesale_price_usd', 'exchange_rate', 'expiry_date']
    const missingColumns = requiredColumns.filter(col => !results.columns.includes(col))

    if (missingColumns.length > 0) {
      console.log('⚠️ Missing columns:', missingColumns)
      
      for (const column of missingColumns) {
        try {
          const columnDef = {
            'wholesale_price_usd': 'NUMERIC DEFAULT 0',
            'exchange_rate': 'NUMERIC DEFAULT 0', 
            'expiry_date': 'DATE'
          }[column] || 'TEXT'

          console.log(`➕ Adding column: ${column}`)
          
          // Try direct SQL first
          const { error: addError } = await supabase.rpc('exec_sql', {
            sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS ${column} ${columnDef};`
          })

          if (addError) {
            console.log(`⚠️ Could not add ${column} via RPC: ${addError.message}`)
            results.errors.push(`Failed to add column ${column}: ${addError.message}`)
          } else {
            console.log(`✅ Column ${column} added successfully`)
            results.columns.push(column)
          }
        } catch (err) {
          const errorMsg = `Error adding column ${column}: ${(err as Error).message}`
          console.error(`❌ ${errorMsg}`)
          results.errors.push(errorMsg)
        }
      }
    } else {
      console.log('✅ All required columns exist')
    }

    // Test 4: Try a test insert
    console.log('4️⃣ Testing insert operation...')
    const testData = {
      name: 'Diagnostic Test Product',
      barcode: 'DIAG_TEST_' + Date.now(),
      type: 'Test',
      roast_level: 'متوسط',
      packaging: '1 كجم',
      stock: 1,
      wholesale_price_usd: 1.00,
      exchange_rate: 37500,
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }

    const { data: insertData, error: insertError } = await supabase
      .from('products')
      .insert(testData)
      .select()
      .single()

    if (insertError) {
      results.errors.push(`Insert failed: ${insertError.message}`)
      console.error('❌ Insert failed:', insertError)
    } else {
      results.canInsert = true
      console.log('✅ Insert successful:', insertData)

      // Clean up test data
      if (insertData?.id) {
        await supabase.from('products').delete().eq('id', insertData.id)
        console.log('🧹 Test data cleaned up')
      }
    }

  } catch (error) {
    const errorMsg = `Diagnostic failed: ${(error as Error).message}`
    results.errors.push(errorMsg)
    console.error('❌ Diagnostic failed:', error)
  }

  console.log('📊 Diagnostic results:', results)
  return results
}

// Auto-run diagnostic on import
if (typeof window !== 'undefined') {
  runDatabaseDiagnostic().then(results => {
    console.log('🏁 Database diagnostic completed')
    if (results.errors.length > 0) {
      console.warn('⚠️ Issues found:', results.errors)
    } else {
      console.log('🎉 All checks passed!')
    }
  })
}
