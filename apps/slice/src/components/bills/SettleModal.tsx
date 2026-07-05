'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@portfolio/supabase'
import type { Bill, BillMember, BillItem, BillItemAssignment } from '@portfolio/supabase'
import { formatMoney } from '../../lib/money'
import { getInitial } from '../../lib/avatar'
import { useToast } from '../Toast'
import { PartyPopper, MessageCircle, CircleCheck, Zap } from 'lucide-react'

type MemberWithTotal = BillMember & { total: number }
type ItemWithAssignments = BillItem & { assignments: (BillItemAssignment & { member: BillMember | null })[] }
type Transfer = { from: MemberWithTotal; to: MemberWithTotal; amount: number }

function MemberDot({ member, size }: { member: BillMember; size: number }) {
  return (
    <span
      className="flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold"
      style={{ backgroundColor: member.color, width: size, height: size, fontSize: size * 0.5 }}
    >
      {getInitial(member.name)}
    </span>
  )
}

const round2 = (n: number) => Math.round(n * 100) / 100

// Greedy min-cash-flow: repeatedly match the biggest net debtor against the
// biggest net creditor. Supports any number of people having fronted money
// (not just one payer) — `paid` is however much each member actually put
// down, `member.total` is however much of the itemized bill they're on the
// hook for; the gap between the two is what they owe or are owed.
// This doesn't guarantee the mathematically-fewest possible transfers, but
// it's simple, deterministic, and plenty for group-of-friends bill sizes.
function computeSettlements(members: MemberWithTotal[], paid: Record<string, number>): Transfer[] {
  const nets = members.map(m => ({ member: m, net: round2((paid[m.id] ?? 0) - m.total) }))
  const creditors = nets.filter(n => n.net > 0.01).map(n => ({ ...n })).sort((a, b) => b.net - a.net)
  const debtors = nets
    .filter(n => n.net < -0.01)
    .map(n => ({ member: n.member, net: -n.net }))
    .sort((a, b) => b.net - a.net)

  const transfers: Transfer[] = []
  let i = 0, j = 0
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i]
    const c = creditors[j]
    const amount = round2(Math.min(d.net, c.net))
    if (amount > 0.01) transfers.push({ from: d.member, to: c.member, amount })
    d.net = round2(d.net - amount)
    c.net = round2(c.net - amount)
    if (d.net <= 0.01) i++
    if (c.net <= 0.01) j++
  }
  return transfers
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
  to: { member: MemberWithTotal; amount: number }[]
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
  const transferBoxH = 92
  const footerH = 60 + to.length * transferBoxH
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
  ctx.fillText(member.name, padX, 66)
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

  // Transfer instruction(s) — one box per recipient, since one person can
  // owe several different people out of the same pot of items
  y += 50
  for (const t of to) {
    ctx.fillStyle = colors.receipt
    ctx.fillRect(padX - 8, y - 34, width - (padX - 8) * 2, 80)
    ctx.font = '400 15px "Courier Prime", monospace'
    ctx.fillStyle = colors.muted
    ctx.fillText(`Transfer ke ${t.member.name}`, padX, y)
    ctx.font = '700 26px "Fredoka One", sans-serif'
    ctx.fillStyle = colors.orange
    ctx.fillText(formatMoney(t.amount, bill.currency), padX, y + 34)
    y += transferBoxH
  }

  // Footer
  ctx.font = '400 13px "Courier Prime", monospace'
  ctx.fillStyle = colors.muted
  ctx.textAlign = 'center'
  ctx.fillText('Dibuat pake SLICE — Split bill app', width / 2, height - 24)
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
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [sharingId, setSharingId] = useState<string | null>(null)

  const potTotal = round2(members.reduce((s, m) => s + m.total, 0))
  const defaultPayer = members.find(m => m.user_id === bill.owner_id) ?? members[0]

  const [paid, setPaid] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const m of members) init[m.id] = m.id === defaultPayer?.id ? String(potTotal) : '0'
    return init
  })

  const paidNum = (id: string) => parseFloat(paid[id]) || 0
  const totalPaid = round2(members.reduce((s, m) => s + paidNum(m.id), 0))
  const remaining = round2(potTotal - totalPaid)

  const transfers = computeSettlements(members, Object.fromEntries(members.map(m => [m.id, paidNum(m.id)])))

  // One card per debtor: someone who owes money can owe several different
  // creditors out of the same pot, so group by `from` instead of rendering
  // a repeated card per pair
  const transferGroups = transfers.reduce<{ from: MemberWithTotal; to: { member: MemberWithTotal; amount: number }[] }[]>((groups, t) => {
    const existing = groups.find(g => g.from.id === t.from.id)
    if (existing) existing.to.push({ member: t.to, amount: t.amount })
    else groups.push({ from: t.from, to: [{ member: t.to, amount: t.amount }] })
    return groups
  }, [])

  const setSinglePayer = (memberId: string) => {
    setPaid(Object.fromEntries(members.map(m => [m.id, m.id === memberId ? String(potTotal) : '0'])))
  }

  const handleSettle = async () => {
    startTransition(async () => {
      if (transfers.length > 0) {
        await supabase.from('payments').insert(
          transfers.map(t => ({ bill_id: bill.id, from_member_id: t.from.id, to_member_id: t.to.id, amount: t.amount }))
        )
      }
      await supabase.from('bills').update({ is_settled: true }).eq('id', bill.id)
      toast.show('Tagihan ditandai lunas.')
      router.push('/bills')
      onClose()
    })
  }

  const shareToWA = async (group: { from: MemberWithTotal; to: { member: MemberWithTotal; amount: number }[] }) => {
    const transferLines = group.to.length > 1
      ? `Kamu perlu transfer:\n${group.to.map(t => `- ${formatMoney(t.amount, bill.currency)} ke ${t.member.name}`).join('\n')}\n\n`
      : `Kamu perlu transfer ${formatMoney(group.to[0].amount, bill.currency)} ke ${group.to[0].member.name} ya!\n\n`
    const text = `Hei ${group.from.name}! Tagihan "${bill.title}" udah dihitung nih\n` +
      transferLines +
      `Rincian di gambar ya\n\n` +
      `Dibuat pake SLICE — Split bill app`

    setSharingId(group.from.id)
    try {
      const blob = await buildReceiptImage(group.from, items, bill, group.to)
      const file = blob ? new File([blob], `rincian-${group.from.name}.png`, { type: 'image/png' }) : null

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
          {/* Who paid upfront — supports multiple people fronting money */}
          <div>
            <label className="text-slice-muted text-xs font-receipt uppercase tracking-widest block mb-2">
              Siapa udah bayar berapa duluan?
            </label>
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <MemberDot member={m} size={22} />
                  <span className="text-sm font-medium flex-1 truncate">{m.name}</span>
                  <button
                    onClick={() => setSinglePayer(m.id)}
                    title={`${m.name} bayar semua duluan`}
                    className="text-slice-text-dim hover:text-slice-orange transition-colors p-1"
                  >
                    <Zap size={14} />
                  </button>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={paid[m.id] ?? ''}
                    onChange={e => setPaid(prev => ({ ...prev, [m.id]: e.target.value.replace(/[^0-9.]/g, '') }))}
                    className="w-28 border border-slice-border rounded-lg px-2 py-1.5 text-sm font-receipt text-right focus:outline-none focus:border-slice-orange/60 bg-slice-surface"
                  />
                </div>
              ))}
            </div>
            <p className={`text-[11px] font-receipt text-right mt-1.5 ${remaining === 0 ? 'text-green-600' : 'text-orange-500'}`}>
              {remaining === 0
                ? 'Pas, semua sudah dialokasikan!'
                : remaining > 0
                  ? `Belum dialokasikan: ${formatMoney(remaining, bill.currency)}`
                  : `Kelebihan: ${formatMoney(-remaining, bill.currency)}`}
            </p>
          </div>

          <hr className="receipt-divider" />

          {/* Per person breakdown */}
          <div>
            <p className="text-slice-muted text-xs font-receipt uppercase tracking-widest mb-3">Rincian per orang</p>
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MemberDot member={m} size={18} />
                    <span className="text-sm font-medium">{m.name}</span>
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
            {transferGroups.length === 0 ? (
              <p className="flex items-center justify-center gap-1.5 text-slice-muted text-sm font-receipt text-center py-4">
                Ga ada yang perlu transfer! <PartyPopper size={16} />
              </p>
            ) : (
              <div className="space-y-3">
                {transferGroups.map(g => {
                  const groupTotal = g.to.reduce((s, t) => s + t.amount, 0)
                  return (
                    <div key={g.from.id} className="bg-slice-surface rounded-2xl p-4 border border-slice-border">
                      <div className="flex items-center gap-2 flex-wrap">
                        <MemberDot member={g.from} size={20} />
                        <span className="font-medium text-sm">{g.from.name}</span>
                        <span className="text-slice-muted text-sm font-receipt">perlu transfer</span>
                      </div>
                      <div className="space-y-1.5 mt-2.5 pl-1">
                        {g.to.map(t => (
                          <div key={t.member.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slice-muted text-xs font-receipt">ke</span>
                              <MemberDot member={t.member} size={16} />
                              <span className="text-xs font-medium">{t.member.name}</span>
                            </div>
                            <span className="font-receipt font-bold text-xs" style={{ color: t.member.color }}>
                              {formatMoney(t.amount, bill.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-dashed border-slice-border">
                        <p className="font-display text-slice-orange text-xl">{formatMoney(groupTotal, bill.currency)}</p>
                        <button
                          onClick={() => shareToWA(g)}
                          disabled={sharingId === g.from.id}
                          className="flex items-center gap-1.5 bg-green-500 text-white rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-green-600 transition-all disabled:opacity-60"
                        >
                          <MessageCircle size={14} /> {sharingId === g.from.id ? 'Nyiapin...' : `WA ${g.from.name}`}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Settle button */}
          <button
            onClick={handleSettle}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-slice-dark text-white rounded-xl py-3.5 font-display text-lg hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isPending ? 'Menyimpan...' : <><CircleCheck size={20} /> Tandai Lunas & Selesai</>}
          </button>
        </div>
      </div>
    </div>
  )
}
