'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customerService, type CustomerRecord } from '@/services/customer-service'
import { CustomerForm } from '@/components/customers/customer-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, Mail, Edit, Trash2, CheckCircle, Clock, Eye, Ban } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

export default function CustomersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | undefined>()
  
  // View Details
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewCustomer, setViewCustomer] = useState<CustomerRecord | null>(null)

  // Payment Prompt
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [paymentCustomer, setPaymentCustomer] = useState<CustomerRecord | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number | string>('')

  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getCustomers,
  })

  const deleteMutation = useMutation({
    mutationFn: customerService.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast({ title: 'Başarılı', description: 'Kayıt silindi.' })
    },
    onError: (err: any) => toast({ title: 'Hata', description: err.message, variant: 'destructive' })
  })

  const togglePaymentMutation = useMutation({
    mutationFn: ({ id, is_paid, paid_amount }: { id: string, is_paid: boolean, paid_amount: number }) => 
      customerService.togglePaymentStatus(id, is_paid, paid_amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast({ title: 'Başarılı', description: 'Ödeme durumu güncellendi.' })
      setIsPaymentOpen(false)
    },
    onError: (err: any) => toast({ title: 'Hata', description: err.message, variant: 'destructive' })
  })

  const filteredCustomers = customers?.filter(c => 
    c.plate.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleEdit = (customer: CustomerRecord) => {
    setEditingCustomer(customer)
    setIsDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingCustomer(undefined)
    setIsDialogOpen(true)
  }

  const handleView = (customer: CustomerRecord) => {
    setViewCustomer(customer)
    setIsViewOpen(true)
  }

  const handlePaymentClick = (customer: CustomerRecord) => {
    // Daima Dialog açılsın, is_paid olsa bile miktarı editlemek isteyebilir
    setPaymentCustomer(customer)
    setPaymentAmount(customer.paid_amount || 0)
    setIsPaymentOpen(true)
  }

  const submitPayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentCustomer) return
    const amt = Number(paymentAmount)
    if (isNaN(amt) || amt < 0) {
      toast({ title: 'Hata', description: 'Geçerli bir tutar giriniz.', variant: 'destructive' })
      return
    }
    
    // Kısmi veya tam kontrolü
    const totalSale = (paymentCustomer.part_price || 0) + (paymentCustomer.labor_price || 0)
    const isNowPaid = amt >= totalSale
    
    togglePaymentMutation.mutate({ id: paymentCustomer.id, is_paid: isNowPaid, paid_amount: amt })
  }

  return (
    <div className="animate-fade-in max-w-[1200px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[1.35rem] font-extrabold text-slate-100">
            Kayıtlı <span className="gradient-text">Müşteriler</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">Müşteri işlemlerini yönetin ve ödeme takibi yapın.</p>
        </div>
        <Dialog 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) setEditingCustomer(undefined)
          }}
        >
          <DialogTrigger className="btn-primary" onClick={handleAddNew}>
            <span className="text-lg leading-none">+</span> Yeni Kayıt
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-slate-100">
                {editingCustomer ? 'Müşteri Kaydını Düzenle' : 'Yeni Müşteri Kaydı'}
              </DialogTitle>
            </DialogHeader>
            <CustomerForm 
              onSuccess={() => setIsDialogOpen(false)} 
              initialData={editingCustomer}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input 
            type="text"
            placeholder="Plaka veya not ara..." 
            className="input-base pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card-custom !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base w-full">
            <thead>
              <tr>
                <th>Plaka</th>
                <th>Satış Fiyatı</th>
                <th>Tahsil Edilen (Kalan)</th>
                <th>Kayıt Tarihi</th>
                <th>Durum</th>
                <th className="text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center text-slate-500">Yükleniyor...</td>
                </tr>
              ) : filteredCustomers?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center text-slate-500">Kayıt bulunamadı.</td>
                </tr>
              ) : (
                filteredCustomers?.map((customer) => {
                  const totalSale = customer.part_price + customer.labor_price
                  const paidAmt = customer.paid_amount || 0
                  const isPartial = paidAmt > 0 && paidAmt < totalSale
                  const isFull = paidAmt >= totalSale && totalSale > 0
                  
                  return (
                    <tr key={customer.id}>
                      <td>
                        <span className="font-mono font-bold text-amber-500 tracking-wider">
                          {customer.plate.toUpperCase()}
                        </span>
                      </td>
                      <td>₺{totalSale.toLocaleString('tr-TR')}</td>
                      <td>
                         <span className={paidAmt > 0 ? "text-emerald-400 font-medium" : "text-slate-500 font-medium"}>
                           {paidAmt > 0 ? `₺${paidAmt.toLocaleString('tr-TR')}` : '-'}
                         </span>
                         {isPartial && (
                           <span className="block text-[0.65rem] text-rose-400 mt-0.5">
                             Kalan: ₺{(totalSale - paidAmt).toLocaleString('tr-TR')}
                           </span>
                         )}
                      </td>
                      <td>
                        <span className="block text-slate-300 font-medium text-sm">
                          {new Date(customer.created_at).toLocaleDateString('tr-TR')}
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5">
                          {new Date(customer.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td>
                         {isFull ? (
                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                             <CheckCircle className="w-3.5 h-3.5" /> Ödendi
                           </span>
                         ) : isPartial ? (
                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                             <Clock className="w-3.5 h-3.5" /> Kısmi Ödeme
                           </span>
                         ) : (
                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                             <Clock className="w-3.5 h-3.5" /> Ödenmedi
                           </span>
                         )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleView(customer)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Detaylı İncele"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => handlePaymentClick(customer)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                            title="Ödeme Miktarını Değiştir"
                          >
                            {isFull ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-cyan-400" />}
                          </button>
                          
                          {customer.email && (
                            <a 
                              href={`mailto:${customer.email}`}
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors"
                              title="E-posta Gönder"
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          )}

                          <button 
                            onClick={() => handleEdit(customer)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => {
                              if(confirm('Kayıt silinecek, onaylıyor musunuz?')) {
                                deleteMutation.mutate(customer.id)
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Customer Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-mono text-sm tracking-wider">
                {viewCustomer?.plate?.toUpperCase()}
              </span>
              Müşteri Detay Çetelesi
            </DialogTitle>
          </DialogHeader>
          {viewCustomer && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <p className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-semibold mb-1">Maliyetler</p>
                  <div className="space-y-1 text-sm text-slate-300">
                    <div className="flex justify-between"><span>Parça Maliyeti:</span> <span>₺{viewCustomer.part_cost?.toLocaleString('tr-TR')}</span></div>
                    <div className="flex justify-between"><span>Ekstra Gider:</span> <span>₺{viewCustomer.extra_cost?.toLocaleString('tr-TR')}</span></div>
                    <div className="flex justify-between font-semibold border-t border-slate-700 pt-1 mt-1 text-rose-400">
                      <span>Toplam Çıkan:</span> <span>₺{((viewCustomer.part_cost || 0) + (viewCustomer.extra_cost || 0)).toLocaleString('tr-TR')}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <p className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-semibold mb-1">Satış (Gelir)</p>
                  <div className="space-y-1 text-sm text-slate-300">
                    <div className="flex justify-between"><span>Parça Satış:</span> <span>₺{viewCustomer.part_price?.toLocaleString('tr-TR')}</span></div>
                    <div className="flex justify-between"><span>İşçilik Satış:</span> <span>₺{viewCustomer.labor_price?.toLocaleString('tr-TR')}</span></div>
                    <div className="flex justify-between font-semibold border-t border-slate-700 pt-1 mt-1 text-emerald-400">
                      <span>Müşteriye Çıkan:</span> <span>₺{((viewCustomer.part_price || 0) + (viewCustomer.labor_price || 0)).toLocaleString('tr-TR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 flex justify-between items-center">
                <div>
                  <p className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-semibold mb-1">Kayıt Net Kârı</p>
                  <p className="text-xl font-bold text-amber-500">
                    ₺{(((viewCustomer.part_price || 0) + (viewCustomer.labor_price || 0)) - ((viewCustomer.part_cost || 0) + (viewCustomer.extra_cost || 0))).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="text-right">
                   <p className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-semibold mb-1">Durum</p>
                   {(() => {
                     const total = (viewCustomer.part_price || 0) + (viewCustomer.labor_price || 0)
                     const paid = viewCustomer.paid_amount || 0
                     if (paid >= total && total > 0) return (
                       <div>
                         <span className="text-emerald-400 font-bold block">ÖDENDİ</span>
                         <span className="text-xs text-slate-400">(₺{paid.toLocaleString('tr-TR')} Tamamı)</span>
                       </div>
                     )
                     if (paid > 0) return (
                       <div>
                         <span className="text-cyan-400 font-bold block">KISMİ ÖDEME</span>
                         <span className="text-xs text-slate-400">(₺{paid.toLocaleString('tr-TR')} Tahsil Edildi)</span>
                       </div>
                     )
                     return <span className="text-rose-400 font-bold">BEKLİYOR</span>
                   })()}
                </div>
              </div>

              {viewCustomer.notes && (
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <p className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-semibold mb-1">Notlar / Yapılanlar</p>
                  <p className="text-sm text-slate-300 italic">"{viewCustomer.notes}"</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 mt-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <div>
                    <span className="block text-[0.6rem] uppercase tracking-wider mb-0.5 opacity-70">Oluşturulma</span>
                    {new Date(viewCustomer.created_at).toLocaleString('tr-TR')}
                  </div>
                </div>
                {viewCustomer.updated_at && (
                  <div className="flex items-center gap-1.5 justify-end text-amber-500/70">
                    <Edit className="w-3.5 h-3.5" />
                    <div className="text-right">
                      <span className="block text-[0.6rem] uppercase tracking-wider mb-0.5 opacity-70">Son Düzenleme</span>
                      {new Date(viewCustomer.updated_at).toLocaleString('tr-TR')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Collect Payment Prompt */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-sm bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" /> Tahsilat Onayı
            </DialogTitle>
          </DialogHeader>
          {paymentCustomer && (
            <form onSubmit={submitPayment} className="space-y-4 mt-2">
              <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300">
                <span className="font-mono text-amber-500">{paymentCustomer.plate.toUpperCase()}</span> plakalı işlem için sistemde beklenen toplam tutar: 
                <strong className="block text-lg text-white mt-1">₺{((paymentCustomer.part_price || 0) + (paymentCustomer.labor_price || 0)).toLocaleString('tr-TR')}</strong>
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">Müşteriden Net Tahsil Edilen:</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₺</span>
                  <input
                    type="number"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="input-base pl-8 w-full font-semibold text-emerald-400"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Eğer indirim veya iskonto yaptıysanız, sadece kasanıza giren net tutarı yazın.</p>
              </div>
              <button 
                type="submit" 
                disabled={togglePaymentMutation.isPending}
                className="btn-primary w-full justify-center !bg-emerald-600 hover:!bg-emerald-500 !border-emerald-500/50"
              >
                {togglePaymentMutation.isPending ? 'İşleniyor...' : 'ÖEHMEYİ AL VE ONAYLA'}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
