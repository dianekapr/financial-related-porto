'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@portfolio/supabase'

const EMOJIS = ['🧑','👩','👨','🧔','👧','🧒','🎩','🤓','😎','🥸','🤩','😄']
const COLORS = ['#FF5E1A','#3B82F6','#22C55E','#8B5CF6','#F59E0B','#EC4899','#14B8A6','#EF4444','#6366F1','#84CC16']
const CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY', 'GBP', 'AUD']

export default function CreateBillModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [currency, setCurrency] = useState('IDR')
  const [members, setMembers] = useState([
    { name: '', emoji: '🧑', color: COLORS[0] },
    { name: '', emoji: '👩', color: COLORS[1] },
  ])

  const addMember = () => {
    const idx = members.length % COLORS.length
    setMembers(prev => [...prev, { name: '', emoji: EMOJIS[idx] ?? '🧑', color: COLORS[idx] }])
  }

  const removeMember = (i: number) => setMembers(prev => prev.filter((_, j) => j !== i))

  const updateMember = (i: number, field: string, val: string) => {
    setMembers(prev => prev.map((m, j) => j === i ? { ...m, [field]: val } : m))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validMembers = members.filter(m => m.name.trim())
    if (!title.trim() || validMembers.length < 2) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    startTransition(async () => {
      // Create bill
      const { data: bill, error } = await supabase
        .from('bills')
        .insert({ owner_id: session.user.id, title: title.trim(), date, total: 0, currency })
        .select()
        .single()

      if (error || !bill) return

      // Create members
      await supabase.from('bill_members').insert(
        validMembers.map(m => ({
          bill_id: bill.id,
          name: m.name.trim(),
          color: m.color,
          avatar_emoji: m.emoji,
        }))
      )

      router.push(`/bills/${bill.id}`)
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl animate-print overflow-hidden">
        {/* Handle */}
        <div className="md:hidden w-10 h-1 bg-slice-border rounded-full mx-auto mt-3" />

        {/* Orange header */}
        <div className="bg-slice-orange px-6 py-5">
          <h2 className="font-display text-white text-2xl">Buat Tagihan Baru</h2>
          <p className="text-orange-100 text-xs font-receipt mt-1">Isi detail & tambahkan siapa yang ikut</p>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-slice-muted text-xs font-receipt uppercase tracking-widest block mb-1.5">Nama Tagihan</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Makan malam bareng, Bensin jalan..."
              required
              className="w-full border border-slice-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-slice-orange/60 bg-slice-surface transition-colors"
            />
          </div>

          {/* Date & currency */}
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

          {/* Members */}
          <div>
            <label className="text-slice-muted text-xs font-receipt uppercase tracking-widest block mb-2">
              Siapa Aja? ({members.filter(m => m.name.trim()).length} orang)
            </label>
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  {/* Emoji picker (simple) */}
                  <select
                    value={m.emoji}
                    onChange={e => updateMember(i, 'emoji', e.target.value)}
                    className="w-11 h-11 text-xl bg-slice-surface border border-slice-border rounded-xl text-center cursor-pointer focus:outline-none"
                  >
                    {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>

                  {/* Name */}
                  <input
                    type="text"
                    value={m.name}
                    onChange={e => updateMember(i, 'name', e.target.value)}
                    placeholder={`Orang ${i + 1}`}
                    className="flex-1 border border-slice-border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-slice-orange/60 bg-slice-surface transition-colors"
                    style={{ borderLeftColor: m.color, borderLeftWidth: 3 }}
                  />

                  {/* Color dots */}
                  <div className="flex gap-1">
                    {COLORS.slice(0, 5).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => updateMember(i, 'color', c)}
                        className="w-4 h-4 rounded-full transition-transform hover:scale-125"
                        style={{
                          backgroundColor: c,
                          ...(m.color === c && {
                            boxShadow: `0 0 0 2px ${c}`,
                            outline: 'none'
                          })
                        }}
                      />
                    ))}
                  </div>

                  {members.length > 2 && (
                    <button onClick={() => removeMember(i)} className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none">✕</button>
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

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isPending || !title.trim() || members.filter(m => m.name.trim()).length < 2}
            className="w-full bg-slice-orange text-white rounded-xl py-3.5 font-display text-lg hover:bg-slice-orange-light active:scale-[0.98] transition-all disabled:opacity-50 shadow-md"
          >
            {isPending ? 'Membuat...' : 'Buat Tagihan →'}
          </button>
        </div>
      </div>
    </div>
  )
}