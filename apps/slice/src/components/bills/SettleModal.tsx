'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@portfolio/supabase'
import type { Bill, BillMember } from '@portfolio/supabase'

type MemberWithTotal = BillMember & { total: number }

function formatIDR(n: number) {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID')
}

// Compute minimal transactions to settle debts
function computeSettlement(members: MemberWithTotal[]) {
  const average = members.reduce((s, m) => s + m.total, 0) / members.length
  const balances = members.map(m => ({ ...m, balance: m.total - average }))

  const payers = balances.filter(m => m.balance < -0.01).sort((a, b) => a.balance - b.balance)
  const receivers = balances.filter(m => m.balance > 0.01).sort((a, b) => b.balance - a.balance)

  const transactions: { from: MemberWithTotal; to: MemberWithTotal; amount: number }[] = []
  let i = 0, j = 0
  const pay = [...payers], rec = [...receivers]

  while (i < pay.length && j < rec.length) {
    const amount = Math.min(-pay[i].balance, rec[j].balance)
    transactions.push({ from: pay[i], to: rec[j], amount })
    pay[i].balance += amount
    rec[j].balance -= amount
    if (Math.abs(pay[i].balance) < 0.01) i++
    if (Math.abs(rec[j].balance) < 0.01) j++
  }

  return transactions
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
  const settlements = computeSettlement(members)

  const handleSettle = async () => {
    startTransition(async () => {
      await supabase.from('bills').update({ is_settled: true }).eq('id', bill.id)
      router.push('/bills')
      onClose()
    })
  }

  const shareToWA = (from: MemberWithTotal, to: MemberWithTotal, amount: number) => {
    const text = encodeURIComponent(
      `Hei ${from.name}! Tagihan "${bill.title}" udah dihitung nih 🧾\n` +
      `Kamu perlu transfer ${formatIDR(amount)} ke ${to.name} ya!\n\n` +
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
          {/* Per person breakdown */}
          <div>
            <p className="text-slice-muted text-xs font-receipt uppercase tracking-widest mb-3">Rincian per orang</p>
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{m.avatar_emoji}</span>
                    <span className="text-sm font-medium">{m.name}</span>
                  </div>
                  <span className="font-receipt font-bold text-sm" style={{ color: m.color }}>
                    {formatIDR(m.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <hr className="receipt-divider" />

          {/* Settlement transactions */}
          <div>
            <p className="text-slice-muted text-xs font-receipt uppercase tracking-widest mb-3">Transfer yang perlu dilakukan</p>
            {settlements.length === 0 ? (
              <p className="text-slice-muted text-sm font-receipt text-center py-4">
                Semua bayar sama rata! 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {settlements.map((s, i) => (
                  <div key={i} className="bg-slice-surface rounded-2xl p-4 border border-slice-border">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl">{s.from.avatar_emoji}</span>
                      <span className="font-medium text-sm">{s.from.name}</span>
                      <span className="text-slice-muted text-sm font-receipt">transfer ke</span>
                      <span className="text-xl">{s.to.avatar_emoji}</span>
                      <span className="font-medium text-sm">{s.to.name}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-display text-slice-orange text-xl">{formatIDR(s.amount)}</p>
                      <button
                        onClick={() => shareToWA(s.from, s.to, s.amount)}
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
