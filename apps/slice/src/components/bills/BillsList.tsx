'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@portfolio/supabase'
import type { Bill, BillMember } from '@portfolio/supabase'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import CreateBillModal from './CreateBillModal'
import { formatMoney } from '../../lib/money'
import { getInitial } from '../../lib/avatar'
import { Plus, Receipt, Loader2, Trash2 } from 'lucide-react'

type BillWithMembers = Bill & { members: BillMember[] }

export default function BillsList({ bills }: { bills: BillWithMembers[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [showCreate, setShowCreate] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, bill: BillWithMembers) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`Hapus tagihan "${bill.title}"? Semua item & pembagian di dalamnya ikut terhapus, ga bisa di-undo.`)) return

    setDeletingId(bill.id)
    const { error } = await supabase.from('bills').delete().eq('id', bill.id)
    setDeletingId(null)
    if (error) {
      console.error('Delete bill failed:', error)
      window.alert('Gagal hapus tagihan, coba lagi.')
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Create button */}
      <button
        onClick={() => setShowCreate(true)}
        className="w-full bg-slice-orange text-white rounded-2xl py-4 font-display text-xl tracking-wide hover:bg-slice-orange-light active:scale-[0.98] transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
      >
        <Plus size={22} /> Buat Tagihan Baru
      </button>

      {/* Bills list */}
      {bills.length === 0 ? (
        <div className="text-center py-16">
          <Receipt size={56} className="mx-auto mb-4 text-slice-muted" />
          <p className="text-slice-muted font-receipt">Belum ada tagihan aktif.</p>
          <p className="text-slice-text-dim text-sm mt-1">Buat tagihan pertama kamu!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill, i) => (
            <div
              key={bill.id}
              className="relative animate-fade-up"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
            >
              <Link
                href={`/bills/${bill.id}`}
                className="block bg-white border border-slice-border rounded-2xl p-4 pr-11 hover:border-slice-orange/40 hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg text-slice-dark truncate">{bill.title}</h3>
                    <p className="text-slice-muted text-xs font-receipt mt-0.5">
                      {format(new Date(bill.date), 'd MMM yyyy', { locale: localeId })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-slice-orange text-lg">{formatMoney(bill.total, bill.currency)}</p>
                    <p className="text-slice-muted text-xs">{bill.members?.length ?? 0} orang</p>
                  </div>
                </div>

                {/* Member avatars */}
                {bill.members && bill.members.length > 0 && (
                  <div className="flex items-center gap-1 mt-3">
                    {bill.members.slice(0, 6).map(m => (
                      <div
                        key={m.id}
                        title={m.name}
                        className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-white text-white text-xs font-bold -ml-1 first:ml-0"
                        style={{ backgroundColor: m.color }}
                      >
                        {getInitial(m.name)}
                      </div>
                    ))}
                    {bill.members.length > 6 && (
                      <div className="w-7 h-7 rounded-full bg-slice-border flex items-center justify-center text-xs text-slice-muted -ml-1">
                        +{bill.members.length - 6}
                      </div>
                    )}
                  </div>
                )}
              </Link>

              <button
                onClick={e => handleDelete(e, bill)}
                disabled={deletingId === bill.id}
                title="Hapus tagihan"
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-slice-text-dim hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deletingId === bill.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateBillModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
