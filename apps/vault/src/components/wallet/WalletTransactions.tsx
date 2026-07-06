'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Transaction } from '@portfolio/supabase'
import { format } from 'date-fns'
import AddTransactionModal from '@/components/AddTransactionModal'
import TransactionRow from '../transactions/TransactionRow'
import { useLocale } from '../LocaleProvider'
import { getDateLocale } from '../../lib/dateLocale'
import { translateCategoryName } from '../../lib/i18n'
import { Search } from 'lucide-react'

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
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [search, setSearch] = useState('')
  const [, startTransition] = useTransition()

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDeleteTx'))) return
    setDeleting(id)
    await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
    startTransition(() => { router.refresh() })
    setDeleting(null)
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-vault-card border border-vault-border rounded-2xl p-12 text-center">
        <p className="text-vault-text-dim font-mono">{t('walletEmptyTransactions')}</p>
      </div>
    )
  }

  const searchedTransactions = transactions.filter(tx => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    const catName = tx.category ? translateCategoryName(tx.category.name, locale).toLowerCase() : ''
    return (tx.note?.toLowerCase().includes(q) ?? false) || catName.includes(q)
  })
  const grouped = groupByDate(searchedTransactions)

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-dim" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('searchTxPlaceholder')}
          className="w-full bg-vault-card border border-vault-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-vault-text placeholder-vault-muted focus:outline-none focus:border-vault-accent/50 transition-colors"
        />
      </div>

      {grouped.length === 0 && (
        <div className="bg-vault-card border border-vault-border rounded-2xl p-12 text-center">
          <p className="text-vault-text-dim font-mono">{t('noSearchResults')}</p>
        </div>
      )}

      {grouped.map(([date, txs]) => (
        <div key={date}>
          <p className="text-vault-text-dim text-xs font-mono uppercase tracking-widest mb-2 px-1">
            {format(new Date(date + 'T00:00:00'), 'EEEE, d MMMM yyyy', { locale: getDateLocale(locale) })}
          </p>
          <div className="bg-vault-card border border-vault-border rounded-2xl divide-y divide-vault-border overflow-hidden">
            {txs.map(tx => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                subtitle={tx.category ? translateCategoryName(tx.category.name, locale) : undefined}
                onEdit={setEditingTx}
                onDelete={handleDelete}
                deleting={deleting === tx.id}
              />
            ))}
          </div>
        </div>
      ))}
      {editingTx && <AddTransactionModal transaction={editingTx} onClose={() => setEditingTx(null)} />}
    </div>
  )
}
