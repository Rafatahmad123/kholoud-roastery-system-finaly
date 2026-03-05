// API functions for Expenses module
import { getCurrentExchangeRate } from './exchange-rate-api'

export interface Expense {
  id: string
  description: string
  amount: number
  currency: 'SYP' | 'USD'
  category: string
  created_at: string
  updated_at: string
}

export const fetchExpenses = async (filters?: {
  category?: string
  startDate?: string
  endDate?: string
}): Promise<Expense[]> => {
  try {
    const params = new URLSearchParams()
    if (filters?.category && filters.category !== 'all') {
      params.append('category', filters.category)
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate)
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate)
    }

    const response = await fetch(`/api/expenses?${params.toString()}`)
    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('❌ Error fetching expenses:', error)
    return []
  }
}

export const createExpense = async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<Expense | null> => {
  try {
    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    })
    
    if (response.ok) {
      const result = await response.json()
      return result.data
    }
    return null
  } catch (error) {
    console.error('❌ Error creating expense:', error)
    return null
  }
}

export const updateExpense = async (id: string, updates: Partial<Expense>): Promise<Expense | null> => {
  try {
    const response = await fetch('/api/expenses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    })
    
    if (response.ok) {
      const result = await response.json()
      return result.data
    }
    return null
  } catch (error) {
    console.error('❌ Error updating expense:', error)
    return null
  }
}

export const deleteExpense = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/expenses?id=${id}`, {
      method: 'DELETE'
    })
    return response.ok
  } catch (error) {
    console.error('❌ Error deleting expense:', error)
    return false
  }
}

export const getTotalExpenses = async (filters?: {
  category?: string
  startDate?: string
  endDate?: string
}): Promise<number> => {
  try {
    const expenses = await fetchExpenses(filters)
    // ✅ Currency Sync: Apply the 11735 exchange rate for any USD entries
    const exchangeRate = 11735 // Fixed exchange rate as requested
    
    return expenses.reduce((total, expense) => {
      const amountInSYP = expense.currency === 'USD' 
        ? expense.amount * exchangeRate  // ✅ Currency Sync: Apply 11735 rate
        : expense.amount
      return total + amountInSYP
    }, 0)
  } catch (error) {
    console.error('❌ Error calculating total expenses:', error)
    return 0
  }
}

export const getExpensesByCategory = async (): Promise<{ [category: string]: number }> => {
  try {
    const expenses = await fetchExpenses()
    // ✅ Currency Sync: Apply the 11735 exchange rate for any USD entries
    const exchangeRate = 11735 // Fixed exchange rate as requested
    
    return expenses.reduce((acc, expense) => {
      const amountInSYP = expense.currency === 'USD' 
        ? expense.amount * exchangeRate  // ✅ Currency Sync: Apply 11735 rate
        : expense.amount
      
      if (!acc[expense.category]) {
        acc[expense.category] = 0
      }
      acc[expense.category] += amountInSYP
      
      return acc
    }, {} as { [category: string]: number })
  } catch (error) {
    console.error('❌ Error calculating expenses by category:', error)
    return {}
  }
}
