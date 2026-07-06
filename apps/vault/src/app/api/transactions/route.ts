import { createServerSupabaseClient } from '../../../../../../packages/supabase/src/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const month = searchParams.get('month')
  const year = searchParams.get('year')
  const type = searchParams.get('type')

  let query = supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .eq('user_id', session.user.id)
    .order('date', { ascending: false })

  if (month && year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
    query = query.gte('date', startDate).lte('date', endDate)
  }
  if (type) query = query.eq('type', type)

  const { data, error } = await query.limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...body, user_id: session.user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (data.wallet_id) {
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('id', data.wallet_id).single()
    if (wallet) {
      const delta = data.type === 'income' ? data.amount : -data.amount
      await supabase.from('wallets').update({ balance: wallet.balance + delta }).eq('id', data.wallet_id)
    }
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  // Look up the transaction's previous effect on its wallet before updating
  // it, so we can reverse that and apply the new effect afterwards
  const { data: oldTx } = await supabase
    .from('transactions')
    .select('amount, type, wallet_id')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single()
  if (!oldTx) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: newTx, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (oldTx.wallet_id) {
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('id', oldTx.wallet_id).single()
    if (wallet) {
      const reversal = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount
      await supabase.from('wallets').update({ balance: wallet.balance + reversal }).eq('id', oldTx.wallet_id)
    }
  }
  if (newTx.wallet_id) {
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('id', newTx.wallet_id).single()
    if (wallet) {
      const delta = newTx.type === 'income' ? newTx.amount : -newTx.amount
      await supabase.from('wallets').update({ balance: wallet.balance + delta }).eq('id', newTx.wallet_id)
    }
  }

  return NextResponse.json(newTx)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Look up what this transaction did to its wallet before deleting it, so
  // we can reverse the effect and keep the wallet balance accurate
  const { data: tx } = await supabase
    .from('transactions')
    .select('amount, type, wallet_id, transfer_group_id')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single()
  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // A transfer is stored as a linked expense+income pair — deleting one leg
  // without the other would leave a dangling half-transfer, so pull in its
  // sibling and remove/reverse both together
  let sibling: { id: string; amount: number; type: string; wallet_id: string | null } | null = null
  if (tx.transfer_group_id) {
    const { data } = await supabase
      .from('transactions')
      .select('id, amount, type, wallet_id')
      .eq('transfer_group_id', tx.transfer_group_id)
      .eq('user_id', session.user.id)
      .neq('id', id)
      .maybeSingle()
    sibling = data
  }

  const idsToDelete = sibling ? [id, sibling.id] : [id]
  const { error } = await supabase
    .from('transactions')
    .delete()
    .in('id', idsToDelete)
    .eq('user_id', session.user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  for (const leg of [tx, sibling].filter((l): l is NonNullable<typeof l> => !!l)) {
    if (leg.wallet_id) {
      const { data: wallet } = await supabase.from('wallets').select('balance').eq('id', leg.wallet_id).single()
      if (wallet) {
        const reversal = leg.type === 'income' ? -leg.amount : leg.amount
        await supabase.from('wallets').update({ balance: wallet.balance + reversal }).eq('id', leg.wallet_id)
      }
    }
  }

  return NextResponse.json({ success: true })
}
