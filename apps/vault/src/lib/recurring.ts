import { addDays, addWeeks, addMonths, format } from 'date-fns'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { RecurringFrequency } from '@portfolio/supabase'

function advance(dateStr: string, frequency: RecurringFrequency): string {
  const d = new Date(`${dateStr}T00:00:00`)
  const next = frequency === 'daily' ? addDays(d, 1) : frequency === 'weekly' ? addWeeks(d, 1) : addMonths(d, 1)
  return format(next, 'yyyy-MM-dd')
}

// A rule can go dormant for a long time (user away, or a stale 'daily'
// rule) — cap how many missed occurrences get backfilled in one pass so a
// single dashboard load can't spawn an unbounded number of transactions
const MAX_BACKFILL = 366

// Turns any recurring rule whose next_run_date has arrived into real
// transactions, applying the same wallet-balance bookkeeping the manual
// add/edit/delete endpoints use. Called when the dashboard loads.
export async function processDueRecurring(supabase: SupabaseClient, userId: string) {
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: due } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .lte('next_run_date', today)

  if (!due || due.length === 0) return

  for (const rule of due) {
    const occurrences: string[] = []
    let cursor = rule.next_run_date as string
    while (cursor <= today && occurrences.length < MAX_BACKFILL) {
      occurrences.push(cursor)
      cursor = advance(cursor, rule.frequency)
    }
    if (occurrences.length === 0) continue

    const { data: inserted } = await supabase
      .from('transactions')
      .insert(occurrences.map(date => ({
        user_id: userId,
        amount: rule.amount,
        type: rule.type,
        category_id: rule.category_id,
        wallet_id: rule.wallet_id,
        note: rule.note,
        date,
        recurring_id: rule.id,
      })))
      .select('amount, type, wallet_id')

    if (rule.wallet_id && inserted?.length) {
      const delta = inserted.reduce((s, tx) => s + (tx.type === 'income' ? tx.amount : -tx.amount), 0)
      const { data: wallet } = await supabase.from('wallets').select('balance').eq('id', rule.wallet_id).single()
      if (wallet) await supabase.from('wallets').update({ balance: wallet.balance + delta }).eq('id', rule.wallet_id)
    }

    await supabase.from('recurring_transactions').update({ next_run_date: cursor }).eq('id', rule.id)
  }
}
