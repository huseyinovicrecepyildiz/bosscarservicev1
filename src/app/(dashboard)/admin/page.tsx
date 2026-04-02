'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService, Profile } from '@/services/admin-service'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Shield, ShieldAlert, ShieldCheck, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { createAdminUser } from '@/app/actions/admin-actions'

export default function AdminPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: adminService.getProfiles,
  })

  // Ensure role changes are optimistic
  const mutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Profile['role'] }) =>
      adminService.updateProfileRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      toast({ title: 'Başarılı', description: 'Kullanıcı rolü güncellendi.' })
    },
    onError: (error: any) => {
      toast({ title: 'Hata', description: error.message, variant: 'destructive' })
    },
  })

  return (
    <div className="animate-fade-in max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[1.35rem] font-extrabold text-slate-100">
            Kullanıcı <span className="gradient-text">Yönetimi</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">Ekip kısıtlamalarını ve rollerini buradan yönetin.</p>
        </div>
        
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger className="btn-primary flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Yeni Personel Ekle
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Manuel Olarak Başkasını Ekle</DialogTitle>
            </DialogHeader>
            <form 
              action={async (formData) => {
                setIsSubmitting(true)
                const res = await createAdminUser(formData)
                setIsSubmitting(false)
                if (res.error) {
                  toast({ title: 'Hata', description: res.error, variant: 'destructive' })
                } else {
                  toast({ title: 'Başarılı', description: 'Yeni kullanıcı başarıyla eklendi.' })
                  setIsAddUserOpen(false)
                  queryClient.invalidateQueries({ queryKey: ['profiles'] })
                }
              }} 
              className="space-y-4 mt-4"
            >
              <div>
                <label className="text-sm text-slate-300 font-medium block mb-1">Giriş Kimliği (ID)</label>
                <input 
                  type="text" 
                  name="userId" 
                  required 
                  placeholder="Örn: ahmetusta" 
                  className="input-base w-full"
                />
                <span className="text-[0.65rem] text-slate-500 block mt-1">
                  Arka planda "ahmetusta@bosscar.local" olarak kaydedilir.
                </span>
              </div>
              <div>
                <label className="text-sm text-slate-300 font-medium block mb-1">Geçici Şifre</label>
                <input 
                  type="text" 
                  name="password" 
                  required 
                  minLength={6} 
                  placeholder="En az 6 karakter" 
                  className="input-base w-full"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 font-medium block mb-1">Yetki Rolü</label>
                <select name="role" required className="input-base w-full">
                  <option value="personel">Personel (Sadece Müşteri Görebilir)</option>
                  <option value="yetkili">Yetkili (Gider & Müşteri Görür)</option>
                  <option value="admin">Admin (Tam Yetki)</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-primary w-full justify-center mt-6 disabled:opacity-50"
              >
                {isSubmitting ? 'Ekleniyor...' : 'Kullanıcıyı Kaydet'}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="card-custom !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Giriş ID (Sistem Maili)</th>
                <th>Şu Anki Rol</th>
                <th>Rolü Değiştir</th>
                <th>Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="h-24 text-center text-slate-500">Yükleniyor...</td>
                </tr>
              ) : profiles?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="h-24 text-center text-slate-500">Sistemde kayıtlı kullanıcı bulunmuyor.</td>
                </tr>
              ) : profiles?.map((profile) => {
                const displayId = profile.email.replace('@bosscar.local', '')
                return (
                  <tr key={profile.id}>
                    <td className="font-medium text-slate-300">
                      <span className="text-amber-500 mr-2">{displayId}</span>
                      <span className="text-xs text-slate-600">({profile.email})</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {profile.role === 'admin' && <ShieldAlert className="h-4 w-4 text-amber-500" />}
                        {profile.role === 'yetkili' && <ShieldCheck className="h-4 w-4 text-indigo-400" />}
                        {profile.role === 'personel' && <Shield className="h-4 w-4 text-emerald-400" />}
                        <span className={`badge-custom badge-${profile.role}`}>
                          {profile.role}
                        </span>
                      </div>
                    </td>
                    <td>
                      <Select
                        defaultValue={profile.role}
                        onValueChange={(val) => mutation.mutate({ id: profile.id, role: val as Profile['role'] })}
                      >
                        <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700 text-slate-300">
                          <SelectValue placeholder="Rol Seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-slate-300">
                          <SelectItem value="admin" className="focus:bg-slate-800 focus:text-slate-200">Admin (Tam Yetki)</SelectItem>
                          <SelectItem value="yetkili" className="focus:bg-slate-800 focus:text-slate-200">Yetkili (Gider & Müşteri)</SelectItem>
                          <SelectItem value="personel" className="focus:bg-slate-800 focus:text-slate-200">Personel (Sadece Müşteri)</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="text-slate-400">
                      {new Date(profile.created_at).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
