'use client'
import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@portfolio/supabase'
import type { Bill, BillMember, BillItem, BillItemAssignment, ScannedReceipt } from '@portfolio/supabase'
import SummaryCard from './SummaryCard'
import ItemRow from './ItemRow'
import SettleModal from './SettleModal'

type FullItem = BillItem & { assignments: (BillItemAssignment & { member: BillMember | null })[] }

function formatIDR(n: number) {
  return n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
}

export default function BillDetail({
  bill, members, items: initialItems,
}: {
  bill: Bill
  members: BillMember[]
  items: FullItem[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  const [items, setItems] = useState<FullItem[]>(initialItems)
  const [scanning, setScanning] = useState(false)
  const [showSettle, setShowSettle] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', price: '', qty: '1' })
  const [showAddItem, setShowAddItem] = useState(false)

  // Compute per-member totals
  const memberTotals = members.map(m => {
    const total = items.reduce((sum, item) => {
      const assignment = item.assignments?.find(a => a.member_id === m.id)
      return sum + (assignment?.share_amount ?? 0)
    }, 0)
    return { ...m, total }
  })

  const grandTotal = items.reduce((s, item) => s + item.price * item.quantity, 0)

  // Upload & scan receipt
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)

    try {
      // Upload to Supabase storage
      const { data: { session } } = await supabase.auth.getSession()
      const path = `${session!.user.id}/${bill.id}/${Date.now()}-${file.name}`
      await supabase.storage.from('receipts').upload(path, file)
      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(path)

      // Call Claude Vision API route
      const res = await fetch('/api/bills/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId: bill.id, imageUrl: publicUrl }),
      })
      const scanned: ScannedReceipt = await res.json()

      if (scanned.items?.length) {
        // Insert scanned items to DB
        const { data: newItems } = await supabase
          .from('bill_items')
          .insert(scanned.items.map(i => ({ bill_id: bill.id, name: i.name, price: i.price, quantity: i.quantity })))
          .select()

        if (newItems) {
          // Convert to FullItem type with empty assignments
          const fullItems: FullItem[] = newItems.map(item => ({
            ...item,
            assignments: []
          }))
          setItems(prev => [...prev, ...fullItems])
        }

        // Update bill total
        const total = scanned.total ?? scanned.items.reduce((s, i) => s + i.price * i.quantity, 0)
        await supabase.from('bills').update({ total, receipt_url: publicUrl }).eq('id', bill.id)

        router.refresh()
      }
    } catch (err) {
      console.error('Scan failed:', err)
    } finally {
      setScanning(false)
    }
  }

  // Add item manually
  const addItem = async () => {
    const price = parseFloat(newItem.price.replace(/[^0-9]/g, ''))
    const qty = parseInt(newItem.qty) || 1
    if (!newItem.name.trim() || !price) return

    const { data: item } = await supabase
      .from('bill_items')
      .insert({ bill_id: bill.id, name: newItem.name.trim(), price, quantity: qty })
      .select()
      .single()

    if (item) {
      // Create FullItem with empty assignments array
      const newFullItem: FullItem = {
        ...item,
        assignments: []
      }
      setItems(prev => [...prev, newFullItem])
      await supabase.from('bills').update({ total: grandTotal + price * qty }).eq('id', bill.id)
      setNewItem({ name: '', price: '', qty: '1' })
      setShowAddItem(false)
    }
  }

  // Toggle assignment
  const toggleAssign = async (itemId: string, memberId: string) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    const existing = item.assignments?.find(a => a.member_id === memberId)

    if (existing) {
      await supabase.from('bill_item_assignments').delete().eq('id', existing.id)
      setItems(prev => prev.map(i => i.id === itemId
        ? { ...i, assignments: i.assignments?.filter(a => a.id !== existing.id) ?? [] }
        : i
      ))
    } else {
      // Split equally among assigned members
      const currentAssignees = [...(item.assignments?.map(a => a.member_id) ?? []), memberId]
      const shareAmount = (item.price * item.quantity) / currentAssignees.length

      // Recalculate all shares
      await supabase.from('bill_item_assignments').delete().eq('bill_item_id', itemId)
      const { data: newAssignments } = await supabase
        .from('bill_item_assignments')
        .insert(currentAssignees.map(mid => ({ bill_item_id: itemId, member_id: mid, share_amount: shareAmount })))
        .select('*, member:bill_members(*)')

      setItems(prev => prev.map(i => i.id === itemId
        ? { ...i, assignments: (newAssignments as (BillItemAssignment & { member: BillMember | null })[]) ?? [] }
        : i
      ))
    }
  }

  return (
    <div className="space-y-5">
      {/* Bill header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-slice-dark">{bill.title}</h1>
          <p className="text-slice-muted text-sm font-receipt">{bill.date}</p>
        </div>
        <div className="text-right">
          <p className="text-slice-text-dim text-xs font-receipt">Total</p>
          <p className="font-display text-slice-orange text-2xl">{formatIDR(grandTotal)}</p>
        </div>
      </div>

      {/* Member summary cards */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {memberTotals.map(m => (
          <SummaryCard key={m.id} member={m} total={m.total} />
        ))}
      </div>

      {/* Receipt / Items section */}
      <div className="bg-white rounded-3xl border border-slice-border overflow-hidden shadow-sm">
        {/* Printer header */}
        <div className="bg-slice-receipt border-b border-slice-border px-5 py-4 flex items-center justify-between">
          <div>
            <p className="font-receipt text-slice-dark font-bold text-sm uppercase tracking-widest">STRUK / ITEMS</p>
            <p className="font-receipt text-slice-muted text-xs">{items.length} item</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Upload buttons */}
            <button
              onClick={() => cameraRef.current?.click()}
              disabled={scanning}
              className="flex items-center gap-1.5 bg-white border border-slice-border rounded-xl px-3 py-2 text-sm text-slice-dark hover:border-slice-orange/40 transition-all text-xs font-medium"
            >
              {scanning ? '🔍 Scanning...' : '📷 Kamera'}
            </button>
            <button
              onClick={() => galleryRef.current?.click()}
              disabled={scanning}
              className="flex items-center gap-1.5 bg-white border border-slice-border rounded-xl px-3 py-2 text-sm text-slice-dark hover:border-slice-orange/40 transition-all text-xs font-medium"
            >
              {scanning ? '🔍 Scanning...' : '🖼️ Galeri'}
            </button>
            <button
              onClick={() => setShowAddItem(true)}
              className="flex items-center gap-1 bg-slice-orange text-white rounded-xl px-3 py-2 text-xs font-medium hover:bg-slice-orange-light transition-all"
            >
              + Item
            </button>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
          <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>

        {/* Items */}
        <div className="divide-y divide-slice-border">
          {items.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="font-receipt text-slice-muted text-sm">Belum ada item.</p>
              <p className="text-slice-text-dim text-xs mt-1">Scan struk atau tambah manual.</p>
            </div>
          ) : (
            items.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                members={members}
                onToggle={(memberId) => toggleAssign(item.id, memberId)}
              />
            ))
          )}
        </div>

        {/* Add item form */}
        {showAddItem && (
          <div className="border-t border-slice-border p-4 bg-slice-surface space-y-3">
            <p className="font-receipt text-slice-dark text-xs uppercase tracking-widest font-bold">Tambah Item Manual</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem.name}
                onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
                placeholder="Nama item..."
                className="flex-1 border border-slice-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-slice-orange/60 bg-white"
                autoFocus
              />
              <input
                type="text"
                inputMode="numeric"
                value={newItem.price}
                onChange={e => setNewItem(p => ({ ...p, price: e.target.value.replace(/[^0-9]/g, '') }))}
                placeholder="Harga"
                className="w-28 border border-slice-border rounded-xl px-3 py-2.5 text-sm font-receipt focus:outline-none focus:border-slice-orange/60 bg-white"
              />
              <input
                type="number"
                value={newItem.qty}
                onChange={e => setNewItem(p => ({ ...p, qty: e.target.value }))}
                min={1}
                className="w-14 border border-slice-border rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:border-slice-orange/60 bg-white"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={addItem}
                className="flex-1 bg-slice-orange text-white rounded-xl py-2.5 text-sm font-medium hover:bg-slice-orange-light transition-all">
                Tambah
              </button>
              <button onClick={() => setShowAddItem(false)}
                className="px-4 text-slice-muted hover:text-slice-dark transition-colors text-sm">
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Total footer */}
        {items.length > 0 && (
          <div className="border-t-2 border-dashed border-slice-border px-5 py-4 bg-slice-receipt">
            <div className="flex justify-between items-center font-receipt">
              <span className="text-slice-dark font-bold uppercase tracking-widest text-sm">TOTAL</span>
              <span className="text-slice-orange font-bold text-xl">{formatIDR(grandTotal)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Settle button */}
      {items.length > 0 && (
        <button
          onClick={() => setShowSettle(true)}
          className="w-full bg-slice-dark text-white rounded-2xl py-4 font-display text-xl hover:bg-gray-800 active:scale-[0.98] transition-all shadow-md"
        >
          ✂️ Hitung Siapa Bayar Berapa
        </button>
      )}

      {showSettle && (
        <SettleModal
          bill={bill}
          members={memberTotals}
          onClose={() => setShowSettle(false)}
        />
      )}
    </div>
  )
}