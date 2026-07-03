'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@portfolio/supabase'
import type { Bill, BillMember } from '@portfolio/supabase'
import { formatMoney } from '../../lib/money'

type MemberWithTotal = BillMember & { total: number }

// One person fronted the whole bill — everyone else pays back exactly
// what they ordered (their `total`), directly to the payer.
function computeSettlement(members: MemberWithTotal[], payerId: string) {
  return members
    .filter(m => m.id !== payerId && m.total > 0.01)
    .map(m => ({ from: m, amount: m.total }))
}

export default function SettleModal({
  bill, members, onClose,
}: {
  bill: Bill
  members: MemberWithTotal[]
  onClose: () => void
}) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [payerId, setPayerId] = useState(
    members.find(m => m.user_id === bill.owner_id)?.id ?? members[0]?.id ?? ''
  )
  const payer = members.find(m => m.id === payerId)
  const settlements = payer ? computeSettlement(members, payerId) : []

  const handleSettle = async () => {
    startTransition(async () => {
      await supabase.from('bills').update({ is_settled: true }).eq('id', bill.id)
      router.push('/bills')
      onClose()
    })
  }

  const shareToWA = (from: MemberWithTotal, amount: number) => {
    if (!payer) return
    const text = encodeURIComponent(
      `Hei ${from.name}! Tagihan "${bill.title}" udah dihitung nih 🧾\n` +
      `Kamu perlu transfer ${formatMoney(amount, bill.currency)} ke ${payer.name} ya!\n\n` +
      `Dibuat pake SLICE — Split bill app 🍕`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl animate-print overflow-hidden">
        <div className="md:hidden w-10 h-1 bg-slice-border rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slice-border">
          <h2 className="font-display text-2xl text-slice-dark">Siapa Bayar Berapa?</h2>
          <p className="text-slice-muted text-xs font-receipt mt-1">Tagihan "{bill.title}"</p>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Who paid upfront */}
          <div>
            <label className="text-slice-muted text-xs font-receipt uppercase tracking-widest block mb-1.5">
              Siapa yang bayar duluan?
            </label>
            <select
              value={payerId}
              onChange={e => setPayerId(e.target.value)}
              className="w-full border border-slice-border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-slice-orange/60 bg-slice-surface"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.avatar_emoji} {m.name}</option>
              ))}
            </select>
          </div>

          {/* Per person breakdown */}
          <div>
            <p className="text-slice-muted text-xs font-receipt uppercase tracking-widest mb-3">Rincian per orang</p>
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{m.avatar_emoji}</span>
                    <span className="text-sm font-medium">{m.name}</span>
                    {m.id === payerId && (
                      <span className="text-[10px] text-green-600 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5">bayar duluan</span>
                    )}
                  </div>
                  <span className="font-receipt font-bold text-sm" style={{ color: m.color }}>
                    {formatMoney(m.total, bill.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <hr className="receipt-divider" />

          {/* Settlement transactions */}
          <div>
            <p className="text-slice-muted text-xs font-receipt uppercase tracking-widest mb-3">Transfer yang perlu dilakukan</p>
            {!payer ? (
              <p className="text-slice-muted text-sm font-receipt text-center py-4">
                Pilih siapa yang bayar duluan dulu.
              </p>
            ) : settlements.length === 0 ? (
              <p className="text-slice-muted text-sm font-receipt text-center py-4">
                Ga ada yang perlu transfer! 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {settlements.map((s, i) => (
                  <div key={i} className="bg-slice-surface rounded-2xl p-4 border border-slice-border">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl">{s.from.avatar_emoji}</span>
                      <span className="font-medium text-sm">{s.from.name}</span>
                      <span className="text-slice-muted text-sm font-receipt">transfer ke</span>
                      <span className="text-xl">{payer.avatar_emoji}</span>
                      <span className="font-medium text-sm">{payer.name}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-display text-slice-orange text-xl">{formatMoney(s.amount, bill.currency)}</p>
                      <button
                        onClick={() => shareToWA(s.from, s.amount)}
                        className="flex items-center gap-1.5 bg-green-500 text-white rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-green-600 transition-all"
                      >
                        <span>📲</span> WA {s.from.name}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settle button */}
          <button
            onClick={handleSettle}
            disabled={isPending}
            className="w-full bg-slice-dark text-white rounded-xl py-3.5 font-display text-lg hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isPending ? 'Menyimpan...' : '✅ Tandai Lunas & Selesai'}
          </button>
        </div>
      </div>
    </div>
  )
}
