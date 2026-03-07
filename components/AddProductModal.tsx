'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, Save, AlertCircle, RefreshCw, Trash2, Zap } from 'lucide-react'
import { createProduct, checkBarcodeExists } from '../lib/api'
import { useExchangeRate } from '../contexts/ExchangeRateContext'
import { useToast } from '../contexts/ToastContext'
import { calculateRetailPrice } from '../lib/currency'
import { reconnectSupabase, forceReconnect } from '../lib/supabase'
import { clearCache } from '../lib/clear-cache'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onProductAdded: () => void
}

export default function AddProductModal({ isOpen, onClose, onProductAdded }: AddProductModalProps) {
  const { exchangeRate } = useExchangeRate()
  const { showError, showSuccess, showInfo } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    type: '',
    roast_level: 'متوسط',
    packaging: '1 كجم',
    stock: 0,
    wholesale_price_usd: 0,
    exchange_rate: exchangeRate,
    expiry_date: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stock' || name === 'wholesale_price_usd' ? Number(value) : value
    }))
    setError('')
    setSuccess('')
  }

  const validateForm = async (): Promise<boolean> => {
    if (!formData.name.trim()) {
      setError('يرجى إدخال اسم المنتج')
      return false
    }

    if (!formData.barcode.trim()) {
      setError('يرجى إدخال الباركود')
      return false
    }

    if (!formData.type.trim()) {
      setError('يرجى إدخال نوع المنتج')
      return false
    }

    if (formData.stock < 0) {
      setError('الكمية يجب أن تكون 0 أو أكثر')
      return false
    }

    if (formData.wholesale_price_usd <= 0) {
      setError('سعر الجملة يجب أن يكون أكبر من صفر')
      return false
    }

    try {
      console.log('🔍 Validating barcode:', formData.barcode.trim())
      showInfo('جاري التحقق من الباركود...')
      
      const barcodeExists = await checkBarcodeExists(formData.barcode.trim())
      
      if (barcodeExists) {
        const errorMessage = 'الباركود موجود بالفعل في قاعدة البيانات'
        setError(errorMessage)
        showError(errorMessage)
        return false
      }
      
      console.log('✅ Barcode validation passed')
      return true
      
    } catch (error) {
      console.error('❌ Barcode validation error:', error)
      
      let errorMessage = 'حدث خطأ أثناء التحقق من الباركود'
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid API key')) {
          errorMessage = 'مشكلة في مفتاح API الخاص ب Supabase. يرجى التحقق من الإعدادات.'
        } else if (error.message.includes('column') || error.message.includes('schema')) {
          errorMessage = `خطأ في قاعدة البيانات: ${error.message}`
        } else if (error.message.includes('permission') || error.message.includes('403')) {
          errorMessage = 'لا يوجد صلاحية للوصول إلى قاعدة البيانات'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'مشكلة في الاتصال بالإنترنت'
        } else {
          errorMessage = `خطأ: ${error.message}`
        }
      }
      
      setError(errorMessage + ' - يمكنك إعادة المحاولة أو مسح التخزين المؤقت.')
      showError(errorMessage)
      return false
    }
  }

  const handleRetryConnection = async () => {
    console.log('🔄 RETRYING CONNECTION WITH FORCED RECONNECT...')
    showInfo('جاري إعادة محاولة الاتصال...')
    
    try {
      // Force reconnection with hardcoded credentials
      const newClient = forceReconnect()
      console.log('✅ Supabase client reconnected with hardcoded credentials')
      
      // Test the connection
      const { data, error, count } = await newClient
        .from('products')
        .select('*', { count: 'exact' })
        .limit(1)
        
      if (error) {
        throw error
      }
      
      console.log('✅ CONNECTION TEST PASSED!')
      console.log('📊 TABLE ACCESSIBLE:', count !== null)
      console.log('📊 SAMPLE DATA:', data)
      
      showSuccess('تم إعادة الاتصال بنجاح!')
      setError('')
      
    } catch (error) {
      console.error('❌ RETRY FAILED:', error)
      showError('فشلت إعادة المحاولة - يرجى مسح التخزين المؤقت وإعادة تحميل الصفحة')
    }
  }

  const handleClearCache = () => {
    console.log('🧹 Clearing cache...')
    showInfo('جاري مسح التخزين المؤقت...')
    clearCache()
  }

  const handleForceInsert = async () => {
    console.log('🚨 FORCE INSERT TRIGGERED!')
    showInfo('جاري إدخال قسري لهيل حب...')
    
    try {
      // Call the global force insert function
      const result = await (window as any).forceInsertHel()
      
      if (result.success) {
        showSuccess('✅ تم إدخال هيل حب بنجاح!')
        setSuccess('✅ تم إدخال هيل حب بنجاح!')
        
        // Refresh inventory after force insert
        setTimeout(() => {
          onProductAdded()
          setSuccess('')
        }, 1500)
      } else {
        showError('فشل الإدخال القسري')
      }
    } catch (error) {
      console.error('❌ Force insert error:', error)
      showError('خطأ في الإدخال القسري')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // FORCE CLEAR API ERROR STATE - Fresh start
    console.log('🔄 CLEARING ERROR STATE FOR FRESH SUBMISSION')
    setError('')
    setSuccess('')
    
    const isValid = await validateForm()
    if (!isValid) return

    setLoading(true)

    try {
      console.log('📝 Starting product creation...')
      showInfo('جاري حفظ المنتج...')

      // Prepare product data with exact column mapping and correct types
      const productData = {
        name: formData.name.trim(),
        barcode: formData.barcode.trim(),
        type: formData.type.trim(),
        roast_level: formData.roast_level,
        packaging: formData.packaging,
        stock: Number(formData.stock), // Ensure number
        wholesale_price_usd: Number(formData.wholesale_price_usd), // Ensure number
        exchange_rate: Number(formData.exchange_rate), // Ensure number
        expiry_date: formData.expiry_date || null,
        category: formData.type.trim(), // Map type to category for database
      }

      console.log('📊 Product data to insert (with correct types):', productData)
      console.log('🔢 wholesale_price_usd type:', typeof productData.wholesale_price_usd)
      console.log('🔢 exchange_rate type:', typeof productData.exchange_rate)

      // Insert product directly
      const result = await createProduct(productData)
      console.log('✅ Product inserted successfully:', result)

      showSuccess('تم إضافة المنتج بنجاح!')
      setSuccess('تم إضافة المنتج بنجاح!')
      
      // Reset form
      setFormData({
        name: '',
        barcode: '',
        type: '',
        roast_level: 'متوسط',
        packaging: '1 كجم',
        stock: 0,
        wholesale_price_usd: 0,
        exchange_rate: exchangeRate,
        expiry_date: '',
      })

      // Close modal after success and refresh inventory
      setTimeout(() => {
        onClose()
        onProductAdded()
        setSuccess('')
      }, 1500)

    } catch (error) {
      console.error('❌ Error creating product:', error)
      
      let errorMessage = 'حدث خطأ أثناء إضافة المنتج'
      
      if (error instanceof Error) {
        // Provide specific error messages
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          errorMessage = 'الباركود موجود بالفعل في قاعدة البيانات'
          showError('الباركود موجود بالفعل في قاعدة البيانات')
        } else if (error.message.includes('permission') || error.message.includes('403')) {
          errorMessage = 'لا يوجد صلاحية للوصول إلى قاعدة البيانات'
          showError('لا يوجد صلاحية للوصول إلى قاعدة البيانات')
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'مشكلة في الاتصال بالإنترنت'
          showError('مشكلة في الاتصال بالإنترنت')
        } else if (error.message.includes('column') || error.message.includes('schema')) {
          errorMessage = `خطأ في قاعدة البيانات: ${error.message}`
          showError(`خطأ في قاعدة البيانات: ${error.message}`)
        } else if (error.message.includes('Invalid API key')) {
          errorMessage = 'مشكلة في مفتاح API - يرجى التحقق من المفاتيح'
          showError('مشكلة في مفتاح API - يرجى التحقق من المفاتيح')
        } else {
          errorMessage = `خطأ: ${error.message}`
          showError(`خطأ: ${error.message}`)
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      setError('')
      setSuccess('')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="relative glass rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-gold" />
                <h3 className="text-xl font-bold font-tajawal text-espresso-brown">
                  إضافة منتج جديد
                </h3>
              </div>
              <motion.button
                onClick={handleClose}
                className="neumorphic rounded-xl p-2 text-espresso-brown hover:bg-red-500 hover:text-white smooth-transition"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Success Message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  className="mb-4 p-3 neumorphic rounded-xl border-2 border-gold/50 bg-gold/10"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <p className="text-center font-tajawal text-gold font-semibold">
                    {success}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="mb-4 p-3 neumorphic rounded-xl border-2 border-red-500/50 bg-red-50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <p className="font-tajawal text-red-600">{error}</p>
                    </div>
                    
                    {/* Retry and Clear Cache Buttons */}
                    <div className="flex gap-2">
                      <motion.button
                        type="button"
                        onClick={handleRetryConnection}
                        className="flex-1 neumorphic rounded-lg px-3 py-2 font-tajawal text-espresso-brown text-sm hover:bg-blue-500 hover:text-white smooth-transition flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <RefreshCw className="w-4 h-4" />
                        إعادة المحاولة
                      </motion.button>
                      
                      <motion.button
                        type="button"
                        onClick={handleClearCache}
                        className="flex-1 neumorphic rounded-lg px-3 py-2 font-tajawal text-espresso-brown text-sm hover:bg-orange-500 hover:text-white smooth-transition flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Trash2 className="w-4 h-4" />
                        مسح التخزين
                      </motion.button>
                    </div>
                    
                    {/* FORCE INSERT BUTTON */}
                    <div className="mt-4">
                      <motion.button
                        type="button"
                        onClick={handleForceInsert}
                        className="w-full neumorphic rounded-lg px-4 py-3 font-tajawal text-white bg-red-600 hover:bg-red-700 smooth-transition flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Zap className="w-5 h-5" />
                        إدخال قسري لهيل حب
                      </motion.button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        تجاوز كل التحقق وأدخل هيل حب مباشرة
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                  اسم المنتج
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full neumorphic rounded-xl px-4 py-3 font-tajawal text-espresso-brown placeholder-espresso-brown/50 focus:outline-none focus:ring-2 focus:ring-gold smooth-transition"
                  placeholder="أدخل اسم المنتج"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                  الباركود
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="أدخل الباركود"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                  التصنيف
                </label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full neumorphic rounded-xl px-4 py-3 font-tajawal text-espresso-brown placeholder-espresso-brown/50 focus:outline-none focus:ring-2 focus:ring-gold smooth-transition"
                  placeholder="مثال: بن عربي"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                  سعر الجملة ($)
                </label>
                <input
                  type="number"
                  name="wholesale_price_usd"
                  value={formData.wholesale_price_usd}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full neumorphic rounded-xl px-4 py-3 font-tajawal text-espresso-brown placeholder-espresso-brown/50 focus:outline-none focus:ring-2 focus:ring-gold smooth-transition"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                  تاريخ الانتهاء
                </label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleInputChange}
                  className="w-full neumorphic rounded-xl px-4 py-3 font-tajawal text-espresso-brown placeholder-espresso-brown/50 focus:outline-none focus:ring-2 focus:ring-gold smooth-transition"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                    درجة التحميص
                  </label>
                  <select
                    name="roast_level"
                    value={formData.roast_level}
                    onChange={handleInputChange}
                    className="w-full neumorphic rounded-xl px-4 py-3 font-tajawal text-espresso-brown focus:outline-none focus:ring-2 focus:ring-gold smooth-transition"
                    disabled={loading}
                  >
                    <option value="فاتح">فاتح</option>
                    <option value="متوسط">متوسط</option>
                    <option value="داكن">داكن</option>
                  </select>
                </div>

                <div>
                  <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                    التغليف
                  </label>
                  <select
                    name="packaging"
                    value={formData.packaging}
                    onChange={handleInputChange}
                    className="w-full neumorphic rounded-xl px-4 py-3 font-tajawal text-espresso-brown focus:outline-none focus:ring-2 focus:ring-gold smooth-transition"
                    disabled={loading}
                  >
                    <option value="250 جرام">250 جرام</option>
                    <option value="500 جرام">500 جرام</option>
                    <option value="1 كجم">1 كجم</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                    المخزون
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full neumorphic rounded-xl px-4 py-3 font-tajawal text-espresso-brown placeholder-espresso-brown/50 focus:outline-none focus:ring-2 focus:ring-gold smooth-transition"
                    placeholder="0"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                    سعر البيع المقترح (ل.س)
                  </label>
                  <input
                    type="text"
                    value={Math.round(formData.wholesale_price_usd * 1.20 * exchangeRate).toLocaleString('ar-SA')}
                    readOnly
                    className="w-full neumorphic-inset rounded-xl px-4 py-3 font-tajawal text-gold placeholder-espresso-brown/50"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full neumorphic rounded-2xl py-3 font-tajawal text-espresso-brown font-semibold hover:bg-gold hover:text-white smooth-transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-espresso-brown border-t-transparent rounded-full animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    حفظ المنتج
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
