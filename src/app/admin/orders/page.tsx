'use client'
import { useEffect, useState } from 'react'
import { Search, RefreshCw, Send, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { sendDownloadEmail } from '@/lib/email'

const STATUS_FILTERS = ['all', 'approved', 'pending', 'rejected', 'expired']
const STATUS_STYLE: Record<string, string> = {
  approved: 'bg-green-100 text-green-800',
  pending:  'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-700',
  expired:  'bg-gray-100 text-gray-500',
}
const STATUS_LABEL: Record<string, string> = {
  approved: 'Aprovado', pending: 'Pendente', rejected: 'Rejeitado', expired: 'Expirado',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any | null>(null)
  const [resending, setResending] = useState(false)

  const load = () => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (status !== 'all') qs.set('status', status)
    if (search) qs.set('search', search)
    fetch(`/api/admin/orders?${qs}`)
      .then(r => r.json())
      .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false) })
  }

  useEffect(load, [status, search])

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/download?token=${token}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado!')
  }

  const resendEmail = async (order: any) => {
    if (!order.download_token) return toast.error('Este pedido não tem token de download')
    setResending(true)
    try {
      // Call a resend endpoint
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, resend_email: true }),
      })
      if (res.ok) toast.success('E-mail reenviado com sucesso!')
      else toast.error('Erro ao reenviar e-mail')
    } catch {
      toast.error('Erro ao reenviar')
    } finally {
      setResending(false)
    }
  }

  const resetDownload = async (order: any) => {
    if (!confirm('Resetar o download permite que o link seja usado novamente. Confirmar?')) return
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: order.id, download_used: false }),
    })
    toast.success('Download resetado!')
    load()
    setSelected((prev: any) => prev ? { ...prev, download_used: false } : null)
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-green-800">Pedidos</h1>
        <p className="text-gray-500 text-sm mt-1">{orders.length} pedido{orders.length !== 1 ? 's' : ''} encontrado{orders.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Buscar por e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-white rounded-xl border border-green-100 p-1">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                status === s ? 'bg-green-800 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'Todos' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <button onClick={load} className="p-2 rounded-xl border border-green-100 bg-white text-gray-400 hover:text-green-700 hover:border-green-300 transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Orders list */}
        <div className="lg:col-span-2 card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-50 border-b border-green-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider">E-mail</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider hidden sm:table-cell">Data</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider">Valor</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-gray-400">Nenhum pedido encontrado</td></tr>
              ) : orders.map(order => (
                <tr
                  key={order.id}
                  onClick={() => setSelected(order)}
                  className={`cursor-pointer hover:bg-green-50/60 transition-colors ${selected?.id === order.id ? 'bg-green-50' : ''}`}
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800 truncate max-w-[200px]">{order.email}</p>
                    <p className="text-xs text-gray-400">{order.pop_ids?.length ?? 0} POP{order.pop_ids?.length !== 1 ? 's' : ''}</p>
                  </td>
                  <td className="px-3 py-3 text-gray-500 text-xs hidden sm:table-cell whitespace-nowrap">
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-3 py-3 font-semibold text-green-800">
                    R$ {(order.total_cents / 100).toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`badge ${STATUS_STYLE[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order detail */}
        <div className="lg:col-span-1">
          {selected ? (
            <div className="card p-6 sticky top-6 space-y-5">
              <h3 className="font-semibold text-gray-700">Detalhes do Pedido</h3>

              <div className="space-y-2 text-sm">
                {[
                  ['E-mail', selected.email],
                  ['ID', selected.id.slice(0, 8) + '...'],
                  ['Data', new Date(selected.created_at).toLocaleString('pt-BR')],
                  ['Valor', `R$ ${(selected.total_cents / 100).toFixed(2).replace('.', ',')}`],
                  ['POPs', selected.pop_ids?.length ?? 0],
                  ['Status', STATUS_LABEL[selected.status] ?? selected.status],
                  ['Download usado', selected.download_used ? 'Sim' : 'Não'],
                  ['Expira em', selected.download_expires_at
                    ? new Date(selected.download_expires_at).toLocaleString('pt-BR')
                    : '—'],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between gap-2">
                    <span className="text-gray-500 text-xs">{k}</span>
                    <span className="text-gray-800 text-xs font-medium text-right">{v as string}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-green-50">
                {selected.download_token && (
                  <button
                    onClick={() => copyLink(selected.download_token)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-green-200 text-green-700 text-sm font-medium hover:bg-green-50 transition-all"
                  >
                    <Copy size={15} /> Copiar Link de Download
                  </button>
                )}
                {selected.status === 'approved' && (
                  <>
                    <button
                      onClick={() => resendEmail(selected)}
                      disabled={resending}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-green-800 text-white text-sm font-medium hover:bg-green-700 transition-all disabled:opacity-50"
                    >
                      <Send size={15} /> {resending ? 'Enviando...' : 'Reenviar E-mail'}
                    </button>
                    {selected.download_used && (
                      <button
                        onClick={() => resetDownload(selected)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gold-500 text-gold-500 text-sm font-medium hover:bg-gold-100 transition-all"
                      >
                        <RefreshCw size={15} /> Resetar Download
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-400">
              <p className="text-sm">Clique em um pedido para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
