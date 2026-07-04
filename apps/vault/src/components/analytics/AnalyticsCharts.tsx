'use client'
import { useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth, startOfYear } from 'date-fns'
import type { Transaction, Wallet } from '@portfolio/supabase'
import { formatIDR } from '../../lib/money'
import Select from '../ui/Select'
import { useLocale } from '../LocaleProvider'
import { getDateLocale } from '../../lib/dateLocale'

function rangeToDates(range: string, now: Date): { start: Date | null; end: Date | null } {
  switch (range) {
    case 'month': return { start: startOfMonth(now), end: endOfMonth(now) }
    case '3m': return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }
    case '6m': return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) }
    case 'year': return { start: startOfYear(now), end: endOfMonth(now) }
    default: return { start: null, end: null }
  }
}

export default function AnalyticsCharts({ transactions, wallets }: { transactions: Transaction[]; wallets: Wallet[] }) {
  const { t, locale } = useLocale()
  const now = new Date()

  const RANGES = [
    { value: 'month', label: t('analyticsRangeMonth') },
    { value: '3m', label: t('analyticsRange3m') },
    { value: '6m', label: t('analyticsRange6m') },
    { value: 'year', label: t('analyticsRangeYear') },
    { value: 'all', label: t('analyticsRangeAll') },
    { value: 'custom', label: t('analyticsRangeCustom') },
  ] as const

  function formatShort(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}${t('million')}`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}${t('thousand')}`
    return String(n)
  }

  const [walletFilter, setWalletFilter] = useState('all')
  const [range, setRange] = useState<typeof RANGES[number]['value']>('month')
  const [customStart, setCustomStart] = useState(format(startOfMonth(now), 'yyyy-MM-dd'))
  const [customEnd, setCustomEnd] = useState(format(now, 'yyyy-MM-dd'))

  const walletFiltered = useMemo(
    () => walletFilter === 'all' ? transactions : transactions.filter(tx => tx.wallet_id === walletFilter),
    [transactions, walletFilter]
  )

  const filtered = useMemo(() => {
    if (range === 'all') return walletFiltered
    const { start, end } = range === 'custom'
      ? { start: new Date(customStart), end: new Date(customEnd) }
      : rangeToDates(range, now)
    if (!start || !end) return walletFiltered
    return walletFiltered.filter(tx => {
      const d = new Date(tx.date)
      return d >= start && d <= end
    })
  }, [walletFiltered, range, customStart, customEnd])

  const expenses = filtered.filter(tx => tx.type === 'expense')

  const categoryMap: Record<string, { amount: number; icon: string; color: string }> = {}
  for (const tx of expenses) {
    const key = tx.category?.name ?? 'Lainnya'
    if (!categoryMap[key]) categoryMap[key] = { amount: 0, icon: tx.category?.icon ?? '📌', color: tx.category?.color ?? '#888' }
    categoryMap[key].amount += tx.amount
  }
  const pieData = Object.entries(categoryMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.amount - a.amount)

  const totalExpense = expenses.reduce((s, tx) => s + tx.amount, 0)

  // Monthly trend (last 6 months) — respects the wallet filter, but stays
  // on its own fixed window since it's inherently a month-over-month view
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i)
    const start = startOfMonth(d)
    const end = endOfMonth(d)
    const txs = walletFiltered.filter(tx => {
      const td = new Date(tx.date)
      return td >= start && td <= end
    })
    return {
      name: format(d, 'MMM', { locale: getDateLocale(locale) }),
      income: txs.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
      expense: txs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
    }
  })

  const rangeLabel = RANGES.find(r => r.value === range)?.label ?? ''
  const walletLabel = walletFilter === 'all' ? t('analyticsAllWallets') : wallets.find(w => w.id === walletFilter)?.name ?? ''

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-vault-surface border border-vault-border rounded-xl p-3 text-xs font-mono shadow-xl">
        <p className="text-vault-text font-semibold">{d.icon} {d.name}</p>
        <p className="text-vault-gold mt-1">{formatIDR(d.amount)}</p>
        <p className="text-vault-text-dim">{totalExpense > 0 ? Math.round((d.amount / totalExpense) * 100) : 0}%</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-vault-card border border-vault-border rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div>
          <label className="text-vault-text-dim text-[10px] font-mono uppercase tracking-widest block mb-1">{t('analyticsWallet')}</label>
          <Select
            value={walletFilter}
            onChange={setWalletFilter}
            options={[{ value: 'all', label: t('analyticsAllWallets') }, ...wallets.map(w => ({ value: w.id, label: w.name }))]}
          />
        </div>
        <div>
          <label className="text-vault-text-dim text-[10px] font-mono uppercase tracking-widest block mb-1">{t('analyticsTimeRange')}</label>
          <Select
            value={range}
            onChange={v => setRange(v as typeof range)}
            options={RANGES.map(r => ({ value: r.value, label: r.label }))}
          />
        </div>
        {range === 'custom' && (
          <div className="flex items-end gap-2">
            <div>
              <label className="text-vault-text-dim text-[10px] font-mono uppercase tracking-widest block mb-1">{t('analyticsFrom')}</label>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="bg-vault-surface border border-vault-border rounded-lg px-3 py-2 text-sm font-mono text-vault-text focus:outline-none focus:border-vault-gold/50"
              />
            </div>
            <div>
              <label className="text-vault-text-dim text-[10px] font-mono uppercase tracking-widest block mb-1">{t('analyticsTo')}</label>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="bg-vault-surface border border-vault-border rounded-lg px-3 py-2 text-sm font-mono text-vault-text focus:outline-none focus:border-vault-gold/50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Top row: Pie + Top categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut chart */}
        <div className="bg-vault-card border border-vault-border rounded-2xl p-5">
          <p className="font-display text-vault-gold tracking-widest text-lg mb-1">{t('analyticsCategory')}</p>
          <p className="text-vault-text-dim text-xs font-mono mb-4">
            {walletLabel} · {rangeLabel} · {t('analyticsTotal')}: {formatIDR(totalExpense)}
          </p>
          {pieData.length === 0 ? (
            <p className="text-vault-text-dim text-sm font-mono text-center py-8">{t('analyticsNoExpense')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="amount"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <RTooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {/* Legend */}
          <div className="space-y-1.5 mt-2">
            {pieData.slice(0, 5).map(d => (
              <div key={d.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-vault-text-dim font-mono">{d.icon} {d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-vault-text-dim font-mono">
                    {totalExpense > 0 ? Math.round((d.amount / totalExpense) * 100) : 0}%
                  </span>
                  <span className="text-xs text-vault-text font-mono font-semibold">{formatIDR(d.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top spending */}
        <div className="bg-vault-card border border-vault-border rounded-2xl p-5">
          <p className="font-display text-vault-gold tracking-widest text-lg mb-4">{t('analyticsTopSpending')}</p>
          {pieData.length === 0 ? (
            <p className="text-vault-text-dim text-sm font-mono text-center py-8">{t('analyticsNoData')}</p>
          ) : (
            <div className="space-y-4">
              {pieData.slice(0, 5).map((cat, i) => {
                const maxAmount = pieData[0].amount
                const pct = Math.round((cat.amount / maxAmount) * 100)
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-vault-text-dim font-mono text-xs w-4">#{i + 1}</span>
                        <span className="text-base">{cat.icon}</span>
                        <span className="text-sm text-vault-text font-medium">{cat.name}</span>
                      </div>
                      <span className="text-sm font-mono text-vault-text font-semibold">{formatIDR(cat.amount)}</span>
                    </div>
                    <div className="h-1.5 bg-vault-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Line chart trend */}
      <div className="bg-vault-card border border-vault-border rounded-2xl p-5">
        <p className="font-display text-vault-gold tracking-widest text-lg mb-1">{t('analyticsTrend')}</p>
        <p className="text-vault-text-dim text-xs font-mono mb-4">{walletLabel}</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#555', fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={formatShort} tick={{ fill: '#555', fontSize: 10, fontFamily: 'IBM Plex Mono' }} width={44} />
            <Tooltip
              contentStyle={{ background: '#111', border: '1px solid #2A2A2A', borderRadius: 12, fontFamily: 'IBM Plex Mono', fontSize: 12 }}
              labelStyle={{ color: '#888' }}
              formatter={(v: number) => formatIDR(v)}
            />
            <Line type="monotone" dataKey="income" name={t('in')} stroke="#C9A84C" strokeWidth={2} dot={{ fill: '#C9A84C', r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="expense" name={t('out')} stroke="#E03E3E" strokeWidth={2} dot={{ fill: '#E03E3E', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
