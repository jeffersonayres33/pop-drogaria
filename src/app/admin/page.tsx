'use client'
import { useEffect, useState } from 'react'
import { FileText, ShoppingBag, TrendingUp, Clock } from 'lucide-react'

interface Stats {
  totalPops: number
  totalOrders: number
  approvedOrders: number
  pendingOrders: number
  totalRevenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/pops').then(r => r.json()),
      fetch('/api/admin/orders').then(r => r.json()),
    ]).then(([pops, orders]) => {
      const approved = orders.filter((o: any) => o.status === 'approved')
      const pending  = orders.filter((o: any) => o.status === 'pending')
      setStats({
        totalPops: Array.isArray(pops) ? pops.length : 0,
        totalOrders: orders.length,
        approvedOrders: approved.length,
        pendingOrders: pending.length,
        totalRevenue: approved.reduce((s: number, o: any) => s + (o.total_cents ?? 0), 0),
      })
      setRecentOrders(orders.slice(0, 8))
    })
  }, [])

  const STATUS_STYLE: Record<string, string> = {
    approved: 'bg-green-100 text-green-800',
    pending:  'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-700',
    expired:  'bg-gray-100 text-gray-600',
  }
  const STATUS_LABEL: Record<string, string> = {
    approved: 'Aprovado',
    pending:  'Pendente',
    rejected: 'Rejeitado',
    expired:  'Expirado',
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-green-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral do sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'POPs Cadastrados', value: stats?.totalPops ?? '—', icon: FileText, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Total de Pedidos', value: stats?.totalOrders ?? '—', icon: ShoppingBag, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Pedidos Aprovados', value: stats?.approvedOrders ?? '—', icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Receita Total', value: stats ? `R$ ${(stats.totalRevenue / 100).toFixed(2).replace('.', ',')}` : '—', icon: TrendingUp, color: 'text-gold-500', bg: 'bg-gold-100' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <div className="text-2xl font-bold text-gray-800">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-green-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <Clock size={17} className="text-green-700" /> Pedidos Recentes
          </h2>
          <a href="/admin/orders" className="text-xs text-green-700 hover:underline font-medium">Ver todos →</a>
        </div>
        <div className="divide-y divide-green-50">
          {recentOrders.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">Nenhum pedido ainda</div>
          ) : recentOrders.map(order => (
            <div key={order.id} className="px-6 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{order.email}</p>
                <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-semibold text-green-800">
                  R$ {(order.total_cents / 100).toFixed(2).replace('.', ',')}
                </span>
                <span className={`badge text-xs ${STATUS_STYLE[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
