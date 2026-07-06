'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@portfolio/supabase'
import type { Wallet } from '@portfolio/supabase'
import WalletTransferModal from './WalletTransferModal'
import { formatIDR } from '../../lib/money'
import { useLocale } from '../LocaleProvider'
import { ArrowLeftRight, X } from 'lucide-react'

const COLORS = ['#C9A84C', '#8B5CF6', '#06B6D4', '#22C55E', '#F97316', '#E03E3E']

export default function WalletManager({ wallets }: { wallets: Wallet[] }) {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLocale()
  const [isPending, startTransition] = useTransition()

  const [showAdd, setShowAdd] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBalance, setNewBalance] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    const balance = parseFloat(newBalance.replace(/[^0-9]/g, '')) || 0

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    startTransition(async () => {
      await supabase.from('wallets').insert({
        user_id: session.user.id,
        name: newName.trim(),
        balance,
        color: newColor,
      })
      setNewName('')
      setNewBalance('')
      setNewColor(COLORS[0])
      setShowAdd(false)
      router.refresh()
    })
  }

  const handleSaveBalance = (walletId: string) => {
    const balance = parseFloat(editValue.replace(/[^0-9]/g, ''))
    if (isNaN(balance)) return

    startTransition(async () => {
      await supabase.from('wallets').update({ balance }).eq('id', walletId)
      setEditingId(null)
      setEditValue('')
      router.refresh()
    })
  }

  const handleDelete = (walletId: string) => {
    if (!confirm(t('confirmDeleteWallet'))) return
    startTransition(async () => {
      await supabase.from('wallets').delete().eq('id', walletId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Total overview */}
      <div className="bg-vault-card border border-vault-border rounded-2xl p-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-vault-text-dim text-xs font-mono uppercase tracking-widest">{t('walletsTotalBalance')}</p>
          <p className="font-mono text-2xl text-vault-accent font-semibold mt-1">{formatIDR(totalBalance)}</p>
        </div>
        {wallets.length >= 2 && (
          <button
            onClick={() => setShowTransfer(true)}
            className="flex items-center gap-1.5 bg-vault-accent/10 hover:bg-vault-accent/20 text-vault-accent border border-vault-accent/30 rounded-xl px-4 py-2 text-sm font-mono transition-all active:scale-95 flex-shrink-0"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            {t('walletTransferBtn')}
          </button>
        )}
      </div>

      {/* Wallet list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {wallets.map(w => {
          const isEditing = editingId === w.id
          return (
            <div key={w.id} className="bg-vault-card border border-vault-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/dashboard/wallets/${w.id}`} className="flex items-center gap-2.5 group">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: w.color }} />
                  <div>
                    <p className="text-sm font-medium text-vault-text group-hover:text-vault-accent transition-colors">{w.name}</p>
                    <p className="font-mono text-lg text-vault-accent font-semibold mt-0.5">{formatIDR(w.balance)}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleDelete(w.id)}
                    className="text-vault-muted hover:text-vault-danger px-1.5 py-1 rounded transition-colors"><X className="w-3.5 h-3.5" /></button>
                  <button
                    onClick={() => { setEditingId(w.id); setEditValue(String(w.balance)) }}
                    className="text-vault-text-dim hover:text-vault-accent text-xs font-mono px-2 py-1 rounded border border-vault-border hover:border-vault-accent/30 transition-all"
                  >
                    {t('budgetEdit')}
                  </button>
                </div>
              </div>

              {isEditing && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder={t('walletBalancePlaceholder')}
                    autoFocus
                    className="flex-1 bg-vault-surface border border-vault-border rounded-lg px-3 py-2 text-sm font-mono text-vault-text placeholder-vault-muted focus:outline-none focus:border-vault-accent/50"
                  />
                  <button onClick={() => handleSaveBalance(w.id)} disabled={isPending}
                    className="bg-vault-accent text-vault-accent-contrast rounded-lg px-3 py-2 text-xs font-mono font-semibold hover:bg-vault-accent-light transition-all disabled:opacity-50">
                    {isPending ? '...' : t('ok')}
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="text-vault-text-dim hover:text-vault-text px-2"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add wallet */}
      {showAdd ? (
        <form onSubmit={handleAdd} className="bg-vault-card border border-vault-border rounded-2xl p-4 space-y-3">
          <p className="text-vault-text-dim text-xs font-mono uppercase tracking-widest">{t('walletNewTitle')}</p>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={t('walletNamePlaceholder')}
            autoFocus
            className="w-full bg-vault-surface border border-vault-border rounded-lg px-3 py-2.5 text-sm text-vault-text placeholder-vault-muted focus:outline-none focus:border-vault-accent/50"
          />
          <input
            type="text"
            inputMode="numeric"
            value={newBalance}
            onChange={e => setNewBalance(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder={t('walletInitialBalancePlaceholder')}
            className="w-full bg-vault-surface border border-vault-border rounded-lg px-3 py-2.5 text-sm font-mono text-vault-text placeholder-vault-muted focus:outline-none focus:border-vault-accent/50"
          />
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                style={{ backgroundColor: c, boxShadow: newColor === c ? `0 0 0 2px var(--vault-card), 0 0 0 4px ${c}` : 'none' }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending || !newName.trim()}
              className="flex-1 bg-vault-accent text-vault-accent-contrast rounded-lg py-2.5 text-sm font-mono font-semibold hover:bg-vault-accent-light transition-all disabled:opacity-50">
              {isPending ? t('saving') : t('walletSaveBtn')}
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="px-4 text-vault-text-dim hover:text-vault-text transition-colors text-sm font-mono">
              {t('cancel')}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full border-2 border-dashed border-vault-border rounded-2xl py-4 text-vault-text-dim hover:border-vault-accent/40 hover:text-vault-accent transition-all font-mono text-sm"
        >
          {t('walletAddBtn')}
        </button>
      )}

      {showTransfer && <WalletTransferModal wallets={wallets} onClose={() => setShowTransfer(false)} />}
    </div>
  )
}
