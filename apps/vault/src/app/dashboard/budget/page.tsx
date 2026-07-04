import { createServerSupabaseClient } from '../../../../../../packages/supabase/src/server'
import BudgetManager from '@/components/budget/BudgetManager'

export default async function BudgetPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const [{ data: categories }, { data: budgets }, { data: transactions }] = await Promise.all([
    supabase.from('categories').select('*').eq('user_id', session!.user.id),
    supabase.from('budgets').select('*, category:categories(*)').eq('user_id', session!.user.id).eq('month', month).eq('year', year),
    supabase.from('transactions').select('amount, type, category_id').eq('user_id', session!.user.id).eq('type', 'expense').gte('date', startDate).lte('date', endDate),
  ])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-vault-text-dim text-sm font-mono uppercase tracking-widest">Pengelolaan</p>
        <h1 className="font-display text-4xl md:text-5xl text-vault-text tracking-wider mt-1">BUDGET</h1>
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
