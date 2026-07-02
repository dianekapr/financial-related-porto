import { createServerSupabaseClient } from '../../../../../../../packages/supabase/src/server'
import { NextResponse } from 'next/server'
import type { ScannedReceipt } from '@portfolio/supabase'

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { billId, imageUrl, currency } = await req.json()
  if (!billId || !imageUrl) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  const cur = typeof currency === 'string' && currency.trim() ? currency.trim().toUpperCase() : 'IDR'

  try {
    // Fetch image and convert to base64
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) {
      console.error('Failed to fetch image:', imgRes.status, await imgRes.text())
      return NextResponse.json({ error: 'Gagal mengambil gambar struk', items: [], total: null, title: null }, { status: 500 })
    }

    const mimeType = imgRes.headers.get('content-type') ?? 'image/jpeg'
    if (!mimeType.startsWith('image/')) {
      console.error('Fetched content is not an image, got:', mimeType)
      return NextResponse.json({ error: 'File bukan gambar yang valid. Pastikan bucket storage sudah public.', items: [], total: null, title: null }, { status: 500 })
    }

    const imgBuffer = await imgRes.arrayBuffer()
    const base64 = Buffer.from(imgBuffer).toString('base64')

    const prompt = `Kamu adalah AI yang mengekstrak data dari foto bill apapun bentuknya: struk belanja/restoran, invoice, tagihan listrik/air/internet/pulsa, bill langganan, nota, atau tagihan lainnya.
Foto bisa saja miring, sedikit blur, kualitas rendah, atau kertas thermal yang pudar — tetap lakukan yang terbaik untuk membaca semua teks dan angka yang ada.
Mata uang pada bill ini adalah ${cur}.
Analisis gambar ini dan ekstrak rincian biayanya.
Kembalikan HANYA JSON valid dengan format berikut, tidak ada teks lain, tidak ada markdown code block:

{
  "title": "Nama toko/penyedia/perusahaan jika terlihat, atau null",
  "total": total_angka_numerik_atau_null,
  "items": [
    { "name": "Nama item/biaya", "price": harga_satuan_numerik, "quantity": jumlah_integer }
  ]
}

Aturan:
- Angka harga dikembalikan tanpa simbol mata uang, hanya angka murni (mis. jika mata uang IDR dan tertulis "40.600" itu berarti 40600; jika mata uang USD dan tertulis "40.60" itu berarti 40.6). Sesuaikan pembacaan pemisah ribuan/desimal dengan konvensi mata uang ${cur}. Jangan lakukan konversi ke mata uang lain
- Jika bill berupa daftar item/produk (struk belanja, restoran, invoice dengan line items), ekstrak tiap item beserta harga dan quantity-nya
- Jika bill TIDAK punya rincian item (misal tagihan listrik, internet, langganan, atau nota dengan satu jumlah saja), buat satu item mewakili biaya tersebut (misal name: "Tagihan Listrik") dengan price = total dan quantity = 1
- Jika ada diskon, kurangi langsung dari item terkait atau buat item terpisah dengan harga negatif
- Jika quantity tidak terlihat, asumsikan 1
- Gunakan bahasa Indonesia untuk nama item jika memungkinkan
- Jika gambar sama sekali bukan bill/struk/tagihan/invoice (misal foto random), baru kembalikan: {"title": null, "total": null, "items": []}`

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    // One attempt at the Gemini API, with its own retry for transient
    // 503/429 (model overloaded / rate limited) since those clear up
    // within a second or two on Google's end
    const callGeminiOnce = async (temperature: number) => {
      const MAX_TRANSIENT_RETRIES = 2
      for (let attempt = 0; attempt <= MAX_TRANSIENT_RETRIES; attempt++) {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
                temperature,
                responseMimeType: 'application/json',
                maxOutputTokens: 8192,
              },
            }),
          }
        )

        if (!geminiRes.ok) {
          const errText = await geminiRes.text()
          console.error('Gemini API error:', geminiRes.status, errText)
          if ((geminiRes.status === 503 || geminiRes.status === 429) && attempt < MAX_TRANSIENT_RETRIES) {
            await sleep(700 * (attempt + 1))
            continue
          }
          return {
            error: geminiRes.status === 503 || geminiRes.status === 429
              ? 'Server AI lagi sibuk banget, coba beberapa saat lagi ya.'
              : 'Gagal menghubungi AI scanner, coba lagi.'
          } as const
        }

        const geminiData = await geminiRes.json()
        const candidate = geminiData.candidates?.[0]
        const text = candidate?.content?.parts?.[0]?.text ?? '{}'

        if (candidate?.finishReason === 'MAX_TOKENS') {
          console.error('Gemini response truncated (MAX_TOKENS)')
          return { error: 'Struk terlalu panjang untuk dibaca sekaligus, coba foto sebagian atau tambah manual.' } as const
        }

        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/)
          const parsed: ScannedReceipt = jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [], total: null, title: null }
          return { parsed } as const
        } catch (parseErr) {
          console.error('Failed to parse Gemini JSON:', parseErr, 'raw text:', text)
          return { error: 'Gagal membaca hasil scan, coba foto ulang dengan pencahayaan lebih baik.' } as const
        }
      }
      // Unreachable, satisfies TS
      return { error: 'Gagal menghubungi AI scanner, coba lagi.' } as const
    }

    // On top of the transient-error retry above, also retry once more if
    // the model came back with a genuinely empty read — noisy/glare-y
    // thermal receipts are flaky, and a second pass at temperature 0
    // recovers a good chunk of those misses
    const isEmpty = (r: ScannedReceipt) => !r.items?.length && r.total === null && r.title === null

    let result = await callGeminiOnce(0.1)
    if (result.parsed && isEmpty(result.parsed)) {
      result = await callGeminiOnce(0)
    }

    if (result.error) {
      return NextResponse.json({ error: result.error, items: [], total: null, title: null }, { status: 500 })
    }

    // Update bill receipt_url
    await supabase.from('bills').update({ receipt_url: imageUrl }).eq('id', billId)

    return NextResponse.json(result.parsed)
  } catch (err) {
    console.error('Vision scan error:', err)
    return NextResponse.json({ error: 'Scan gagal, coba lagi.', items: [], total: null, title: null }, { status: 500 })
  }
}