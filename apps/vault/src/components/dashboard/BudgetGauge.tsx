'use client'
import type { Budget, Transaction } from '@portfolio/supabase'
import { formatIDR } from '../../lib/money'
import { useLocale } from '../LocaleProvider'
import { translateCategoryName } from '../../lib/i18n'
import { CategoryIcon } from '../../lib/categoryIcons'

function CircleGauge({ pct, color }: { pct: number; color: string }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const over = pct > 100

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="flex-shrink-0">
      <circle cx="26" cy="26" r={r} fill="none" stroke="var(--vault-border)" strokeWidth="4" />
      <circle
        cx="26" cy="26" r={r} fill="none"
        stroke={over ? 'var(--vault-danger)' : color}
        strokeWidth="4"
        strokeDasharray={`${Math.min(dash, circ)} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
        className="transition-all duration-700"
      />
      <text
        x="26" y="30"
        textAnchor="middle"
        fontSize="9"
        fontFamily="monospace"
        fill={over ? 'var(--vault-danger)' : 'var(--vault-text)'}
      >
        {Math.min(pct, 999)}%
      </text>
    </svg>
  )
}

export default function BudgetGauge({ budgets, transactions }: { budgets: Budget[]; transactions: Transaction[] }) {
  const { t, locale } = useLocale()

  if (budgets.length === 0) {
    return (
      <div className="bg-vault-card rounded-2xl border border-vault-border p-5 h-full flex flex-col">
        <p className="font-display text-vault-accent tracking-widest text-lg mb-4">{t('budgetGaugeTitle')}</p>
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-vault-text-dim text-sm font-mono">{t('budgetGaugeEmpty1')}<br />{t('budgetGaugeEmpty2')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-vault-card rounded-2xl border border-vault-border p-5 space-y-3">
      <p className="font-display text-vault-accent tracking-widest text-lg">{t('budgetGaugeTitle')}</p>

      {budgets.map((b) => {
        const spent = transactions
          .filter(tx => tx.type === 'expense' && tx.category_id === b.category_id)
          .reduce((s, tx) => s + tx.amount, 0)
        const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0
        const over = pct > 100

        return (
          <div key={b.id} className="flex items-center gap-3">
            <CircleGauge pct={pct} color={b.category?.color ?? 'var(--vault-accent)'} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <CategoryIcon icon={b.category?.icon} className="w-4 h-4" style={{ color: b.category?.color }} />
                <p className="text-sm font-medium text-vault-text truncate">{b.category?.name ? translateCategoryName(b.category.name, locale) : ''}</p>
              </div>
              <p className={`text-xs font-mono mt-0.5 ${over ? 'text-vault-danger' : 'text-vault-text-dim'}`}>
                {formatIDR(spent)} / {formatIDR(b.amount)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
