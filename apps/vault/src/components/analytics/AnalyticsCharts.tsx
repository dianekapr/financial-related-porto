'use client'
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import type { Transaction } from '@portfolio/supabase'
import { formatIDR } from '../../lib/money'

function formatShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`
  return String(n)
}

export default function AnalyticsCharts({ transactions }: { transactions: Transaction[] }) {
  const now = new Date()

  // Category breakdown (expenses only, current month)
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const currentExpenses = transactions.filter(t => {
    const d = new Date(t.date)
    return t.type === 'expense' && d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear
  })

  const categoryMap: Record<string, { amount: number; icon: string; color: string }> = {}
  for (const tx of currentExpenses) {
    const key = tx.category?.name ?? 'Lainnya'
    if (!categoryMap[key]) categoryMap[key] = { amount: 0, icon: tx.category?.icon ?? '📌', color: tx.category?.color ?? '#888' }
    categoryMap[key].amount += tx.amount
  }
  const pieData = Object.entries(categoryMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.amount - a.amount)

  // Monthly trend (last 6 months)
  const trendData = Array.from({ length: 6 }, (_, i) => {
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

  // Top spending categories (all time)
  const allCatMap: Record<string, { amount: number; icon: string; color: string }> = {}
  for (const tx of transactions.filter(t => t.type === 'expense')) {
    const key = tx.category?.name ?? 'Lainnya'
    if (!allCatMap[key]) allCatMap[key] = { amount: 0, icon: tx.category?.icon ?? '📌', color: tx.category?.color ?? '#888' }
    allCatMap[key].amount += tx.amount
  }
  const topCats = Object.entries(allCatMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  const totalExpense = currentExpenses.reduce((s, t) => s + t.amount, 0)

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
      {/* Top row: Pie + Top categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut chart */}
        <div className="bg-vault-card border border-vault-border rounded-2xl p-5">
          <p className="font-display text-vault-gold tracking-widest text-lg mb-1">KATEGORI BULAN INI</p>
          <p className="text-vault-text-dim text-xs font-mono mb-4">
            Total pengeluaran: {formatIDR(totalExpense)}
          </p>
          {pieData.length === 0 ? (
            <p className="text-vault-text-dim text-sm font-mono text-center py-8">Belum ada pengeluaran</p>
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
                <span className="text-xs text-vault-text font-mono font-semibold">{formatIDR(d.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top spending */}
        <div className="bg-vault-card border border-vault-border rounded-2xl p-5">
          <p className="font-display text-vault-gold tracking-widest text-lg mb-4">TOP PENGELUARAN</p>
          {topCats.length === 0 ? (
            <p className="text-vault-text-dim text-sm font-mono text-center py-8">Belum ada data</p>
          ) : (
            <div className="space-y-4">
              {topCats.map((cat, i) => {
                const maxAmount = topCats[0].amount
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
        <p className="font-display text-vault-gold tracking-widest text-lg mb-6">TREN 6 BULAN</p>
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
            <Line type="monotone" dataKey="income" name="Masuk" stroke="#C9A84C" strokeWidth={2} dot={{ fill: '#C9A84C', r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="expense" name="Keluar" stroke="#E03E3E" strokeWidth={2} dot={{ fill: '#E03E3E', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
