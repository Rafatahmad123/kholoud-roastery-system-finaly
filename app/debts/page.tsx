'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, DollarSign, User, CheckCircle, XCircle, Edit2, Trash2, CreditCard } from 'lucide-react'
import { getCurrentExchangeRate } from '../../lib/exchange-rate-api'
import { formatCurrencyLS } from '../../lib/currency'

interface Debt {
  id: string
  person_name: string
  amount: number
  currency: 'SYP' | 'USD'
  type: 'customer' | 'supplier'
  status: 'pending' | 'paid'
  description?: string
  payment_history?: string
  created_at: string
  updated_at: string
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [filteredDebts, setFilteredDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [exchangeRate, setExchangeRate] = useState(11735)
  const [formData, setFormData] = useState({
    person_name: '',
    amount: '',
    currency: 'SYP' as 'SYP' | 'USD',
    type: 'customer' as 'customer' | 'supplier',
    status: 'pending' as 'pending' | 'paid',
    description: ''
  })
  const [paymentData, setPaymentData] = useState({
    amount: '',
    currency: 'SYP' as 'SYP' | 'USD'
  })

  useEffect(() => {
    fetchDebts()
    fetchExchangeRate()
  }, [])

  useEffect(() => {
    filterDebts()
  }, [debts, searchTerm, statusFilter, typeFilter])

  const fetchDebts = async () => {
    try {
      const response = await fetch('/api/debts')
      const result = await response.json()
      if (result.data) {
        setDebts(result.data)
      }
    } catch (error) {
      console.error('❌ Error fetching debts:', error)
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

  const filterDebts = () => {
    let filtered = debts

    if (searchTerm) {
      filtered = filtered.filter(debt => 
        debt.person_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(debt => debt.status === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(debt => debt.type === typeFilter)
    }

    setFilteredDebts(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setShowAddModal(false)
        setFormData({
          person_name: '',
          amount: '',
          currency: 'SYP',
          type: 'customer',
          status: 'pending',
          description: ''
        })
        fetchDebts()
      }
    } catch (error) {
      console.error('❌ Error creating debt:', error)
    }
  }

  const updateDebtStatus = async (id: string, status: 'pending' | 'paid') => {
    try {
      const response = await fetch('/api/debts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      
      if (response.ok) {
        fetchDebts()
      }
    } catch (error) {
      console.error('❌ Error updating debt:', error)
    }
  }

  const deleteDebt = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الدين؟')) {
      try {
        const response = await fetch(`/api/debts?id=${id}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          fetchDebts()
        }
      } catch (error) {
        console.error('❌ Error deleting debt:', error)
      }
    }
  }

  const openPaymentModal = (debt: Debt) => {
    setSelectedDebt(debt)
    setPaymentData({
      amount: '',
      currency: debt.currency
    })
    setShowPaymentModal(true)
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDebt) return

    try {
      // ✅ Debts Link: Connect payment modal to payment logic with fixed exchange rate
      const paymentAmount = parseFloat(paymentData.amount)
      let paymentInDebtCurrency = paymentAmount

      if (paymentData.currency !== selectedDebt.currency) {
        // ✅ Fixed exchange rate of 11735 for currency conversion
        if (paymentData.currency === 'USD' && selectedDebt.currency === 'SYP') {
          paymentInDebtCurrency = paymentAmount * 11735
        } else if (paymentData.currency === 'SYP' && selectedDebt.currency === 'USD') {
          paymentInDebtCurrency = paymentAmount / 11735
        }
      }

      // Calculate new amount
      const newAmount = selectedDebt.amount - paymentInDebtCurrency
      const newStatus = newAmount <= 0 ? 'paid' : 'pending'
      
      // ✅ Debts Link: Create payment history entry
      const paymentDate = new Date().toLocaleDateString('ar-SA')
      const paymentEntry = `Paid ${formatCurrencyLS(paymentInDebtCurrency)} on ${paymentDate}`
      const newPaymentHistory = selectedDebt.payment_history 
        ? `${selectedDebt.payment_history} | ${paymentEntry}`
        : paymentEntry

      // ✅ Debts Link: Update amount and payment_history in debts table
      const response = await fetch('/api/debts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedDebt.id,
          amount: Math.max(0, newAmount),
          status: newStatus,
          payment_history: newPaymentHistory
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Payment recorded successfully:', result.data)
        
        // ✅ ERROR HANDLING: Check if payment_history was updated correctly
        if (result.data && result.data.payment_history) {
          console.log('✅ Payment history updated correctly:', result.data.payment_history)
        } else {
          console.warn('⚠️ Payment history may not have been updated:', result.data)
        }
        
        setShowPaymentModal(false)
        setSelectedDebt(null)
        setPaymentData({ amount: '', currency: 'SYP' })
        fetchDebts()
        
        // ✅ Real-time Audit: Trigger audit page refresh after payment
        console.log('💰 Payment recorded, triggering audit refresh...')
        const auditEvent = new CustomEvent('paymentRecorded', { 
          detail: { 
            debtId: selectedDebt.id,
            paymentAmount: paymentInDebtCurrency,
            currency: selectedDebt.currency,
            newStatus: newStatus,
            exchangeRate: 11735
          }
        })
        window.dispatchEvent(auditEvent)
        
        // ✅ Success Feedback: Show detailed success message
        const message = newStatus === 'paid' 
          ? `✅ تم تسجيل الدفع بنجاح!\nتم سداد الدين بالكامل.\nالدين: ${selectedDebt.person_name}\nالمبلغ المدفوع: ${formatCurrencyLS(paymentInDebtCurrency)}`
          : `✅ تم تسجيل الدفع بنجاح!\nالدين: ${selectedDebt.person_name}\nالمبلغ المدفوع: ${formatCurrencyLS(paymentInDebtCurrency)}\nالمبلغ المتبقي: ${formatCurrencyLS(Math.max(0, newAmount))}`
        
        alert(message)
      } else {
        // ✅ ERROR HANDLING: Handle database errors gracefully
        const errorData = await response.json()
        console.error('❌ Database error:', errorData)
        alert(`❌ فشل تسجيل الدفع: ${errorData.error || 'خطأ غير معروف'}\nيرجى المحاولة مرة أخرى.`)
      }
    } catch (error) {
      console.error('❌ Error recording payment:', error)
      // ✅ Success Feedback: Show error message
      alert('❌ حدث خطأ في تسجيل الدفع. يرجى المحاولة مرة أخرى.')
    }
  }

  const getAmountInSYP = (amount: number, currency: 'SYP' | 'USD') => {
    // ✅ Debts Link: Use fixed exchange rate of 11735 for USD conversions
    return currency === 'USD' ? amount * 11735 : amount
  }

  const getStatusColor = (status: string) => {
    return status === 'paid' ? 'text-amber-200 bg-green-100' : 'text-yellow-600 bg-yellow-100'
  }

  const getTypeColor = (type: string) => {
    return type === 'customer' ? 'text-amber-200 bg-blue-100' : 'text-amber-200 bg-red-100'
  }

  const getTotalByType = (type: 'customer' | 'supplier') => {
    return filteredDebts
      .filter(debt => debt.type === type)
      .reduce((sum, debt) => sum + getAmountInSYP(debt.amount, debt.currency), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-200 font-tajawal">جاري تحميل الديون...</p>
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
              الديون والذمم
              <div className="h-1 w-12 bg-emerald-500 mt-1 rounded-full"></div>
            </h2>
            <p className="text-white/80 font-tajawal drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">إدارة ديون العملاء والموردين</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-emerald-300" />
            <div>
              <h3 className="text-sm font-tajawal text-white/60">ديون العملاء</h3>
              <p className="text-2xl font-bold font-tajawal text-amber-200">
                {formatCurrencyLS(getTotalByType('customer'))}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 text-white p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-emerald-300" />
            <div>
              <h3 className="text-sm font-tajawal text-white/60">ديون الموردين</h3>
              <p className="text-2xl font-bold font-tajawal text-amber-200">
                {formatCurrencyLS(getTotalByType('supplier'))}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 text-white p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Filter className="w-8 h-8 text-emerald-300" />
            <div>
              <h3 className="text-sm font-tajawal text-white/60">إجمالي الديون</h3>
              <p className="text-2xl font-bold font-tajawal text-amber-200">
                {formatCurrencyLS(getTotalByType('customer') + getTotalByType('supplier'))}
              </p>
            </div>
          </div>
        </div>
      </div>

        {/* Filters and Search Section - Glass Card */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="البحث عن دين..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-2xl border border-gold/20 bg-white/50 backdrop-blur-sm font-tajawal text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold/50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl border border-gold/20 bg-white/50 backdrop-blur-sm font-tajawal text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">معلق</option>
              <option value="paid">مدفوع</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl border border-gold/20 bg-white/50 backdrop-blur-sm font-tajawal text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
            >
              <option value="all">جميع الأنواع</option>
              <option value="customer">عملاء</option>
              <option value="supplier">موردون</option>
            </select>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-gold to-orange-500 text-white rounded-2xl font-tajawal font-semibold hover:from-gold/90 hover:to-orange-500/90 transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة دين
            </button>
          </div>
        </div>
        </div>

        {/* Debts Table */}
        <div>
          <div className="glass rounded-3xl p-6">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold/20">
                  <th className="text-right py-3 px-4 font-tajawal text-white">الاسم</th>
                  <th className="text-right py-3 px-4 font-tajawal text-white">المبلغ</th>
                  <th className="text-right py-3 px-4 font-tajawal text-white">العملة</th>
                  <th className="text-right py-3 px-4 font-tajawal text-white">النوع</th>
                  <th className="text-right py-3 px-4 font-tajawal text-white">الحالة</th>
                  <th className="text-right py-3 px-4 font-tajawal text-white">الوصف</th>
                  <th className="text-right py-3 px-4 font-tajawal text-white">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredDebts.map((debt, index) => (
                  <tr
                    key={debt.id}
                    className="border-b border-gold/10 hover:bg-gold/5"
                  >
                    <td className="py-3 px-4">
                      <span className="font-tajawal text-white font-semibold">
                        {debt.person_name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-tajawal text-white">
                        {debt.amount.toLocaleString('ar-LB')}
                      </span>
                      {debt.currency === 'USD' && (
                        <span className="text-xs text-white/60 ml-1">($)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-tajawal font-semibold ${
                        debt.currency === 'USD' ? 'bg-green-100 text-amber-200' : 'bg-blue-100 text-amber-200'
                      }`}>
                        {debt.currency}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-tajawal font-semibold ${getTypeColor(debt.type)}`}>
                        {debt.type === 'customer' ? 'عميل' : 'مورد'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-tajawal font-semibold ${getStatusColor(debt.status)}`}>
                        {debt.status === 'paid' ? 'مدفوع' : 'معلق'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-tajawal text-white text-sm">
                        {debt.description || '-'}
                      </span>
                      {debt.payment_history && (
                        <div className="text-xs text-white/50 mt-1">
                          {debt.payment_history}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {debt.status === 'pending' && (
                          <button
                            onClick={() => openPaymentModal(debt)}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            title="تسجيل دفعة"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => updateDebtStatus(debt.id, debt.status === 'paid' ? 'pending' : 'paid')}
                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          title={debt.status === 'paid' ? 'تعيين كمعلق' : 'تعيين كمدفوع'}
                        >
                          {debt.status === 'paid' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteDebt(debt.id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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

        {/* Add Debt Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowAddModal(false)}>
            <div className="glass rounded-3xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold font-tajawal text-white mb-6">إضافة دين جديد</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-tajawal text-white mb-2">الاسم</label>
                  <input
                    type="text"
                    required
                    value={formData.person_name}
                    onChange={(e) => setFormData({...formData, person_name: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-gold/20 bg-white/50 backdrop-blur-sm font-tajawal text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-tajawal text-white mb-2">المبلغ</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-gold/20 bg-white/50 backdrop-blur-sm font-tajawal text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-tajawal text-white mb-2">العملة</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value as 'SYP' | 'USD'})}
                      className="w-full px-4 py-3 rounded-2xl border border-gold/20 bg-white/50 backdrop-blur-sm font-tajawal text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                    >
                      <option value="SYP">ل.س</option>
                      <option value="USD">$</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-tajawal text-white mb-2">النوع</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as 'customer' | 'supplier'})}
                      className="w-full px-4 py-3 rounded-2xl border border-gold/20 bg-white/50 backdrop-blur-sm font-tajawal text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                    >
                      <option value="customer">عميل</option>
                      <option value="supplier">مورد</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-tajawal text-white mb-2">الوصف</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 rounded-2xl border border-gold/20 bg-white/50 backdrop-blur-sm font-tajawal text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>
                
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-gold to-orange-500 text-white rounded-2xl font-tajawal font-semibold hover:from-gold/90 hover:to-orange-500/90 transition-all duration-200"
                  >
                    إضافة الدين
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-2xl font-tajawal font-semibold hover:bg-gray-300 transition-all duration-200"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* ✅ Payment Tracking: Payment Modal */}
        {showPaymentModal && selectedDebt && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowPaymentModal(false)}>
            <div className="glass rounded-3xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold font-tajawal text-white mb-6">تسجيل دفعة</h2>
              
              <div className="mb-4 p-4 bg-gold/10 rounded-2xl">
                <p className="font-tajawal text-white">
                  <span className="font-semibold">الدين:</span> {selectedDebt.person_name}
                </p>
                <p className="font-tajawal text-white">
                  <span className="font-semibold">المبلغ المتبقي:</span> {formatCurrencyLS(selectedDebt.amount)}
                </p>
              </div>
              
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-tajawal text-white mb-2">مبلغ الدفعة</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    max={selectedDebt.amount}
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-gold/20 bg-white/50 backdrop-blur-sm font-tajawal text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-tajawal text-white mb-2">عملة الدفعة</label>
                  <select
                    value={paymentData.currency}
                    onChange={(e) => setPaymentData({...paymentData, currency: e.target.value as 'SYP' | 'USD'})}
                    className="w-full px-4 py-3 rounded-2xl border border-gold/20 bg-white/50 backdrop-blur-sm font-tajawal text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                  >
                    <option value="SYP">ل.س</option>
                    <option value="USD">$</option>
                  </select>
                </div>
                
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl font-tajawal font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200"
                  >
                    تسجيل الدفعة
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 py-3 bg-gray-500 text-white rounded-2xl font-tajawal font-semibold hover:bg-gray-600 transition-all duration-200"
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
