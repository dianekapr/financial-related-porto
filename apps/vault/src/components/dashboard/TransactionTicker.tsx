'use client'
import { useState } from 'react'
import type { Transaction } from '@portfolio/supabase'
import { format } from 'date-fns'
import AddTransactionModal from '@/components/AddTransactionModal'
import TransactionRow from '../transactions/TransactionRow'
import Link from 'next/link'
import { useLocale } from '../LocaleProvider'
import { getDateLocale } from '../../lib/dateLocale'
import { translateCategoryName } from '../../lib/i18n'
import { ChevronRight } from 'lucide-react'

export default function TransactionTicker({ transactions }: { transactions: Transaction[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const { t, locale } = useLocale()

  return (
    <div className="bg-vault-card rounded-2xl border border-vault-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-vault-border">
        <div className="flex items-center gap-3">
          <span className="font-display text-vault-accent tracking-widest text-lg">{t('tickerTitle')}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-vault-accent animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-vault-accent/10 hover:bg-vault-accent/20 text-vault-accent border border-vault-accent/30 rounded-lg px-3 py-1.5 text-sm font-mono transition-all active:scale-95"
          >
            {t('tickerAdd')}
          </button>
          <Link href="/dashboard/transactions" className="flex items-center gap-0.5 text-vault-text-dim hover:text-vault-text text-sm font-mono transition-colors">
            {t('tickerSeeAll')}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-vault-border max-h-80 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-vault-text-dim font-mono text-sm">{t('tickerEmpty')}</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-vault-accent text-sm underline underline-offset-2">
              {t('tickerAddFirst')}
            </button>
          </div>
        ) : (
          transactions.slice(0, 20).map((tx, i) => (
            <div key={tx.id} className="animate-fade-up" style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'backwards' }}>
              <TransactionRow
                tx={tx}
                subtitle={`${format(new Date(tx.date), 'd MMM yyyy', { locale: getDateLocale(locale) })}${tx.category ? ` · ${translateCategoryName(tx.category.name, locale)}` : ''}`}
              />
            </div>
          ))
        )}
      </div>

      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
