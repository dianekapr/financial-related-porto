'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@portfolio/supabase'
import type { Bill, BillMember, BillItem, BillItemAssignment } from '@portfolio/supabase'
import { formatMoney } from '../../lib/money'

type MemberWithTotal = BillMember & { total: number }
type ItemWithAssignments = BillItem & { assignments: (BillItemAssignment & { member: BillMember | null })[] }

// One person fronted the whole bill — everyone else pays back exactly
// what they ordered (their `total`), directly to the payer.
function computeSettlement(members: MemberWithTotal[], payerId: string) {
  return members
    .filter(m => m.id !== payerId && m.total > 0.01)
    .map(m => ({ from: m, amount: m.total }))
}

// Renders a shareable "rincian" (breakdown) receipt image for one person:
// just the items they're on the hook for, their total, and who to pay.
// wa.me links can only pre-fill text (WhatsApp has no URL param for
// attaching an image), so this image is meant to go through the Web
// Share API's native share sheet alongside the text instead.
async function buildReceiptImage(
  member: MemberWithTotal,
  items: ItemWithAssignments[],
  bill: Bill,
  payer: MemberWithTotal | undefined,
  amount: number
): Promise<Blob | null> {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('700 24px "Fredoka One"'),
        document.fonts.load('400 15px "Courier Prime"'),
        document.fonts.load('700 15px "Courier Prime"'),
      ]),
      new Promise(resolve => setTimeout(resolve, 500)),
    ])
  } catch {
    // fall through with system fonts
  }

  const myItems = items
    .map(item => ({ item, assignment: item.assignments?.find(a => a.member_id === member.id) }))
    .filter((x): x is { item: ItemWithAssignments; assignment: BillItemAssignment & { member: BillMember | null } } => !!x.assignment)

  const width = 640
  const padX = 48
  const lineH = 34
  const headerH = 190
  const footerH = payer && member.id !== payer.id ? 150 : 70
  const height = headerH + myItems.length * lineH + 90 + footerH

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const colors = {
    bg: '#FFFFFF',
    receipt: '#F5F0E0',
    border: '#E8E0C8',
    orange: '#FF5E1A',
    dark: '#2D2D2D',
    muted: '#8A8070',
  }

  ctx.fillStyle = colors.bg
  ctx.fillRect(0, 0, width, height)

  // Header
  ctx.fillStyle = colors.receipt
  ctx.fillRect(0, 0, width, headerH)
  ctx.fillStyle = colors.dark
  ctx.font = '700 30px "Fredoka One", sans-serif'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(`${member.avatar_emoji} ${member.name}`, padX, 66)
  ctx.font = '400 16px "Courier Prime", monospace'
  ctx.fillStyle = colors.muted
  ctx.fillText(`Tagihan "${bill.title}" · ${bill.date}`, padX, 96)
  ctx.font = '700 13px "Courier Prime", monospace'
  ctx.fillStyle = colors.orange
  ctx.fillText('SLICE — RINCIAN KAMU', padX, 130)

  const dashedLine = (y: number) => {
    ctx.strokeStyle = colors.border
    ctx.lineWidth = 2
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    ctx.moveTo(padX, y)
    ctx.lineTo(width - padX, y)
    ctx.stroke()
    ctx.setLineDash([])
  }
  dashedLine(headerH - 20)

  // Items
  let y = headerH + 30
  ctx.font = '400 16px "Courier Prime", monospace'
  if (myItems.length === 0) {
    ctx.fillStyle = colors.muted
    ctx.fillText('(belum ada item di-assign)', padX, y)
    y += lineH
  } else {
    for (const { item, assignment } of myItems) {
      const assignees = item.assignments?.length ?? 1
      ctx.fillStyle = colors.dark
      const label = assignees > 1 ? `${item.name} (÷${assignees})` : item.name
      ctx.fillText(label, padX, y)
      ctx.textAlign = 'right'
      ctx.fillText(formatMoney(assignment.share_amount, bill.currency), width - padX, y)
      ctx.textAlign = 'left'
      y += lineH
    }
  }

  y += 10
  dashedLine(y)
  y += 40

  // Total
  ctx.font = '700 20px "Courier Prime", monospace'
  ctx.fillStyle = colors.dark
  ctx.fillText('TOTAL', padX, y)
  ctx.textAlign = 'right'
  ctx.fillStyle = colors.orange
  ctx.fillText(formatMoney(member.total, bill.currency), width - padX, y)
  ctx.textAlign = 'left'

  // Transfer instruction
  if (payer && member.id !== payer.id) {
    y += 50
    ctx.fillStyle = colors.receipt
    ctx.fillRect(padX - 8, y - 34, width - (padX - 8) * 2, 80)
    ctx.font = '400 15px "Courier Prime", monospace'
    ctx.fillStyle = colors.muted
    ctx.fillText(`Transfer ke ${payer.avatar_emoji} ${payer.name}`, padX, y)
    ctx.font = '700 26px "Fredoka One", sans-serif'
    ctx.fillStyle = colors.orange
    ctx.fillText(formatMoney(amount, bill.currency), padX, y + 34)
  }

  // Footer
  ctx.font = '400 13px "Courier Prime", monospace'
  ctx.fillStyle = colors.muted
  ctx.textAlign = 'center'
  ctx.fillText('Dibuat pake SLICE — Split bill app 🍕', width / 2, height - 24)
  ctx.textAlign = 'left'

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}

export default function SettleModal({
  bill, members, items, onClose,
}: {
  bill: Bill
  members: MemberWithTotal[]
  items: ItemWithAssignments[]
  onClose: () => void
}) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [sharingId, setSharingId] = useState<string | null>(null)
  const [payerId, setPayerId] = useState(
    members.find(m => m.user_id === bill.owner_id)?.id ?? members[0]?.id ?? ''
  )
  const payer = members.find(m => m.id === payerId)
  const settlements = payer ? computeSettlement(members, payerId) : []

  const handleSettle = async () => {
    startTransition(async () => {
      await supabase.from('bills').update({ is_settled: true }).eq('id', bill.id)
      router.push('/bills')
      onClose()
    })
  }

  const shareToWA = async (from: MemberWithTotal, amount: number) => {
    if (!payer) return
    const text = `Hei ${from.name}! Tagihan "${bill.title}" udah dihitung nih 🧾\n` +
      `Kamu perlu transfer ${formatMoney(amount, bill.currency)} ke ${payer.name} ya! Rincian di gambar ya 👆\n\n` +
      `Dibuat pake SLICE — Split bill app 🍕`

    setSharingId(from.id)
    try {
      const blob = await buildReceiptImage(from, items, bill, payer, amount)
      const file = blob ? new File([blob], `rincian-${from.name}.png`, { type: 'image/png' }) : null

      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: `Rincian tagihan ${bill.title}` })
        return
      }
    } catch (err) {
      // Falls through to the wa.me fallback below even on cancel/AbortError —
      // the share sheet only lists apps actually installed, so on a device
      // without the WhatsApp app it won't appear as an option at all and
      // the user has no real choice but to back out. Landing them on wa.me
      // (opens the WhatsApp app if installed, WhatsApp Web otherwise) beats
      // a silent dead end; the cost of an extra tab if they truly meant to
      // cancel is minor.
      if ((err as Error)?.name !== 'AbortError') {
        console.error('Share with image failed, falling back to text-only:', err)
      }
    } finally {
      setSharingId(null)
    }

    // Fallback: text-only wa.me link (no image — WhatsApp has no URL param
    // for attaching files). Also where we land after the share-sheet path
    // above didn't go through, so users without the app installed still
    // get to WhatsApp/WhatsApp Web with the message pre-filled.
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl animate-print overflow-hidden">
        <div className="md:hidden w-10 h-1 bg-slice-border rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slice-border">
          <h2 className="font-display text-2xl text-slice-dark">Siapa Bayar Berapa?</h2>
          <p className="text-slice-muted text-xs font-receipt mt-1">Tagihan "{bill.title}"</p>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Who paid upfront */}
          <div>
            <label className="text-slice-muted text-xs font-receipt uppercase tracking-widest block mb-1.5">
              Siapa yang bayar duluan?
            </label>
            <select
              value={payerId}
              onChange={e => setPayerId(e.target.value)}
              className="w-full border border-slice-border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-slice-orange/60 bg-slice-surface"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.avatar_emoji} {m.name}</option>
              ))}
            </select>
          </div>

          {/* Per person breakdown */}
          <div>
            <p className="text-slice-muted text-xs font-receipt uppercase tracking-widest mb-3">Rincian per orang</p>
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{m.avatar_emoji}</span>
                    <span className="text-sm font-medium">{m.name}</span>
                    {m.id === payerId && (
                      <span className="text-[10px] text-green-600 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5">bayar duluan</span>
                    )}
                  </div>
                  <span className="font-receipt font-bold text-sm" style={{ color: m.color }}>
                    {formatMoney(m.total, bill.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <hr className="receipt-divider" />

          {/* Settlement transactions */}
          <div>
            <p className="text-slice-muted text-xs font-receipt uppercase tracking-widest mb-3">Transfer yang perlu dilakukan</p>
            {!payer ? (
              <p className="text-slice-muted text-sm font-receipt text-center py-4">
                Pilih siapa yang bayar duluan dulu.
              </p>
            ) : settlements.length === 0 ? (
              <p className="text-slice-muted text-sm font-receipt text-center py-4">
                Ga ada yang perlu transfer! 🎉
              </p>
            ) : (
              <div className="space-y-3">
                {settlements.map((s, i) => (
                  <div key={i} className="bg-slice-surface rounded-2xl p-4 border border-slice-border">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl">{s.from.avatar_emoji}</span>
                      <span className="font-medium text-sm">{s.from.name}</span>
                      <span className="text-slice-muted text-sm font-receipt">transfer ke</span>
                      <span className="text-xl">{payer.avatar_emoji}</span>
                      <span className="font-medium text-sm">{payer.name}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-display text-slice-orange text-xl">{formatMoney(s.amount, bill.currency)}</p>
                      <button
                        onClick={() => shareToWA(s.from, s.amount)}
                        disabled={sharingId === s.from.id}
                        className="flex items-center gap-1.5 bg-green-500 text-white rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-green-600 transition-all disabled:opacity-60"
                      >
                        <span>📲</span> {sharingId === s.from.id ? 'Nyiapin...' : `WA ${s.from.name}`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settle button */}
          <button
            onClick={handleSettle}
            disabled={isPending}
            className="w-full bg-slice-dark text-white rounded-xl py-3.5 font-display text-lg hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isPending ? 'Menyimpan...' : '✅ Tandai Lunas & Selesai'}
          </button>
        </div>
      </div>
    </div>
  )
}
