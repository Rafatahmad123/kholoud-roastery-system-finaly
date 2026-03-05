'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, TrendingDown, TrendingUp, Package, Clock } from 'lucide-react'
import { fetchDailyAudit } from '../lib/api'
import { formatCurrencyLS } from '../lib/currency'

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
  date: string
  totalItemsSold: number
  totalSales: number
  uniqueProducts: number
  logs: AuditLog[]
}

export default function DailyAudit() {
  const [auditData, setAuditData] = useState<AuditLog[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [groupedData, setGroupedData] = useState<DailySummary[]>([])

  useEffect(() => {
    loadAuditData(selectedDate)
  }, [selectedDate])

  const loadAuditData = async (date: string) => {
    try {
      setLoading(true)
      console.log('📊 Daily Audit: Loading data for date:', date)
      const data = await fetchDailyAudit(date)
      console.log('📊 Daily Audit: Data loaded:', data)
      setAuditData(data)
      
      // Group data by date for summary view
      const grouped = groupAuditData(data)
      setGroupedData(grouped)
    } catch (error) {
      console.error('❌ Error loading audit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupAuditData = (logs: AuditLog[]): DailySummary[] => {
    const grouped: { [key: string]: DailySummary } = {}
    
    logs.forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0]
      
      if (!grouped[date]) {
        grouped[date] = {
          date,
          totalItemsSold: 0,
          totalSales: 0,
          uniqueProducts: 0,
          logs: []
        }
      }
      
      grouped[date].totalItemsSold += log.quantity_sold
      grouped[date].totalSales += (log.quantity_sold * (log.products?.price || 0))
      grouped[date].logs.push(log)
    })
    
    // Count unique products and sort by date
    return Object.values(grouped).map(day => ({
      ...day,
      uniqueProducts: new Set(day.logs.map(log => log.product_id)).size
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  const getStockStatus = (remaining: number, sold: number) => {
    if (remaining === 0) return { status: 'نفذ', color: 'text-red-600', bg: 'bg-red-100' }
    if (remaining < 10) return { status: 'منخفض', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { status: 'جيد', color: 'text-green-600', bg: 'bg-green-100' }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-20 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
          <p className="mt-4 font-tajawal text-espresso-brown">جاري تحميل بيانات الجرد اليومي...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="container mx-auto px-4 pt-24 pb-20 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-tajawal text-espresso-brown mb-2">
          الجرد اليومي
        </h1>
        <p className="text-lg font-tajawal text-espresso-brown/70">
          مراقبة المخزون والمبيعات اليومية
        </p>
      </div>

      {/* Date Selector */}
      <div className="glass rounded-3xl p-6 mb-8">
        <div className="flex items-center gap-4">
          <Calendar className="w-6 h-6 text-gold" />
          <label className="font-tajawal text-espresso-brown">اختر التاريخ:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="neumorphic rounded-xl px-4 py-2 font-tajawal text-espresso-brown focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          className="glass rounded-3xl p-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-gold" />
            <div>
              <h3 className="text-sm font-tajawal text-espresso-brown/60">إجمالي المبيعات</h3>
              <p className="text-2xl font-bold font-tajawal text-espresso-brown">
                {auditData.reduce((sum, log) => sum + log.quantity_sold, 0)} قطعة
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="glass rounded-3xl p-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <div>
              <h3 className="text-sm font-tajawal text-espresso-brown/60">قيمة المبيعات</h3>
              <p className="text-2xl font-bold font-tajawal text-espresso-brown">
                {formatCurrencyLS(auditData.reduce((sum, log) => sum + (log.quantity_sold * (log.products?.price || 0)), 0))}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="glass rounded-3xl p-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="text-sm font-tajawal text-espresso-brown/60">عدد المنتجات</h3>
              <p className="text-2xl font-bold font-tajawal text-espresso-brown">
                {new Set(auditData.map(log => log.product_id)).size} منتج
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Audit Logs Table */}
      <div className="glass rounded-3xl p-6">
        <h2 className="text-2xl font-bold font-tajawal text-espresso-brown mb-6">
          سجل الجرد اليومي
        </h2>

        {auditData.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-espresso-brown/30 mx-auto mb-4" />
            <p className="text-lg font-tajawal text-espresso-brown/60">
              لا توجد بيانات جرد لهذا التاريخ
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold/20">
                  <th className="text-right py-3 px-4 font-tajawal text-espresso-brown">المنتج</th>
                  <th className="text-right py-3 px-4 font-tajawal text-espresso-brown">الكمية المباعة</th>
                  <th className="text-right py-3 px-4 font-tajawal text-espresso-brown">المخزون المتبقي</th>
                  <th className="text-right py-3 px-4 font-tajawal text-espresso-brown">حالة المخزون</th>
                  <th className="text-right py-3 px-4 font-tajawal text-espresso-brown">الوقت</th>
                </tr>
              </thead>
              <tbody>
                {auditData.map((log, index) => {
                  const stockStatus = getStockStatus(log.remaining_stock, log.quantity_sold)
                  return (
                    <motion.tr
                      key={log.id}
                      className="border-b border-gold/10 hover:bg-gold/5"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-tajawal text-espresso-brown font-semibold">
                            {log.product_name}
                          </p>
                          <p className="text-sm font-tajawal text-espresso-brown/60">
                            #{log.product_id}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-tajawal text-espresso-brown">
                          {log.quantity_sold} قطعة
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-tajawal text-espresso-brown">
                          {log.remaining_stock} قطعة
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-tajawal ${stockStatus.bg} ${stockStatus.color}`}>
                          {stockStatus.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-tajawal text-espresso-brown/60 text-sm">
                          {new Date(log.created_at).toLocaleTimeString('ar-SA', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}
