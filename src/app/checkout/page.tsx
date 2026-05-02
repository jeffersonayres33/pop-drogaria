'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Pop } from '@/types'
import { Lock, CreditCard, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

function CheckoutContent() {
  const params = useSearchParams()
  const popIds = params.get('pops')?.split(',') ?? []
  const email = decodeURIComponent(params.get('email') ?? '')

  const [pops, setPops] = useState<Pop[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (!popIds.length) return
    createClient()
      .from('pops')
      .select('*')
      .in('id', popIds)
      .then(({ data }) => { setPops(data ?? []); setLoading(false) })
  }, [])

  const total = pops.reduce((sum, p) => sum + p.price, 0)

  const handlePay = async () => {
    if (!email) return toast.error('E-mail inválido')
    setPaying(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pop_ids: popIds, total_cents: total }),
      })
      const data = await res.json()
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        toast.error('Erro ao iniciar pagamento. Tente novamente.')
      }
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100">
      <div className="text-center text-gray-400">Carregando...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      <header className="bg-green-800 text-white px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Lock size={20} className="text-gold-400" />
          <span className="font-display text-xl font-semibold">Checkout Seguro</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-6 py-10 grid md:grid-cols-5 gap-6">
        {/* Order summary */}
        <div className="md:col-span-3 space-y-4">
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold text-green-800 mb-4">Resumo do Pedido</h2>
            <div className="space-y-3">
              {pops.map(pop => (
                <div key={pop.id} className="flex items-center justify-between py-2 border-b border-green-50 last:border-0">
                  <div>
                    <span className="badge bg-green-100 text-green-800 mr-2">{pop.number}</span>
                    <span className="text-sm font-medium text-gray-700">{pop.title}</span>
                  </div>
                  <span className="font-semibold text-green-800 text-sm">
                    R$ {(pop.price / 100).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t-2 border-green-100 flex justify-between items-center">
              <span className="font-semibold text-gray-600">Total</span>
              <span className="font-bold text-2xl text-green-800">
                R$ {(total / 100).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ShieldCheck size={18} className="text-green-700" /> Sobre o seu acesso
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>📧 Link único enviado para: <strong>{email}</strong></li>
              <li>⬇️ <strong>1 download por POP</strong> adquirido</li>
              <li>⏱️ Link válido por <strong>48 horas</strong> após o pagamento</li>
              <li>📄 PDF personalizado gerado com os dados da sua drogaria</li>
            </ul>
          </div>
        </div>

        {/* Payment panel */}
        <div className="md:col-span-2">
          <div className="card p-6 sticky top-6">
            <h2 className="font-display text-lg font-semibold text-green-800 mb-5 flex items-center gap-2">
              <CreditCard size={20} /> Pagamento
            </h2>
            <div className="bg-green-50 rounded-xl p-4 mb-5 text-center">
              <img
                src="https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.1/mercadopago/logo__small.png"
                alt="Mercado Pago"
                className="h-8 mx-auto mb-2"
              />
              <p className="text-xs text-gray-500">Pague com cartão, Pix ou boleto</p>
            </div>
            <button
              onClick={handlePay}
              disabled={paying}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base"
            >
              {paying ? (
                <><span className="animate-spin">⏳</span> Redirecionando...</>
              ) : (
                <>Pagar R$ {(total / 100).toFixed(2).replace('.', ',')} →</>
              )}
            </button>
            <p className="text-xs text-center text-gray-400 mt-3 flex items-center justify-center gap-1">
              <Lock size={10} /> Pagamento 100% seguro via Mercado Pago
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return <Suspense><CheckoutContent /></Suspense>
}
