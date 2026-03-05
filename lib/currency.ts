// Mathematical Engine for Currency Calculations

export interface CurrencyCalculation {
  wholesalePriceUSD: number
  exchangeRate: number
  retailPriceUSD: number
  retailPriceLS: number
  wholesalePriceLS: number
}

export const calculateRetailPrice = (wholesalePriceUSD: number): number => {
  return wholesalePriceUSD * 1.20 // 20% margin
}

export const calculateWholesalePriceLS = (wholesalePriceUSD: number, exchangeRate: number): number => {
  return wholesalePriceUSD * exchangeRate
}

export const calculateRetailPriceLS = (wholesalePriceUSD: number, exchangeRate: number): number => {
  const retailPriceUSD = calculateRetailPrice(wholesalePriceUSD)
  return Math.round(retailPriceUSD * exchangeRate) // Round to nearest whole number
}

export const formatCurrencyUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatCurrencyLS = (amount: number): string => {
  // Format with Arabic number grouping and add 'ل.س' suffix
  const formatted = new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  return `${formatted} ل.س`
}

export const calculateAllPrices = (
  wholesalePriceUSD: number, 
  exchangeRate: number
): CurrencyCalculation => {
  const retailPriceUSD = calculateRetailPrice(wholesalePriceUSD)
  const wholesalePriceLS = calculateWholesalePriceLS(wholesalePriceUSD, exchangeRate)
  const retailPriceLS = calculateRetailPriceLS(wholesalePriceUSD, exchangeRate)

  return {
    wholesalePriceUSD,
    exchangeRate,
    retailPriceUSD,
    retailPriceLS,
    wholesalePriceLS,
  }
}

export const formatDualCurrency = (
  wholesalePriceUSD: number, 
  exchangeRate: number,
  showRetail: boolean = false
): string => {
  const prices = calculateAllPrices(wholesalePriceUSD, exchangeRate)
  
  if (showRetail) {
    return `${formatCurrencyUSD(prices.retailPriceUSD)} / ${formatCurrencyLS(prices.retailPriceLS)}`
  } else {
    return `${formatCurrencyUSD(prices.wholesalePriceUSD)} / ${formatCurrencyLS(prices.wholesalePriceLS)}`
  }
}

export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export const isExpiringSoon = (expiryDate: string, daysThreshold: number = 30): boolean => {
  if (!expiryDate) return false
  
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays <= daysThreshold && diffDays > 0
}
