'use client'
import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@portfolio/supabase'
import type { Category } from '@portfolio/supabase'
import { useRouter } from 'next/navigation'

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'user_id' | 'created_at'>[] = [
  { name: 'Makan & Minum', icon: '🍜', color: '#E03E3E', budget_limit: null },
  { name: 'Transport', icon: '🚗', color: '#C9A84C', budget_limit: null },
  { name: 'Belanja', icon: '🛍️', color: '#8B5CF6', budget_limit: null },
  { name: 'Hiburan', icon: '🎬', color: '#06B6D4', budget_limit: null },
  { name: 'Kesehatan', icon: '💊', color: '#22C55E', budget_limit: null },
  { name: 'Tagihan', icon: '📄', color: '#F97316', budget_limit: null },
  { name: 'Gaji', icon: '💰', color: '#C9A84C', budget_limit: null },
  { name: 'Freelance', icon: '💻', color: '#22C55E', budget_limit: null },
  { name: 'Lainnya', icon: '📌', color: '#888888', budget_limit: null },
]

export default function AddTransactionModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      let { data: cats } = await supabase.from('categories').select('*').eq('user_id', session.user.id)

      // Seed default categories if none
      if (!cats || cats.length === 0) {
        const seeds = DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: session.user.id }))
        const { data: seeded } = await supabase.from('categories').insert(seeds).select()
        cats = seeded
      }
      setCategories(cats ?? [])
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''))
    if (!numericAmount || numericAmount <= 0) return

    startTransition(async () => {
      await supabase.from('transactions').insert({
        user_id: session.user.id,
        amount: numericAmount,
        type,
        category_id: categoryId,
        note: note || null,
        date,
      })
      router.refresh()
      onClose()
    })
  }

  const filteredCats = categories.filter(c =>
    type === 'income'
      ? ['Gaji', 'Freelance', 'Lainnya'].some(n => c.name.includes(n))
      : !['Gaji', 'Freelance'].some(n => c.name.includes(n))
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full md:max-w-md bg-vault-surface border border-vault-border rounded-t-3xl md:rounded-2xl shadow-2xl animate-fade-up">
        {/* Handle */}
        <div className="md:hidden w-10 h-1 bg-vault-border rounded-full mx-auto mt-3 mb-1" />

        <div className="p-6">
          <h2 className="font-display text-vault-gold tracking-widest text-2xl mb-6">TAMBAH TRANSAKSI</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type toggle */}
            <div className="flex rounded-xl overflow-hidden border border-vault-border">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setCategoryId(null) }}
                  className={`flex-1 py-2.5 text-sm font-mono transition-all
                    ${type === t
                      ? t === 'income' ? 'bg-vault-gold text-vault-bg font-semibold' : 'bg-vault-red text-white font-semibold'
                      : 'text-vault-text-dim hover:text-vault-text'
                    }`}
                >
                  {t === 'income' ? '↑ Pemasukan' : '↓ Pengeluaran'}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div>
              <label className="text-vault-text-dim text-xs font-mono uppercase tracking-widest block mb-2">Jumlah</label>
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
                  className="w-full bg-vault-card border border-vault-border rounded-xl py-3 pl-12 pr-4 font-mono text-lg text-vault-text placeholder-vault-muted focus:outline-none focus:border-vault-gold/50 transition-colors"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-vault-text-dim text-xs font-mono uppercase tracking-widest block mb-2">Kategori</label>
              <div className="flex flex-wrap gap-2">
                {filteredCats.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all
                      ${categoryId === cat.id
                        ? 'border-transparent text-vault-bg font-medium'
                        : 'border-vault-border text-vault-text-dim hover:border-vault-muted'
                      }`}
                    style={categoryId === cat.id ? { backgroundColor: cat.color } : {}}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-vault-text-dim text-xs font-mono uppercase tracking-widest block mb-2">Catatan (opsional)</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Makan siang di warung..."
                className="w-full bg-vault-card border border-vault-border rounded-xl py-3 px-4 text-sm text-vault-text placeholder-vault-muted focus:outline-none focus:border-vault-gold/50 transition-colors"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-vault-text-dim text-xs font-mono uppercase tracking-widest block mb-2">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-vault-card border border-vault-border rounded-xl py-3 px-4 text-sm text-vault-text font-mono focus:outline-none focus:border-vault-gold/50 transition-colors"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending || !amount}
              className="w-full bg-vault-gold text-vault-bg rounded-xl py-3.5 font-mono font-semibold text-sm hover:bg-vault-gold-light active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
