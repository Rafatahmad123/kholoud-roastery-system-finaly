'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, FileText, TrendingUp, Package, BarChart3, Filter, DollarSign } from 'lucide-react'
import { fetchAuditData } from '../../lib/api'
import { formatCurrencyLS } from '../../lib/currency'
import { getCurrentExchangeRate } from '../../lib/exchange-rate-api'
import { getTotalExpenses } from '../../lib/api-expenses'

interface AuditLog {
  id: string
  product_id: number
  product_name: string
  quantity_sold: number
  remaining_stock: number
  sale_id: string
  created_at: string
  products?: {
    stock_quantity: number
    wholesale_price: number
    price: number
  }
}

interface DailySummary {
  product_id: number
  product_name: string
  starting_stock: number
  sold_today: number
  ending_stock: number
  total_revenue: number
  total_profit: number
  total_profit_usd: number
}

interface MonthlySummary {
  product_id: number
  product_name: string
  total_quantity_sold: number
  total_revenue: number
  total_profit: number
  total_profit_usd: number
  average_daily_sales: number
}

export default function AuditPage() {
  const [auditData, setAuditData] = useState<AuditLog[]>([])
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([])
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')
  const [loading, setLoading] = useState(true)
  const [totalExpenses, setTotalExpenses] = useState(0)

  const loadAuditData = async (date: string) => {
    try {
      setLoading(true)
      console.log('📊 Audit Page: Loading data for date:', date, 'View:', viewMode)
      console.log('🔍 DEBUG: Frontend loadAuditData called with:', { date, viewMode })
      
      // ✅ Audit Integration: Load total expenses for profit calculation
      const expenses = await getTotalExpenses({
        startDate: date,
        endDate: date
      })
      setTotalExpenses(expenses)
      console.log('💰 Total expenses loaded for profit calculation:', expenses)
      
      if (viewMode === 'daily') {
        console.log('🔍 DEBUG: Fetching daily audit data...')
        const data = await fetchAuditData(date, 'daily')
        console.log('📊 Audit Page: Daily data loaded:', data?.length || 0, 'items')
        
        if (data && Array.isArray(data)) {
          console.log('🔍 DEBUG: Data type check passed, array length:', data.length)
          console.log('🔍 Validation Log: SUPABASE_FETCH:', JSON.stringify(data, null, 2))
          
          // ✅ Safety First: Get exchange rate with fallback
          let exchangeRate = 11735 // Default fallback
          try {
            exchangeRate = await getCurrentExchangeRate()
            console.log('💱 Using exchange rate for profit calculations:', exchangeRate)
          } catch (exchangeError) {
            console.warn('⚠️ Failed to fetch exchange rate, using fallback:', exchangeError)
            exchangeRate = 11735 // Immediate fallback
          }
          
          // ✅ Async/Await Fix: Calculate daily summary with exchange rate parameter
          const summary = calculateDailySummary(data, exchangeRate)
          console.log('🔍 DEBUG: Calculated daily summary:', summary)
          setDailySummary(summary)
          setAuditData(data)
        } else {
          console.log('🔍 DEBUG: No data or invalid data format')
          setDailySummary([])
          setAuditData([])
        }
      } else {
        console.log('🔍 DEBUG: Fetching monthly audit data...')
        const year = new Date(date).getFullYear()
        const month = new Date(date).getMonth()
        const summary = await fetchMonthlyData(year, month)
        console.log('� Audit Page: Monthly data loaded:', summary?.length || 0, 'items')
        setMonthlySummary(summary)
      }
    } catch (error) {
      console.error('❌ Error loading audit data:', error)
      setDailySummary([])
      setMonthlySummary([])
      setAuditData([])
    } finally {
      // ✅ Loading State: Ensure loading is always set to false
      setLoading(false)
      console.log('🔍 DEBUG: Loading state set to false')
    }
  }

  // ✅ Force UI Refresh: Re-fetch data whenever date or view mode changes
  useEffect(() => {
    loadAuditData(selectedDate)
    
    // ✅ Real-time Audit: Listen for expense changes to recalculate profit
    const handleExpenseAdded = (event: CustomEvent) => {
      console.log('💰 Expense added event received:', event.detail)
      // Reload audit data to recalculate profit with new expenses
      loadAuditData(selectedDate)
    }
    
    const handleExpenseDeleted = (event: CustomEvent) => {
      console.log('💰 Expense deleted event received:', event.detail)
      // Reload audit data to recalculate profit after expense deletion
      loadAuditData(selectedDate)
    }
    
    // ✅ Real-time Audit: Listen for payment changes to recalculate profit
    const handlePaymentRecorded = (event: CustomEvent) => {
      console.log('💰 Payment recorded event received:', event.detail)
      // Reload audit data to recalculate profit after payment
      loadAuditData(selectedDate)
    }
    
    window.addEventListener('expenseAdded', handleExpenseAdded as EventListener)
    window.addEventListener('expenseDeleted', handleExpenseDeleted as EventListener)
    window.addEventListener('paymentRecorded', handlePaymentRecorded as EventListener)
    
    return () => {
      window.removeEventListener('expenseAdded', handleExpenseAdded as EventListener)
      window.removeEventListener('expenseDeleted', handleExpenseDeleted as EventListener)
      window.removeEventListener('paymentRecorded', handlePaymentRecorded as EventListener)
    }
  }, [selectedDate, viewMode])

  const fetchMonthlyData = async (year: number, month: number): Promise<MonthlySummary[]> => {
    // Get all days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const monthlyData: { [key: number]: MonthlySummary } = {}
    
    // ✅ Safety First: Get exchange rate with fallback for monthly calculations
    let exchangeRate = 11735 // Default fallback
    try {
      exchangeRate = await getCurrentExchangeRate()
      console.log('💱 Monthly data: Using exchange rate:', exchangeRate)
    } catch (exchangeError) {
      console.warn('⚠️ Monthly data: Failed to fetch exchange rate, using fallback:', exchangeError)
      exchangeRate = 11735
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day).toISOString().split('T')[0]
      try {
        const dayData = await fetchAuditData(date, 'daily')
        
        dayData.forEach((log: any) => {
          if (!monthlyData[log.product_id]) {
            monthlyData[log.product_id] = {
              product_id: log.product_id,
              product_name: log.product_name,
              total_quantity_sold: 0,
              total_revenue: 0,
              total_profit: 0,
              total_profit_usd: 0,
              average_daily_sales: 0
            }
          }
          
          // ✅ Check Currency: Determine if prices are in USD or SYP
          const unitPrice = Number(log.products?.price) || 0
          const wholesalePrice = Number(log.products?.wholesale_price) || 0
          const quantitySold = Number(log.quantity_sold) || 0
          
          // ✅ Currency Logic: Assume prices are in SYP unless very small (indicating USD)
          const isUSDPrice = unitPrice < 100 && wholesalePrice < 100
          
          let sellingPriceSYP: number
          let wholesalePriceSYP: number
          
          if (isUSDPrice) {
            // Convert USD to SYP using current exchange rate
            sellingPriceSYP = unitPrice * exchangeRate
            wholesalePriceSYP = wholesalePrice * exchangeRate
          } else {
            // Prices are already in SYP
            sellingPriceSYP = unitPrice
            wholesalePriceSYP = wholesalePrice
          }
          
          // ✅ Final Profit Logic: 20% markup is the base for both SYP and USD displays
          const profitPerUnit = wholesalePriceSYP * 0.20
          const itemProfit = profitPerUnit * quantitySold
          
          // ✅ Calculation: profitUSD = itemProfit / exchangeRate
          const itemProfitUSD = itemProfit / exchangeRate
          
          // ✅ Revenue Fix: Total Revenue = (Wholesale Price + (Wholesale Price * 0.20)) * Quantity Sold
          const sellingPricePerUnit = wholesalePriceSYP + profitPerUnit
          const itemRevenue = sellingPricePerUnit * quantitySold
          
          monthlyData[log.product_id].total_quantity_sold += quantitySold
          monthlyData[log.product_id].total_revenue += itemRevenue
          monthlyData[log.product_id].total_profit += itemProfit
          monthlyData[log.product_id].total_profit_usd += itemProfitUSD
        })
      } catch (error) {
        console.warn(`⚠️ Failed to fetch data for ${date}:`, error)
      }
    }
    
    // Calculate averages
    const results = Object.values(monthlyData).map(item => ({
      ...item,
      average_daily_sales: item.total_quantity_sold / daysInMonth
    }))
    
    return results.sort((a, b) => b.total_quantity_sold - a.total_quantity_sold)
  }

  const calculateDailySummary = (logs: AuditLog[], exchangeRate: number): DailySummary[] => {
    const summary: { [key: number]: DailySummary } = {}
    
    logs.forEach(log => {
      if (!summary[log.product_id]) {
        summary[log.product_id] = {
          product_id: log.product_id,
          product_name: log.product_name,
          starting_stock: log.remaining_stock + log.quantity_sold, // Calculate starting stock
          sold_today: 0,
          ending_stock: log.remaining_stock,
          total_revenue: 0,
          total_profit: 0,
          total_profit_usd: 0
        }
      }
      
      // ✅ Check Currency: Determine if prices are in USD or SYP
      const unitPrice = Number(log.products?.price) || 0
      const wholesalePrice = Number(log.products?.wholesale_price) || 0
      const quantitySold = Number(log.quantity_sold) || 0
      
      // ✅ Currency Logic: Assume prices are in SYP unless very small (indicating USD)
      const isUSDPrice = unitPrice < 100 && wholesalePrice < 100
      
      let sellingPriceSYP: number
      let wholesalePriceSYP: number
      
      if (isUSDPrice) {
        // Convert USD to SYP using current exchange rate
        sellingPriceSYP = unitPrice * exchangeRate
        wholesalePriceSYP = wholesalePrice * exchangeRate
        console.log('💱 Currency Conversion: USD to SYP', {
          product_id: log.product_id,
          product_name: log.product_name,
          originalPriceUSD: unitPrice,
          originalWholesaleUSD: wholesalePrice,
          exchangeRate,
          sellingPriceSYP,
          wholesalePriceSYP
        })
      } else {
        // Prices are already in SYP
        sellingPriceSYP = unitPrice
        wholesalePriceSYP = wholesalePrice
        console.log('🔍 Currency Check: Prices in SYP', {
          product_id: log.product_id,
          product_name: log.product_name,
          sellingPriceSYP,
          wholesalePriceSYP
        })
      }
      
      // ✅ Final Profit Logic: 20% markup is the base for both SYP and USD displays
      const profitPerUnit = wholesalePriceSYP * 0.20
      const itemProfit = profitPerUnit * quantitySold
      
      // ✅ Calculation: profitUSD = itemProfit / exchangeRate
      const itemProfitUSD = itemProfit / exchangeRate
      
      // ✅ Revenue Fix: Total Revenue = (Wholesale Price + (Wholesale Price * 0.20)) * Quantity Sold
      const sellingPricePerUnit = wholesalePriceSYP + profitPerUnit
      const itemRevenue = sellingPricePerUnit * quantitySold
      
      console.log('🔍 DEBUG: Calculating revenue/profit for item:', {
        product_id: log.product_id,
        product_name: log.product_name,
        isUSDPrice,
        wholesalePriceSYP,
        profitPerUnit,
        sellingPricePerUnit,
        quantitySold,
        itemRevenue,
        itemProfit,
        itemProfitUSD,
        exchangeRate
      })
      
      summary[log.product_id].sold_today += quantitySold
      summary[log.product_id].total_revenue += itemRevenue
      summary[log.product_id].total_profit += itemProfit
      summary[log.product_id].total_profit_usd += itemProfitUSD
      summary[log.product_id].ending_stock = log.remaining_stock
    })
    
    return Object.values(summary).sort((a, b) => b.sold_today - a.sold_today)
  }

  const getProfitColor = (profit: number): string => {
    // ✅ Display: Ensure numbers show as Positive Green values
    if (profit > 0) return 'text-emerald-300 font-semibold'
    if (profit < 0) return 'text-red-400 font-semibold'
    return 'text-slate-200'
  }

  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return 'text-red-400 bg-red-500/20'
    if (stock < 10) return 'text-orange-400 bg-orange-500/20'
    return 'text-emerald-300 bg-emerald-500/20'
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-20 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 font-tajawal text-slate-200">جاري تحميل بيانات الجرد...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-20 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-tajawal text-white mb-2">
          الجرد والتقارير
        </h1>
        <p className="text-lg font-tajawal text-slate-200">
          مراقبة المخزون والمبيعات اليومية والشهرية
        </p>
      </div>

      {/* Controls */}
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-emerald-300" />
            <label className="font-tajawal text-slate-200">اختر التاريخ:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-black/30 backdrop-blur-sm rounded-xl px-4 py-2 font-tajawal text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-white/20"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Filter className="w-6 h-6 text-emerald-300" />
            <label className="font-tajawal text-slate-200">عرض:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'daily' | 'monthly')}
              className="bg-black/30 backdrop-blur-sm rounded-xl px-4 py-2 font-tajawal text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-white/20"
            >
              <option value="daily">جرد يومي</option>
              <option value="monthly">تقرير شهري</option>
            </select>
          </div>
        </div>
      </div>

      {/* Daily View */}
      {viewMode === 'daily' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg p-6">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-emerald-300" />
                <div>
                  <h3 className="text-sm font-tajawal text-slate-200">إجمالي المبيعات</h3>
                  <p className="text-2xl font-bold font-tajawal text-slate-100">
                    {dailySummary.reduce((sum, item) => sum + item.sold_today, 0)} قطعة
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-emerald-300" />
                <div>
                  <h3 className="text-sm font-tajawal text-slate-200">قيمة المبيعات</h3>
                  <p className="text-2xl font-bold font-tajawal text-amber-200">
                    {formatCurrencyLS(dailySummary.reduce((sum, item) => sum + (item.total_revenue || 0), 0))}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-emerald-300" />
                <div>
                  <h3 className="text-sm font-tajawal text-slate-200">الأرباح</h3>
                  <p className="text-2xl font-bold font-tajawal text-amber-200">
                    {formatCurrencyLS(dailySummary.reduce((sum, item) => sum + (item.total_profit || 0), 0) - totalExpenses)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-emerald-300" />
                <div>
                  <h3 className="text-sm font-tajawal text-slate-200">إجمالي الأرباح ($)</h3>
                  <p className="text-2xl font-bold font-tajawal text-amber-200">
                    ${dailySummary.reduce((sum, item) => sum + (item.total_profit_usd || 0), 0).toFixed(2)}
                  </p>
                  <p className="text-xs font-tajawal text-slate-200 mt-1">
                    (بعد خصم المصاريف: ${((dailySummary.reduce((sum, item) => sum + (item.total_profit_usd || 0), 0) - (totalExpenses / 11735)).toFixed(2))})
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Audit Table */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 text-white p-6 shadow-lg">
            <h2 className="text-2xl font-bold font-tajawal text-white mb-6">
              الجرد اليومي - {selectedDate}
            </h2>

            {dailySummary.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-slate-200/30 mx-auto mb-4" />
                <p className="text-lg font-tajawal text-slate-200">
                  لا توجد بيانات جرد لهذا التاريخ
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-right py-3 px-4 font-tajawal text-white">المنتج</th>
                      <th className="text-right py-3 px-4 font-tajawal text-white">المخزون الافتتاحي</th>
                      <th className="text-right py-3 px-4 font-tajawal text-white">المبيعات اليوم</th>
                      <th className="text-right py-3 px-4 font-tajawal text-white">المخزون المتبقي</th>
                      <th className="text-right py-3 px-4 font-tajawal text-white">الإيرادات</th>
                      <th className="text-right py-3 px-4 font-tajawal text-white">الأرباح</th>
                      <th className="text-right py-3 px-4 font-tajawal text-white">الربح ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySummary.map((item, index) => (
                      <tr
                        key={item.product_id}
                        className="border-b border-white/10 hover:bg-white/5"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-tajawal text-slate-100 font-semibold">
                              {item.product_name}
                            </p>
                            <p className="text-sm font-tajawal text-slate-100/60">
                              #{item.product_id}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-tajawal text-slate-100">
                            {item.starting_stock} قطعة
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-tajawal text-slate-100 font-semibold">
                            {item.sold_today} قطعة
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-tajawal ${getStockStatusColor(item.ending_stock)}`}>
                            {item.ending_stock} قطعة
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-tajawal text-slate-100">
                            {formatCurrencyLS(item.total_revenue)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-tajawal ${getProfitColor(item.total_profit)}`}>
                            {formatCurrencyLS(item.total_profit)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-tajawal text-emerald-300 font-semibold">
                            ${item.total_profit_usd.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Monthly View */}
      {viewMode === 'monthly' && (
        <>
          {/* Monthly Summary */}
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold font-tajawal text-slate-100 mb-6">
              التقرير الشهري - {new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
            </h2>

            {monthlySummary.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-slate-100/30 mx-auto mb-4" />
                <p className="text-lg font-tajawal text-slate-100/60">
                  لا توجد بيانات لهذا الشهر
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gold/20">
                      <th className="text-right py-3 px-4 font-tajawal text-slate-100">المنتج</th>
                      <th className="text-right py-3 px-4 font-tajawal text-slate-100">إجمالي الكمية المباعة</th>
                      <th className="text-right py-3 px-4 font-tajawal text-slate-100">متوسط المبيعات اليومية</th>
                      <th className="text-right py-3 px-4 font-tajawal text-slate-100">الإيرادات الشهرية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySummary.map((item, index) => (
                      <tr
                        key={item.product_id}
                        className="border-b border-white/10 hover:bg-white/5"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-tajawal text-slate-100 font-semibold">
                              {item.product_name}
                            </p>
                            <p className="text-sm font-tajawal text-slate-100/60">
                              #{item.product_id}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-tajawal text-slate-100 font-semibold">
                            {item.total_quantity_sold} قطعة
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-tajawal text-slate-100">
                            {item.average_daily_sales.toFixed(1)} قطعة
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-tajawal text-slate-100">
                            {formatCurrencyLS(item.total_revenue)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
