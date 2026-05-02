import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createAdminSupabase } from '@/lib/supabase'
import type { CheckoutPayload } from '@/types'

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutPayload = await req.json()
    const { email, pop_ids, total_cents } = body

    if (!email || !pop_ids?.length || !total_cents) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
    }

    const supabase = createAdminSupabase()

    // Fetch POP titles for the Mercado Pago description
    const { data: pops } = await supabase
      .from('pops')
      .select('id, title, number, price')
      .in('id', pop_ids)

    if (!pops?.length) {
      return NextResponse.json({ error: 'pops_not_found' }, { status: 404 })
    }

    // Create the order in DB (pending)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        email,
        pop_ids,
        total_cents,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'order_creation_failed' }, { status: 500 })
    }

    // Create Mercado Pago preference
    const preference = new Preference(mp)
    const result = await preference.create({
      body: {
        external_reference: order.id,
        payer: { email },
        items: pops.map(pop => ({
          id: pop.id,
          title: `${pop.number} – ${pop.title}`,
          description: 'Procedimento Operacional Padrão para Drogaria',
          quantity: 1,
          unit_price: pop.price / 100,
          currency_id: 'BRL',
        })),
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/failure`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/pending`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
        statement_descriptor: 'POPS DROGARIA',
      }
    })

    return NextResponse.json({ init_point: result.init_point })

  } catch (err) {
    console.error('Payment error:', err)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
