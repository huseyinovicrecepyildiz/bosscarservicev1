'use client'

import { useQuery } from '@tanstack/react-query'
import { expenseService } from '@/services/expense-service'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function ExpensesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => expenseService.getExpenses(),
  })

  const filteredExpenses = expenses?.filter(e => 
    e.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="animate-fade-in max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[1.35rem] font-extrabold text-slate-100">
            Gider <span className="gradient-text">Yönetimi</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">İşletme giderlerini kalem bazlı takip edin.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className="btn-danger !border-red-500/50">
            <span className="text-lg leading-none">+</span> Gider Ekle
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Gider Girişi</DialogTitle>
            </DialogHeader>
            <ExpenseForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Gider ara..." 
            className="input-base pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card-custom !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Açıklama</th>
                <th>Tutar (₺)</th>
                <th>Tarih</th>
                <th className="text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="h-24 text-center text-slate-500">Yükleniyor...</td>
                </tr>
              ) : filteredExpenses?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-24 text-center text-slate-500">Gider kaydı bulunamadı.</td>
                </tr>
              ) : (
                filteredExpenses?.map((expense) => (
                  <tr key={expense.id}>
                    <td>
                      <span className="badge-custom bg-slate-800 text-slate-300 border-slate-700">
                        {expense.category}
                      </span>
                    </td>
                    <td className="font-medium text-slate-300">{expense.description}</td>
                    <td className="font-bold text-red-500">
                      ₺{expense.amount.toLocaleString('tr-TR')}
                    </td>
                    <td className="text-slate-400">
                      {new Date(expense.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="text-right">
                      <button className="btn-ghost !text-red-500 hover:!bg-red-500/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
