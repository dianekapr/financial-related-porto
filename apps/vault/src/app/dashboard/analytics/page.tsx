import { createServerSupabaseClient } from '../../../../../../packages/supabase/src/server'
import AnalyticsCharts from '@/components/analytics/AnalyticsCharts'
import { t } from '@/lib/i18n'
import { getServerLocale } from '@/lib/getServerLocale'

export default async function AnalyticsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  const locale = getServerLocale()

  const [{ data: transactions }, { data: wallets }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', session!.user.id)
      .order('date', { ascending: true }),
    supabase
      .from('wallets')
      .select('*')
      .eq('user_id', session!.user.id)
      .order('created_at'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-vault-text-dim text-sm font-mono uppercase tracking-widest">{t(locale, 'analyticsBreadcrumb')}</p>
        <h1 className="font-display text-4xl md:text-5xl text-vault-text tracking-wider mt-1">{t(locale, 'analyticsTitle')}</h1>
      </div>
      <AnalyticsCharts transactions={transactions ?? []} wallets={wallets ?? []} />
    </div>
  )
}
