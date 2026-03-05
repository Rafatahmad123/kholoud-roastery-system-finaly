'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Receipt, TrendingDown, Edit2, Trash2, Calendar } from 'lucide-react'
import { getCurrentExchangeRate } from '../../lib/exchange-rate-api'
import { formatCurrencyLS } from '../../lib/currency'

interface Expense {
  id: string
  description: string
  amount: number
  currency: 'SYP' | 'USD'
  category: string
  created_at: string
  updated_at: string
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [exchangeRate, setExchangeRate] = useState(11735)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: 'SYP' as 'SYP' | 'USD',
    category: 'إيجار'
  })

  const categories = [
    'إيجار',
    'رواتب',
    'خدمات',
    'صيانة',
    'تسويق',
    'مشتريات',
    'نقل',
    'أخرى'
  ]

  useEffect(() => {
    fetchExpenses()
    fetchExchangeRate()
  }, [])

  useEffect(() => {
    filterExpenses()
  }, [expenses, searchTerm, categoryFilter])

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      const result = await response.json()
      if (result.data) {
        setExpenses(result.data)
      }
    } catch (error) {
      console.error('❌ Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExchangeRate = async () => {
    try {
      const rate = await getCurrentExchangeRate()
      setExchangeRate(rate)
    } catch (error) {
      console.error('❌ Error fetching exchange rate:', error)
    }
  }

  const filterExpenses = () => {
    let filtered = expenses

    if (searchTerm) {
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === categoryFilter)
    }

    setFilteredExpenses(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // ✅ Expenses Link: Connect modal to POST /api/expenses with fixed exchange rate
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Expense created successfully:', result.data)
        
        // ✅ ERROR HANDLING: Check if expense was created correctly
        if (result.data && result.data.id) {
          console.log('✅ Expense created with ID:', result.data.id)
        } else {
          console.warn('⚠️ Expense may not have been created correctly:', result.data)
        }
        
        setShowAddModal(false)
        setFormData({
          description: '',
          amount: '',
          currency: 'SYP',
          category: 'إيجار'
        })
        fetchExpenses()
        
        // ✅ Real-time Audit: Trigger audit page refresh with fixed 11735 exchange rate
        console.log('💰 Expense added, triggering profit recalculation...')
        const auditEvent = new CustomEvent('expenseAdded', { 
          detail: { 
            amount: parseFloat(formData.amount),
            currency: formData.currency,
            exchangeRate: 11735, // ✅ Fixed exchange rate of 11735
            expenseId: result.data.id
          } 
        })
        window.dispatchEvent(auditEvent)
        
        // ✅ Success Feedback: Show success message
        alert(`✅ تم إضافة المصروف بنجاح!\nالوصف: ${formData.description}\nالمبلغ: ${formData.amount} ${formData.currency}`)
      } else {
        // ✅ ERROR HANDLING: Handle database errors gracefully
        const errorData = await response.json()
        console.error('❌ Database error:', errorData)
        alert(`❌ فشل إضافة المصروف: ${errorData.error || 'خطأ غير معروف'}\nيرجى المحاولة مرة أخرى.`)
      }
    } catch (error) {
      console.error('❌ Error creating expense:', error)
      // ✅ Success Feedback: Show error message
      alert('❌ حدث خطأ في إضافة المصروف. يرجى المحاولة مرة أخرى.')
    }
  }

  const deleteExpense = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المصروف؟')) {
      try {
        const response = await fetch(`/api/expenses?id=${id}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          console.log('✅ Expense deleted successfully:', id)
          fetchExpenses()
          
          // ✅ Real-time Audit: Trigger audit page refresh after expense deletion
          console.log('💰 Expense deleted, triggering profit recalculation...')
          const auditEvent = new CustomEvent('expenseDeleted', { 
            detail: { 
              expenseId: id,
              exchangeRate: 11735 // ✅ Fixed exchange rate of 11735
            }
          })
          window.dispatchEvent(auditEvent)
          
          // ✅ Success Feedback: Show success message
          alert('✅ تم حذف المصروف بنجاح!')
        } else {
          // ✅ ERROR HANDLING: Handle database errors gracefully
          const errorData = await response.json()
          console.error('❌ Database error:', errorData)
          alert(`❌ فشل حذف المصروف: ${errorData.error || 'خطأ غير معروف'}\nيرجى المحاولة مرة أخرى.`)
        }
      } catch (error) {
        console.error('❌ Error deleting expense:', error)
        // ✅ Success Feedback: Show error message
        alert('❌ حدث خطأ في حذف المصروف. يرجى المحاولة مرة أخرى.')
      }
    }
  }

  const getAmountInSYP = (amount: number, currency: 'SYP' | 'USD') => {
    // ✅ Expenses Link: Use fixed exchange rate of 11735 for USD conversions
    return currency === 'USD' ? amount * 11735 : amount
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'إيجار': 'bg-blue-100 text-blue-600',
      'رواتب': 'bg-green-100 text-green-600',
      'خدمات': 'bg-yellow-100 text-yellow-600',
      'صيانة': 'bg-red-100 text-red-600',
      'تسويق': 'bg-purple-100 text-purple-600',
      'مشتريات': 'bg-orange-100 text-orange-600',
      'نقل': 'bg-indigo-100 text-indigo-600',
      'أخرى': 'bg-gray-100 text-gray-600'
    }
    return colors[category] || 'bg-gray-100 text-gray-600'
  }

  const getTotalExpenses = () => {
    return filteredExpenses.reduce((sum, expense) => sum + getAmountInSYP(expense.amount, expense.currency), 0)
  }

  const getTotalByCategory = (category: string) => {
    return filteredExpenses
      .filter(expense => expense.category === category)
      .reduce((sum, expense) => sum + getAmountInSYP(expense.amount, expense.currency), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-200 font-tajawal">جاري تحميل المصاريف...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold font-tajawal text-white mb-2">المصاريف والسحوبات</h1>
          <p className="text-lg font-tajawal text-slate-200">إدارة المصاريف التشغيلية والسحوبات</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg p-6">
            <div className="flex items-center gap-3">
              <Receipt className="w-8 h-8 text-amber-200" />
              <div>
                <h3 className="text-sm font-tajawal text-slate-200">إجمالي المصاريف</h3>
                <p className="text-2xl font-bold font-tajawal text-amber-200">
                  {formatCurrencyLS(getTotalExpenses())}
                </p>
              </div>
            </div>
          </div>

          {categories.slice(0, 3).map((category, index) => (
            <div key={category} className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg p-6">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-8 h-8 text-amber-200" />
                <div>
                  <h3 className="text-sm font-tajawal text-slate-200">{category}</h3>
                  <p className="text-xl font-bold font-tajawal text-amber-200">
                    {formatCurrencyLS(getTotalByCategory(category))}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 w-5 h-5 text-slate-200/40" />
                <input
                  type="text"
                  placeholder="البحث عن مصروف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 rounded-2xl border border-white/20 bg-black/30 backdrop-blur-sm font-tajawal text-slate-100 placeholder-slate-200/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl border border-white/20 bg-black/30 backdrop-blur-sm font-tajawal text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">جميع الفئات</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-tajawal font-semibold hover:bg-emerald-700 transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة مصروف
            </button>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 text-white p-6 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-right py-3 px-4 font-tajawal text-white">الوصف</th>
                  <th className="text-right py-3 px-4 font-tajawal text-white">المبلغ</th>
                  <th className="text-right py-3 px-4 font-tajawal text-white">العملة</th>
                  <th className="text-right py-3 px-4 font-tajawal text-white">الفئة</th>
                  <th className="text-right py-3 px-4 font-tajawal text-white">التاريخ</th>
                  <th className="text-right py-3 px-4 font-tajawal text-white">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense, index) => (
                  <tr key={expense.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-3 px-4">
                      <span className="font-tajawal text-slate-100 font-semibold">
                        {expense.description}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-tajawal text-amber-200">
                        {expense.amount.toLocaleString('ar-LB')}
                      </span>
                      {expense.currency === 'USD' && (
                        <span className="text-xs text-slate-200/60 ml-1">($)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-tajawal font-semibold ${
                        expense.currency === 'USD' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {expense.currency}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-tajawal font-semibold bg-amber-500/20 text-amber-300`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-tajawal text-slate-100 text-sm">
                        {new Date(expense.created_at).toLocaleDateString('ar-LB')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Expense Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowAddModal(false)}>
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold font-tajawal text-white mb-6">إضافة مصروف جديد</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-tajawal text-slate-200 mb-2">الوصف</label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-white/20 bg-black/30 backdrop-blur-sm font-tajawal text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-tajawal text-slate-200 mb-2">المبلغ</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-white/20 bg-black/30 backdrop-blur-sm font-tajawal text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-tajawal text-slate-200 mb-2">العملة</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value as 'SYP' | 'USD'})}
                      className="w-full px-4 py-3 rounded-2xl border border-white/20 bg-black/30 backdrop-blur-sm font-tajawal text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="SYP">ل.س</option>
                      <option value="USD">$</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-tajawal text-slate-200 mb-2">الفئة</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl border border-white/20 bg-black/30 backdrop-blur-sm font-tajawal text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-tajawal font-semibold hover:bg-emerald-700 transition-all duration-200"
                  >
                    إضافة المصروف
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-slate-600 text-white rounded-2xl font-tajawal font-semibold hover:bg-slate-700 transition-all duration-200"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
