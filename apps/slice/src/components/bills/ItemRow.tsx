'use client'
import type { BillItem, BillMember, BillItemAssignment } from '@portfolio/supabase'

type FullItem = BillItem & { assignments: (BillItemAssignment & { member: BillMember | null })[] }

function formatIDR(n: number) {
  return n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
}

export default function ItemRow({
  item, members, onToggle,
}: {
  item: FullItem
  members: BillMember[]
  onToggle: (memberId: string) => void
}) {
  const assignedIds = item.assignments?.map(a => a.member_id) ?? []
  const perPerson = assignedIds.length > 0
    ? (item.price * item.quantity) / assignedIds.length
    : null

  return (
    <div className="px-5 py-3.5">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex-1">
          <p className="text-sm font-medium text-slice-dark">{item.name}</p>
          {item.quantity > 1 && (
            <p className="text-slice-muted text-xs font-receipt">
              {item.quantity}× {formatIDR(item.price)} = {formatIDR(item.price * item.quantity)}
            </p>
          )}
        </div>
        <p className="font-receipt text-sm font-bold text-slice-dark flex-shrink-0">
          {formatIDR(item.price * item.quantity)}
        </p>
      </div>

      {/* Member assignment toggles */}
      <div className="flex flex-wrap gap-1.5">
        {members.map(m => {
          const assigned = assignedIds.includes(m.id)
          return (
            <button
              key={m.id}
              onClick={() => onToggle(m.id)}
              className={`member-pill transition-all active:scale-95 ${
                assigned ? 'text-white shadow-sm' : 'bg-slate-100 text-slice-muted hover:bg-slate-200'
              }`}
              style={assigned ? { backgroundColor: m.color } : {}}
            >
              <span>{m.avatar_emoji}</span>
              <span>{m.name}</span>
              {assigned && perPerson && (
                <span className="opacity-75 text-[10px]">({formatIDR(perPerson)})</span>
              )}
            </button>
          )
        })}
        {assignedIds.length === 0 && (
          <span className="text-xs text-slice-text-dim font-receipt">Belum di-assign ke siapapun</span>
        )}
      </div>
    </div>
  )
}
