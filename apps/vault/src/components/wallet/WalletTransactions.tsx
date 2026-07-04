'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Transaction } from '@portfolio/supabase'
import { format } from 'date-fns'
import { formatIDR } from '../../lib/money'
import { useLocale } from '../LocaleProvider'
import { getDateLocale } from '../../lib/dateLocale'

function groupByDate(txs: Transaction[]) {
  const groups: Record<string, Transaction[]> = {}
  for (const tx of txs) {
    if (!groups[tx.date]) groups[tx.date] = []
    groups[tx.date].push(tx)
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

export default function WalletTransactions({ transactions }: { transactions: Transaction[] }) {
  const router = useRouter()
  const { t, locale } = useLocale()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDeleteTx'))) return
    setDeleting(id)
    await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
    startTransition(() => { router.refresh() })
    setDeleting(null)
  }

  const grouped = groupByDate(transactions)

  if (grouped.length === 0) {
    return (
      <div className="bg-vault-card border border-vault-border rounded-2xl p-12 text-center">
        <p className="text-vault-text-dim font-mono">{t('walletEmptyTransactions')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {grouped.map(([date, txs]) => (
        <div key={date}>
          <p className="text-vault-text-dim text-xs font-mono uppercase tracking-widest mb-2 px-1">
            {format(new Date(date + 'T00:00:00'), 'EEEE, d MMMM yyyy', { locale: getDateLocale(locale) })}
          </p>
          <div className="bg-vault-card border border-vault-border rounded-2xl divide-y divide-vault-border overflow-hidden">
            {txs.map(tx => (
              <div key={tx.id} className="flex items-center gap-4 px-4 py-3.5 group hover:bg-vault-surface/50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: `${tx.category?.color ?? '#C9A84C'}20` }}>
                  {tx.category?.icon ?? (tx.type === 'income' ? '↑' : '↓')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-vault-text truncate">{tx.note ?? tx.category?.name ?? t('fallbackTxName')}</p>
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
  )
}
