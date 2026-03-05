'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Plus, Minus, ShoppingCart, CreditCard, Search, X, CheckCircle, Edit2, Save, XCircle } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { fetchProducts, fetchProductByBarcode, createSale, createInventoryAudit } from '../lib/api'
import { formatDualCurrency } from '../lib/currency'
import { useExchangeRate } from '../contexts/ExchangeRateContext'
import { Product } from '../lib/types'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  stock: number
  wholesale_price?: number
  isEditingPrice?: boolean
  originalPrice?: number
}

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const { exchangeRate } = useExchangeRate()
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  // Listen for exchange rate changes and recalculate prices
  useEffect(() => {
    const handleExchangeRateChange = (event: CustomEvent) => {
      console.log('💱 POS: Exchange rate changed, recalculating prices')
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
      console.log('🔄 POS: Loading products from Supabase...')
      const data = await fetchProducts()
      console.log('📊 POS: Products loaded:', data)
      console.log('🔍 Product IDs and types:')
      data.forEach((product, index) => {
        console.log(`  Product ${index}: ID=${product.id}, Type=${typeof product.id}, Name=${product.name}`)
      })
      setProducts(data)
    } catch (error) {
      console.error('❌ Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.includes(searchTerm) || product.type.includes(searchTerm)
  )

  useEffect(() => {
    if (showScanner && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )
      scannerRef.current.render(
        async (decodedText) => {
          try {
            const product = await fetchProductByBarcode(decodedText)
            if (product) {
              addToCart(product)
            }
          } catch (error) {
            console.error('Error fetching product by barcode:', error)
          }
          setShowScanner(false)
        },
        (error) => {
          console.warn(error)
        }
      )
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
        scannerRef.current = null
      }
    }
  }, [showScanner])

  const addToCart = (product: Product) => {
    console.log('🛒 POS: Adding product to cart:', product)
    console.log('🔍 Product ID type:', typeof product.id)
    console.log('🔍 Product ID value:', product.id)
    
    // ✅ ID Matching: Ensure product.id is used as Integer
    const productId = Number(product.id)
    console.log('🔍 Converted Product ID:', productId, 'Type:', typeof productId)
    
    const retailPrice = (product.wholesale_price_usd || product.price / 1.20) * 1.20 // Calculate retail price
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === productId)
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1
        if (newQuantity > product.stock) {
          console.log('⚠️ Insufficient stock for product:', product.name)
          return prevCart
        }
        console.log('🔄 Updating existing item:', existingItem.name, 'New quantity:', newQuantity)
        return prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity: newQuantity, price: retailPrice, wholesale_price: product.wholesale_price_usd || 0 }
            : item
        )
      }
      if (product.stock > 0) {
        console.log('✅ Adding new item to cart:', product.name, 'ID:', productId)
        return [...prevCart, { 
          ...product, 
          id: productId, 
          quantity: 1, 
          price: retailPrice, 
          stock: product.stock,
          wholesale_price: product.wholesale_price_usd || 0,
          isEditingPrice: false,
          originalPrice: retailPrice
        }]
      }
      console.log('⚠️ Product out of stock:', product.name)
      return prevCart
    })
  }

  const updateQuantity = (id: number, change: number) => {
    console.log('🔄 POS: Updating quantity for item ID:', id, 'Change:', change)
    console.log('🔍 ID type:', typeof id)
    
    // ✅ Click Handler: Ensure ID is handled as Integer
    const itemId = Number(id)
    console.log('🔍 Converted Item ID:', itemId, 'Type:', typeof itemId)
    
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === itemId) {
          const newQuantity = item.quantity + change
          console.log('🔄 Updating item quantity:', item.name, 'From:', item.quantity, 'To:', newQuantity)
          if (newQuantity > item.stock) {
            console.log('⚠️ Insufficient stock for item:', item.name)
            return item
          }
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null
        }
        return item
      }).filter(Boolean) as CartItem[]
    })
  }

  // ✅ POS UI UPDATE: Enable Manual Price Override
  const togglePriceEdit = (id: number) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === id 
          ? { ...item, isEditingPrice: !item.isEditingPrice, originalPrice: item.originalPrice || item.price }
          : item
      )
    )
  }

  const updateItemPrice = (id: number, newPrice: number) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === id 
          ? { ...item, price: newPrice }
          : item
      )
    )
  }

  const savePriceEdit = (id: number) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === id 
          ? { ...item, isEditingPrice: false, originalPrice: item.price }
          : item
      )
    )
  }

  const cancelPriceEdit = (id: number) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === id 
          ? { ...item, isEditingPrice: false, price: item.originalPrice || item.price }
          : item
      )
    )
  }

  const calculateItemProfit = (item: CartItem) => {
    const wholesalePrice = item.wholesale_price || 0
    return (item.price - wholesalePrice) * item.quantity
  }

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handlePayment = async () => {
    if (cart.length === 0) return

    setProcessingPayment(true)
    try {
      // Fetch product details to get wholesale prices
      const productsWithWholesale = await Promise.all(
        cart.map(async (item) => {
          try {
            const response = await fetch('/api/products')
            const products = await response.json()
            const product = products.find((p: any) => p.id === item.id)
            console.log('🔍 POS Product lookup:', {
              cartItemId: item.id,
              cartItemType: typeof item.id,
              foundProduct: product,
              productId: product?.id,
              productType: typeof product?.id
            })
            return {
              ...item,
              product_name: product?.name || `Product ${item.id}`, // ✅ Data to Capture: Save product_name
              wholesale_price: product?.wholesale_price || 0,
              remaining_stock: product?.stock_quantity || 0 // ✅ Data to Capture: Save remaining_stock
            }
          } catch (error) {
            console.error('❌ Error fetching product wholesale price:', error)
            return {
              ...item,
              product_name: `Product ${item.id}`,
              wholesale_price: 0,
              remaining_stock: 0
            }
          }
        })
      )

      // ✅ Ensure product_id is INTEGER (not UUID)
      const saleData = {
        total_amount: getTotal(),
        payment_method: 'cash',
        items: productsWithWholesale.map(item => ({
          product_id: item.id,  // ✅ Send as INTEGER from cart
          quantity: item.quantity,
          unit_price: item.price,         // ✅ FINAL SYNC: Manual price saved here
          wholesale_price: item.wholesale_price, // ✅ Include wholesale_price for database
          total_price: item.price * item.quantity,
        }))
      }

      console.log('💳 Processing payment with data:', saleData)
      console.log('📊 Cart items being processed:', cart)
      console.log('📊 Products with wholesale prices:', productsWithWholesale)
      console.log('📊 Final sale items with wholesale prices:', saleData.items)
      
      // ✅ Log types for verification - should all be integers
      saleData.items.forEach((item, index) => {
        console.log(`🔍 Item ${index} types:`, {
          product_id: item.product_id,
          product_id_type: typeof item.product_id,
          quantity: item.quantity,
          quantity_type: typeof item.quantity,
          unit_price: item.unit_price,
          unit_price_type: typeof item.unit_price,
          wholesale_price: item.wholesale_price,
          wholesale_price_type: typeof item.wholesale_price
        })
      })
      
      // Create sale via API
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Sale creation failed:', errorData)
        throw new Error(errorData.error || 'Failed to create sale')
      }
      
      const createdSale = await response.json()
      console.log('✅✅✅ SUCCESS! Sale created via Supabase:', createdSale)
      
      // ✅ POS Trigger: Update POS payment logic to insert inventory audit records
      try {
        console.log('📊 Creating inventory audit records for sale:', createdSale.id)
        const auditResult = await createInventoryAudit(createdSale.id, productsWithWholesale)
        console.log('📊 Inventory audit logging result:', auditResult)
      } catch (auditError) {
        console.error('⚠️ Inventory audit logging failed (but sale completed):', auditError)
        // ✅ Safe Integration: Don't fail the sale if audit logging fails
      }
      
      // Trigger dashboard refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('saleCompleted', { detail: createdSale }))
      }
      
      // Clear cart and show success
      setCart([])
      alert('تمت عملية البيع بنجاح!')
      
    } catch (error) {
      console.error('❌ SALE INSERT ERROR:', error)
      alert('فشلت عملية البيع: ' + (error as Error).message)
    } finally {
      setProcessingPayment(false)
    }
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-20 min-h-screen">
      {/* Header Section with Glass Card */}
      <div className="bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-3xl font-bold font-tajawal text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mb-2">
              نقطة البيع
              <div className="h-1 w-12 bg-emerald-500 mt-1 rounded-full"></div>
            </h2>
            <p className="text-white/80 font-tajawal drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">نظام المبيعات والمسح الضوئي</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Products Section - Glass Card */}
          <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold font-tajawal text-white">المنتجات</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-200/50 w-5 h-5" />
                <input
                  type="text"
                  placeholder="البحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-black/30 backdrop-blur-sm rounded-xl pr-10 pl-4 py-2 font-tajawal text-slate-100 placeholder-slate-200/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-white/20"
                />
                  <input
                    type="text"
                    placeholder="البحث..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-black/30 backdrop-blur-sm rounded-xl pr-10 pl-4 py-2 font-tajawal text-slate-100 placeholder-slate-200/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-white/20"
                  />
                </div>
                <button
                  onClick={() => setShowScanner(!showScanner)}
                  className="bg-black/30 backdrop-blur-sm rounded-xl p-2 hover:bg-emerald-600 hover:text-white transition-all duration-200 border border-white/20"
                  style={{ cursor: 'pointer' }}
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>

            {showScanner && (
              <div
                className="mb-4 neumorphic rounded-2xl p-4"
                style={{ opacity: 1, height: 'auto' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-tajawal text-white">المسح الضوئي</h4>
                  <button
                    onClick={() => setShowScanner(false)}
                    className="p-1 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div id="qr-reader"></div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => {
                    console.log('🖱️ POS: Product button clicked:', product.name, 'ID:', product.id, 'Type:', typeof product.id)
                    addToCart(product)
                  }}
                  className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/10 transition-all duration-200 text-right border border-white/20"
                  style={{ opacity: 1, transform: 'translateY(0)' }}
                >
                  <h4 className="font-tajawal text-slate-100 font-semibold">{product.name}</h4>
                  <p className="text-sm font-tajawal text-slate-200 mb-2">{product.type}</p>
                  <p className="text-lg font-bold font-tajawal text-amber-200">{product.price} ل.س</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="space-y-6"
          style={{ transform: 'translateX(0)', opacity: 1 }}
        >
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 text-white p-6 shadow-lg sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-6 h-6 text-emerald-300" />
              <h3 className="text-xl font-bold font-tajawal text-white">سلة المشتريات</h3>
            </div>

            {cart.length === 0 ? (
              <p className="text-center font-tajawal text-slate-200 py-8">
                السلة فارغة
              </p>
            ) : (
              <>
                <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                  {cart.map((item, index) => (
                    <div
                      key={item.id}
                      className="neumorphic rounded-xl p-3"
                      style={{ opacity: 1, transform: 'translateX(0)' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-tajawal text-slate-100 font-semibold">{item.name}</h4>
                        <div className="flex items-center gap-2">
                          {item.isEditingPrice ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-sm font-tajawal text-slate-100 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-black/30 backdrop-blur-sm"
                                step="0.01"
                                min="0"
                              />
                              <button
                                onClick={() => savePriceEdit(item.id)}
                                className="p-1 hover:bg-emerald-600 hover:text-white rounded-lg transition-all duration-200"
                                style={{ cursor: 'pointer' }}
                              >
                                <Save className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => cancelPriceEdit(item.id)}
                                className="p-1 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200"
                                style={{ cursor: 'pointer' }}
                              >
                                <XCircle className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-tajawal text-amber-200">
                                {formatDualCurrency(item.price / 1.20, exchangeRate, true)}
                              </span>
                              <button
                                onClick={() => togglePriceEdit(item.id)}
                                className="p-1 hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200"
                                style={{ cursor: 'pointer' }}
                                title="تعديل السعر"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-tajawal text-slate-200">
                          {formatDualCurrency(item.price / 1.20, exchangeRate, false)}
                        </span>
                        <span className="text-xs font-tajawal text-emerald-300">
                          ربح: {formatDualCurrency(calculateItemProfit(item) / 1.20, exchangeRate, false)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              console.log('🖱️ POS: Minus button clicked for item:', item.name, 'ID:', item.id, 'Type:', typeof item.id)
                              updateQuantity(item.id, -1)
                            }}
                            className="bg-black/30 backdrop-blur-sm rounded-lg p-1 hover:bg-red-600 hover:text-white transition-all duration-200 border border-white/20"
                            style={{ cursor: 'pointer' }}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-tajawal text-slate-100 w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => {
                              console.log('🖱️ POS: Plus button clicked for item:', item.name, 'ID:', item.id, 'Type:', typeof item.id)
                              updateQuantity(item.id, 1)
                            }}
                            className="bg-black/30 backdrop-blur-sm rounded-lg p-1 hover:bg-emerald-600 hover:text-white transition-all duration-200 border border-white/20"
                            style={{ cursor: 'pointer' }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gold/20 pt-4">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-tajawal text-slate-200/60">الإجمالي الفرعي:</span>
                      <span className="text-lg font-tajawal text-slate-100">
                        {formatDualCurrency(getTotal() / 1.20, exchangeRate, false)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-tajawal text-green-600">الربح المتوقع:</span>
                      <span className="text-lg font-tajawal text-green-600">
                        {formatDualCurrency(cart.reduce((total, item) => total + calculateItemProfit(item), 0) / 1.20, exchangeRate, false)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold font-tajawal text-slate-100">الإجمالي:</span>
                      <span className="text-2xl font-bold font-tajawal text-gold">
                        {formatDualCurrency(getTotal() / 1.20, exchangeRate, true)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={processingPayment || cart.length === 0}
                    className="w-full neumorphic rounded-2xl py-3 font-tajawal text-slate-100 font-semibold hover:bg-emerald hover:text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                    style={{ cursor: (processingPayment || cart.length === 0) ? 'not-allowed' : 'pointer' }}
                  >
                    {processingPayment ? (
                      <>
                        <div className="w-5 h-5 border-2 border-espresso-brown border-t-transparent rounded-full animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        إتمام البيع
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
