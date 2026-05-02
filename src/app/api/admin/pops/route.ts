import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase'

async function isAdmin() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user
}

// GET /api/admin/pops  → list all pops
export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const supabase = createAdminSupabase()
  const { data, error } = await supabase
    .from('pops')
    .select('*')
    .order('number')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/admin/pops  → create pop
export async function POST(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const supabase = createAdminSupabase()

  const { data, error } = await supabase
    .from('pops')
    .insert({
      title: body.title,
      number: body.number,
      description: body.description,
      price: body.price,
      category: body.category,
      fields: body.fields ?? [],
      template: body.template ?? {},
      active: body.active ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/admin/pops  → update pop
export async function PATCH(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createAdminSupabase()
  const { data, error } = await supabase
    .from('pops')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/admin/pops?id=xxx  → delete pop
export async function DELETE(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createAdminSupabase()
  const { error } = await supabase.from('pops').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
