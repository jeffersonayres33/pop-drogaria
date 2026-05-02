'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Pop } from '@/types'
import { ShoppingCart, Search, ChevronRight, CheckCircle2, Package } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['Todos', 'Administrativo', 'Atendimento', 'Armazenamento', 'Controle', 'Higiene', 'Farmacotécnica']

export default function CatalogoPage() {
  const router = useRouter()
  const supabase = createClient()

  const [pops, setPops] = useState<Pop[]>([])
  const [cart, setCart] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')

  useEffect(() => {
    supabase
      .from('pops')
      .select('*')
      .eq('active', true)
      .order('number')
      .then(({ data }) => {
        setPops(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = pops.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                        p.number.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'Todos' || p.category === category
    return matchSearch && matchCat
  })

  const toggle = (id: string) => {
    setCart(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const total = pops.filter(p => cart.has(p.id)).reduce((sum, p) => sum + p.price, 0)

  const handleCheckout = () => {
    if (cart.size === 0) return toast.error('Selecione ao menos um POP')
    if (!email || !email.includes('@')) return toast.error('Informe um e-mail válido')
    const ids = Array.from(cart).join(',')
    router.push(`/checkout?pops=${ids}&email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      <header className="bg-green-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">💊 POPs Drogaria</h1>
            <p className="text-green-100 text-sm mt-1">Procedimentos Operacionais Padrão para Farmácias</p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-5 py-3">
            <ShoppingCart size={20} className="text-gold-400" />
            <span className="font-semibold text-lg">{cart.size} POPs</span>
            {cart.size > 0 && (
              <span className="ml-1 text-gold-300 text-sm font-medium">
                R$ {(total / 100).toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT: filters + checkout */}
        <aside className="lg:col-span-1 space-y-4">
          {/* Search */}
          <div className="card p-4">
            <p className="section-label">Buscar</p>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input-field pl-9"
                placeholder="Nome ou número..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="card p-4">
            <p className="section-label">Categoria</p>
            <div className="flex flex-col gap-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-left text-sm px-3 py-2 rounded-lg transition-all ${
                    category === cat
                      ? 'bg-green-800 text-white font-medium'
                      : 'text-gray-600 hover:bg-green-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cart / Checkout */}
          <div className="card p-4 sticky top-6">
            <p className="section-label">Finalizar Pedido</p>
            {cart.size > 0 ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-green-800">{cart.size} POP{cart.size > 1 ? 's' : ''}</span> selecionado{cart.size > 1 ? 's' : ''}
                </div>
                <div className="text-2xl font-bold text-green-800">
                  R$ {(total / 100).toFixed(2).replace('.', ',')}
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Seu e-mail *</label>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="para@receber.olink"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">O link de download será enviado aqui</p>
                </div>
                <button onClick={handleCheckout} className="btn-primary w-full flex items-center justify-center gap-2">
                  Pagar com Mercado Pago <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400 text-sm">
                <Package size={32} className="mx-auto mb-2 opacity-40" />
                Selecione os POPs que deseja adquirir
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT: POP grid */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                  <div className="h-5 bg-gray-100 rounded w-2/3 mb-2" />
                  <div className="h-12 bg-gray-100 rounded mb-4" />
                  <div className="h-8 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Package size={48} className="mx-auto mb-4 opacity-30" />
              <p>Nenhum POP encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(pop => {
                const selected = cart.has(pop.id)
                return (
                  <div
                    key={pop.id}
                    onClick={() => toggle(pop.id)}
                    className={`card p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                      selected ? 'ring-2 ring-green-700 bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="badge bg-green-100 text-green-800">{pop.number}</span>
                      {selected && <CheckCircle2 size={20} className="text-green-700 flex-shrink-0" />}
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">{pop.title}</h3>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{pop.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="badge bg-cream-200 text-gray-600">{pop.category}</span>
                      <span className="font-bold text-green-800 text-lg">
                        R$ {(pop.price / 100).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className={`mt-3 w-full text-center text-sm font-medium py-2 rounded-xl transition-all ${
                      selected
                        ? 'bg-green-800 text-white'
                        : 'bg-green-50 text-green-800 hover:bg-green-100'
                    }`}>
                      {selected ? '✓ Selecionado' : 'Selecionar'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
