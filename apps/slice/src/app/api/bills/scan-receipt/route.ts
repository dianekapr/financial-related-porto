import { createServerSupabaseClient } from '../../../../../../../packages/supabase/src/server'
import { NextResponse } from 'next/server'
import type { ScannedReceipt } from '@portfolio/supabase'

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { billId, imageUrl } = await req.json()
  if (!billId || !imageUrl) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  try {
    // Fetch image and convert to base64
    const imgRes = await fetch(imageUrl)
    const imgBuffer = await imgRes.arrayBuffer()
    const base64 = Buffer.from(imgBuffer).toString('base64')
    const mimeType = imgRes.headers.get('content-type') ?? 'image/jpeg'

    const prompt = `Kamu adalah AI yang mengekstrak data dari foto struk/bill/receipt.
Analisis gambar ini dan ekstrak semua item beserta harganya.
Kembalikan HANYA JSON valid dengan format berikut, tidak ada teks lain, tidak ada markdown code block:

{
  "title": "Nama toko/restoran jika terlihat, atau null",
  "total": total_angka_numerik_atau_null,
  "items": [
    { "name": "Nama item", "price": harga_satuan_numerik, "quantity": jumlah_integer }
  ]
}

Aturan:
- Harga dalam Rupiah (IDR) tanpa simbol, hanya angka
- Jika ada diskon, kurangi langsung dari item terkait atau buat item terpisah dengan harga negatif
- Jika quantity tidak terlihat, asumsikan 1
- Gunakan bahasa Indonesia untuk nama item jika memungkinkan
- Jika gambar bukan struk, kembalikan: {"title": null, "total": null, "items": []}`

    // Call Google Gemini Vision (gemini-1.5-flash - free tier generous)
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64 } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('Gemini API error:', errText)
      return NextResponse.json({ error: 'Scan failed', items: [], total: null, title: null }, { status: 500 })
    }

    const geminiData = await geminiRes.json()
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'

    // Parse JSON from Gemini response
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