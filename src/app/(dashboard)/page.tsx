'use client'

import { StatsCards } from '@/components/dashboard/stats-cards'
import { FinancialChart } from '@/components/dashboard/financial-chart'
import { useQuery } from '@tanstack/react-query'
import { customerService } from '@/services/customer-service'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertCircle, Clock } from 'lucide-react'

export type DateFilter = 'day' | 'week' | 'month' | 'all'

export default function DashboardPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('month')
  const [username, setUsername] = useState('Yükleniyor...')
  const [isReceivablesOpen, setIsReceivablesOpen] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email;
      if (email) {
        setUsername(email.replace('@bosscar.local', ''));
      } else {
        setUsername('Personel');
      }
    });
  }, [])

  const { data: allCustomers } = useQuery({
    queryKey: ['customers-all'],
    queryFn: customerService.getCustomers,
  })

  const { data: recentCustomers } = useQuery({
    queryKey: ['recent-customers', dateFilter],
    queryFn: async () => {
      const data = await customerService.getCustomers()
      
      const now = new Date()
      // Setup start dates
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      const startOfWeek = new Date(startOfDay)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (startOfWeek.getDay() === 0 ? -6 : 1)) // Monday
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const filtered = data.filter(c => {
        const d = new Date(c.created_at)
        if (dateFilter === 'day') return d >= startOfDay
        if (dateFilter === 'week') return d >= startOfWeek
        if (dateFilter === 'month') return d >= startOfMonth
        return true
      })
      
      return filtered.slice(0, 5) // Last 5
    },
  })

  // Date filtered customers for the modules
  const currentFilteredCustomers = allCustomers?.filter(c => {
    const d = new Date(c.created_at)
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (startOfWeek.getDay() === 0 ? -6 : 1))
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    if (dateFilter === 'day') return d >= startOfDay
    if (dateFilter === 'week') return d >= startOfWeek
    if (dateFilter === 'month') return d >= startOfMonth
    return true
  }) || []

  // Receivables Math on Filtered Customers
  const totalCollected = currentFilteredCustomers.reduce((acc, curr) => acc + (curr.paid_amount || 0), 0)
  
  const receivablesCustomers = currentFilteredCustomers.filter(c => {
    const totalSale = (c.part_price || 0) + (c.labor_price || 0)
    const paid = c.paid_amount || 0
    return paid < totalSale && totalSale > 0
  }).sort((a, b) => {
    const aDebt = ((a.part_price || 0) + (a.labor_price || 0)) - (a.paid_amount || 0)
    const bDebt = ((b.part_price || 0) + (b.labor_price || 0)) - (b.paid_amount || 0)
    return bDebt - aDebt // Sort by largest debt first
  })

  const totalReceivables = receivablesCustomers.reduce((acc, curr) => {
    const totalSale = (curr.part_price || 0) + (curr.labor_price || 0)
    return acc + (totalSale - (curr.paid_amount || 0))
  }, 0)


  return (
    <div className="animate-fade-in-up max-w-[1200px] mx-auto space-y-6">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-[1.35rem] font-extrabold text-slate-100">
            Merhaba, <span className="gradient-text cursor-default capture-case" style={{textTransform: 'capitalize'}}>{username}</span> 👋
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Boss Car ERP • {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        
        <div className="flex bg-slate-800/80 rounded-lg p-1 border border-slate-700">
          {[
             { id: 'day', label: 'Bugün' },
             { id: 'week', label: 'Bu Hafta' },
             { id: 'month', label: 'Bu Ay' },
             { id: 'all', label: 'Tümü' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setDateFilter(f.id as DateFilter)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                dateFilter === f.id 
                  ? 'bg-amber-500/20 text-amber-500' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <StatsCards filter={dateFilter} />

      {/* Tahsilat ve Alacaklar Bölümü */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-custom bg-emerald-900/10 border-emerald-500/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[0.70rem] text-emerald-400 uppercase tracking-widest font-bold mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                KASAYA GİREN (NET TAHSİLAT)
              </p>
              <p className="text-3xl font-extrabold text-slate-100 mt-2">₺{totalCollected.toLocaleString('tr-TR')}</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsReceivablesOpen(true)}
          className="card-custom text-left group bg-rose-900/10 border-rose-500/20 hover:border-rose-500/50 focus:ring-2 ring-rose-500/50 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 translate-x-4 group-hover:translate-x-0 duration-300">
            <span className="bg-rose-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg shadow-rose-900/50 font-bold whitespace-nowrap">
              LİSTEYİ GÖR
            </span>
          </div>
          <div className="relative z-0 group-hover:-translate-x-2 transition-transform duration-300">
            <p className="text-[0.70rem] text-rose-400 uppercase tracking-widest font-bold mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
              AÇIK HESAP (BEKLEYEN ALACAK)
            </p>
            <p className="text-3xl font-extrabold text-slate-100 mt-2">₺{totalReceivables.toLocaleString('tr-TR')}</p>
            <p className="text-xs text-rose-400/80 mt-1.5 font-medium">{receivablesCustomers.length} müşteride bakiye bulunuyor.</p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-5">
        <div className="card-custom">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="text-base font-bold text-slate-100">
              📈 Satış — Gider
              <span className="text-xs font-normal text-slate-500 ml-2">
                ({dateFilter === 'month' ? 'Bu Ay' : dateFilter === 'week' ? 'Bu Hafta' : dateFilter === 'day' ? 'Bugün' : 'Tümü'})
              </span>
            </h3>
          </div>
          <div className="h-[250px] mt-4 flex items-center justify-center text-slate-600">
            <FinancialChart filter={dateFilter} />
          </div>
        </div>

        <div className="card-custom !p-0 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-700/30 flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-100">
              📋 Son İşlemler (Bu Dönem)
            </h3>
            <span className="text-xs text-slate-500">{recentCustomers?.length || 0} kayıt</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Plaka</th>
                  <th>Satış Tutarı</th>
                  <th className="text-right">Durum</th>
                </tr>
              </thead>
              <tbody>
                {recentCustomers?.map((customer) => {
                  const sale = customer.part_price + customer.labor_price
                  const paid = customer.paid_amount || 0
                  return (
                    <tr key={customer.id}>
                      <td>
                        <span className="font-mono font-bold text-amber-500 tracking-wider">
                          {customer.plate}
                        </span>
                      </td>
                      <td className="text-slate-300 font-semibold">
                        ₺{sale.toLocaleString('tr-TR')}
                      </td>
                      <td className="text-right">
                         {paid >= sale && sale > 0 ? (
                           <span className="badge-custom bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Ödendi</span>
                         ) : paid > 0 ? (
                           <span className="badge-custom bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Kısmi</span>
                         ) : (
                           <span className="badge-custom bg-rose-500/10 text-rose-400 border border-rose-500/20">Açık</span>
                         )}
                      </td>
                    </tr>
                  )
                })}
                {(!recentCustomers || recentCustomers.length === 0) && (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-slate-500">
                      Seçili dönemde işlem yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Receivables Dialog Modal */}
      <Dialog open={isReceivablesOpen} onOpenChange={setIsReceivablesOpen}>
        <DialogContent className="sm:max-w-3xl bg-slate-900 border-slate-700 max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0 mb-4">
            <DialogTitle className="text-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xl">
                <AlertCircle className="w-6 h-6 text-rose-500" /> Açık Hesaplar (Ödenmeyenler)
              </div>
              <div className="text-right flex flex-col bg-rose-950/40 px-4 py-1.5 rounded-lg border border-rose-900/50">
                <span className="text-[0.65rem] text-rose-400/80 uppercase font-bold tracking-widest text-left">TOPLAM ALACAK BAKİYE</span>
                <span className="text-2xl font-extrabold text-rose-400">₺{totalReceivables.toLocaleString('tr-TR')}</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {receivablesCustomers.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center bg-slate-800/30 rounded-xl border border-slate-700/50 border-dashed">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                  <span className="text-4xl">🎉</span>
                </div>
                <h3 className="text-lg font-bold text-slate-200">Açık Hesap Yok!</h3>
                <p className="text-slate-500 text-sm mt-1 max-w-sm">
                  {dateFilter === 'all' ? 'Geçmişe dönük hiç alacağınız kalmamış. Kasanız pırıl pırıl.' : 'Seçili zaman aralığında içeride paranız yok. Temiz.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {receivablesCustomers.map(customer => {
                  const sale = (customer.part_price || 0) + (customer.labor_price || 0);
                  const paid = customer.paid_amount || 0;
                  const debt = sale - paid;
                  
                  return (
                    <div key={customer.id} className="p-4 bg-slate-800/60 hover:bg-slate-800 transition-colors rounded-xl border border-rose-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 shrink-0 bg-slate-900 rounded-lg border border-slate-700 flex flex-col items-center justify-center text-center">
                           <Clock className="w-4 h-4 text-rose-400 mb-1" />
                           <span className="text-[0.6rem] text-slate-500 block leading-tight">{new Date(customer.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div>
                          <div className="font-mono font-bold text-amber-500 text-lg tracking-wider bg-slate-900/50 px-2 py-0.5 rounded inline-block border border-amber-500/20 mb-1.5">
                            {customer.plate.toUpperCase()}
                          </div>
                          <div className="text-sm text-slate-400 max-w-sm truncate" title={customer.notes || ""}>
                            {customer.notes ? customer.notes : "Not bulunmuyor..."}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 sm:text-right shrink-0">
                        <div>
                          <p className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-bold">Toplam İşlem</p>
                          <p className="text-sm font-semibold text-slate-300">₺{sale.toLocaleString('tr-TR')}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-700/50"></div>
                        <div>
                          <p className="text-[0.65rem] text-rose-400/80 uppercase tracking-widest font-bold">KALAN BORCU</p>
                          <p className="text-xl font-extrabold text-rose-400">₺{debt.toLocaleString('tr-TR')}</p>
                          {paid > 0 && <p className="text-[0.65rem] text-cyan-500/80 mt-0.5">(Kısmi: ₺{paid} alındı)</p>}
                        </div>
                      </div>

                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
