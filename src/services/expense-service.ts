import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

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

export const expenseService = {
  getExpenses: async (startDate?: string, endDate?: string) => {
    let query = supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
    
    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    const { data, error } = await query
    if (error) throw error
    return data as Expense[]
  },

  createExpense: async (expense: Omit<Expense, 'id' | 'created_at' | 'created_by'>) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select()
    if (error) throw error
    return data[0] as Expense
  },

  updateExpense: async (id: string, expense: Partial<Expense>) => {
    const { data, error } = await supabase
      .from('expenses')
      .update(expense)
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0] as Expense
  },

  deleteExpense: async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
