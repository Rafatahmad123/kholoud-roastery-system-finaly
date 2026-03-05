'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, TrendingDown, Receipt, Trash2, Edit2, X } from 'lucide-react'
import { formatCurrencyLS } from 'lib/currency'

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
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    currency: 'SYP' as 'SYP' | 'USD',
    category: ''
  })

  const categories = ['مشتريات', 'إيجار', 'رواتب', 'صيانة', 'كهرباء', 'مياه', 'إنترنت', 'أخرى']

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      if (!response.ok) {
        throw new Error('Failed to fetch expenses')
      }
      const data = await response.json()
      setExpenses(data)
    } catch (error) {
      console.error('❌ Error loading expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: formData.description,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          category: formData.category,
          date: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create expense')
      }

      setShowAddModal(false)
      setFormData({
        description: '',
        amount: '',
        currency: 'SYP',
        category: ''
      })
      loadExpenses()
    } catch (error) {
      console.error('❌ Error creating expense:', error)
      alert('فشل إضافة المصروف: ' + (error as Error).message)
    }
  }

  const deleteExpense = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return
    
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete expense')
      }

      loadExpenses()
    } catch (error) {
      console.error('❌ Error deleting expense:', error)
      alert('فشل حذف المصروف: ' + (error as Error).message)
    }
  }

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0)
  }

  const getTotalByCategory = (category: string) => {
    return expenses
      .filter(expense => expense.category === category)
      .reduce((total, expense) => total + expense.amount, 0)
  }

  const filteredExpenses = (expenses || []).filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-200 font-tajawal">جاري تحميل المصاريف...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-20 min-h-screen">
      {/* Header Section with Glass Card */}
      <div className="bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-3xl font-bold font-tajawal text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mb-2">
              المصاريف والسحوبات
              <div className="h-1 w-12 bg-emerald-500 mt-1 rounded-full"></div>
            </h2>
            <p className="text-white/80 font-tajawal drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">إدارة المصاريف التشغيلية والسحوبات</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6">
          <div className="flex items-center gap-3">
            <Receipt className="w-8 h-8 text-emerald-300" />
            <div>
              <h3 className="text-sm font-tajawal text-white/60">إجمالي المصاريف</h3>
              <p className="text-2xl font-bold font-tajawal text-amber-200">
                {formatCurrencyLS(getTotalExpenses())}
              </p>
            </div>
          </div>
        </div>

        {categories.slice(0, 3).map((category, index) => (
          <div
            key={category}
            className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6"
          >
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-emerald-300" />
              <div>
                <h3 className="text-sm font-tajawal text-white/60">{category}</h3>
                <p className="text-xl font-bold font-tajawal text-amber-200">
                  {formatCurrencyLS(getTotalByCategory(category))}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search Section - Glass Card */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-5 h-5 text-slate-200/40" />
              <input
                type="text"
                placeholder="البحث عن مصروف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/30 backdrop-blur-md rounded-2xl font-tajawal text-slate-200 placeholder-slate-200/40 focus:outline-none focus:ring-2 focus:ring-emerald transition-all duration-300 border border-white/20"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-200/60" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-black/30 backdrop-blur-md rounded-2xl px-4 py-3 font-tajawal text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald transition-all duration-300 border border-white/20"
            >
              <option value="all">جميع الفئات</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-emerald to-emerald-600 text-white rounded-2xl font-tajawal font-semibold hover:from-emerald/90 hover:to-emerald-600/90 transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            إضافة مصروف
          </button>
        </div>
      </div>

      {/* Expenses Table Section - Glass Card */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6 overflow-x-auto">
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
              {filteredExpenses.map((expense, index) => (
                <tr key={expense.id} className="border-b border-emerald/10 hover:bg-emerald/5 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-tajawal text-white">{expense.description}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-tajawal text-amber-200 font-semibold">
                      {formatCurrencyLS(expense.amount)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-tajawal text-slate-200">{expense.currency}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-tajawal text-slate-200">{expense.category}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-tajawal text-slate-200">
                      {new Date(expense.created_at).toLocaleDateString('ar-SA')}
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
              {/* Loading State */}
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
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 text-white p-8 max-w-md w-full transition-all duration-300"
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
                  className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm rounded-xl font-tajawal text-slate-200 placeholder-slate-200/40 focus:outline-none focus:ring-2 focus:ring-emerald transition-all duration-300 border border-white/20"
                  placeholder="أدخل وصف المصروف..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-tajawal text-slate-200 mb-2">المبلغ</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm rounded-xl font-tajawal text-slate-200 placeholder-slate-200/40 focus:outline-none focus:ring-2 focus:ring-emerald transition-all duration-300 border border-white/20"
                  placeholder="أدخل المبلغ..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-tajawal text-slate-200 mb-2">العملة</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value as 'SYP' | 'USD'})}
                  className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm rounded-xl font-tajawal text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald transition-all duration-300 border border-white/20"
                >
                  <option value="SYP">ل.س سوري</option>
                  <option value="USD">دولار أمريكي</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-tajawal text-slate-200 mb-2">الفئة</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 bg-black/30 backdrop-blur-sm rounded-xl font-tajawal text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald transition-all duration-300 border border-white/20"
                  required
                >
                  <option value="">اختر الفئة</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-tajawal font-semibold hover:bg-emerald-700 transition-all duration-300 hover:scale-[1.02]"
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
  )
}
