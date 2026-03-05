import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ✅ FIX SUPABASE CONNECTION: Use shared supabase client
import { supabase } from '../../../lib/supabase'

// GET /api/debts - Fetch all debts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    let query = supabase
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('❌ Error fetching debts:', error)
    return NextResponse.json({ error: 'Failed to fetch debts' }, { status: 500 })
  }
}

// POST /api/debts - Create new debt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('debts')
      .insert([{
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()

    if (error) throw error

    console.log('✅ Debt created:', data)
    return NextResponse.json({ data: data[0] })
  } catch (error) {
    console.error('❌ Error creating debt:', error)
    return NextResponse.json({ error: 'Failed to create debt' }, { status: 500 })
  }
}

// PUT /api/debts - Update debt (supports payment tracking)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📊 Updating debt:', body)
    
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Missing required field: id' 
      }, { status: 400 })
    }
    
    // ✅ MAP FIELDS: Ensure payment_history is being updated correctly
    const updateData = {
      ...updates, // amount, status, payment_history
      updated_at: new Date().toISOString()
    }
    
    console.log('📊 Updating debt with data:', updateData)
    
    const { data, error } = await supabase
      .from('debts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Error updating debt:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ Debt updated successfully:', data)
    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('❌ Unexpected error in debts PUT:', error)
    return NextResponse.json({ error: 'Failed to update debt' }, { status: 500 })
  }
}

// DELETE /api/debts - Delete debt
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Missing required field: id' 
      }, { status: 400 })
    }
    
    console.log('📊 Deleting debt:', id)
    
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('❌ Error deleting debt:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ Debt deleted successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Unexpected error in debts DELETE:', error)
    return NextResponse.json({ error: 'Failed to delete debt' }, { status: 500 })
  }
}
