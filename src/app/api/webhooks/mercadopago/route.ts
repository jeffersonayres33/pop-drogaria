import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createAdminSupabase } from '@/lib/supabase'
import { sendDownloadEmail } from '@/lib/email'
import { v4 as uuidv4 } from 'uuid'

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Only handle payment notifications
    if (body.type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) return NextResponse.json({ ok: true })

    // Fetch payment details from Mercado Pago
    const payment = new Payment(mp)
    const mpPayment = await payment.get({ id: paymentId })

    const orderId = mpPayment.external_reference
    const status = mpPayment.status // 'approved' | 'rejected' | 'pending' etc.

    if (!orderId) return NextResponse.json({ ok: true })

    const supabase = createAdminSupabase()

    if (status === 'approved') {
      // Generate unique download token
      const token = uuidv4()
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48h

      // Update order
      const { data: order } = await supabase
        .from('orders')
        .update({
          status: 'approved',
          mp_payment_id: String(paymentId),
          download_token: token,
          download_expires_at: expiresAt,
        })
        .eq('id', orderId)
        .select()
        .single()

      if (!order) return NextResponse.json({ ok: true })

      // Fetch POP titles for email
      const { data: pops } = await supabase
        .from('pops')
        .select('title, number')
        .in('id', order.pop_ids)

      const popTitles = (pops ?? []).map(p => `${p.number} – ${p.title}`)

      // Send download email
      await sendDownloadEmail({
        to: order.email,
        token,
        popTitles,
        expiresAt,
      })

    } else if (status === 'rejected') {
      await supabase
        .from('orders')
        .update({ status: 'rejected', mp_payment_id: String(paymentId) })
        .eq('id', orderId)
    }

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('Webhook error:', err)
    // Always return 200 to MP so it doesn't retry endlessly
    return NextResponse.json({ ok: true })
  }
}
