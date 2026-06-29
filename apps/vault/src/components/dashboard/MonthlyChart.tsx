'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Tx { amount: number; type: string; date: string }

function buildChartData(transactions: Tx[]) {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i)
    const start = startOfMonth(d)
    const end = endOfMonth(d)
    const txs = transactions.filter(t => {
      const td = new Date(t.date)
      return td >= start && td <= end
    })
    return {
      name: format(d, 'MMM', { locale: localeId }),
      income: txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  })
}

function formatShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`
  return `${n}`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-vault-surface border border-vault-border rounded-xl p-3 shadow-xl text-xs font-mono">
      <p className="text-vault-text-dim mb-2 uppercase tracking-widest">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }} className="flex justify-between gap-4">
          <span>{p.name === 'income' ? '↑ Masuk' : '↓ Keluar'}</span>
          <span>{p.value.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}</span>
        </p>
      ))}
    </div>
  )
}

export default function MonthlyChart({ transactions }: { transactions: Tx[] }) {
  const data = buildChartData(transactions)
  const currentMonth = format(new Date(), 'MMM', { locale: localeId })

  return (
    <div className="bg-vault-card rounded-2xl border border-vault-border p-5">
      <div className="flex items-center justify-between mb-6">
        <p className="font-display text-vault-gold tracking-widest text-lg">6 BULAN TERAKHIR</p>
        <div className="flex items-center gap-4 text-xs font-mono text-vault-text-dim">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-vault-gold inline-block" />Masuk</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-vault-red inline-block" />Keluar</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barGap={4} barCategoryGap="30%">
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#555', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={formatShort}
            tick={{ fill: '#555', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="income" name="income" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.name === currentMonth ? '#C9A84C' : '#C9A84C44'} />
            ))}
          </Bar>
          <Bar dataKey="expense" name="expense" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.name === currentMonth ? '#E03E3E' : '#E03E3E44'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
