import { pb } from '@/lib/pocketbase'

export type Profile = {
  id: string
  email: string
  role: 'admin' | 'yetkili' | 'personel'
  created_at: string
}

const mapRecord = (r: any): Profile => ({
  ...r,
  created_at: r.created,
})

export const adminService = {
  getProfiles: async () => {
    const records = await pb.collection('users').getFullList({
      sort: '-created',
    })
    return records.map(mapRecord) as Profile[]
  },

  updateProfileRole: async (id: string, role: Profile['role']) => {
    const record = await pb.collection('users').update(id, { role })
    return mapRecord(record) as Profile
  },
}
