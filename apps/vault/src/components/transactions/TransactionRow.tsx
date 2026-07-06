'use client'
import type { Transaction } from '@portfolio/supabase'
import { useLocale } from '../LocaleProvider'
import { translateCategoryName } from '../../lib/i18n'
import { CategoryIcon } from '../../lib/categoryIcons'
import { formatIDR } from '../../lib/money'
import { ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, Pencil, X } from 'lucide-react'

// A transfer leg (transfer_group_id set) moves money between the user's own
// wallets — it's not real income or spending, so it gets a neutral icon/color
// and skips the edit action (editing one leg would break the linked pair;
// deleting is still allowed and removes both legs, see /api/transactions).
export default function TransactionRow({
  tx, subtitle, onEdit, onDelete, deleting,
}: {
  tx: Transaction
  subtitle?: string
  onEdit?: (tx: Transaction) => void
  onDelete?: (id: string) => void
  deleting?: boolean
}) {
  const { t, locale } = useLocale()
  const isTransfer = !!tx.transfer_group_id
  const label = isTransfer
    ? t('transferLabel')
    : tx.note ?? (tx.category ? translateCategoryName(tx.category.name, locale) : t('fallbackTxName'))

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 group hover:bg-vault-surface/50 transition-colors">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: isTransfer
            ? 'color-mix(in srgb, var(--vault-text-dim) 20%, transparent)'
            : tx.category?.color ? `${tx.category.color}20` : 'color-mix(in srgb, var(--vault-accent) 20%, transparent)',
        }}
      >
        {isTransfer ? (
          <ArrowLeftRight className="w-5 h-5 text-vault-text-dim" />
        ) : tx.category ? (
          <CategoryIcon icon={tx.category.icon} className="w-5 h-5" style={{ color: tx.category.color }} />
        ) : tx.type === 'income' ? (
          <ArrowUpCircle className="w-5 h-5 text-vault-accent" />
        ) : (
          <ArrowDownCircle className="w-5 h-5 text-vault-danger" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-vault-text truncate">{label}</p>
        {subtitle && <p className="text-xs text-vault-text-dim font-mono mt-0.5">{subtitle}</p>}
      </div>
      <p className={`font-mono text-sm font-semibold flex-shrink-0 ${isTransfer ? 'text-vault-text-dim' : tx.type === 'income' ? 'text-vault-accent' : 'text-vault-danger'}`}>
        {tx.type === 'income' ? '+' : '−'}{formatIDR(tx.amount)}
      </p>
      {onEdit && !isTransfer && (
        <button
          onClick={() => onEdit(tx)}
          className="opacity-0 group-hover:opacity-100 text-vault-muted hover:text-vault-accent transition-all text-xs font-mono px-2 py-1 rounded"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => onDelete(tx.id)}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 text-vault-muted hover:text-vault-danger transition-all text-xs font-mono px-2 py-1 rounded"
        >
          {deleting ? '...' : <X className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  )
}
