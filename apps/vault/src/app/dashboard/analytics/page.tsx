import { createServerSupabaseClient } from '@portfolio/supabase'
import { cookies } from 'next/headers'
import AnalyticsCharts from '@/components/analytics/AnalyticsCharts'

export default async function AnalyticsPage() {
  const cookieStore = cookies()
  const supabase = createServerSupabaseClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()

  // Last 12 months
  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .eq('user_id', session!.user.id)
    .gte('date', twelveMonthsAgo.toISOString().split('T')[0])
    .order('date', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-vault-text-dim text-sm font-mono uppercase tracking-widest">Laporan</p>
        <h1 className="font-display text-4xl md:text-5xl text-vault-text tracking-wider mt-1">ANALITIK</h1>
      </div>
      <AnalyticsCharts transactions={transactions ?? []} />
    </div>
  )
}
