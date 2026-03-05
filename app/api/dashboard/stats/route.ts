import { NextResponse } from 'next/server'
import { db } from '../../../../lib/database-adapter'
import { formatCurrencyLS } from '../../../../lib/currency'
import { supabase } from '../../../../lib/supabase-client'

// GET /api/dashboard/stats - Fetch dashboard statistics
export async function GET() {
  console.log('📊 Fetching dashboard stats via API...')
  
  try {
    // Get all products using database adapter
    const products = await db.getProducts()
    
    // Calculate inventory statistics
    const totalProducts = products.length
    const totalStock = products.reduce((sum: number, p: any) => sum + p.stock_quantity, 0)
    const stockValue = products.reduce((sum: number, p: any) => sum + (p.stock_quantity * p.wholesale_price), 0)
    const lowStockProducts = products.filter(p => p.stock_quantity < 10)
    const lowStockCount = lowStockProducts.length
    
    // Get current exchange rate
    const currentExchangeRate = await db.getExchangeRate()
    
    // Calculate daily sales and profits from sales tables
    const today = new Date()
    // ✅ Timezone Offset: 24-hour window starting from midnight Asia/Damascus time
    const damascusMidnight = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Damascus' }))
    damascusMidnight.setHours(0, 0, 0, 0) // Midnight Damascus time
    const damascusEndOfDay = new Date(damascusMidnight)
    damascusEndOfDay.setHours(23, 59, 59, 999) // End of day Damascus time
    
    console.log('🕐 Damascus midnight:', damascusMidnight.toISOString())
    console.log('🕐 Damascus end of day:', damascusEndOfDay.toISOString())
    console.log('🕐 Current Damascus time:', new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Damascus' })).toISOString())
    console.log('🕐 Date range: Midnight to EOD Damascus time')
    
    // Get today's sales with sale_items including wholesale_price
    const { data: todaySales, error: salesError } = await supabase
      .from('sales')
      .select(`
        id,
        total_amount,
        created_at,
        sale_items (
          id,
          quantity,
          unit_price,
          wholesale_price,  
          total_price,
          products (
            name_ar
          )
        )
      `)
      .gte('created_at', damascusMidnight.toISOString())
      .lte('created_at', damascusEndOfDay.toISOString())
      .order('created_at', { ascending: false })
    
    let dailySales = 0
    let profit = 0
    
    if (!salesError && todaySales) {
      dailySales = todaySales.reduce((sum: number, sale: any) => sum + (sale.total_amount || 0), 0)
      
      // Calculate profit (selling price - wholesale price)
      todaySales.forEach((sale: any) => {
        console.log(`🔍 Processing sale:`, sale)
        if (sale.sale_items) {
          sale.sale_items.forEach((item: any) => {
            console.log(`🔍 Processing sale item:`, item)
            // ✅ Wholesale Price Safety: Use || 0 for all math operations
            const wholesalePrice = Number(item.wholesale_price) || 0
            const sellingPrice = Number(item.unit_price) || 0
            const quantity = Number(item.quantity) || 0
            const itemProfit = (sellingPrice - wholesalePrice) * quantity
            profit += itemProfit
            
            console.log(`💰 Safe profit calculation: (${sellingPrice} - ${wholesalePrice}) × ${quantity} = ${itemProfit}`)
            console.log(`📊 Safe item details:`, {
              wholesalePrice,
              sellingPrice,
              quantity,
              itemProfit,
              wholesalePriceType: typeof item.wholesale_price,
              unitPriceType: typeof item.unit_price,
              quantityType: typeof item.quantity,
              wholesalePriceIsNull: item.wholesale_price === null,
              wholesalePriceIsUndefined: item.wholesale_price === undefined,
              wholesalePriceIsNaN: isNaN(Number(item.wholesale_price))
            })
          })
        } else {
          console.log(`⚠️ Sale has no items:`, sale)
        }
      })
    }
    
    // Get recent sales (last 5 transactions) with wholesale_price
    const { data: recentSales, error: recentError } = await supabase
      .from('sales')
      .select(`
        id,
        total_amount,
        created_at,
        sale_items (
          id,
          quantity,
          unit_price,
          wholesale_price,  // ✅ Include wholesale_price from sale_items
          total_price,
          products (
            name_ar
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)
    
    const stats = {
      totalProducts,
      daily_sales: dailySales,
      profit: profit,
      stock_levels: {
        total: totalStock,
        lowStockCount: lowStockCount,
        lowStockProducts: lowStockProducts.map(p => ({
          id: p.id,
          name_ar: p.name_ar,
          stock_quantity: p.stock_quantity,
          wholesale_price: p.wholesale_price
        }))
      },
      recent_sales: recentSales?.map((sale: any) => ({
        id: sale.id,
        total_amount: sale.total_amount,
        created_at: sale.created_at,
        items: sale.sale_items?.map((item: any) => ({
          id: item.id,
          product_name: item.products?.name_ar || 'Unknown',
          quantity: item.quantity,
          unit_price: item.unit_price,
          wholesale_price: item.wholesale_price,  // ✅ Include wholesale_price in response
          total_price: item.total_price,
          profit: (item.unit_price - item.wholesale_price) * item.quantity  // ✅ Calculate profit per item
        })) || []
      })) || [],
      exchange_rate: currentExchangeRate,
      formatted_values: {
        daily_sales: formatCurrencyLS(dailySales),
        profit: formatCurrencyLS(profit),
        stock_value: formatCurrencyLS(stockValue)
      }
    }
    
    // ✅ Debug Log: Find timestamp of last sale
    let lastSaleTimestamp = null
    if (todaySales && todaySales.length > 0) {
      lastSaleTimestamp = todaySales[0].created_at
      console.log('🕐 Last sale timestamp:', lastSaleTimestamp)
      console.log('🕐 Last sale in Damascus time:', new Date(lastSaleTimestamp).toLocaleString('en-US', { timeZone: 'Asia/Damascus' }))
      console.log('🕐 Is last sale within date range?', {
        lastSale: lastSaleTimestamp,
        rangeStart: damascusMidnight.toISOString(),
        rangeEnd: damascusEndOfDay.toISOString(),
        isInRange: lastSaleTimestamp >= damascusMidnight.toISOString() && lastSaleTimestamp <= damascusEndOfDay.toISOString()
      })
    } else {
      console.log('🕐 No sales found in date range')
    }

    console.log('✅ Dashboard stats fetched:', {
      daily_sales: dailySales,
      profit: profit,
      low_stock_count: stats.stock_levels.lowStockCount,
      recent_sales_count: stats.recent_sales.length,
      today_sales_count: todaySales?.length || 0,
      date_range_start: damascusMidnight.toISOString(),
      date_range_end: damascusEndOfDay.toISOString(),
      sales_error: salesError,
      recent_error: recentError,
      raw_sales_data: todaySales,
      last_sale_timestamp: lastSaleTimestamp // ✅ Debug Log: Last sale timestamp
    })
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
