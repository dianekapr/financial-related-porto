import { createServerSupabaseClient } from '@portfolio/supabase'
import { cookies } from 'next/headers'
import TransactionList from '@/components/transactions/TransactionList'
import { format } from 'date-fns'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string; type?: string }
}) {
  const cookieStore = cookies()
  const supabase = createServerSupabaseClient(cookieStore)
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

  const { data: transactions } = await query

  const income = transactions?.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) ?? 0
  const expense = transactions?.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-vault-text-dim text-sm font-mono uppercase tracking-widest">Riwayat</p>
        <h1 className="font-display text-4xl md:text-5xl text-vault-text tracking-wider mt-1">TRANSAKSI</h1>
      </div>

      <TransactionList
        transactions={transactions ?? []}
        month={month}
        year={year}
        type={type}
        income={income}
        expense={expense}
      />
    </div>
  )
}
