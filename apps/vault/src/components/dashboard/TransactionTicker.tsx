'use client'
import { useState } from 'react'
import type { Transaction } from '@portfolio/supabase'
import { format } from 'date-fns'
import AddTransactionModal from '@/components/AddTransactionModal'
import Link from 'next/link'
import { formatIDR } from '../../lib/money'
import { useLocale } from '../LocaleProvider'
import { getDateLocale } from '../../lib/dateLocale'

export default function TransactionTicker({ transactions }: { transactions: Transaction[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const { t, locale } = useLocale()

  return (
    <div className="bg-vault-card rounded-2xl border border-vault-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-vault-border">
        <div className="flex items-center gap-3">
          <span className="font-display text-vault-gold tracking-widest text-lg">{t('tickerTitle')}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-vault-gold animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-vault-gold/10 hover:bg-vault-gold/20 text-vault-gold border border-vault-gold/30 rounded-lg px-3 py-1.5 text-sm font-mono transition-all active:scale-95"
          >
            {t('tickerAdd')}
          </button>
          <Link href="/dashboard/transactions" className="text-vault-text-dim hover:text-vault-text text-sm font-mono transition-colors">
            {t('tickerSeeAll')}
          </Link>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-vault-border max-h-80 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-vault-text-dim font-mono text-sm">{t('tickerEmpty')}</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-vault-gold text-sm underline underline-offset-2">
              {t('tickerAddFirst')}
            </button>
          </div>
        ) : (
          transactions.slice(0, 20).map((tx, i) => (
            <div
              key={tx.id}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-vault-surface/50 transition-colors animate-fade-up"
              style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'backwards' }}
            >
              {/* Category icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: `${tx.category?.color ?? '#C9A84C'}20` }}
              >
                {tx.category?.icon ?? (tx.type === 'income' ? '💰' : '💸')}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-vault-text truncate">{tx.note ?? tx.category?.name ?? t('fallbackTxName')}</p>
                <p className="text-xs text-vault-text-dim font-mono mt-0.5">
                  {format(new Date(tx.date), 'd MMM yyyy', { locale: getDateLocale(locale) })}
                  {tx.category && ` · ${tx.category.name}`}
                </p>
              </div>

              {/* Amount */}
              <p className={`font-mono text-sm font-semibold flex-shrink-0 ${tx.type === 'income' ? 'text-vault-gold' : 'text-vault-red'}`}>
                {tx.type === 'income' ? '+' : '−'}{formatIDR(tx.amount)}
              </p>
            </div>
          ))
        )}
      </div>

      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
