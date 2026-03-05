// Exchange Rate API for real-time currency conversion
import { supabase } from './supabase'

export interface ExchangeRate {
  id: string
  rate: number
  created_at: string
}

export const getCurrentExchangeRate = async (): Promise<number> => {
  try {
    // First try to get from API route (which uses database adapter)
    const apiResponse = await fetch('/api/exchange-rate')
    if (apiResponse.ok) {
      const data = await apiResponse.json()
      console.log('💱 Exchange rate from API:', data.rate)
      return data.rate || 11735
    }
  } catch (apiError) {
    console.warn('⚠️ API route failed, trying direct Supabase:', apiError)
  }

  // Fallback to direct Supabase query
  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.warn('⚠️ Failed to fetch exchange rate from Supabase, using default:', error)
      return 11735 // Default fallback rate
    }

    console.log('💱 Current exchange rate from Supabase:', data.rate)
    return data.rate || 11735
  } catch (error) {
    console.warn('⚠️ Exchange rate API error, using default:', error)
    return 11735 // Default fallback rate
  }
}

export const formatCurrencyWithDetection = (
  price: number,
  exchangeRate: number = 11735
): { amount: number; currency: 'USD' | 'SYP'; formatted: string } => {
  // ✅ Formatting: If price is small, assume USD, otherwise SYP
  const isUSD = price < 100
  
  if (isUSD) {
    const amountSYP = price * exchangeRate
    return {
      amount: amountSYP,
      currency: 'SYP',
      formatted: `${amountSYP.toLocaleString('ar-LB')} ل.س`
    }
  } else {
    return {
      amount: price,
      currency: 'SYP',
      formatted: `${price.toLocaleString('ar-LB')} ل.س`
    }
  }
}
