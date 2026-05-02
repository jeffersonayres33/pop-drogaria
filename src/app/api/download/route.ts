import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase'

// GET /api/download?token=xxx  → validate token, return order + pops
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'no_token' }, { status: 400 })

  const supabase = createAdminSupabase()

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('download_token', token)
    .single()

  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  if (order.status !== 'approved') {
    return NextResponse.json({ error: 'not_approved' }, { status: 403 })
  }

  if (new Date(order.download_expires_at) < new Date()) {
    // Mark as expired
    await supabase.from('orders').update({ status: 'expired' }).eq('id', order.id)
    return NextResponse.json({ error: 'expired' }, { status: 410 })
  }

  if (order.download_used) {
    return NextResponse.json({ error: 'used' }, { status: 410 })
  }

  // Fetch POPs
  const { data: pops } = await supabase
    .from('pops')
    .select('*')
    .in('id', order.pop_ids)
    .order('number')

  return NextResponse.json({ order, pops })
}

// POST /api/download  → mark download as used after PDF generated
export async function POST(req: NextRequest) {
  try {
    const { token, pop_id } = await req.json()
    if (!token) return NextResponse.json({ error: 'no_token' }, { status: 400 })

    const supabase = createAdminSupabase()

    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('download_token', token)
      .single()

    if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    if (order.download_used) return NextResponse.json({ error: 'already_used' }, { status: 410 })

    // If single POP order, mark as used. Multi-POP: track individually via a separate table if needed.
    // For simplicity, mark used only when ALL pops in the order have been downloaded.
    // Here we just mark on first download — adjust as needed.
    await supabase
      .from('orders')
      .update({ download_used: true })
      .eq('id', order.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Download POST error:', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
