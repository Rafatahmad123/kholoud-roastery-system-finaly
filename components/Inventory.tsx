'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Package, Coffee, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react'
import { fetchProducts, deleteProduct } from '../lib/api'
import { Product } from '../lib/types'
import { formatDualCurrency, formatDate, isExpiringSoon } from '../lib/currency'
import { useExchangeRate } from '../contexts/ExchangeRateContext'
import AddProductModal from './AddProductModal'
import EditProductModal from './EditProductModal'

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('الكل')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null)
  const { exchangeRate } = useExchangeRate()

  useEffect(() => {
    loadProducts()
  }, [])

  // Listen for exchange rate changes and recalculate prices
  useEffect(() => {
    const handleExchangeRateChange = (event: CustomEvent) => {
      console.log('💱 Inventory: Exchange rate changed, recalculating prices')
      loadProducts() // Reload products to trigger price recalculation
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('exchangeRateChanged', handleExchangeRateChange as EventListener)
      return () => {
        window.removeEventListener('exchangeRateChanged', handleExchangeRateChange as EventListener)
      }
    }
  }, [])

  const loadProducts = async () => {
    try {
      const data = await fetchProducts()
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setShowEditModal(true)
  }

  const handleDeleteProduct = (product: Product) => {
    setDeleteConfirm(product)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    
    try {
      console.log('🗑️ Attempting to delete product:', deleteConfirm.id, deleteConfirm.name)
      const result = await deleteProduct(deleteConfirm.id)
      console.log('✅ Delete API result:', result)
      
      setDeleteConfirm(null)
      
      // Force immediate refresh to clear deleted item from UI
      console.log('🔄 Forcing immediate inventory refresh...')
      await loadProducts() // Force refresh
      
    } catch (error) {
      console.error('❌ Error deleting product:', error)
      alert(`فشل في حذف المنتج: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.includes(searchTerm) || 
                         product.type.includes(searchTerm) ||
                         product.roast_level.includes(searchTerm)
    const matchesFilter = filterType === 'الكل' || product.type === filterType
    return matchesSearch && matchesFilter
  })

  const uniqueTypes = ['الكل', ...Array.from(new Set(products.map(p => p.type)))]

  if (loading) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-20">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
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
              إدارة المنتجات
              <div className="h-1 w-12 bg-emerald-500 mt-1 rounded-full"></div>
            </h2>
            <p className="text-white/80 font-tajawal drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">إدارة وتتبع جميع منتجات القهوة والمخزون</p>
          </div>
        </div>
      </div>

      {/* Search and Filters Section - Glass Card */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-200/50 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث عن منتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/30 backdrop-blur-sm rounded-2xl pr-12 pl-4 py-3 font-tajawal text-slate-100 placeholder-slate-200/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-white/20"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-black/30 backdrop-blur-sm rounded-2xl px-4 py-3 font-tajawal text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-white/20"
          >
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-black/30 backdrop-blur-sm rounded-2xl px-6 py-3 font-tajawal text-slate-200 hover:bg-emerald-600 hover:text-white transition-all duration-200 flex items-center gap-2 border border-white/20"
          >
            <Plus className="w-5 h-5" />
            إضافة منتج
          </button>
        </div>
      </div>

      {/* Products Table Section - Glass Card */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gold/20">
              <th className="text-right font-tajawal text-white pb-3">اسم المنتج</th>
              <th className="text-right font-tajawal text-white pb-3">تاريخ الانتهاء</th>
              <th className="text-right font-tajawal text-white pb-3">سعر الجملة (ل.س / $)</th>
              <th className="text-right font-tajawal text-white pb-3">السعر العمومي (+20%)</th>
              <th className="text-right font-tajawal text-white pb-3">المخزون</th>
              <th className="text-right font-tajawal text-white pb-3">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product, index) => (
              <tr
                key={product.id}
                className="border-b border-gold/10 hover:bg-gold/5 smooth-transition"
              >
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <Coffee className="w-6 h-6 text-emerald-300" />
                    <div className="flex flex-col">
                      <span className="font-tajawal text-slate-100">{product.name}</span>
                      {isExpiringSoon(product.expiry_date) && (
                        <div className="flex items-center gap-1 text-orange-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-xs font-tajawal">ينتهي قريباً</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 font-tajawal text-slate-100">
                  {formatDate(product.expiry_date)}
                </td>
                <td className="py-4 font-tajawal text-slate-100 font-semibold">
                  {formatDualCurrency(product.wholesale_price_usd || product.price / 1.20, exchangeRate, false)}
                </td>
                <td className="py-4 font-tajawal text-amber-200 font-bold">
                  {formatDualCurrency(product.wholesale_price_usd || product.price / 1.20, exchangeRate, true)}
                </td>
                <td className="py-4">
                  <span className={`font-tajawal ${
                    product.stock < 20 ? 'text-red-400' : 
                    product.stock < 50 ? 'text-orange-400' : 
                    'text-emerald-300'
                  }`}>
                    {product.stock} وحدة
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="p-2 bg-black/30 backdrop-blur-sm rounded-xl hover:bg-emerald-600 hover:text-white transition-all duration-200 border border-white/20"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      className="p-2 bg-black/30 backdrop-blur-sm rounded-xl hover:bg-red-600 hover:text-white transition-all duration-200 border border-white/20"
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

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onProductAdded={loadProducts}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        product={selectedProduct}
        onSuccess={loadProducts}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-transparent rounded-2xl p-6 w-full max-w-md neumorphic">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-tajawal text-white">
                  تأكيد الحذف
                </h3>
                <p className="text-sm font-tajawal text-slate-200">
                  هل أنت متأكد من حذف هذا المنتج؟
                </p>
              </div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 mb-4 border border-white/10">
              <p className="font-tajawal text-slate-100 font-medium">
                {deleteConfirm.name}
              </p>
              <p className="text-sm font-tajawal text-slate-200">
                {deleteConfirm.barcode}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-white/20 text-slate-200 rounded-lg hover:bg-white/10 transition-all duration-200 font-tajawal font-medium bg-black/30 backdrop-blur-sm"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 smooth-transition font-tajawal font-medium"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
