'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Receipt, TrendingDown, Edit2, Trash2, Calendar } from 'lucide-react'
import { getCurrentExchangeRate } from '../../lib/exchange-rate-api'
import { formatCurrencyLS } from '../../lib/currency'

interface Expense {
  id: string
  description: string
  amount: number
  currency: 'SYP' | 'USD'
  category: string
  date: string
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: 'SYP' as 'SYP' | 'USD',
    category: 'إيجار'
  })
  const [exchangeRate, setExchangeRate] = useState(11735)

  const categories = ['إيجار', 'رواتب', 'خدمات', 'صيانة', 'تسويق', 'مشتريات']

  useEffect(() => {
    loadExpenses()
    loadExchangeRate()
  }, [])

  const loadExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      const data = await response.json()
      // ✅ Data Fetching Safety: Ensure expenses is always an array
      setExpenses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading expenses:', error)
      // ✅ Data Fetching Safety: Set empty array on error
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const loadExchangeRate = async () => {
    try {
      const rate = await getCurrentExchangeRate()
      setExchangeRate(rate)
    } catch (error) {
      console.error('Error loading exchange rate:', error)
      // Use fixed rate as fallback
      setExchangeRate(11735)
    }
  }

  const filteredExpenses = (Array.isArray(expenses) ? expenses : []).filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getTotalExpenses = () => {
    return (Array.isArray(expenses) ? expenses : []).reduce((total, expense) => {
      const amountInSYP = expense.currency === 'USD' ? expense.amount * exchangeRate : expense.amount
      return total + amountInSYP
    }, 0)
  }

  const getTotalByCategory = (category: string) => {
    return (Array.isArray(expenses) ? expenses : [])
      .filter(expense => expense.category === category)
      .reduce((total, expense) => {
        const amountInSYP = expense.currency === 'USD' ? expense.amount * exchangeRate : expense.amount
        return total + amountInSYP
      }, 0)
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
        loadExpenses()
        
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
          loadExpenses()
          
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
      'صيانة': 'bg-red-100 text-amber-200',
      'تسويق': 'bg-purple-100 text-purple-600',
      'مشتريات': 'bg-orange-100 text-amber-200'
    }
    return colors[category] || 'bg-gray-100 text-gray-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-emerald border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-200 font-tajawal">جاري تحميل المصاريف...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div
          style={{ transform: 'translateY(0)', opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold font-tajawal text-slate-200 mb-2">المصاريف والسحوبات</h1>
          <p className="text-lg font-tajawal text-slate-200/70">إدارة المصاريف التشغيلية والسحوبات</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            className="glass rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02]"
            style={{ transform: 'translateY(0)', opacity: 1 }}
          >
            <div className="flex items-center gap-3">
              <Receipt className="w-8 h-8 text-emerald-300" />
              <div>
                <h3 className="text-sm font-tajawal text-slate-200/60">إجمالي المصاريف</h3>
                <p className="text-2xl font-bold font-tajawal text-amber-200">
                  {formatCurrencyLS(getTotalExpenses())}
                </p>
              </div>
            </div>
          </div>

          {categories.slice(0, 3).map((category, index) => (
            <div
              key={category}
              className="glass rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02]"
              style={{ transform: 'translateY(0)', opacity: 1 }}
            >
              <div className="flex items-center gap-3">
                <TrendingDown className="w-8 h-8 text-emerald-300" />
                <div>
                  <h3 className="text-sm font-tajawal text-slate-200/60">{category}</h3>
                  <p className="text-xl font-bold font-tajawal text-amber-200">
                    {formatCurrencyLS(getTotalByCategory(category))}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div
          className="glass rounded-3xl p-6 mb-6 transition-all duration-300 hover:scale-[1.02]"
          style={{ transform: 'translateY(0)', opacity: 1 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 w-5 h-5 text-slate-200/40" />
                <input
                  type="text"
                  placeholder="البحث عن مصروف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 neumorphic rounded-xl font-tajawal text-slate-200 placeholder-slate-200/40 focus:outline-none focus:ring-2 focus:ring-emerald transition-all duration-300"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-200/60" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="neumorphic rounded-xl px-4 py-3 font-tajawal text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald transition-all duration-300"
              >
                <option value="all">جميع الفئات</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald to-emerald-600 text-white rounded-2xl font-tajawal font-semibold hover:from-emerald/90 hover:to-emerald-600/90 transition-all duration-300 flex items-center gap-2 hover:scale-[1.02]"
            >
              <Plus className="w-5 h-5" />
              إضافة مصروف
            </button>
          </div>
        </div>

        {/* Expenses Table */}
        <div
          className="glass rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02]"
          style={{ transform: 'translateY(0)', opacity: 1 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-emerald/20">
                  <th className="text-right py-3 px-4 font-tajawal text-slate-200">الوصف</th>
                  <th className="text-right py-3 px-4 font-tajawal text-slate-200">المبلغ</th>
                  <th className="text-right py-3 px-4 font-tajawal text-slate-200">العملة</th>
                  <th className="text-right py-3 px-4 font-tajawal text-slate-200">الفئة</th>
                  <th className="text-right py-3 px-4 font-tajawal text-slate-200">التاريخ</th>
                  <th className="text-right py-3 px-4 font-tajawal text-slate-200">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {/* ✅ Loading State: Only render if loading is false and expenses is valid */}
                {!loading && Array.isArray(expenses) && filteredExpenses.map((expense, index) => (
                  <tr
                    key={expense.id}
                    className="border-b border-emerald/10 hover:bg-emerald/5 transition-all duration-300"
                    style={{ opacity: 1, transform: 'translateX(0)' }}
                  >
                    <td className="py-3 px-4">
                      <span className="font-tajawal text-slate-200 font-semibold">
                        {expense.description}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-tajawal text-slate-200">
                        {expense.amount.toLocaleString('ar-LB')}
                      </span>
                      {expense.currency === 'USD' && (
                        <span className="text-xs text-slate-200/60 ml-1">($)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-tajawal font-semibold ${
                        expense.currency === 'USD' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {expense.currency}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-tajawal font-semibold ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-tajawal text-slate-200/60">
                        {new Date(expense.date).toLocaleDateString('ar-SA')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="p-2 text-amber-200 hover:bg-red-100 rounded-lg transition-all duration-300"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* ✅ Loading State: Show empty state when loading or no data */}
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-emerald border-t-transparent rounded-full animate-spin ml-2"></div>
                        <span className="text-slate-200 font-tajawal">جاري تحميل المصاريف...</span>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && (!Array.isArray(expenses) || expenses.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <span className="text-slate-200 font-tajawal">لا توجد مصاريف حالياً</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Expense Modal */}
        {showAddModal && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            style={{ opacity: 1 }}
            onClick={() => setShowAddModal(false)}
          >
            <div
              className="glass rounded-3xl p-8 max-w-md w-full transition-all duration-300"
              style={{ transform: 'scale(1)', opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold font-tajawal text-slate-200 mb-6">إضافة مصروف جديد</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-tajawal text-slate-200 mb-2">الوصف</label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 neumorphic rounded-xl font-tajawal text-slate-200 placeholder-slate-200/40 focus:outline-none focus:ring-2 focus:ring-emerald transition-all duration-300"
                    placeholder="أدخل وصف المصروف..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-tajawal text-slate-200 mb-2">المبلغ</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full px-4 py-3 neumorphic rounded-xl font-tajawal text-slate-200 placeholder-slate-200/40 focus:outline-none focus:ring-2 focus:ring-emerald transition-all duration-300"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-tajawal text-slate-200 mb-2">العملة</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value as 'SYP' | 'USD'})}
                      className="w-full px-4 py-3 neumorphic rounded-xl font-tajawal text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald transition-all duration-300"
                    >
                      <option value="SYP">ليرة سورية</option>
                      <option value="USD">دولار أمريكي</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-tajawal text-slate-200 mb-2">الفئة</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 neumorphic rounded-xl font-tajawal text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald transition-all duration-300"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-emerald to-emerald-600 text-white rounded-2xl font-tajawal font-semibold hover:from-emerald/90 hover:to-emerald-600/90 transition-all duration-300 hover:scale-[1.02]"
                  >
                    حفظ المصروف
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-2xl font-tajawal font-semibold hover:bg-gray-300 transition-all duration-300 hover:scale-[1.02]"
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
