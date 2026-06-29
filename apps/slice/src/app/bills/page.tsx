import { createServerSupabaseClient } from '../../../../../packages/supabase/src/server'
import BillsList from '../../components/bills/BillsList'

export default async function BillsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return <div>Please log in to view your bills.</div>
  }

  const { data: bills } = await supabase
    .from('bills')
    .select('*, members:bill_members(*)')
    .eq('owner_id', session.user.id)
    .eq('is_settled', false)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-slice-dark">Tagihan Aktif</h1>
          <p className="text-slice-muted text-sm mt-0.5">{bills?.length ?? 0} tagihan belum diselesaikan</p>
        </div>
      </div>
      <BillsList bills={bills ?? []} />
    </div>
  )
}