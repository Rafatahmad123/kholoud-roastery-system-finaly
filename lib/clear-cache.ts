// Clear localStorage cache to prevent initialization issues
export const clearCache = () => {
  console.log('🧹 CLEARING LOCAL STORAGE CACHE...')
  
  if (typeof window !== 'undefined') {
    try {
      // Clear exchange rate cache
      localStorage.removeItem('exchangeRate')
      console.log('✅ Exchange rate cache cleared')
      
      // Clear any other app-related cache
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('exchange') || key.includes('supabase') || key.includes('auth'))) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`✅ Removed cache key: ${key}`)
      })
      
      console.log('🎉 LOCAL STORAGE CACHE CLEARED SUCCESSFULLY')
      
      // Force page reload after clearing cache
      setTimeout(() => {
        console.log('🔄 Reloading page after cache clear...')
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error('❌ Error clearing cache:', error)
    }
  } else {
    console.log('ℹ️ Not in browser environment, skipping cache clear')
  }
}

// Auto-clear cache on first load if there are issues
export const checkAndClearCache = () => {
  if (typeof window !== 'undefined') {
    try {
      const exchangeRate = localStorage.getItem('exchangeRate')
      if (exchangeRate) {
        const parsed = parseFloat(exchangeRate)
        // Clear if exchange rate is invalid or too old
        if (isNaN(parsed) || parsed <= 0) {
          console.log('⚠️ Invalid exchange rate found, clearing cache...')
          clearCache()
        }
      }
    } catch (error) {
      console.log('⚠️ Cache check failed, clearing cache...')
      clearCache()
    }
  }
}
