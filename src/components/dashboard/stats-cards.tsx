'use client'

import { useQuery } from '@tanstack/react-query'
import { customerService } from '@/services/customer-service'
import { expenseService } from '@/services/expense-service'
import type { DateFilter } from '@/app/(dashboard)/page'

export function StatsCards({ filter = 'month' }: { filter?: DateFilter }) {
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getCustomers,
  })

  const { data: expenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expenseService.getExpenses(),
  })

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (startOfWeek.getDay() === 0 ? -6 : 1)) 
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const filterByDate = (dateString: string | Date) => {
    const d = new Date(dateString)
    if (filter === 'day') return d >= startOfDay
    if (filter === 'week') return d >= startOfWeek
    if (filter === 'month') return d >= startOfMonth
    return true
  }

  const filteredCustomers = customers?.filter(c => filterByDate(c.created_at)) || []
  const filteredExpenses = expenses?.filter(e => filterByDate(e.date)) || []

  // Algoritma: 
  // Brüt Gelir: Sadece satış (Müşteriye yansıtılan parça satış + işçilik)
  const totalIncome = filteredCustomers.reduce((acc, curr) => acc + (curr.part_price || 0) + (curr.labor_price || 0), 0)
  
  // Araç Başına İç Maliyetler: Parça geliş maliyeti + Ekstra maliyetler
  const totalInternalCost = filteredCustomers.reduce((acc, curr) => acc + (curr.part_cost || 0) + (curr.extra_cost || 0), 0)

  // Genel Giderler: Fatura, Kira vs..
  const totalGeneralExpense = filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0)
  
  const totalExpense = totalInternalCost + totalGeneralExpense
  const netProfit = totalIncome - totalExpense

  const stats = [
    {
      label: 'Toplam Gelir (Satış)', value: `₺${totalIncome.toLocaleString('tr-TR')}`, icon: '💵',
      color: 'green', sub: `${filteredCustomers.length} işlemden`,
    },
    {
      label: 'Toplam Gider (Maliyet+Masraf)', value: `₺${totalExpense.toLocaleString('tr-TR')}`, icon: '📋',
      color: 'red', sub: `İç maliyet + ${filteredExpenses.length} genel gider`,
    },
    {
      label: 'Net Kâr', value: `₺${netProfit.toLocaleString('tr-TR')}`, icon: netProfit >= 0 ? '📈' : '📉',
      color: netProfit >= 0 ? 'amber' : 'red',
      sub: netProfit >= 0 ? '🟢 Kârlı Dönem' : '🔴 Zararlı Dönem',
    },
    {
      label: 'İşlem Gören Araç', value: (filteredCustomers.length).toString(), icon: '🚗',
      color: 'violet', sub: 'Seçili döneme ait periyot',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(stat => (
        <div key={stat.label} className={`card-custom stat-gradient-${stat.color} flex items-center gap-3.5`}>
          <div className="text-3xl shrink-0 leading-none">{stat.icon}</div>
          <div className="min-w-0">
            <p className="text-[0.68rem] text-slate-400 font-medium whitespace-nowrap">{stat.label}</p>
            <p className="text-[1.05rem] font-extrabold text-slate-100 overflow-hidden text-ellipsis whitespace-nowrap">
              {stat.value}
            </p>
            <p className="text-[0.68rem] text-slate-500">{stat.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
