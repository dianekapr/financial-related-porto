'use client'
import type { BillItem, BillMember, BillItemAssignment } from '@portfolio/supabase'
import { formatMoney } from '../../lib/money'

type FullItem = BillItem & { assignments: (BillItemAssignment & { member: BillMember | null })[] }

export default function ItemRow({
  item, members, currency, readOnly, onToggle,
}: {
  item: FullItem
  members: BillMember[]
  currency: string
  readOnly?: boolean
  onToggle: (memberId: string) => void
}) {
  const assignedIds = item.assignments?.map(a => a.member_id) ?? []
  const perPerson = assignedIds.length > 0
    ? (item.price * item.quantity) / assignedIds.length
    : null
  const visibleMembers = readOnly ? members.filter(m => assignedIds.includes(m.id)) : members

  return (
    <div className="px-5 py-3.5">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex-1">
          <p className="text-sm font-medium text-slice-dark">{item.name}</p>
          {item.quantity > 1 && (
            <p className="text-slice-muted text-xs font-receipt">
              {item.quantity}× {formatMoney(item.price, currency)} = {formatMoney(item.price * item.quantity, currency)}
            </p>
          )}
        </div>
        <p className="font-receipt text-sm font-bold text-slice-dark flex-shrink-0">
          {formatMoney(item.price * item.quantity, currency)}
        </p>
      </div>

      {/* Member assignment toggles */}
      <div className="flex flex-wrap gap-1.5">
        {visibleMembers.map(m => {
          const assigned = assignedIds.includes(m.id)
          const Tag = readOnly ? 'span' : 'button'
          return (
            <Tag
              key={m.id}
              onClick={readOnly ? undefined : () => onToggle(m.id)}
              className={`member-pill ${readOnly ? '' : 'transition-all active:scale-95'} ${
                assigned ? 'text-white shadow-sm' : 'bg-slate-100 text-slice-muted hover:bg-slate-200'
              }`}
              style={assigned ? { backgroundColor: m.color } : {}}
            >
              <span>{m.avatar_emoji}</span>
              <span>{m.name}</span>
              {assigned && perPerson && (
                <span className="opacity-75 text-[10px]">({formatMoney(perPerson, currency)})</span>
              )}
            </Tag>
          )
        })}
        {assignedIds.length === 0 && (
          <span className="text-xs text-slice-text-dim font-receipt">Belum di-assign ke siapapun</span>
        )}
      </div>
    </div>
  )
}
