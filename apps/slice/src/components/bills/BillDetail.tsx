'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@portfolio/supabase'
import type { Bill, BillMember, BillItem, BillItemAssignment, ScannedReceipt } from '@portfolio/supabase'
import { formatMoney } from '../../lib/money'
import SummaryCard from './SummaryCard'
import ItemRow from './ItemRow'
import SettleModal from './SettleModal'
import EditBillModal from './EditBillModal'
import ConfirmDialog from '../ConfirmDialog'
import { useToast } from '../Toast'
import { Check, Loader2, Camera, Image as ImageIcon, Upload, X, Scissors, Plus, Settings } from 'lucide-react'

type FullItem = BillItem & { assignments: (BillItemAssignment & { member: BillMember | null })[] }

// Photos from phone cameras are often stored sideways with the correct
// orientation only recorded in EXIF. Re-drawing to a canvas bakes the
// EXIF orientation into the pixels so the vision model always sees an
// upright image, and downscaling keeps the upload/inference fast.
async function normalizeImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const maxEdge = 1800
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    return blob ?? file
  } catch {
    return file
  }
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
  const toast = useToast()
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<FullItem[]>(initialItems)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [showSettle, setShowSettle] = useState(false)
  const [showEditBill, setShowEditBill] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({ name: '', price: '', qty: '1' })
  const [showAddItem, setShowAddItem] = useState(false)
  const [showUploadSource, setShowUploadSource] = useState(false)

  // Compute per-member totals
  const memberTotals = members.map(m => {
    const total = items.reduce((sum, item) => {
      const assignment = item.assignments?.find(a => a.member_id === m.id)
      return sum + (assignment?.share_amount ?? 0)
    }, 0)
    return { ...m, total }
  })

  const grandTotal = items.reduce((s, item) => s + item.price * item.quantity, 0)
  const isSettled = bill.is_settled

  // Upload & scan receipt
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setScanning(true)
    setScanError(null)

    try {
      // Normalize orientation/size before upload so sideways camera
      // photos don't confuse the vision model
      const normalized = await normalizeImage(file)

      // Upload to Supabase storage, with retries — mobile uploads (esp.
      // right after the native camera/gallery sheet closes) can hit a
      // transient network blip that has nothing to do with the photo itself
      const { data: { session } } = await supabase.auth.getSession()
      const path = `${session!.user.id}/${bill.id}/${Date.now()}.jpg`
      let uploadError: Error | null = null
      for (let attempt = 0; attempt <= 2; attempt++) {
        const { error } = await supabase.storage.from('receipts').upload(path, normalized, { contentType: 'image/jpeg' })
        uploadError = error
        if (!error) break
        if (attempt < 2) await new Promise(r => setTimeout(r, 700 * (attempt + 1)))
      }
      if (uploadError) {
        console.error('Upload failed after retries:', uploadError)
        setScanError('Gagal upload foto, cek koneksi internet dan coba lagi.')
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(path)

      // Call Gemini Vision API route
      const res = await fetch('/api/bills/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId: bill.id, imageUrl: publicUrl }),
      })
      const scanned: ScannedReceipt = await res.json()

      if (scanned.error) {
        setScanError(scanned.error)
        return
      }

      if (scanned.items?.length) {
        // DB rejects negative prices (used to represent discounts), and a
        // single bad row fails the whole batch insert — clamp defensively
        // in case the model still emits one despite the prompt telling it not to
        const insertItems = scanned.items.map(i => ({ bill_id: bill.id, name: i.name, price: Math.max(0, i.price), quantity: i.quantity }))

        // Insert scanned items to DB
        const { data: newItems, error: insertError } = await supabase
          .from('bill_items')
          .insert(insertItems)
          .select()

        if (insertError) {
          console.error('Insert items failed:', insertError)
          setScanError('Gagal simpan item hasil scan, coba lagi.')
          return
        }

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
      } else {
        setScanError('Nggak ketemu item di foto ini. Coba foto yang lebih jelas/terang, atau tambah manual.')
      }
    } catch (err) {
      console.error('Scan failed:', err)
      setScanError('Scan gagal, coba lagi.')
    } finally {
      setScanning(false)
    }
  }

  // Add item manually
  const addItem = async () => {
    const price = parseFloat(newItem.price.replace(/[^0-9]/g, ''))
    const qty = parseInt(newItem.qty) || 1
    if (!newItem.name.trim() || !price) return

    const { data: item, error } = await supabase
      .from('bill_items')
      .insert({ bill_id: bill.id, name: newItem.name.trim(), price, quantity: qty })
      .select()
      .single()

    if (error || !item) {
      toast.show('Gagal tambah item, coba lagi.', 'error')
      return
    }

    // Create FullItem with empty assignments array
    const newFullItem: FullItem = {
      ...item,
      assignments: []
    }
    setItems(prev => [...prev, newFullItem])
    await supabase.from('bills').update({ total: grandTotal + price * qty }).eq('id', bill.id)
    setNewItem({ name: '', price: '', qty: '1' })
    setShowAddItem(false)
    toast.show('Item ditambahkan.')
  }

  // Edit item name/price/qty. Assignments only get auto-recalculated when
  // they were an equal split before the edit — custom (manually-adjusted)
  // splits are left untouched since the model has no idea what the user's
  // new intent for them is, but the totals may now be off so we flag it.
  const editItem = async (itemId: string, updates: { name: string; price: number; quantity: number }) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const oldLineTotal = item.price * item.quantity
    const newLineTotal = updates.price * updates.quantity

    const { error } = await supabase.from('bill_items').update(updates).eq('id', itemId)
    if (error) {
      toast.show('Gagal update item, coba lagi.', 'error')
      return
    }

    const assignedIds = item.assignments?.map(a => a.member_id) ?? []
    const oldPerPerson = assignedIds.length > 0 ? oldLineTotal / assignedIds.length : 0
    const wasEqualSplit = item.assignments?.every(a => Math.abs(a.share_amount - oldPerPerson) < 0.01) ?? true

    let updatedAssignments = item.assignments
    if (assignedIds.length > 0 && wasEqualSplit) {
      const newPerPerson = newLineTotal / assignedIds.length
      await supabase.from('bill_item_assignments').delete().eq('bill_item_id', itemId)
      const { data: newAssignments } = await supabase
        .from('bill_item_assignments')
        .insert(assignedIds.map(mid => ({ bill_item_id: itemId, member_id: mid, share_amount: newPerPerson })))
        .select('*, member:bill_members(*)')
      updatedAssignments = (newAssignments as FullItem['assignments']) ?? []
    } else if (assignedIds.length > 0) {
      toast.show('Item diubah — porsi custom-nya mungkin perlu dicek ulang.', 'error')
    }

    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates, assignments: updatedAssignments ?? [] } : i))
    await supabase.from('bills').update({ total: grandTotal - oldLineTotal + newLineTotal }).eq('id', bill.id)
    toast.show('Item diperbarui.')
  }

  // Delete confirmation is handled by a ConfirmDialog in the render below;
  // this just performs the deletion once the user confirms.
  const confirmDeleteItem = async () => {
    const itemId = deletingItemId
    if (!itemId) return
    const item = items.find(i => i.id === itemId)
    if (!item) { setDeletingItemId(null); return }

    const lineTotal = item.price * item.quantity
    const { error } = await supabase.from('bill_items').delete().eq('id', itemId)
    setDeletingItemId(null)
    if (error) {
      toast.show('Gagal hapus item, coba lagi.', 'error')
      return
    }
    setItems(prev => prev.filter(i => i.id !== itemId))
    await supabase.from('bills').update({ total: grandTotal - lineTotal }).eq('id', bill.id)
    toast.show('Item dihapus.')
  }

  // Replace an item's assignments with an exact (non-equal) split
  const customSplit = async (itemId: string, shares: { member_id: string; share_amount: number }[]) => {
    await supabase.from('bill_item_assignments').delete().eq('bill_item_id', itemId)

    if (shares.length === 0) {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, assignments: [] } : i))
      return
    }

    const { data: newAssignments, error } = await supabase
      .from('bill_item_assignments')
      .insert(shares.map(s => ({ bill_item_id: itemId, member_id: s.member_id, share_amount: s.share_amount })))
      .select('*, member:bill_members(*)')

    if (error) {
      toast.show('Gagal simpan porsi, coba lagi.', 'error')
      return
    }
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, assignments: (newAssignments as FullItem['assignments']) ?? [] } : i))
    toast.show('Porsi item disimpan.')
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
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl text-slice-dark">{bill.title}</h1>
            {isSettled && (
              <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 border border-green-200 rounded-full px-2 py-0.5"><Check size={12} /> Lunas</span>
            )}
            {!isSettled && (
              <button
                onClick={() => setShowEditBill(true)}
                title="Kelola tagihan & orang"
                className="p-1 text-slice-text-dim hover:text-slice-orange transition-colors"
              >
                <Settings size={16} />
              </button>
            )}
          </div>
          <p className="text-slice-muted text-sm font-receipt">{bill.date} · {bill.currency}</p>
        </div>
        <div className="text-right">
          <p className="text-slice-text-dim text-xs font-receipt">Total</p>
          <p className="font-display text-slice-orange text-2xl">{formatMoney(grandTotal, bill.currency)}</p>
        </div>
      </div>

      {/* Member summary cards */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {memberTotals.map(m => (
          <SummaryCard key={m.id} member={m} total={m.total} currency={bill.currency} />
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
          {!isSettled && (
            <div className="flex items-center gap-2">
              {/* Upload button */}
              <button
                onClick={() => setShowUploadSource(true)}
                disabled={scanning}
                className="flex items-center gap-1.5 bg-white border border-slice-border rounded-xl px-3 py-2 text-sm text-slice-dark hover:border-slice-orange/40 transition-all text-xs font-medium disabled:opacity-60"
              >
                {scanning ? <><Loader2 size={14} className="animate-spin" /> Scanning...</> : <><Upload size={14} /> Upload</>}
              </button>
              <button
                onClick={() => setShowAddItem(true)}
                className="flex items-center gap-1 bg-slice-orange text-white rounded-xl px-3 py-2 text-xs font-medium hover:bg-slice-orange-light transition-all"
              >
                <Plus size={14} /> Item
              </button>
            </div>
          )}
          {!isSettled && (
            <>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleUpload} />
              <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </>
          )}
        </div>

        {showUploadSource && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUploadSource(false)} />
            <div className="relative w-full max-w-xs bg-white rounded-2xl shadow-2xl animate-bounce-in p-5">
              <h3 className="font-display text-lg text-slice-dark">Upload struk</h3>
              <p className="text-slice-muted text-sm mt-1">Ambil foto dari mana?</p>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => { setShowUploadSource(false); cameraRef.current?.click() }}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-xl border border-slice-border hover:border-slice-orange/40 hover:bg-slice-surface transition-all"
                >
                  <Camera size={20} className="text-slice-orange" />
                  <span className="text-sm font-medium text-slice-dark">Kamera</span>
                </button>
                <button
                  onClick={() => { setShowUploadSource(false); galleryRef.current?.click() }}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-xl border border-slice-border hover:border-slice-orange/40 hover:bg-slice-surface transition-all"
                >
                  <ImageIcon size={20} className="text-slice-orange" />
                  <span className="text-sm font-medium text-slice-dark">Galeri</span>
                </button>
              </div>
              <button
                onClick={() => setShowUploadSource(false)}
                className="w-full mt-2 py-2 rounded-xl text-sm font-medium text-slice-muted hover:bg-slice-surface transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {scanError && (
          <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between gap-2">
            <p className="text-red-600 text-xs">{scanError}</p>
            <button onClick={() => setScanError(null)} className="text-red-400 hover:text-red-600 text-xs shrink-0"><X size={14} /></button>
          </div>
        )}

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
                currency={bill.currency}
                readOnly={isSettled}
                onToggle={(memberId) => toggleAssign(item.id, memberId)}
                onEdit={isSettled ? undefined : (updates) => editItem(item.id, updates)}
                onDelete={isSettled ? undefined : () => setDeletingItemId(item.id)}
                onCustomSplit={isSettled ? undefined : (shares) => customSplit(item.id, shares)}
              />
            ))
          )}
        </div>

        {/* Add item form */}
        {!isSettled && showAddItem && (
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
              <span className="text-slice-orange font-bold text-xl">{formatMoney(grandTotal, bill.currency)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Settle button */}
      {!isSettled && items.length > 0 && (
        <button
          onClick={() => setShowSettle(true)}
          className="w-full flex items-center justify-center gap-2 bg-slice-dark text-white rounded-2xl py-4 font-display text-xl hover:bg-gray-800 active:scale-[0.98] transition-all shadow-md"
        >
          <Scissors size={20} /> Hitung Siapa Bayar Berapa
        </button>
      )}

      {showSettle && (
        <SettleModal
          bill={bill}
          members={memberTotals}
          items={items}
          onClose={() => setShowSettle(false)}
        />
      )}

      {showEditBill && (
        <EditBillModal
          bill={bill}
          members={members}
          onClose={() => setShowEditBill(false)}
          onSaved={() => {
            setShowEditBill(false)
            router.refresh()
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingItemId}
        title="Hapus item?"
        message="Item dan pembagiannya bakal ikut kehapus, ga bisa di-undo."
        confirmLabel="Hapus"
        danger
        onConfirm={confirmDeleteItem}
        onCancel={() => setDeletingItemId(null)}
      />
    </div>
  )
}