'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardCard from './DashboardCard'
import { TrendingUp, Package, DollarSign, Coffee, RefreshCcw } from 'lucide-react'
import { fetchDashboardStats } from '../lib/api'
import { formatCurrencyLS } from '../lib/currency'

export default function Dashboard() {
  const [stats, setStats] = useState<any>({
    daily_sales: 0,
    profit: 0,
    stock_levels: { total: 0, lowStockCount: 0, lowStockProducts: [] },
    recent_sales: [],
    exchange_rate: 37500,
    formatted_values: { daily_sales: '0 ل.س', profit: '0 ل.س', stock_value: '0 ل.س' }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 30000)

    const handleSaleCompleted = () => loadStats()
    const handleVisibilityChange = () => { if (!document.hidden) loadStats() }
    const handleWindowFocus = () => loadStats()

    if (typeof window !== 'undefined') {
      window.addEventListener('saleCompleted', handleSaleCompleted as EventListener)
      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('focus', handleWindowFocus)
    }

    return () => {
      clearInterval(interval)
      if (typeof window !== 'undefined') {
        window.removeEventListener('saleCompleted', handleSaleCompleted as EventListener)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', handleWindowFocus)
      }
    }
  }, [])

  const loadStats = async () => {
    try {
      const data = await fetchDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('❌ Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      title: 'المبيعات اليومية',
      value: stats.formatted_values?.daily_sales || formatCurrencyLS(stats.daily_sales),
      icon: <DollarSign className="w-8 h-8" />,
      trend: stats.daily_sales > 0 ? '+١٢٪' : '٠٪',
      color: 'text-amber-200'
    },
    {
      title: 'الأرباح',
      value: stats.formatted_values?.profit || formatCurrencyLS(stats.profit),
      icon: <TrendingUp className="w-8 h-8" />,
      trend: stats.profit > 0 ? '+١٥٪' : '٠٪',
      color: 'text-amber-200'
    },
    {
      title: 'مستويات المخزون',
      value: `${stats.stock_levels?.total || 0} وحدة`,
      icon: <Package className="w-8 h-8" />,
      trend: `${stats.stock_levels?.lowStockCount || 0} منخفض`,
      color: 'text-slate-200'
    },
    {
      title: 'إجمالي المنتجات',
      value: `${stats.totalProducts || 0} منتج`,
      icon: <Coffee className="w-8 h-8" />,
      trend: 'مستقر',
      color: 'text-slate-200'
    }
  ]

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-20">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-20">
      {/* Header Section with Fade into Background */}
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-3xl font-bold font-tajawal text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mb-2">
              لوحة التحكم
              <div className="h-1 w-12 bg-emerald-500 mt-1 rounded-full"></div>
            </h2>
            <p className="text-white/80 font-tajawal drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">نظرة عامة على أداء محمصة الخلود اليوم</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-tajawal bg-white/10 px-3 py-1.5 rounded-full text-white/70 border border-white/10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              آخر تحديث: {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button 
              onClick={loadStats}
              className="p-2 bg-white/10 hover:bg-emerald-500/20 rounded-full transition-colors text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="smooth-transition hover:-translate-y-1">
            <DashboardCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              color={stat.color}
            />
          </div>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Sales Section */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 text-white p-6 shadow-lg">
          <h3 className="text-xl font-bold font-tajawal text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-200" />
            أحدث المبيعات
          </h3>
          <div className="space-y-4">
            {stats.recent_sales?.length > 0 ? (
              stats.recent_sales.map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                      <Coffee className="w-6 h-6 text-amber-200" />
                    </div>
                    <div>
                      <p className="font-tajawal font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{sale.items?.[0]?.product_name || 'طلب متنوع'}</p>
                      <p className="text-sm text-slate-100">{new Date(sale.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{formatCurrencyLS(sale.total_amount)}</p>
                    <p className="text-xs text-emerald-400">مكتمل</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-white/40">
                <Coffee className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>لا توجد عمليات بيع مسجلة حالياً</p>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Alerts Section */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 text-white p-6 shadow-lg">
          <h3 className="text-xl font-bold font-tajawal text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-200" />
            تنبيهات المخزون
          </h3>
          <div className="space-y-4">
            {stats.stock_levels?.lowStockProducts?.length > 0 ? (
              stats.stock_levels.lowStockProducts.map((product: any) => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-tajawal font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{product.name_ar}</p>
                      <p className="text-sm text-slate-100">المتبقي: {product.stock_quantity} وحدة</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-orange-500 text-white px-2 py-1 rounded-md font-bold">طلب فوري</span>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-white/40">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>جميع مستويات المخزون ممتازة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}