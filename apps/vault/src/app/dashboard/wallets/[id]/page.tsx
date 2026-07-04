import { createServerSupabaseClient } from '../../../../../../../packages/supabase/src/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import WalletTransactions from '@/components/wallet/WalletTransactions'
import { formatIDR } from '@/lib/money'
import { t } from '@/lib/i18n'
import { getServerLocale } from '@/lib/getServerLocale'

export default async function WalletDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  const locale = getServerLocale()

  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session!.user.id)
    .single()

  if (!wallet) notFound()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .eq('wallet_id', params.id)
    .eq('user_id', session!.user.id)
    .order('date', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/wallets" className="text-vault-text-dim text-xs font-mono hover:text-vault-gold transition-colors">
          {t(locale, 'walletBackLink')}
        </Link>
        <div className="flex items-center gap-2.5 mt-2">
          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: wallet.color }} />
          <h1 className="font-display text-4xl md:text-5xl text-vault-text tracking-wider">{wallet.name.toUpperCase()}</h1>
        </div>
        <p className="font-mono text-2xl text-vault-gold font-semibold mt-2">{formatIDR(wallet.balance)}</p>
      </div>

      <WalletTransactions transactions={transactions ?? []} />
    </div>
  )
}
