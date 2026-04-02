'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { expenseService } from '@/services/expense-service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

const expenseSchema = zod.object({
  category: zod.enum(['Maaş', 'Fatura', 'Kira', 'Sarf Malzeme', 'Diğer']),
  amount: zod.coerce.number().min(1, 'Miktar en az 1 olmalıdır'),
  description: zod.string().min(1, 'Açıklama gereklidir'),
  date: zod.string(),
})

type ExpenseFormValues = zod.infer<typeof expenseSchema>

export function ExpenseForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      category: 'Diğer',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
    },
  })

  const mutation = useMutation({
    mutationFn: expenseService.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast({ title: 'Başarılı', description: 'Gider başarıyla kaydedildi.' })
      form.reset()
      if (onSuccess) onSuccess()
    },
    onError: (error: any) => {
      toast({ title: 'Hata', description: error.message, variant: 'destructive' })
    },
  })

  function onSubmit(values: ExpenseFormValues) {
    mutation.mutate(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">Kategori</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="input-base bg-slate-800 border-slate-700 text-slate-200">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-300">
                  <SelectItem value="Maaş" className="focus:bg-slate-800 focus:text-slate-200">Maaş</SelectItem>
                  <SelectItem value="Fatura" className="focus:bg-slate-800 focus:text-slate-200">Fatura</SelectItem>
                  <SelectItem value="Kira" className="focus:bg-slate-800 focus:text-slate-200">Kira</SelectItem>
                  <SelectItem value="Sarf Malzeme" className="focus:bg-slate-800 focus:text-slate-200">Sarf Malzeme</SelectItem>
                  <SelectItem value="Diğer" className="focus:bg-slate-800 focus:text-slate-200">Diğer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="error-text" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">Tutar (₺)</FormLabel>
              <FormControl>
                <input type="number" {...field} className="input-base" />
              </FormControl>
              <FormMessage className="error-text" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">Tarih</FormLabel>
              <FormControl>
                <input type="date" {...field} className="input-base" />
              </FormControl>
              <FormMessage className="error-text" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">Açıklama</FormLabel>
              <FormControl>
                <textarea 
                  placeholder="Gider detayı..." 
                  {...field} 
                  className="input-base min-h-[100px] resize-y" 
                />
              </FormControl>
              <FormMessage className="error-text" />
            </FormItem>
          )}
        />
        <button type="submit" className="btn-danger w-full justify-center mt-6" disabled={mutation.isPending}>
          {mutation.isPending ? 'Kaydediliyor...' : 'Gider Ekle'}
        </button>
      </form>
    </Form>
  )
}
