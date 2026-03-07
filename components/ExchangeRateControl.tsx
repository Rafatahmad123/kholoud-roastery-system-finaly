'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Settings, RefreshCw } from 'lucide-react'
import { useExchangeRate } from '../contexts/ExchangeRateContext'
import { updateAllProductsExchangeRate } from '../lib/api'

export default function ExchangeRateControl() {
  const { exchangeRate, setExchangeRate, updateAllProductsExchangeRate } = useExchangeRate()
  const [tempRate, setTempRate] = useState(exchangeRate.toString())
  const [updating, setUpdating] = useState(false)

  const handleUpdate = async () => {
    const newRate = parseFloat(tempRate)
    if (isNaN(newRate) || newRate <= 0) {
      alert('يرجى إدخال سعر صحيح أكبر من صفر')
      return
    }

    setUpdating(true)
    try {
      await updateAllProductsExchangeRate(newRate)
      setExchangeRate(newRate)
      alert('تم تحديث سعر الصرف بنجاح!')
    } catch (error) {
      console.error('Error updating exchange rate:', error)
      alert('حدث خطأ أثناء تحديث سعر الصرف')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <motion.div
      className="glass rounded-3xl p-6 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <DollarSign className="w-6 h-6 text-amber-200" />
        <h3 className="text-xl font-bold font-tajawal text-white">
          سعر الصرف العالمي
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block font-tajawal text-white font-medium mb-2">
            سعر الصرف الحالي (ل.س مقابل $)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={tempRate}
              onChange={(e) => setTempRate(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="أدخل سعر الصرف"
              disabled={updating}
            />
            <motion.button
              onClick={handleUpdate}
              disabled={updating}
              className="bg-emerald-600/80 hover:bg-emerald-500 backdrop-blur-md text-white rounded-xl px-6 py-3 font-tajawal font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              whileHover={{ scale: updating ? 1 : 1.05 }}
              whileTap={{ scale: updating ? 1 : 0.95 }}
            >
              {updating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  تحديث الكل
                </>
              )}
            </motion.button>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-tajawal text-white">السعر الحالي:</span>
            <span className="font-bold font-tajawal text-amber-200 text-lg">
              {exchangeRate.toLocaleString('ar-SA')} ل.س
            </span>
          </div>
          <div className="text-sm font-tajawal text-gray-200">
            سيتم تحديث جميع المنتجات تلقائياً عند تغيير سعر الصرف
          </div>
        </div>
      </div>
    </motion.div>
  )
}
