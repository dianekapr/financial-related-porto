'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Transaction } from '@portfolio/supabase'
import { format } from 'date-fns'
import AddTransactionModal from '@/components/AddTransactionModal'
import TransactionRow from './TransactionRow'
import { createClient } from '@portfolio/supabase'
import { formatIDR } from '../../lib/money'
import { useLocale } from '../LocaleProvider'
import { getDateLocale } from '../../lib/dateLocale'
import { translateCategoryName } from '../../lib/i18n'
import { ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react'

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
  transactions, month, year, type, income, expense, walletBalance,
}: {
  transactions: Transaction[]
  month: number
  year: number
  type: string
  income: number
  expense: number
  walletBalance: number
}) {
  const router = useRouter()
  const supabase = createClient()
  const { t, locale } = useLocale()
  const [showAdd, setShowAdd] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const setFilter = (key: string, val: string) => {
    const params = new URLSearchParams({ month: String(month), year: String(year), type })
    params.set(key, val)
    router.push(`/dashboard/transactions?${params}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDeleteTx'))) return
    setDeleting(id)
    await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
    startTransition(() => { router.refresh() })
    setDeleting(null)
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
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Month selector */}
        <div className="flex items-center gap-1 bg-vault-card border border-vault-border rounded-xl p-1">
          <button onClick={() => setFilter('month', String(month === 1 ? 12 : month - 1))}
            className="w-7 h-7 flex items-center justify-center text-vault-text-dim hover:text-vault-text rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <span className="font-mono text-sm text-vault-text px-1 min-w-[60px] text-center">
            {format(new Date(year, month - 1), 'MMM', { locale: getDateLocale(locale) })} {year}
          </span>
          <button onClick={() => setFilter('month', String(month === 12 ? 1 : month + 1))}
            className="w-7 h-7 flex items-center justify-center text-vault-text-dim hover:text-vault-text rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1 bg-vault-card border border-vault-border rounded-xl p-1">
          {(['all', 'income', 'expense'] as const).map(filterType => (
            <button key={filterType} onClick={() => setFilter('type', filterType)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                type === filterType
                  ? filterType === 'income' ? 'bg-vault-accent text-vault-accent-contrast font-semibold'
                    : filterType === 'expense' ? 'bg-vault-danger text-white font-semibold'
                    : 'bg-vault-accent/20 text-vault-accent font-semibold'
                  : 'text-vault-text-dim hover:text-vault-text'
              }`}>
              {filterType === 'income' && <ArrowUpCircle className="w-3.5 h-3.5" />}
              {filterType === 'expense' && <ArrowDownCircle className="w-3.5 h-3.5" />}
              {filterType === 'all' ? t('all') : filterType === 'income' ? t('incomeToggle') : t('expenseToggle')}
            </button>
          ))}
        </div>

        <button onClick={() => setShowAdd(true)}
          className="ml-auto flex items-center gap-1.5 bg-vault-accent/10 hover:bg-vault-accent/20 text-vault-accent border border-vault-accent/30 rounded-xl px-4 py-2 text-sm font-mono transition-all active:scale-95">
          {t('tickerAdd')}
        </button>
      </div>

      {/* Search */}
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

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('in'), val: formatIDR(income), color: 'text-vault-accent' },
          { label: t('out'), val: formatIDR(expense), color: 'text-vault-danger' },
          { label: t('balance'), val: formatIDR(walletBalance), color: walletBalance >= 0 ? 'text-vault-success' : 'text-vault-danger' },
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
          <p className="text-vault-text-dim font-mono">{search.trim() ? t('noSearchResults') : t('noTransactions')}</p>
        </div>
      ) : (
        <div className="space-y-4">
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
        </div>
      )}

      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} />}
      {editingTx && <AddTransactionModal transaction={editingTx} onClose={() => setEditingTx(null)} />}
    </div>
  )
}
