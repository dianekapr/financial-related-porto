import { createServerSupabaseClient } from '@portfolio/supabase'
import { notFound } from 'next/navigation'
import BillDetail from '../../../components/bills/BillDetail'

export default async function BillDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return notFound()
  }

  const [{ data: bill }, { data: members }, { data: items }] = await Promise.all([
    supabase.from('bills').select('*').eq('id', params.id).eq('owner_id', session.user.id).single(),
    supabase.from('bill_members').select('*').eq('bill_id', params.id),
    supabase.from('bill_items').select('*, assignments:bill_item_assignments(*, member:bill_members(*))').eq('bill_id', params.id),
  ])

  if (!bill) notFound()

  return (
    <BillDetail
      bill={bill}
      members={members ?? []}
      items={items ?? []}
    />
  )
}