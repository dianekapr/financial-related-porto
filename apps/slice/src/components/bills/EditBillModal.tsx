'use client'
import { useState } from 'react'
import { createClient } from '@portfolio/supabase'
import type { Bill, BillMember } from '@portfolio/supabase'
import { X, Loader2 } from 'lucide-react'
import { getInitial } from '../../lib/avatar'
import { MEMBER_COLORS as COLORS, CURRENCIES } from '../../lib/billConstants'
import ConfirmDialog from '../ConfirmDialog'
import { useToast } from '../Toast'

type EditableMember = { id?: string; name: string; color: string }

export default function EditBillModal({
  bill, members, onClose, onSaved,
}: {
  bill: Bill
  members: BillMember[]
  onClose: () => void
  onSaved: () => void
}) {
  const supabase = createClient()
  const toast = useToast()
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState(bill.title)
  const [date, setDate] = useState(bill.date)
  const [currency, setCurrency] = useState(bill.currency)
  const [memberList, setMemberList] = useState<EditableMember[]>(members.map(m => ({ id: m.id, name: m.name, color: m.color })))
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [removeIdx, setRemoveIdx] = useState<number | null>(null)

  const activeCount = memberList.length
  const canSave = title.trim() && activeCount >= 2 && !saving

  const updateMember = (i: number, field: 'name' | 'color', val: string) => {
    setMemberList(prev => prev.map((m, j) => j === i ? { ...m, [field]: val } : m))
  }

  const addMember = () => {
    const idx = memberList.length % COLORS.length
    setMemberList(prev => [...prev, { name: '', color: COLORS[idx] }])
  }

  const removeMember = (i: number) => {
    const m = memberList[i]
    if (m.id) {
      setRemoveIdx(i)
    } else {
      setMemberList(prev => prev.filter((_, j) => j !== i))
    }
  }

  const confirmRemove = () => {
    if (removeIdx === null) return
    const m = memberList[removeIdx]
    if (m.id) setRemovedIds(prev => [...prev, m.id!])
    setMemberList(prev => prev.filter((_, j) => j !== removeIdx))
    setRemoveIdx(null)
  }

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)

    const { error: billError } = await supabase
      .from('bills')
      .update({ title: title.trim(), date, currency })
      .eq('id', bill.id)

    if (billError) {
      setSaving(false)
      toast.show('Gagal update tagihan, coba lagi.', 'error')
      return
    }

    if (removedIds.length > 0) {
      await supabase.from('bill_members').delete().in('id', removedIds)
    }

    const renamed = memberList.filter(m => m.id)
    for (const m of renamed) {
      await supabase.from('bill_members').update({ name: m.name.trim(), color: m.color }).eq('id', m.id)
    }

    const brandNew = memberList.filter(m => !m.id && m.name.trim())
    if (brandNew.length > 0) {
      await supabase.from('bill_members').insert(
        brandNew.map(m => ({ bill_id: bill.id, name: m.name.trim(), color: m.color }))
      )
    }

    setSaving(false)
    toast.show('Tagihan diperbarui.')
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl animate-print overflow-hidden">
        <div className="md:hidden w-10 h-1 bg-slice-border rounded-full mx-auto mt-3" />

        <div className="bg-slice-dark px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-white text-2xl">Kelola Tagihan</h2>
            <p className="text-gray-300 text-xs font-receipt mt-1">Ubah detail & siapa yang ikut</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-slice-muted text-xs font-receipt uppercase tracking-widest block mb-1.5">Nama Tagihan</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-slice-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-slice-orange/60 bg-slice-surface transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-slice-muted text-xs font-receipt uppercase tracking-widest block mb-1.5">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-slice-border rounded-xl py-3 px-4 text-sm font-receipt focus:outline-none focus:border-slice-orange/60 bg-slice-surface transition-colors"
              />
            </div>
            <div>
              <label className="text-slice-muted text-xs font-receipt uppercase tracking-widest block mb-1.5">Mata Uang</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="border border-slice-border rounded-xl py-3 px-3 text-sm font-receipt focus:outline-none focus:border-slice-orange/60 bg-slice-surface transition-colors"
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-slice-muted text-xs font-receipt uppercase tracking-widest block mb-2">
              Siapa Aja? ({activeCount} orang)
            </label>
            <div className="space-y-3">
              {memberList.map((m, i) => (
                <div key={m.id ?? `new-${i}`} className="flex items-start gap-2">
                  <div
                    className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl font-display text-lg text-white"
                    style={{ backgroundColor: m.color }}
                  >
                    {getInitial(m.name || `Orang ${i + 1}`)}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={m.name}
                      onChange={e => updateMember(i, 'name', e.target.value)}
                      placeholder={`Orang ${i + 1}`}
                      className="w-full border border-slice-border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-slice-orange/60 bg-slice-surface transition-colors"
                      style={{ borderLeftColor: m.color, borderLeftWidth: 3 }}
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateMember(i, 'color', c)}
                          className="w-5 h-5 rounded-full transition-transform hover:scale-125"
                          style={{
                            backgroundColor: c,
                            ...(m.color === c && { boxShadow: `0 0 0 2px white, 0 0 0 4px ${c}`, outline: 'none' })
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  {memberList.length > 2 && (
                    <button onClick={() => removeMember(i)} className="mt-2.5 text-slate-300 hover:text-red-400 transition-colors">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addMember}
              className="mt-3 w-full border-2 border-dashed border-slice-border rounded-xl py-2.5 text-slice-muted text-sm hover:border-slice-orange/40 hover:text-slice-orange transition-all font-receipt"
            >
              + Tambah Orang
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full bg-slice-orange text-white rounded-xl py-3.5 font-display text-lg hover:bg-slice-orange-light active:scale-[0.98] transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : null}
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={removeIdx !== null}
        title="Hapus orang ini?"
        message="Semua pembagian item yang udah di-assign ke orang ini bakal ikut kehapus."
        confirmLabel="Hapus"
        danger
        onConfirm={confirmRemove}
        onCancel={() => setRemoveIdx(null)}
      />
    </div>
  )
}
