import { createServerSupabaseClient } from '../../../../../../packages/supabase/src/server'
import TransactionList from '@/components/transactions/TransactionList'
import { t } from '@/lib/i18n'
import { getServerLocale } from '@/lib/getServerLocale'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string; type?: string }
}) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  const now = new Date()
  const month = parseInt(searchParams.month ?? String(now.getMonth() + 1))
  const year = parseInt(searchParams.year ?? String(now.getFullYear()))
  const type = searchParams.type ?? 'all'

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  let query = supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .eq('user_id', session!.user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  if (type !== 'all') query = query.eq('type', type)

  const [{ data: transactions }, { data: wallets }] = await Promise.all([
    query,
    supabase.from('wallets').select('balance').eq('user_id', session!.user.id),
  ])

  const locale = getServerLocale()
  const income = transactions?.filter(tx => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0) ?? 0
  const expense = transactions?.filter(tx => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0) ?? 0
  // "Saldo" here is the real money the user has right now — the sum of
  // all wallet balances — not income-minus-expense for the filtered
  // period, which is a cash-flow number and not an actual balance
  const walletBalance = wallets?.reduce((s, w) => s + w.balance, 0) ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-vault-text-dim text-sm font-mono uppercase tracking-widest">{t(locale, 'transactionsBreadcrumb')}</p>
        <h1 className="font-display text-4xl md:text-5xl text-vault-text tracking-wider mt-1">{t(locale, 'transactionsTitle')}</h1>
      </div>

      <TransactionList
        transactions={transactions ?? []}
        month={month}
        year={year}
        type={type}
        income={income}
        expense={expense}
        walletBalance={walletBalance}
      />
    </div>
  )
}
