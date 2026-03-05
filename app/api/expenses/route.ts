import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// GET /api/expenses - Fetch all expenses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    console.log('📊 Fetching expenses with filters:', { category, startDate, endDate })
    
    let query = supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('❌ Error fetching expenses:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ Expenses fetched successfully:', data?.length || 0)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('❌ Unexpected error in expenses GET:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

// POST /api/expenses - Create new expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📊 Creating new expense:', body)
    
    const { description, amount, currency, category } = body
    
    if (!description || !amount || !currency || !category) {
      return NextResponse.json({ 
        error: 'Missing required fields: description, amount, currency, category' 
      }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        description,
        amount: parseFloat(amount),
        currency,
        category
      }])
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error creating expense:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ Expense created successfully:', data)
    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('❌ Unexpected error in expenses POST:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}

// PUT /api/expenses - Update expense
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📊 Updating expense:', body)
    
    const { id, description, amount, currency, category } = body
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Missing required field: id' 
      }, { status: 400 })
    }
    
    const updateData: any = { updated_at: new Date().toISOString() }
    
    if (description) updateData.description = description
    if (amount) updateData.amount = parseFloat(amount)
    if (currency) updateData.currency = currency
    if (category) updateData.category = category
    
    const { data, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error updating expense:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ Expense updated successfully:', data)
    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('❌ Unexpected error in expenses PUT:', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

// DELETE /api/expenses - Delete expense
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Missing required field: id' 
      }, { status: 400 })
    }
    
    console.log('📊 Deleting expense:', id)
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('❌ Error deleting expense:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ Expense deleted successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Unexpected error in expenses DELETE:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
