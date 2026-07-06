'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Wallet } from '@portfolio/supabase'
import Select from '../ui/Select'
import { useLocale } from '../LocaleProvider'
import { formatIDR } from '../../lib/money'
import { ArrowRight } from 'lucide-react'

export default function WalletTransferModal({ wallets, onClose }: { wallets: Wallet[]; onClose: () => void }) {
  const router = useRouter()
  const { t } = useLocale()
  const [isPending, startTransition] = useTransition()

  const [fromId, setFromId] = useState(wallets[0]?.id ?? '')
  const [toId, setToId] = useState(wallets[1]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''))
    if (!numericAmount || numericAmount <= 0 || !fromId || !toId || fromId === toId) return

    startTransition(async () => {
      await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_wallet_id: fromId, to_wallet_id: toId, amount: numericAmount, note: note || null, date }),
      })
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full md:max-w-md bg-vault-surface border border-vault-border rounded-t-3xl md:rounded-2xl shadow-2xl animate-fade-up">
        <div className="md:hidden w-10 h-1 bg-vault-border rounded-full mx-auto mt-3 mb-1" />

        <div className="p-6">
          <h2 className="font-display text-vault-accent tracking-widest text-2xl mb-6">{t('walletTransferTitle')}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* From / To */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-vault-text-dim text-xs font-mono uppercase tracking-widest block mb-2">{t('walletTransferFrom')}</label>
                <Select
                  value={fromId}
                  onChange={setFromId}
                  options={wallets.map(w => ({ value: w.id, label: `${w.name} (${formatIDR(w.balance)})` }))}
                  className="w-full"
                />
              </div>
              <ArrowRight className="w-4 h-4 text-vault-text-dim flex-shrink-0 mt-6" />
              <div className="flex-1">
                <label className="text-vault-text-dim text-xs font-mono uppercase tracking-widest block mb-2">{t('walletTransferTo')}</label>
                <Select
                  value={toId}
                  onChange={setToId}
                  options={wallets.map(w => ({ value: w.id, label: `${w.name} (${formatIDR(w.balance)})` }))}
                  className="w-full"
                />
              </div>
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

            {/* Date */}
            <div>
              <label className="text-vault-text-dim text-xs font-mono uppercase tracking-widest block mb-2">{t('addTxDate')}</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-vault-card border border-vault-border rounded-xl py-3 px-4 text-sm text-vault-text font-mono focus:outline-none focus:border-vault-accent/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isPending || !amount || !fromId || !toId || fromId === toId}
              className="w-full bg-vault-accent text-vault-accent-contrast rounded-xl py-3.5 font-mono font-semibold text-sm hover:bg-vault-accent-light active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
            >
              {isPending ? t('saving') : t('walletTransferSubmit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
