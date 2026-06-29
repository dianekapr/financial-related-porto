'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Transaction } from '@portfolio/supabase'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import AddTransactionModal from '@/components/AddTransactionModal'
import { createClient } from '@portfolio/supabase'

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

function formatIDR(n: number) {
  return n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
}

// Group transactions by date
function groupByDate(txs: Transaction[]) {
  const groups: Record<string, Transaction[]> = {}
  for (const tx of txs) {
    if (!groups[tx.date]) groups[tx.date] = []
    groups[tx.date].push(tx)
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

export default function TransactionList({
  transactions, month, year, type, income, expense,
}: {
  transactions: Transaction[]
  month: number
  year: number
  type: string
  income: number
  expense: number
}) {
  const router = useRouter()
  const supabase = createClient()
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const setFilter = (key: string, val: string) => {
    const params = new URLSearchParams({ month: String(month), year: String(year), type })
    params.set(key, val)
    router.push(`/dashboard/transactions?${params}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus transaksi ini?')) return
    setDeleting(id)
    await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
    startTransition(() => { router.refresh() })
    setDeleting(null)
  }

  const grouped = groupByDate(transactions)

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Month selector */}
        <div className="flex items-center gap-1 bg-vault-card border border-vault-border rounded-xl p-1">
          <button onClick={() => setFilter('month', String(month === 1 ? 12 : month - 1))}
            className="w-7 h-7 flex items-center justify-center text-vault-text-dim hover:text-vault-text rounded-lg transition-colors">‹</button>
          <span className="font-mono text-sm text-vault-text px-1 min-w-[60px] text-center">
            {MONTHS[month - 1]} {year}
          </span>
          <button onClick={() => setFilter('month', String(month === 12 ? 1 : month + 1))}
            className="w-7 h-7 flex items-center justify-center text-vault-text-dim hover:text-vault-text rounded-lg transition-colors">›</button>
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1 bg-vault-card border border-vault-border rounded-xl p-1">
          {(['all', 'income', 'expense'] as const).map(t => (
            <button key={t} onClick={() => setFilter('type', t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                type === t
                  ? t === 'income' ? 'bg-vault-gold text-vault-bg font-semibold'
                    : t === 'expense' ? 'bg-vault-red text-white font-semibold'
                    : 'bg-vault-gold/20 text-vault-gold font-semibold'
                  : 'text-vault-text-dim hover:text-vault-text'
              }`}>
              {t === 'all' ? 'Semua' : t === 'income' ? '↑ Masuk' : '↓ Keluar'}
            </button>
          ))}
        </div>

        <button onClick={() => setShowAdd(true)}
          className="ml-auto flex items-center gap-1.5 bg-vault-gold/10 hover:bg-vault-gold/20 text-vault-gold border border-vault-gold/30 rounded-xl px-4 py-2 text-sm font-mono transition-all active:scale-95">
          + Tambah
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Masuk', val: formatIDR(income), color: 'text-vault-gold' },
          { label: 'Keluar', val: formatIDR(expense), color: 'text-vault-red' },
          { label: 'Saldo', val: formatIDR(income - expense), color: income - expense >= 0 ? 'text-green-400' : 'text-vault-red' },
        ].map(s => (
          <div key={s.label} className="bg-vault-card border border-vault-border rounded-xl p-3">
            <p className="text-vault-text-dim text-[10px] font-mono uppercase tracking-widest">{s.label}</p>
            <p className={`font-mono text-sm font-semibold mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Grouped list */}
      {grouped.length === 0 ? (
        <div className="bg-vault-card border border-vault-border rounded-2xl p-12 text-center">
          <p className="text-vault-text-dim font-mono">Tidak ada transaksi</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, txs]) => (
            <div key={date}>
              <p className="text-vault-text-dim text-xs font-mono uppercase tracking-widest mb-2 px-1">
                {format(new Date(date + 'T00:00:00'), 'EEEE, d MMMM yyyy', { locale: localeId })}
              </p>
              <div className="bg-vault-card border border-vault-border rounded-2xl divide-y divide-vault-border overflow-hidden">
                {txs.map(tx => (
                  <div key={tx.id} className="flex items-center gap-4 px-4 py-3.5 group hover:bg-vault-surface/50 transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: `${tx.category?.color ?? '#C9A84C'}20` }}>
                      {tx.category?.icon ?? (tx.type === 'income' ? '💰' : '💸')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-vault-text truncate">{tx.note ?? tx.category?.name ?? 'Transaksi'}</p>
                      {tx.category && <p className="text-xs text-vault-text-dim font-mono mt-0.5">{tx.category.name}</p>}
                    </div>
                    <p className={`font-mono text-sm font-semibold flex-shrink-0 ${tx.type === 'income' ? 'text-vault-gold' : 'text-vault-red'}`}>
                      {tx.type === 'income' ? '+' : '−'}{formatIDR(tx.amount)}
                    </p>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      disabled={deleting === tx.id}
                      className="opacity-0 group-hover:opacity-100 text-vault-muted hover:text-vault-red transition-all text-xs font-mono px-2 py-1 rounded"
                    >
                      {deleting === tx.id ? '...' : '✕'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
