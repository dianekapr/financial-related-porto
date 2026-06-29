'use client'

interface Props {
  income: number
  expense: number
  txCount: number
}

function formatIDR(n: number) {
  return n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
}

export default function SummaryCards({ income, expense, txCount }: Props) {
  const savingRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0

  const cards = [
    {
      label: 'Total Pemasukan',
      value: formatIDR(income),
      icon: '↑',
      color: 'text-vault-gold',
      bg: 'bg-vault-gold/5 border-vault-gold/20',
      indicator: 'bg-vault-gold',
    },
    {
      label: 'Total Pengeluaran',
      value: formatIDR(expense),
      icon: '↓',
      color: 'text-vault-red',
      bg: 'bg-vault-red/5 border-vault-red/20',
      indicator: 'bg-vault-red',
    },
    {
      label: 'Saving Rate',
      value: `${savingRate}%`,
      icon: '◉',
      color: savingRate > 0 ? 'text-green-400' : 'text-vault-red',
      bg: 'bg-vault-card border-vault-border',
      indicator: savingRate > 0 ? 'bg-green-400' : 'bg-vault-red',
    },
    {
      label: 'Transaksi',
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
