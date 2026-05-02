import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase'

async function isAdmin() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

// GET /api/admin/orders  → list orders with optional filters
export async function GET(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const status = req.nextUrl.searchParams.get('status')
  const search = req.nextUrl.searchParams.get('search')

  const supabase = createAdminSupabase()
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)
  if (search) query = query.ilike('email', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/admin/orders  → manually update order status / resend link
export async function PATCH(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createAdminSupabase()
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
