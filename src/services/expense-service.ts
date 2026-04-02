import { pb } from '@/lib/pocketbase'

export type ExpenseCategory = 'Maaş' | 'Fatura' | 'Kira' | 'Sarf Malzeme' | 'Diğer'

export type Expense = {
  id: string
  category: ExpenseCategory
  amount: number
  description: string | null
  date: string
  created_at: string
  created_by: string | null
}

const mapRecord = (r: any): Expense => ({
  ...r,
  created_at: r.created,
})

export const expenseService = {
  getExpenses: async (startDate?: string, endDate?: string) => {
    let filter = ''
    if (startDate && endDate) {
        filter = `date >= "${startDate}" && date <= "${endDate}"`
    } else if (startDate) {
        filter = `date >= "${startDate}"`
    } else if (endDate) {
        filter = `date <= "${endDate}"`
    }

    const records = await pb.collection('expenses').getFullList({
      sort: '-date',
      filter: filter
    })
    
    return records.map(mapRecord) as Expense[]
  },

  createExpense: async (expense: Omit<Expense, 'id' | 'created_at' | 'created_by'>) => {
    const record = await pb.collection('expenses').create(expense)
    return mapRecord(record) as Expense
  },

  updateExpense: async (id: string, expense: Partial<Expense>) => {
    const record = await pb.collection('expenses').update(id, expense)
    return mapRecord(record) as Expense
  },

  deleteExpense: async (id: string) => {
    await pb.collection('expenses').delete(id)
  }
}
