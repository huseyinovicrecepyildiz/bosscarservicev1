import { pb } from '@/lib/pocketbase'

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

const mapRecord = (r: any): CustomerRecord => ({
  ...r,
  created_at: r.created,
  updated_at: r.updated,
})

export const customerService = {
  getCustomers: async () => {
    const records = await pb.collection('customer_records').getFullList({
      sort: '-created',
    })
    return records.map(mapRecord) as CustomerRecord[]
  },

  createCustomer: async (customer: Omit<CustomerRecord, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    const record = await pb.collection('customer_records').create(customer)
    return mapRecord(record) as CustomerRecord
  },

  updateCustomer: async (id: string, customer: Partial<CustomerRecord>) => {
    const record = await pb.collection('customer_records').update(id, customer)
    return mapRecord(record) as CustomerRecord
  },

  togglePaymentStatus: async (id: string, is_paid: boolean, paid_amount: number = 0) => {
    const record = await pb.collection('customer_records').update(id, { is_paid, paid_amount })
    return mapRecord(record) as CustomerRecord
  },

  deleteCustomer: async (id: string) => {
    await pb.collection('customer_records').delete(id)
  }
}
