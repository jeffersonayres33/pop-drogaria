'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { LayoutDashboard, FileText, ShoppingBag, LogOut, Menu, X } from 'lucide-react'

const NAV = [
  { href: '/admin',        label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/pops',   label: 'POPs',        icon: FileText },
  { href: '/admin/orders', label: 'Pedidos',     icon: ShoppingBag },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login')
      else setChecking(false)
    })
  }, [])

  const logout = async () => {
    await createClient().auth.signOut()
    router.push('/login')
  }

  if (checking) return (
    <div className="min-h-screen bg-green-950 flex items-center justify-center text-white">
      Verificando acesso...
    </div>
  )

  return (
    <div className="min-h-screen bg-cream-100 flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 bg-green-950 flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gold-500 rounded-xl flex items-center justify-center text-lg">💊</div>
            <div>
              <div className="text-white font-semibold text-sm">POPs Drogaria</div>
              <div className="text-green-400 text-xs">Painel Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-gold-500 text-white'
                    : 'text-green-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-green-400 hover:bg-white/5 hover:text-white w-full transition-all"
          >
            <LogOut size={17} /> Sair
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-green-100 px-6 py-4 flex items-center gap-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu size={22} />
          </button>
          <span className="font-display font-semibold text-green-800">POPs Admin</span>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
