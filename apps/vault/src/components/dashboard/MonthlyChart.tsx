'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { formatIDR } from '../../lib/money'
import { useLocale } from '../LocaleProvider'
import { getDateLocale } from '../../lib/dateLocale'
import type { Locale } from '../../lib/i18n'

interface Tx { amount: number; type: string; date: string }

function buildChartData(transactions: Tx[], locale: Locale) {
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
      name: format(d, 'MMM', { locale: getDateLocale(locale) }),
      income: txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  })
}

function makeFormatShort(million: string, thousand: string) {
  return (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}${million}`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}${thousand}`
    return `${n}`
  }
}

function CustomTooltip({ active, payload, label, inLabel, outLabel }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-vault-surface border border-vault-border rounded-xl p-3 shadow-xl text-xs font-mono">
      <p className="text-vault-text-dim mb-2 uppercase tracking-widest">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }} className="flex justify-between gap-4">
          <span>{p.name === 'income' ? `↑ ${inLabel}` : `↓ ${outLabel}`}</span>
          <span>{formatIDR(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function MonthlyChart({ transactions }: { transactions: Tx[] }) {
  const { t, locale } = useLocale()
  const data = buildChartData(transactions, locale)
  const currentMonth = format(new Date(), 'MMM', { locale: getDateLocale(locale) })
  const formatShort = makeFormatShort(t('million'), t('thousand'))

  return (
    <div className="bg-vault-card rounded-2xl border border-vault-border p-5">
      <div className="flex items-center justify-between mb-6">
        <p className="font-display text-vault-gold tracking-widest text-lg">{t('monthlyChartTitle')}</p>
        <div className="flex items-center gap-4 text-xs font-mono text-vault-text-dim">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-vault-gold inline-block" />{t('in')}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-vault-red inline-block" />{t('out')}</span>
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
          <Tooltip content={<CustomTooltip inLabel={t('in')} outLabel={t('out')} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
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
