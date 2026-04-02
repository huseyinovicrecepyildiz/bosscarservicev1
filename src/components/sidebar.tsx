'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const menuItems = [
  { icon: <span className="text-xl leading-none">📊</span>, label: 'Dashboard', href: '/' },
  { icon: <span className="text-xl leading-none">👥</span>, label: 'Müşteriler', href: '/customers' },
  { icon: <span className="text-xl leading-none">📋</span>, label: 'Giderler', href: '/expenses' },
  { icon: <span className="text-xl leading-none">⚙️</span>, label: 'Kullanıcılar', href: '/admin' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ id: string, name: string, role: string } | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Find profile role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        setUser({
          id: session.user.id,
          name: session.user.email?.replace('@bosscar.local', '') || 'Personel',
          role: profile?.role || 'personel'
        })
      }
    }
    loadUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const sidebarContent = (
    <div className="flex flex-col h-full py-5 px-3.5">
      {/* Logo */}
      <div className="flex items-center gap-3 px-1 mb-8">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-xl shrink-0 shadow-[0_4px_12px_rgba(245,158,11,0.2)]">
          🚗
        </div>
        <div>
          <h1 className="text-base font-extrabold text-slate-100 leading-none">
            Boss <span className="gradient-text">Car</span>
          </h1>
          <p className="text-[0.65rem] text-slate-500 mt-0.5">ERP Sistemi</p>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        <p className="text-[0.65rem] text-slate-500 font-semibold uppercase tracking-widest px-2 mb-2">
          Menü
        </p>
        {menuItems.map((item) => (
          // Sadece adminler kullanıcı listesini görebilir.
          (item.href === '/admin' && user?.role !== 'admin') ? null : (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'sidebar-link',
                pathname === item.href && 'active'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          )
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-slate-700/30 pt-4 mt-4">
        {user ? (
          <div className="p-3 rounded-lg bg-slate-900/60 mb-3 flex items-center gap-2.5 border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-sm font-bold text-slate-950 shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
              <span className={`badge-custom badge-${user.role} mt-0.5 text-[0.60rem]`}>
                {user.role}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-slate-900/60 mb-3 flex items-center gap-2.5 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-800 rounded w-full"></div>
              <div className="h-2 bg-slate-800 rounded w-2/3"></div>
            </div>
          </div>
        )}
        <button
          className="sidebar-link w-full !text-red-400"
          onClick={handleLogout}
        >
          <span className="text-xl leading-none">🚪</span>
          <span>Çıkış Yap</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button 
        className="lg:hidden absolute top-4 left-4 z-50 p-2 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      <aside className="hidden lg:block w-[240px] shrink-0 bg-slate-950/95 border-r border-slate-800/50 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 bottom-0 w-[260px] z-50 bg-slate-950/98 border-r border-slate-800/80 transform transition-transform duration-300 lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex justify-end p-4 pb-0">
          <button className="btn-ghost !text-xl" onClick={() => setMobileOpen(false)}>
            ✕
          </button>
        </div>
        {sidebarContent}
      </aside>
    </>
  )
}
