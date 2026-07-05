import type { BillMember } from '@portfolio/supabase'
import { formatMoney } from '../../lib/money'
import { AvatarIcon } from '../../lib/avatarIcons'

export default function SummaryCard({ member, total, currency }: { member: BillMember; total: number; currency: string }) {
  return (
    <div
      className="flex-shrink-0 bg-white border-2 rounded-2xl px-4 py-3 min-w-[120px] animate-bounce-in"
      style={{ borderColor: member.color }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <AvatarIcon icon={member.avatar_emoji} size={18} style={{ color: member.color }} />
        <p className="text-sm font-medium text-slice-dark truncate max-w-[72px]">{member.name}</p>
      </div>
      <p className="font-display text-lg" style={{ color: member.color }}>
        {formatMoney(total, currency)}
      </p>
      {total === 0 && (
        <p className="text-slice-text-dim text-[10px] font-receipt">Belum ada item</p>
      )}
    </div>
  )
}
