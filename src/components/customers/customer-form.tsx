'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { customerService, type CustomerRecord } from '@/services/customer-service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

const customerSchema = zod.object({
  plate: zod.string().min(5, 'Plaka en az 5 karakter olmalıdır').max(10, 'Plaka çok uzun'),
  part_price: zod.coerce.number().min(0, 'Fiyat 0 dan küçük olamaz'),
  part_cost: zod.coerce.number().min(0, 'Maliyet 0 dan küçük olamaz'),
  extra_cost: zod.coerce.number().min(0, 'Gider 0 dan küçük olamaz'),
  labor_price: zod.coerce.number().min(0, 'İşçilik 0 dan küçük olamaz'),
  email: zod.string().email('Geçerli bir e-posta giriniz').optional().or(zod.literal('')),
  notes: zod.string().optional(),
})

type CustomerFormValues = zod.infer<typeof customerSchema>

export function CustomerForm({ 
  onSuccess, 
  initialData 
}: { 
  onSuccess?: () => void,
  initialData?: CustomerRecord 
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      plate: initialData?.plate || '',
      part_price: initialData?.part_price || 0,
      part_cost: initialData?.part_cost || 0,
      extra_cost: initialData?.extra_cost || 0,
      labor_price: initialData?.labor_price || 0,
      email: initialData?.email || '',
      notes: initialData?.notes || '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: any) => 
      initialData 
        ? customerService.updateCustomer(initialData.id, values)
        : customerService.createCustomer(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast({ 
        title: 'Başarılı', 
        description: initialData ? 'Kayıt başarıyla güncellendi.' : 'Müşteri kaydı başarıyla oluşturuldu.' 
      })
      if (!initialData) form.reset()
      if (onSuccess) onSuccess()
    },
    onError: (error: any) => {
      toast({ title: 'Hata', description: error.message, variant: 'destructive' })
    },
  })

  function onSubmit(values: CustomerFormValues) {
    const payload = {
      ...values,
      email: values.email || null,
      notes: values.notes || null,
      is_paid: initialData ? initialData.is_paid : false, // preserve payment status or default false
    }
    mutation.mutate(payload as any)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="plate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Araç Plakası</FormLabel>
                <FormControl>
                  <input placeholder="34 ABC 123" {...field} className="input-base uppercase" />
                </FormControl>
                <FormMessage className="error-text" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">E-posta (Opsiyonel)</FormLabel>
                <FormControl>
                  <input type="email" placeholder="musteri@mail.com" {...field} className="input-base" />
                </FormControl>
                <FormMessage className="error-text" />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <div className="col-span-2 text-sm font-medium text-slate-400 mb-2">💰 Müşteriye Yansıtılan (Satış)</div>
          
          <FormField
            control={form.control}
            name="part_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Parça Fiyatı (₺)</FormLabel>
                <FormControl>
                  <input type="number" {...field} className="input-base" />
                </FormControl>
                <FormMessage className="error-text" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="labor_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">İşçilik Ücreti (₺)</FormLabel>
                <FormControl>
                  <input type="number" {...field} className="input-base" />
                </FormControl>
                <FormMessage className="error-text" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-red-900/10 border border-red-900/30">
          <div className="col-span-2 text-sm font-medium text-slate-400 mb-2">📉 İç Maliyetler (Müşteri Görmez)</div>
          
          <FormField
            control={form.control}
            name="part_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Parça Geliş Maliyeti (₺)</FormLabel>
                <FormControl>
                  <input type="number" {...field} className="input-base focus:border-red-500/50 focus:ring-red-500/50" />
                </FormControl>
                <FormMessage className="error-text" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="extra_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Ekstra Maliyet (₺)</FormLabel>
                <FormControl>
                  <input type="number" {...field} className="input-base focus:border-red-500/50 focus:ring-red-500/50" />
                </FormControl>
                <FormMessage className="error-text" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">Teknik Notlar</FormLabel>
              <FormControl>
                <textarea 
                  placeholder="Araç durumu ve yapılan işlemler..." 
                  {...field} 
                  className="input-base min-h-[80px] resize-y" 
                />
              </FormControl>
              <FormMessage className="error-text" />
            </FormItem>
          )}
        />
        <button type="submit" className="btn-primary w-full justify-center mt-6" disabled={mutation.isPending}>
          {mutation.isPending ? 'Kaydediliyor...' : (initialData ? 'Değişiklikleri Kaydet' : 'Kayıt Ekle')}
        </button>
      </form>
    </Form>
  )
}
