'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Package, DollarSign, Barcode, Coffee, Edit } from 'lucide-react'
import { updateProduct } from '../lib/api'
import { Product } from '../lib/types'

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSuccess: () => void
}

export default function EditProductModal({ isOpen, onClose, product, onSuccess }: EditProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    type: '',
    roast_level: '',
    packaging: '',
    stock: 0,
    wholesale_price_usd: 0,
    exchange_rate: 37500,
    expiry_date: '',
    category: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        barcode: product.barcode,
        type: product.type,
        roast_level: product.roast_level || '',
        packaging: product.packaging || '',
        stock: product.stock,
        wholesale_price_usd: product.wholesale_price_usd,
        exchange_rate: 37500,
        expiry_date: product.expiry_date || '',
        category: product.category || product.type
      })
    }
  }, [product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!product) throw new Error('No product selected')
      
      await updateProduct(product.id, formData)
      console.log('✅ Product updated successfully!')
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('❌ Error updating product:', error)
      setError(error instanceof Error ? error.message : 'Failed to update product')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stock' || name === 'wholesale_price_usd' || name === 'exchange_rate' 
        ? Number(value) || 0 
        : value
    }))
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-transparent rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto neumorphic"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-tajawal text-espresso-brown flex items-center gap-2">
              <Edit className="w-6 h-6 text-gold" />
              تعديل المنتج
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full smooth-transition"
            >
              <X className="w-5 h-5 text-espresso-brown" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Name */}
              <div>
                <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                  اسم المنتج
                </label>
                <div className="relative">
                  <Package className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gold" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pr-10 pl-3 py-3 border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 font-tajawal text-espresso-brown neumorphic-inset"
                    placeholder="أدخل اسم المنتج"
                    required
                  />
                </div>
              </div>

              {/* Barcode */}
              <div>
                <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                  الباركود
                </label>
                <div className="relative">
                  <Barcode className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gold" />
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    className="w-full pr-10 pl-3 py-3 border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 font-tajawal text-espresso-brown neumorphic-inset"
                    placeholder="أدخل الباركود"
                    required
                  />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                  النوع
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 font-tajawal text-espresso-brown neumorphic-inset"
                  required
                >
                  <option value="">اختر النوع</option>
                  <option value="قهوة عربية">قهوة عربية</option>
                  <option value="قهوة تركية">قهوة تركية</option>
                  <option value="قهوة خاصة">قهوة خاصة</option>
                  <option value="شاي">شاي</option>
                  <option value="بهارات">بهارات</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                  الفئة
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 font-tajawal text-espresso-brown neumorphic-inset"
                  placeholder="أدخل الفئة"
                />
              </div>

              {/* Roast Level */}
              <div>
                <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                  مستوى التحميص
                </label>
                <select
                  name="roast_level"
                  value={formData.roast_level}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 font-tajawal text-espresso-brown neumorphic-inset"
                >
                  <option value="">اختر مستوى التحميص</option>
                  <option value="خفيف">خفيف</option>
                  <option value="متوسط">متوسط</option>
                  <option value="داكن">داكن</option>
                  <option value="غامق جداً">غامق جداً</option>
                </select>
              </div>

              {/* Packaging */}
              <div>
                <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                  التغليف
                </label>
                <input
                  type="text"
                  name="packaging"
                  value={formData.packaging}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 font-tajawal text-espresso-brown neumorphic-inset"
                  placeholder="مثال: 1 كجم، 500جم"
                />
              </div>

              {/* Stock */}
              <div>
                <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                  الكمية
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 font-tajawal text-espresso-brown neumorphic-inset"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>

              {/* Wholesale Price USD */}
              <div>
                <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                  السعر الجملة (دولار)
                </label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gold" />
                  <input
                    type="number"
                    name="wholesale_price_usd"
                    value={formData.wholesale_price_usd}
                    onChange={handleChange}
                    className="w-full pr-10 pl-3 py-3 border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 font-tajawal text-espresso-brown neumorphic-inset"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block font-tajawal text-espresso-brown font-medium mb-2">
                  تاريخ الانتهاء
                </label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 font-tajawal text-espresso-brown neumorphic-inset"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gold/20 text-espresso-brown rounded-lg hover:bg-gray-50 smooth-transition font-tajawal font-medium"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gold text-white px-4 py-3 rounded-lg hover:bg-gold/600 smooth-transition font-tajawal font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    حفظ التعديلات
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
