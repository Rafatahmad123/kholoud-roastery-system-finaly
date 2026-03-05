import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/database-adapter'

// GET /api/exchange-rate - Get current exchange rate
export async function GET() {
  console.log('💱 Fetching exchange rate via API...')
  
  try {
    const rate = await db.getExchangeRate()
    console.log('✅ Exchange rate found:', rate)
    return NextResponse.json({ rate })
  } catch (error) {
    console.error('❌ Error fetching exchange rate:', error)
    return NextResponse.json({ error: 'Failed to fetch exchange rate' }, { status: 500 })
  }
}

// POST /api/exchange-rate - Update exchange rate
export async function POST(request: NextRequest) {
  console.log('💱 Updating exchange rate via API...')
  
  try {
    const { rate } = await request.json()
    
    if (!rate || rate <= 0) {
      return NextResponse.json({ error: 'Invalid exchange rate' }, { status: 400 })
    }
    
    // Update exchange rate using adapter
    await db.setExchangeRate(rate)
    console.log('✅ Exchange rate updated:', rate)
    
    return NextResponse.json({ rate, success: true })
  } catch (error) {
    console.error('❌ Error updating exchange rate:', error)
    return NextResponse.json({ error: 'Failed to update exchange rate' }, { status: 500 })
  }
}
