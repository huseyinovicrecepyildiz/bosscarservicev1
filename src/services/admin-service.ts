import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export type Profile = {
  id: string
  email: string
  role: 'admin' | 'yetkili' | 'personel'
  created_at: string
}

export const adminService = {
  getProfiles: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as Profile[]
  },

  updateProfileRole: async (id: string, role: Profile['role']) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0] as Profile
  },
}
