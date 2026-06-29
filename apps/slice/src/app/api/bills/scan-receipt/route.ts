import { createServerSupabaseClient } from '../../../../../../../packages/supabase/src/server'
import { NextResponse } from 'next/server'
import type { ScannedReceipt } from '@portfolio/supabase'

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient() // ← Tidak perlu passing cookies
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { billId, imageUrl } = await req.json()
  if (!billId || !imageUrl) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  try { 
    // Fetch image and convert to base64
    const imgRes = await fetch(imageUrl)
    const imgBuffer = await imgRes.arrayBuffer()
    const base64 = Buffer.from(imgBuffer).toString('base64')
    const mimeType = imgRes.headers.get('content-type') ?? 'image/jpeg'

    // Call Claude Vision
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mimeType, data: base64 },
              },
              {
                type: 'text',
                text: `Kamu adalah AI yang mengekstrak data dari foto struk/bill/receipt.
Analisis gambar ini dan ekstrak semua item beserta harganya.
Kembalikan HANYA JSON valid dengan format berikut, tidak ada teks lain:

{
  "title": "Nama toko/restoran jika terlihat, atau null",
  "total": total_angka_numerik_atau_null,
  "items": [
    { "name": "Nama item", "price": harga_satuan_numerik, "quantity": jumlah_integer }
  ]
}

Aturan:
- Harga dalam Rupiah (IDR) tanpa simbol, hanya angka
- Jika ada pajak/service charge, tambahkan sebagai item terpisah
- Jika quantity tidak terlihat, asumsikan 1
- Gunakan bahasa Indonesia untuk nama item jika memungkinkan
- Jika gambar bukan struk, kembalikan: {"title": null, "total": null, "items": []}`,
              },
            ],
          },
        ],
      }),
    })

    const claudeData = await claudeRes.json()
    const text = claudeData.content?.[0]?.text ?? '{}'

    // Parse JSON from Claude response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed: ScannedReceipt = jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [], total: null, title: null }

    // Update bill receipt_url
    await supabase.from('bills').update({ receipt_url: imageUrl }).eq('id', billId)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Vision scan error:', err)
    return NextResponse.json({ error: 'Scan failed', items: [], total: null, title: null }, { status: 500 })
  }
}