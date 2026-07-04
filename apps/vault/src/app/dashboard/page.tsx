import { createServerSupabaseClient } from '../../../../../packages/supabase/src/server'
import { format } from 'date-fns'
import SummaryCards from '@/components/dashboard/SummaryCards'
import TransactionTicker from '@/components/dashboard/TransactionTicker'
import BudgetGauge from '@/components/dashboard/BudgetGauge'
import MonthlyChart from '@/components/dashboard/MonthlyChart'
import { formatIDR } from '@/lib/money'
import { t } from '@/lib/i18n'
import { getServerLocale } from '@/lib/getServerLocale'
import { getDateLocale } from '@/lib/dateLocale'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  const locale = getServerLocale()

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  // Fetch current month transactions
  const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`
  const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0]

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .eq('user_id', session!.user.id)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)
    .order('date', { ascending: false })

  // Compute summary
  const income = transactions?.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0) ?? 0
  const expense = transactions?.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0) ?? 0

  // Fetch budgets with spending
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('user_id', session!.user.id)
    .eq('month', month)
    .eq('year', year)

  // Fetch last 6 months for chart
  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('amount, type, date')
    .eq('user_id', session!.user.id)
    .gte('date', `${year - 1}-${String(month).padStart(2, '0')}-01`)
    .order('date', { ascending: true })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-vault-text-dim text-sm font-mono uppercase tracking-widest">
            {format(now, 'MMMM yyyy', { locale: getDateLocale(locale) })}
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-vault-text tracking-wider mt-1">
            {t(locale, 'dashboardSummary')}
          </h1>
        </div>
        <div className="text-right">
          <p className="text-vault-text-dim text-xs font-mono">{t(locale, 'dashboardBalance')}</p>
          <p className={`font-mono text-2xl font-semibold ${income - expense >= 0 ? 'text-vault-gold' : 'text-vault-red'}`}>
            {formatIDR(income - expense)}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <SummaryCards income={income} expense={expense} txCount={transactions?.length ?? 0} />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions ticker - 2/3 width */}
        <div className="lg:col-span-2">
          <TransactionTicker transactions={transactions ?? []} />
        </div>

        {/* Budget gauges - 1/3 width */}
        <div>
          <BudgetGauge budgets={budgets ?? []} transactions={transactions ?? []} />
        </div>
      </div>

      {/* Monthly chart */}
      <MonthlyChart transactions={allTransactions ?? []} />
    </div>
  )
}
