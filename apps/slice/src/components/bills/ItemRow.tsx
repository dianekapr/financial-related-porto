'use client'
import { useState } from 'react'
import type { BillItem, BillMember, BillItemAssignment } from '@portfolio/supabase'
import { formatMoney } from '../../lib/money'
import { Pencil, Trash2, SlidersHorizontal, Check, X } from 'lucide-react'

type FullItem = BillItem & { assignments: (BillItemAssignment & { member: BillMember | null })[] }

export default function ItemRow({
  item, members, currency, readOnly, onToggle, onEdit, onDelete, onCustomSplit,
}: {
  item: FullItem
  members: BillMember[]
  currency: string
  readOnly?: boolean
  onToggle: (memberId: string) => void
  onEdit?: (updates: { name: string; price: number; quantity: number }) => void
  onDelete?: () => void
  onCustomSplit?: (shares: { member_id: string; share_amount: number }[]) => void
}) {
  const [editing, setEditing] = useState(false)
  const [splitting, setSplitting] = useState(false)
  const [editForm, setEditForm] = useState({ name: item.name, price: String(item.price), qty: String(item.quantity) })
  const [splitShares, setSplitShares] = useState<Record<string, string>>({})

  const assignedIds = item.assignments?.map(a => a.member_id) ?? []
  const perPerson = assignedIds.length > 0
    ? (item.price * item.quantity) / assignedIds.length
    : null
  const visibleMembers = readOnly ? members.filter(m => assignedIds.includes(m.id)) : members
  const lineTotal = item.price * item.quantity

  const startEdit = () => {
    setEditForm({ name: item.name, price: String(item.price), qty: String(item.quantity) })
    setEditing(true)
    setSplitting(false)
  }

  const saveEdit = () => {
    const price = parseFloat(editForm.price.replace(/[^0-9.]/g, ''))
    const qty = parseInt(editForm.qty) || 1
    if (!editForm.name.trim() || !price || !onEdit) return
    onEdit({ name: editForm.name.trim(), price, quantity: qty })
    setEditing(false)
  }

  const startSplit = () => {
    const initial: Record<string, string> = {}
    for (const m of members) {
      const a = item.assignments?.find(x => x.member_id === m.id)
      initial[m.id] = a ? String(a.share_amount) : ''
    }
    setSplitShares(initial)
    setSplitting(true)
    setEditing(false)
  }

  const splitSum = Object.values(splitShares).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const splitDiff = Math.round((lineTotal - splitSum) * 100) / 100

  const equalizeChecked = () => {
    const checkedIds = Object.keys(splitShares).filter(id => splitShares[id] !== '')
    if (checkedIds.length === 0) return
    const each = lineTotal / checkedIds.length
    setSplitShares(prev => {
      const next = { ...prev }
      for (const id of checkedIds) next[id] = each.toFixed(2)
      return next
    })
  }

  const toggleSplitMember = (memberId: string) => {
    setSplitShares(prev => ({ ...prev, [memberId]: prev[memberId] === '' || prev[memberId] === undefined ? '0' : '' }))
  }

  const saveSplit = () => {
    if (!onCustomSplit) return
    const shares = Object.entries(splitShares)
      .filter(([, v]) => v !== '' && parseFloat(v) > 0)
      .map(([member_id, v]) => ({ member_id, share_amount: parseFloat(v) }))
    onCustomSplit(shares)
    setSplitting(false)
  }

  return (
    <div className="px-5 py-3.5">
      {editing ? (
        <div className="space-y-2 mb-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={editForm.name}
              onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
              className="flex-1 border border-slice-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-slice-orange/60 bg-white"
              autoFocus
            />
            <input
              type="text"
              inputMode="decimal"
              value={editForm.price}
              onChange={e => setEditForm(p => ({ ...p, price: e.target.value.replace(/[^0-9.]/g, '') }))}
              className="w-24 border border-slice-border rounded-xl px-3 py-2 text-sm font-receipt focus:outline-none focus:border-slice-orange/60 bg-white"
            />
            <input
              type="number"
              min={1}
              value={editForm.qty}
              onChange={e => setEditForm(p => ({ ...p, qty: e.target.value }))}
              className="w-14 border border-slice-border rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:border-slice-orange/60 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={saveEdit} className="flex items-center gap-1 bg-slice-orange text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slice-orange-light transition-all">
              <Check size={12} /> Simpan
            </button>
            <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-slice-muted hover:text-slice-dark text-xs px-2">
              <X size={12} /> Batal
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex-1">
            <p className="text-sm font-medium text-slice-dark">{item.name}</p>
            {item.quantity > 1 && (
              <p className="text-slice-muted text-xs font-receipt">
                {item.quantity}× {formatMoney(item.price, currency)} = {formatMoney(lineTotal, currency)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <p className="font-receipt text-sm font-bold text-slice-dark">
              {formatMoney(lineTotal, currency)}
            </p>
            {!readOnly && (onEdit || onCustomSplit || onDelete) && (
              <div className="flex items-center gap-0.5">
                {onCustomSplit && (
                  <button onClick={startSplit} title="Atur porsi manual" className="p-1 text-slice-text-dim hover:text-slice-orange transition-colors">
                    <SlidersHorizontal size={14} />
                  </button>
                )}
                {onEdit && (
                  <button onClick={startEdit} title="Edit item" className="p-1 text-slice-text-dim hover:text-slice-orange transition-colors">
                    <Pencil size={14} />
                  </button>
                )}
                {onDelete && (
                  <button onClick={onDelete} title="Hapus item" className="p-1 text-slice-text-dim hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {splitting ? (
        <div className="space-y-2 bg-slice-surface rounded-xl p-3 border border-slice-border">
          <p className="text-slice-muted text-[11px] font-receipt uppercase tracking-widest">Atur porsi per orang</p>
          {members.map(m => {
            const checked = splitShares[m.id] !== '' && splitShares[m.id] !== undefined
            return (
              <div key={m.id} className="flex items-center gap-2">
                <button type="button" onClick={() => toggleSplitMember(m.id)} className="shrink-0">
                  <span
                    className="w-4 h-4 rounded flex items-center justify-center border-2"
                    style={{ borderColor: m.color, backgroundColor: checked ? m.color : 'transparent' }}
                  >
                    {checked && <Check size={10} className="text-white" />}
                  </span>
                </button>
                <span className="text-xs flex-1 truncate">{m.name}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  disabled={!checked}
                  value={splitShares[m.id] ?? ''}
                  onChange={e => setSplitShares(prev => ({ ...prev, [m.id]: e.target.value.replace(/[^0-9.]/g, '') }))}
                  placeholder="0"
                  className="w-24 border border-slice-border rounded-lg px-2 py-1 text-xs font-receipt text-right focus:outline-none focus:border-slice-orange/60 bg-white disabled:opacity-40"
                />
              </div>
            )
          })}
          <div className={`text-[11px] font-receipt text-right ${splitDiff === 0 ? 'text-green-600' : 'text-red-500'}`}>
            {splitDiff === 0 ? 'Pas!' : splitDiff > 0 ? `Kurang ${formatMoney(splitDiff, currency)}` : `Lebih ${formatMoney(-splitDiff, currency)}`}
          </div>
          <div className="flex gap-2">
            <button onClick={saveSplit} disabled={splitDiff !== 0} className="flex-1 bg-slice-orange text-white rounded-lg py-1.5 text-xs font-medium hover:bg-slice-orange-light transition-all disabled:opacity-40">
              Simpan Porsi
            </button>
            <button onClick={equalizeChecked} className="text-slice-muted hover:text-slice-dark text-xs px-2">
              Ratain
            </button>
            <button onClick={() => setSplitting(false)} className="text-slice-muted hover:text-slice-dark text-xs px-2">
              Batal
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {visibleMembers.map(m => {
            const assigned = assignedIds.includes(m.id)
            const assignment = item.assignments?.find(a => a.member_id === m.id)
            const isCustom = assignment && perPerson !== null && Math.abs(assignment.share_amount - perPerson) > 0.01
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
                <span>{m.name}</span>
                {assigned && assignment && (
                  <span className="opacity-75 text-[10px]">
                    ({formatMoney(assignment.share_amount, currency)}{isCustom ? '*' : ''})
                  </span>
                )}
              </Tag>
            )
          })}
          {assignedIds.length === 0 && (
            <span className="text-xs text-slice-text-dim font-receipt">Belum di-assign ke siapapun</span>
          )}
        </div>
      )}
    </div>
  )
}
