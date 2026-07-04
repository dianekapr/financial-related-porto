import { createServerSupabaseClient } from '../../../../../../packages/supabase/src/server'
import WalletManager from '@/components/wallet/WalletManager'

export default async function WalletsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: wallets } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', session!.user.id)
    .order('created_at')

  return (
    <div className="space-y-6">
      <div>
        <p className="text-vault-text-dim text-sm font-mono uppercase tracking-widest">Pengelolaan</p>
        <h1 className="font-display text-4xl md:text-5xl text-vault-text tracking-wider mt-1">WALLET</h1>
      </div>
      <WalletManager wallets={wallets ?? []} />
    </div>
  )
}
