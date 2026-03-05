'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ExchangeRateContextType {
  exchangeRate: number
  setExchangeRate: (rate: number) => void
  updateAllProductsExchangeRate: (newRate: number) => Promise<void>
  recalculateAllPrices: () => void
  isLoading?: boolean
}

const ExchangeRateContext = createContext<ExchangeRateContextType | undefined>(undefined)

export function ExchangeRateProvider({ children }: { children: ReactNode }) {
  const [exchangeRate, setExchangeRateState] = useState(37500) // Default LBP/USD rate
  const [isLoading, setIsLoading] = useState(true)

  const setExchangeRate = (rate: number) => {
    if (rate > 0) {
      setExchangeRateState(rate)
      // Safe localStorage access
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('exchangeRate', rate.toString())
        } catch (error) {
          console.warn('Could not save exchange rate to localStorage:', error)
        }
      }
      
      // Trigger global price recalculation
      recalculateAllPrices()
    }
  }

  const recalculateAllPrices = () => {
    // Force re-render of components that use exchange rate
    // This will trigger price recalculation in POS and Inventory
    console.log('💱 Triggering global price recalculation with rate:', exchangeRate)
    
    // Dispatch custom event to notify components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('exchangeRateChanged', { 
        detail: { exchangeRate } 
      }))
    }
  }

  const updateAllProductsExchangeRate = async (newRate: number) => {
    try {
      console.log('💱 Updating exchange rate via API:', newRate)
      
      // Update exchange rate via API
      const response = await fetch('/api/exchange-rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rate: newRate }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update exchange rate')
      }
      
      const result = await response.json()
      console.log('✅ Exchange rate updated successfully:', result)

      // Update local state
      setExchangeRate(newRate)
      
    } catch (error) {
      console.error('❌ Error in updateAllProductsExchangeRate:', error)
      throw error
    }
  }

  // Load exchange rate from API on mount (client-side only)
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    const loadExchangeRate = async () => {
      try {
        const response = await fetch('/api/exchange-rate')
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rate')
        }
        
        const data = await response.json()
        const rate = data.rate
        
        if (rate && rate > 0) {
          setExchangeRateState(rate)
          console.log('💱 Loaded exchange rate from API:', rate)
          
          // Also save to localStorage as backup
          localStorage.setItem('exchangeRate', rate.toString())
        }
      } catch (error) {
        console.warn('Could not load exchange rate from API, trying localStorage:', error)
        
        // Fallback to localStorage
        try {
          const savedRate = localStorage.getItem('exchangeRate')
          if (savedRate) {
            const parsedRate = parseFloat(savedRate)
            if (!isNaN(parsedRate) && parsedRate > 0) {
              setExchangeRateState(parsedRate)
              console.log('💱 Loaded exchange rate from localStorage fallback:', parsedRate)
            }
          }
        } catch (localStorageError) {
          console.warn('Could not load exchange rate from localStorage:', localStorageError)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadExchangeRate()
  }, [])

  const value = {
    exchangeRate,
    setExchangeRate,
    updateAllProductsExchangeRate,
    recalculateAllPrices,
    isLoading
  }

  return (
    <ExchangeRateContext.Provider value={value}>
      {children}
    </ExchangeRateContext.Provider>
  )
}

export function useExchangeRate() {
  const context = useContext(ExchangeRateContext)
  if (context === undefined) {
    throw new Error('useExchangeRate must be used within an ExchangeRateProvider')
  }
  return context
}
