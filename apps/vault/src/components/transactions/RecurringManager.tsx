'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { RecurringTransaction } from '@portfolio/supabase'
import { format } from 'date-fns'
import AddRecurringModal from './AddRecurringModal'
import { formatIDR } from '../../lib/money'
import { useLocale } from '../LocaleProvider'
import { getDateLocale } from '../../lib/dateLocale'
import { translateCategoryName } from '../../lib/i18n'
import { CategoryIcon } from '../../lib/categoryIcons'
import { Repeat, Pause, Play, Info, X } from 'lucide-react'

const FREQUENCY_KEY = {
  daily: 'recurringFrequencyDaily',
  weekly: 'recurringFrequencyWeekly',
  monthly: 'recurringFrequencyMonthly',
} as const

export default function RecurringManager({ rules }: { rules: RecurringTransaction[] }) {
  const router = useRouter()
  const { t, locale } = useLocale()
  const [showAdd, setShowAdd] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const handleToggle = async (rule: RecurringTransaction) => {
    setBusyId(rule.id)
    await fetch('/api/recurring', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rule.id, is_active: !rule.is_active }),
    })
    startTransition(() => { router.refresh() })
    setBusyId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDeleteRecurring'))) return
    setBusyId(id)
    await fetch(`/api/recurring?id=${id}`, { method: 'DELETE' })
    startTransition(() => { router.refresh() })
    setBusyId(null)
  }

  return (
    <div className="bg-vault-card border border-vault-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-display text-vault-accent tracking-widest text-sm flex items-center gap-2">
          <Repeat className="w-4 h-4" />
          {t('recurringTitle')}
        </p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-vault-accent/10 hover:bg-vault-accent/20 text-vault-accent border border-vault-accent/30 rounded-lg px-3 py-1.5 text-xs font-mono transition-all active:scale-95"
        >
          {t('recurringAddBtn')}
        </button>
      </div>

      <div className="flex items-start gap-2 bg-vault-surface border border-vault-border rounded-xl px-3 py-2.5 mb-3">
        <Info className="w-3.5 h-3.5 text-vault-text-dim flex-shrink-0 mt-0.5" />
        <p className="text-vault-text-dim text-xs font-mono leading-relaxed">{t('recurringNotice')}</p>
      </div>

      {rules.length === 0 ? (
        <p className="text-vault-text-dim text-sm font-mono py-2">{t('recurringEmpty')}</p>
      ) : (
        <div className="divide-y divide-vault-border">
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center gap-3 py-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: rule.category?.color ? `${rule.category.color}20` : 'color-mix(in srgb, var(--vault-accent) 20%, transparent)' }}>
                <CategoryIcon icon={rule.category?.icon} className="w-4 h-4" style={{ color: rule.category?.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-vault-text truncate">
                  {rule.note ?? (rule.category ? translateCategoryName(rule.category.name, locale) : t('fallbackTxName'))}
                </p>
                <p className="text-xs text-vault-text-dim font-mono mt-0.5">
                  {t(FREQUENCY_KEY[rule.frequency])} · {t('recurringNextRun')} {format(new Date(`${rule.next_run_date}T00:00:00`), 'd MMM yyyy', { locale: getDateLocale(locale) })}
                  {!rule.is_active && ` · ${t('recurringPaused')}`}
                </p>
              </div>
              <p className={`font-mono text-sm font-semibold flex-shrink-0 ${rule.is_active ? (rule.type === 'income' ? 'text-vault-accent' : 'text-vault-danger') : 'text-vault-muted'}`}>
                {rule.type === 'income' ? '+' : '−'}{formatIDR(rule.amount)}
              </p>
              <button
                onClick={() => handleToggle(rule)}
                disabled={busyId === rule.id}
                title={rule.is_active ? t('recurringPause') : t('recurringResume')}
                className="text-vault-muted hover:text-vault-accent transition-all px-1.5 py-1 rounded flex-shrink-0"
              >
                {rule.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => handleDelete(rule.id)}
                disabled={busyId === rule.id}
                className="text-vault-muted hover:text-vault-danger transition-all px-1.5 py-1 rounded flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddRecurringModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
