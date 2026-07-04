'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@portfolio/supabase'
import type { Category, Budget } from '@portfolio/supabase'
import { formatIDR } from '../../lib/money'
import { useLocale } from '../LocaleProvider'

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const over = pct > 100
  return (
    <div className="h-2 bg-vault-border rounded-full overflow-hidden mt-2">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${Math.min(pct, 100)}%`,
          backgroundColor: over ? '#E03E3E' : color,
        }}
      />
    </div>
  )
}

export default function BudgetManager({
  categories, budgets, transactions, month, year,
}: {
  categories: Category[]
  budgets: Budget[]
  transactions: { amount: number; type: string; category_id: string | null }[]
  month: number
  year: number
}) {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLocale()
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState<string | null>(null)
  const [inputVal, setInputVal] = useState('')

  const getBudget = (catId: string) => budgets.find(b => b.category_id === catId)
  const getSpent = (catId: string) =>
    transactions.filter(tx => tx.category_id === catId).reduce((s, tx) => s + tx.amount, 0)

  const handleSave = async (catId: string) => {
    const amount = parseFloat(inputVal.replace(/[^0-9]/g, ''))
    if (!amount || amount <= 0) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const existing = getBudget(catId)
    startTransition(async () => {
      if (existing) {
        await supabase.from('budgets').update({ amount }).eq('id', existing.id)
      } else {
        await supabase.from('budgets').insert({ user_id: session.user.id, category_id: catId, amount, month, year })
      }
      setEditing(null)
      setInputVal('')
      router.refresh()
    })
  }

  const handleDelete = (budgetId: string) => {
    startTransition(async () => {
      await supabase.from('budgets').delete().eq('id', budgetId)
      router.refresh()
    })
  }

  const expenseCategories = categories.filter(c => !['Gaji', 'Freelance'].some(n => c.name.includes(n)))
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = transactions.reduce((s, tx) => s + tx.amount, 0)

  return (
    <div className="space-y-4">
      {/* Total overview */}
      <div className="bg-vault-card border border-vault-border rounded-2xl p-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-vault-text-dim text-xs font-mono uppercase tracking-widest">{t('budgetTotalThisMonth')}</p>
            <p className="font-mono text-2xl text-vault-gold font-semibold mt-1">{formatIDR(totalBudget)}</p>
          </div>
          <div className="text-right">
            <p className="text-vault-text-dim text-xs font-mono">{t('budgetUsed')}</p>
            <p className={`font-mono text-lg font-semibold ${totalSpent > totalBudget ? 'text-vault-red' : 'text-vault-text'}`}>
              {formatIDR(totalSpent)}
            </p>
          </div>
        </div>
        <ProgressBar
          pct={totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}
          color="#C9A84C"
        />
        <p className="text-vault-text-dim text-xs font-mono mt-1.5 text-right">
          {t('budgetRemaining')}: {formatIDR(Math.max(0, totalBudget - totalSpent))}
        </p>
      </div>

      {/* Per category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {expenseCategories.map(cat => {
          const budget = getBudget(cat.id)
          const spent = getSpent(cat.id)
          const pct = budget ? Math.round((spent / budget.amount) * 100) : 0
          const isEditing = editing === cat.id

          return (
            <div key={cat.id} className="bg-vault-card border border-vault-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: `${cat.color}20` }}>
                    {cat.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-vault-text">{cat.name}</p>
                    <p className="text-xs text-vault-text-dim font-mono">
                      {budget ? `${formatIDR(spent)} / ${formatIDR(budget.amount)}` : t('budgetNotSet')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {budget && (
                    <button onClick={() => handleDelete(budget.id)}
                      className="text-vault-muted hover:text-vault-red text-xs px-1.5 py-1 rounded transition-colors">✕</button>
                  )}
                  <button
                    onClick={() => {
                      setEditing(cat.id)
                      setInputVal(budget ? String(budget.amount) : '')
                    }}
                    className="text-vault-text-dim hover:text-vault-gold text-xs font-mono px-2 py-1 rounded border border-vault-border hover:border-vault-gold/30 transition-all"
                  >
                    {budget ? t('budgetEdit') : t('budgetSetBtn')}
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder={t('budgetAmountPlaceholder')}
                    autoFocus
                    className="flex-1 bg-vault-surface border border-vault-border rounded-lg px-3 py-2 text-sm font-mono text-vault-text placeholder-vault-muted focus:outline-none focus:border-vault-gold/50"
                  />
                  <button onClick={() => handleSave(cat.id)} disabled={isPending}
                    className="bg-vault-gold text-vault-bg rounded-lg px-3 py-2 text-xs font-mono font-semibold hover:bg-vault-gold-light transition-all disabled:opacity-50">
                    {isPending ? '...' : t('ok')}
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="text-vault-text-dim hover:text-vault-text px-2 text-xs font-mono">✕</button>
                </div>
              )}

              {budget && !isEditing && (
                <>
                  <ProgressBar pct={pct} color={cat.color} />
                  <div className="flex justify-between items-center mt-1">
                    <p className={`text-xs font-mono ${pct > 100 ? 'text-vault-red' : 'text-vault-text-dim'}`}>{pct}%</p>
                    {pct > 80 && (
                      <p className={`text-xs font-mono ${pct > 100 ? 'text-vault-red' : 'text-amber-400'}`}>
                        {pct > 100 ? t('budgetOver') : t('budgetAlmostOut')}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
