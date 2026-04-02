import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export type CustomerRecord = {
  id: string
  plate: string
  part_price: number
  part_cost: number
  extra_cost: number
  labor_price: number
  notes: string | null
  email: string | null
  is_paid: boolean
  paid_amount: number
  created_at: string
  updated_at: string | null
  created_by: string | null
}

export const customerService = {
  getCustomers: async () => {
    const { data, error } = await supabase
      .from('customer_records')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as CustomerRecord[]
  },

  createCustomer: async (customer: Omit<CustomerRecord, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    const { data, error } = await supabase
      .from('customer_records')
      .insert([customer])
      .select()
    if (error) throw error
    return data[0] as CustomerRecord
  },

  updateCustomer: async (id: string, customer: Partial<CustomerRecord>) => {
    const { data, error } = await supabase
      .from('customer_records')
      .update({ ...customer, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0] as CustomerRecord
  },

  togglePaymentStatus: async (id: string, is_paid: boolean, paid_amount: number = 0) => {
    const { data, error } = await supabase
      .from('customer_records')
      .update({ is_paid, paid_amount, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0] as CustomerRecord
  },

  deleteCustomer: async (id: string) => {
    const { error } = await supabase
      .from('customer_records')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
