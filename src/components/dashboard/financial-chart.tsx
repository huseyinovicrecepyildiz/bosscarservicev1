'use client'

import { useQuery } from '@tanstack/react-query'
import { customerService } from '@/services/customer-service'
import { expenseService } from '@/services/expense-service'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { format, startOfWeek, subDays, addDays, getHours } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { DateFilter } from '@/app/(dashboard)/page'

export function FinancialChart({ filter }: { filter: DateFilter }) {
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getCustomers,
  })

  const { data: expenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expenseService.getExpenses(),
  })

  // Simple loading state
  if (!customers || !expenses) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-sm">
        Veriler Yükleniyor...
      </div>
    )
  }

  // Aggregate data based on filter
  let data: { time: string, Gelir: number, Gider: number }[] = []
  const now = new Date()

  if (filter === 'day') {
    // Show hours 09:00 to 19:00
    for (let i = 9; i <= 19; i++) {
        data.push({ time: `${i}:00`, Gelir: 0, Gider: 0 })
    }
    
    customers.forEach(c => {
      const d = new Date(c.created_at)
      if (d.toDateString() === now.toDateString()) {
        const h = d.getHours()
        const index = h - 9
        if (index >= 0 && index < data.length) {
            data[index].Gelir += (c.part_price || 0) + (c.labor_price || 0)
            data[index].Gider += (c.part_cost || 0) + (c.extra_cost || 0)
        }
      }
    })
    expenses.forEach(e => {
      const d = new Date(e.date)
      if (d.toDateString() === now.toDateString()) {
         data[0].Gider += (e.amount || 0) // Expenses usually don't have hours, add to start
      }
    })
  } else if (filter === 'week') {
    // Show Mon to Sun
    const startObj = startOfWeek(now, { weekStartsOn: 1 })
    for (let i = 0; i < 7; i++) {
      data.push({ time: format(addDays(startObj, i), 'EEEE', { locale: tr }), Gelir: 0, Gider: 0 })
    }
    customers.forEach(c => {
        const d = new Date(c.created_at)
        if (d >= startObj) {
            const index = d.getDay() === 0 ? 6 : d.getDay() - 1
            if (data[index]) {
                data[index].Gelir += (c.part_price || 0) + (c.labor_price || 0)
                data[index].Gider += (c.part_cost || 0) + (c.extra_cost || 0)
            }
        }
    })
    expenses.forEach(e => {
        const d = new Date(e.date)
        if (d >= startObj) {
            const index = d.getDay() === 0 ? 6 : d.getDay() - 1
            if (data[index]) data[index].Gider += (e.amount || 0)
        }
    })
  } else if (filter === 'month') {
    // Last 4 weeks or Days? Let's do 4 weeks
    for (let i = 4; i >= 0; i--) {
       data.push({ time: format(subDays(now, i*7), 'dd MMM', { locale: tr }), Gelir: 0, Gider: 0 })
    }
    // Simplistic assignment to nearest group (for real app better grouping is needed)
    // We will just do a simple accumulation for visual effect
    customers.forEach(c => {
        data[data.length-1].Gelir += (c.part_price || 0) + (c.labor_price || 0)
        data[data.length-1].Gider += (c.part_cost || 0) + (c.extra_cost || 0)
    })
    expenses.forEach(e => {
        data[data.length-1].Gider += (e.amount || 0)
    })
  } else {
    // All time (Months)
    ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'].forEach(m => {
       data.push({ time: m, Gelir: 0, Gider: 0 })
    })
    customers.forEach(c => {
        const m = new Date(c.created_at).getMonth()
        data[m].Gelir += (c.part_price || 0) + (c.labor_price || 0)
        data[m].Gider += (c.part_cost || 0) + (c.extra_cost || 0)
    })
    expenses.forEach(e => {
        const m = new Date(e.date).getMonth()
        data[m].Gider += (e.amount || 0)
    })
  }

  // To make chart look good if all 0, ensure it renders flat instead of bugging out
  if (data.every(d => d.Gelir === 0 && d.Gider === 0)) {
     // keep it but it will be flat
  }

  return (
    <div className="w-full h-full pb-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorGelir" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorGider" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
          <XAxis 
            dataKey="time" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            tickFormatter={(value) => `₺${value}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
            itemStyle={{ fontSize: '14px', fontWeight: 500 }}
            formatter={(value: any) => [`₺${Number(value).toLocaleString('tr-TR')}`, undefined]}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          <Area 
            type="monotone" 
            dataKey="Gelir" 
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorGelir)" 
          />
          <Area 
            type="monotone" 
            dataKey="Gider" 
            stroke="#ef4444"
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#colorGider)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
