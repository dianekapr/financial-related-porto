import { createServerSupabaseClient } from '../../../../../../packages/supabase/src/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { from_wallet_id, to_wallet_id, amount, note, date } = await req.json()
  if (!from_wallet_id || !to_wallet_id || from_wallet_id === to_wallet_id) {
    return NextResponse.json({ error: 'Two distinct wallets are required' }, { status: 400 })
  }
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
  }

  const [{ data: fromWallet }, { data: toWallet }] = await Promise.all([
    supabase.from('wallets').select('balance').eq('id', from_wallet_id).eq('user_id', session.user.id).single(),
    supabase.from('wallets').select('balance').eq('id', to_wallet_id).eq('user_id', session.user.id).single(),
  ])
  if (!fromWallet || !toWallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })

  const transferGroupId = crypto.randomUUID()
  const { data: legs, error } = await supabase
    .from('transactions')
    .insert([
      { user_id: session.user.id, amount, type: 'expense', wallet_id: from_wallet_id, category_id: null, note: note || null, date, transfer_group_id: transferGroupId },
      { user_id: session.user.id, amount, type: 'income', wallet_id: to_wallet_id, category_id: null, note: note || null, date, transfer_group_id: transferGroupId },
    ])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await Promise.all([
    supabase.from('wallets').update({ balance: fromWallet.balance - amount }).eq('id', from_wallet_id),
    supabase.from('wallets').update({ balance: toWallet.balance + amount }).eq('id', to_wallet_id),
  ])

  return NextResponse.json(legs, { status: 201 })
}
