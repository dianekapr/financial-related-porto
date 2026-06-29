'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Bill, BillMember } from '@portfolio/supabase'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import CreateBillModal from './CreateBillModal'

function formatIDR(n: number) {
  return n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
}

type BillWithMembers = Bill & { members: BillMember[] }

export default function BillsList({ bills }: { bills: BillWithMembers[] }) {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="space-y-4">
      {/* Create button */}
      <button
        onClick={() => setShowCreate(true)}
        className="w-full bg-slice-orange text-white rounded-2xl py-4 font-display text-xl tracking-wide hover:bg-slice-orange-light active:scale-[0.98] transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
      >
        <span className="text-2xl">+</span> Buat Tagihan Baru
      </button>

      {/* Bills list */}
      {bills.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🧾</div>
          <p className="text-slice-muted font-receipt">Belum ada tagihan aktif.</p>
          <p className="text-slice-text-dim text-sm mt-1">Buat tagihan pertama kamu!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill, i) => (
            <Link
              key={bill.id}
              href={`/bills/${bill.id}`}
              className="block bg-white border border-slice-border rounded-2xl p-4 hover:border-slice-orange/40 hover:shadow-md transition-all animate-fade-up active:scale-[0.99]"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg text-slice-dark truncate">{bill.title}</h3>
                  <p className="text-slice-muted text-xs font-receipt mt-0.5">
                    {format(new Date(bill.date), 'd MMM yyyy', { locale: localeId })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display text-slice-orange text-lg">{formatIDR(bill.total)}</p>
                  <p className="text-slice-muted text-xs">{bill.members?.length ?? 0} orang</p>
                </div>
              </div>

              {/* Member avatars */}
              {bill.members && bill.members.length > 0 && (
                <div className="flex items-center gap-1 mt-3">
                  {bill.members.slice(0, 6).map(m => (
                    <div
                      key={m.id}
                      title={m.name}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 border-white -ml-1 first:ml-0"
                      style={{ backgroundColor: `${m.color}30`, borderColor: m.color }}
                    >
                      {m.avatar_emoji}
                    </div>
                  ))}
                  {bill.members.length > 6 && (
                    <div className="w-7 h-7 rounded-full bg-slice-border flex items-center justify-center text-xs text-slice-muted -ml-1">
                      +{bill.members.length - 6}
                    </div>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {showCreate && <CreateBillModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
