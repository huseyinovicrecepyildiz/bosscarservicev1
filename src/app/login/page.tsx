'use client'

import Link from 'next/link'
import { useState } from 'react'
import { pb } from '@/lib/pocketbase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!id || !password) {
      setError('Lütfen ID ve şifrenizi girin.')
      return
    }

    setLoading(true)
    
    const dummyEmail = `${id.trim().toLowerCase()}@bosscar.local`

    try {
      await pb.collection('users').authWithPassword(dummyEmail, password)
      
      // Save token in cookie so Middleware can check it
      document.cookie = pb.authStore.exportToCookie({ httpOnly: false, secure: false })
      
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError('Hatalı ID veya Şifre.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="card-custom w-full max-w-md p-8 sm:p-10 relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 rounded-xl backdrop-blur-sm">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-3xl shadow-[0_4px_24px_rgba(245,158,11,0.25)] mb-6">
            🚗
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Boss <span className="gradient-text">Car</span>
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Personel Yönetim Paneli Girişi
          </p>
        </div>
        
        <form className="space-y-5" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-md text-sm font-medium">
               {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300" htmlFor="id">Personel ID</label>
            <input 
              id="id" 
              placeholder="Örn: ahmetusta" 
              className="input-base" 
              value={id}
              onChange={e => setId(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300" htmlFor="password">Şifre</label>
            <input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              className="input-base" 
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center !mt-8 text-base py-3">
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
          
          <div className="text-center text-sm font-medium text-slate-500 mt-6 pt-4 border-t border-slate-800">
            Sisteme eklendiğiniz ID adresinizi yetkiliden öğrenebilirsiniz.
          </div>
        </form>
      </div>
    </div>
  )
}
