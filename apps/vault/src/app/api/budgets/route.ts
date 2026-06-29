import { createServerSupabaseClient } from '@portfolio/supabase'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cookieStore = cookies()
  const supabase = createServerSupabaseClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const month = searchParams.get('month')
  const year = searchParams.get('year')

  let query = supabase.from('budgets').select('*, category:categories(*)').eq('user_id', session.user.id)
  if (month) query = query.eq('month', month)
  if (year) query = query.eq('year', year)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createServerSupabaseClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('budgets')
    .upsert({ ...body, user_id: session.user.id }, { onConflict: 'user_id,category_id,month,year' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
