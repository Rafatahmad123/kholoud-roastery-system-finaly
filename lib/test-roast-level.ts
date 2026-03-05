import { supabase } from './supabase'

export const testRoastLevelColumn = async () => {
  console.log('🔥 TESTING roast_level COLUMN ACCESS')
  
  try {
    // Try to select the roast_level column specifically
    const { data, error } = await supabase
      .from('products')
      .select('roast_level')
      .limit(1)

    if (error) {
      console.error('❌ roast_level COLUMN ERROR:', error)
      if (error.code === 'PGRST204') {
        console.log('🔧 roast_level column missing - needs to be added via SQL')
        console.log('📝 RUN THIS SQL: ALTER TABLE products ADD COLUMN IF NOT EXISTS roast_level text;')
      }
      return { success: false, error: error.message, needsFix: true }
    }

    console.log('✅ roast_level COLUMN ACCESS SUCCESSFUL')
    console.log('📊 Sample roast_level data:', data)
    
    return { success: true, data }

  } catch (err) {
    console.error('❌ CRITICAL ERROR:', err)
    return { success: false, error: (err as Error).message }
  }
}

// Auto-run test
if (typeof window !== 'undefined') {
  setTimeout(() => {
    testRoastLevelColumn().then(result => {
      if (result.success) {
        console.log('🎉 roast_level COLUMN IS READY!')
      } else {
        console.error('❌ roast_level COLUMN ISSUE:', result.error)
        if (result.needsFix) {
          console.log('🔧 ADD roast_level COLUMN VIA SQL EDITOR')
        }
      }
    })
  }, 2000)
}
