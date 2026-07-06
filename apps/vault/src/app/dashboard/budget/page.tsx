import { createServerSupabaseClient } from '../../../../../../packages/supabase/src/server'
import BudgetManager from '@/components/budget/BudgetManager'
import { t } from '@/lib/i18n'
import { getServerLocale } from '@/lib/getServerLocale'

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  const locale = getServerLocale()

  const now = new Date()
  const month = parseInt(searchParams.month ?? String(now.getMonth() + 1))
  const year = parseInt(searchParams.year ?? String(now.getFullYear()))

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const [{ data: categories }, { data: budgets }, { data: transactions }] = await Promise.all([
    supabase.from('categories').select('*').eq('user_id', session!.user.id),
    supabase.from('budgets').select('*, category:categories(*)').eq('user_id', session!.user.id).eq('month', month).eq('year', year),
    supabase.from('transactions').select('amount, type, category_id').eq('user_id', session!.user.id).eq('type', 'expense').is('transfer_group_id', null).gte('date', startDate).lte('date', endDate),
  ])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-vault-text-dim text-sm font-mono uppercase tracking-widest">{t(locale, 'budgetBreadcrumb')}</p>
        <h1 className="font-display text-4xl md:text-5xl text-vault-text tracking-wider mt-1">{t(locale, 'budgetTitle')}</h1>
      </div>
      <BudgetManager
        categories={categories ?? []}
        budgets={budgets ?? []}
        transactions={transactions ?? []}
        month={month}
        year={year}
      />
    </div>
  )
}
