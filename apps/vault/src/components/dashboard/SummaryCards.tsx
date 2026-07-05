'use client'
import { formatIDR } from '../../lib/money'
import { useLocale } from '../LocaleProvider'

interface Props {
  income: number
  expense: number
  txCount: number
}

export default function SummaryCards({ income, expense, txCount }: Props) {
  const { t } = useLocale()
  const savingRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0

  const cards = [
    {
      label: t('summaryTotalIncome'),
      value: formatIDR(income),
      icon: '↑',
      color: 'text-vault-accent',
      bg: 'bg-vault-accent/5 border-vault-accent/20',
      indicator: 'bg-vault-accent',
    },
    {
      label: t('summaryTotalExpense'),
      value: formatIDR(expense),
      icon: '↓',
      color: 'text-vault-danger',
      bg: 'bg-vault-danger/5 border-vault-danger/20',
      indicator: 'bg-vault-danger',
    },
    {
      label: t('summarySavingRate'),
      value: `${savingRate}%`,
      icon: '◉',
      color: savingRate > 0 ? 'text-vault-success' : 'text-vault-danger',
      bg: 'bg-vault-card border-vault-border',
      indicator: savingRate > 0 ? 'bg-vault-success' : 'bg-vault-danger',
    },
    {
      label: t('summaryTransactions'),
      value: `${txCount}×`,
      icon: '≡',
      color: 'text-vault-text-dim',
      bg: 'bg-vault-card border-vault-border',
      indicator: 'bg-vault-muted',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`relative rounded-2xl border p-4 overflow-hidden animate-fade-up ${card.bg}`}
          style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
        >
          {/* Indicator dot */}
          <span className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${card.indicator}`} />

          <p className="text-vault-text-dim text-xs font-mono uppercase tracking-widest mb-2">{card.label}</p>
          <div className="flex items-end gap-2">
            <span className={`text-lg font-mono opacity-40 ${card.color}`}>{card.icon}</span>
            <span className={`font-mono text-lg md:text-xl font-semibold ${card.color} animate-number`}>
              {card.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
