import { createServerSupabaseClient } from '../../../../../../packages/supabase/src/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { formatMoney } from '../../../lib/money'

export default async function HistoryPage() {
const supabase = createServerSupabaseClient()  
const { data: { session } } = await supabase.auth.getSession()

  const { data: bills } = await supabase
    .from('bills')
    .select('*, members:bill_members(*)')
    .eq('owner_id', session!.user.id)
    .eq('is_settled', true)
    .order('created_at', { ascending: false })

  const totalSplit = bills?.reduce((s, b) => s + b.total, 0) ?? 0

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-slice-dark">Riwayat</h1>
        <p className="text-slice-muted text-sm font-receipt mt-0.5">
          {bills?.length ?? 0} tagihan lunas · Total {formatMoney(totalSplit, 'IDR')} di-split
        </p>
      </div>

      {!bills?.length ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-slice-muted font-receipt">Belum ada riwayat tagihan lunas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map(bill => (
            <Link
              key={bill.id}
              href={`/bills/${bill.id}`}
              className="block bg-white border border-slice-border rounded-2xl p-4 opacity-80 hover:opacity-100 hover:border-slice-orange/40 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 text-xs font-medium bg-green-50 border border-green-200 rounded-full px-2 py-0.5">✓ Lunas</span>
                    <h3 className="font-display text-lg text-slice-dark">{bill.title}</h3>
                  </div>
                  <p className="text-slice-muted text-xs font-receipt mt-0.5">
                    {format(new Date(bill.date), 'd MMM yyyy', { locale: localeId })}
                    {' · '}{bill.members?.length ?? 0} orang
                  </p>
                </div>
                <p className="font-display text-slice-muted text-lg">{formatMoney(bill.total, bill.currency)}</p>
              </div>
              <div className="flex items-center gap-1 mt-3">
                {bill.members?.slice(0, 6).map((m: any) => (
                  <div key={m.id} className="w-6 h-6 rounded-full flex items-center justify-center text-sm -ml-1 first:ml-0 border border-white"
                    style={{ backgroundColor: `${m.color}30` }}>
                    {m.avatar_emoji}
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
