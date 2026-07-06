'use client'
import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@portfolio/supabase'
import type { Category, Wallet, RecurringFrequency } from '@portfolio/supabase'
import { useRouter } from 'next/navigation'
import { useLocale } from '../LocaleProvider'
import { translateCategoryName } from '../../lib/i18n'
import { CategoryIcon } from '../../lib/categoryIcons'
import Select from '../ui/Select'
import { ArrowUpCircle, ArrowDownCircle, Info } from 'lucide-react'

export default function AddRecurringModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const { t, locale } = useLocale()
  const [isPending, startTransition] = useTransition()

  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [walletId, setWalletId] = useState<string | null>(null)
  const [wallets, setWallets] = useState<Wallet[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const [{ data: cats }, { data: wals }] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', session.user.id),
        supabase.from('wallets').select('*').eq('user_id', session.user.id).order('created_at'),
      ])
      setCategories(cats ?? [])
      setWallets(wals ?? [])
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''))
    if (!numericAmount || numericAmount <= 0) return

    startTransition(async () => {
      await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          type,
          category_id: categoryId,
          wallet_id: walletId,
          note: note || null,
          frequency,
          next_run_date: startDate,
        }),
      })
      router.refresh()
      onClose()
    })
  }

  const filteredCats = categories.filter(c =>
    type === 'income'
      ? ['Gaji', 'Freelance', 'Lainnya'].some(n => c.name.includes(n))
      : !['Gaji', 'Freelance'].some(n => c.name.includes(n))
  )

  const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
    { value: 'daily', label: t('recurringFrequencyDaily') },
    { value: 'weekly', label: t('recurringFrequencyWeekly') },
    { value: 'monthly', label: t('recurringFrequencyMonthly') },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full md:max-w-md bg-vault-surface border border-vault-border rounded-t-3xl md:rounded-2xl shadow-2xl animate-fade-up">
        <div className="md:hidden w-10 h-1 bg-vault-border rounded-full mx-auto mt-3 mb-1" />

        <div className="p-6">
          <h2 className="font-display text-vault-accent tracking-widest text-2xl mb-6">{t('recurringModalTitle')}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type toggle */}
            <div className="flex rounded-xl overflow-hidden border border-vault-border">
              {(['expense', 'income'] as const).map((txType) => (
                <button
                  key={txType}
                  type="button"
                  onClick={() => { setType(txType); setCategoryId(null) }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-mono transition-all
                    ${type === txType
                      ? txType === 'income' ? 'bg-vault-accent text-vault-accent-contrast font-semibold' : 'bg-vault-danger text-white font-semibold'
                      : 'text-vault-text-dim hover:text-vault-text'
                    }`}
                >
                  {txType === 'income' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                  {txType === 'income' ? t('incomeToggle') : t('expenseToggle')}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div>
              <label className="text-vault-text-dim text-xs font-mono uppercase tracking-widest block mb-2">{t('addTxAmount')}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-vault-text-dim font-mono text-sm">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    setAmount(raw ? parseInt(raw).toLocaleString('id-ID') : '')
                  }}
                  placeholder="0"
                  required
                  className="w-full bg-vault-card border border-vault-border rounded-xl py-3 pl-12 pr-4 font-mono text-lg text-vault-text placeholder-vault-muted focus:outline-none focus:border-vault-accent/50 transition-colors"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-vault-text-dim text-xs font-mono uppercase tracking-widest block mb-2">{t('addTxCategory')}</label>
              <div className="flex flex-wrap gap-2">
                {filteredCats.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all
                      ${categoryId === cat.id
                        ? 'border-transparent text-vault-bg font-medium'
                        : 'border-vault-border text-vault-text-dim hover:border-vault-muted'
                      }`}
                    style={categoryId === cat.id ? { backgroundColor: cat.color } : {}}
                  >
                    <CategoryIcon icon={cat.icon} className="w-3.5 h-3.5" />
                    <span>{translateCategoryName(cat.name, locale)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet */}
            {wallets.length > 0 && (
              <div>
                <label className="text-vault-text-dim text-xs font-mono uppercase tracking-widest block mb-2">{t('walletOptional')}</label>
                <div className="flex flex-wrap gap-2">
                  {wallets.map(w => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setWalletId(walletId === w.id ? null : w.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all
                        ${walletId === w.id
                          ? 'border-transparent text-vault-bg font-medium'
                          : 'border-vault-border text-vault-text-dim hover:border-vault-muted'
                        }`}
                      style={walletId === w.id ? { backgroundColor: w.color } : {}}
                    >
                      <span>{w.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Frequency + start date */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-vault-text-dim text-xs font-mono uppercase tracking-widest block mb-2">{t('recurringFrequency')}</label>
                <Select value={frequency} onChange={v => setFrequency(v as RecurringFrequency)} options={FREQUENCIES} className="w-full" />
              </div>
              <div className="flex-1">
                <label className="text-vault-text-dim text-xs font-mono uppercase tracking-widest block mb-2">{t('recurringStartDate')}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-vault-card border border-vault-border rounded-xl py-3 px-4 text-sm text-vault-text font-mono focus:outline-none focus:border-vault-accent/50 transition-colors"
                />
              </div>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-2 bg-vault-card border border-vault-border rounded-xl px-3 py-2.5">
              <Info className="w-3.5 h-3.5 text-vault-text-dim flex-shrink-0 mt-0.5" />
              <p className="text-vault-text-dim text-xs font-mono leading-relaxed">{t('recurringNotice')}</p>
            </div>

            {/* Note */}
            <div>
              <label className="text-vault-text-dim text-xs font-mono uppercase tracking-widest block mb-2">{t('addTxNote')}</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={t('addTxNotePlaceholder')}
                className="w-full bg-vault-card border border-vault-border rounded-xl py-3 px-4 text-sm text-vault-text placeholder-vault-muted focus:outline-none focus:border-vault-accent/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isPending || !amount}
              className="w-full bg-vault-accent text-vault-accent-contrast rounded-xl py-3.5 font-mono font-semibold text-sm hover:bg-vault-accent-light active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
            >
              {isPending ? t('saving') : t('recurringSubmit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
