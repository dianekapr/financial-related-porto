import type { BillMember } from '@portfolio/supabase'
import { formatMoney } from '../../lib/money'
import { getInitial } from '../../lib/avatar'

export default function SummaryCard({ member, total, currency }: { member: BillMember; total: number; currency: string }) {
  return (
    <div
      className="flex-shrink-0 bg-white border-2 rounded-2xl px-4 py-3 min-w-[120px] animate-bounce-in"
      style={{ borderColor: member.color }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
          style={{ backgroundColor: member.color }}
        >
          {getInitial(member.name)}
        </span>
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
