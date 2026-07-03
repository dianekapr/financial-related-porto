import { createServerSupabaseClient } from '../../../../../../../packages/supabase/src/server'
import { NextResponse } from 'next/server'
import type { ScannedReceipt } from '@portfolio/supabase'

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { billId, imageUrl, currency } = await req.json()
  if (!billId || !imageUrl) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  // Currency is chosen once at bill creation and lives on the bill row —
  // fall back to a client-supplied value only for bills created before the
  // `currency` column migration ran
  const { data: billRow } = await supabase.from('bills').select('currency').eq('id', billId).single()
  const cur = billRow?.currency
    ?? (typeof currency === 'string' && currency.trim() ? currency.trim().toUpperCase() : 'IDR')

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

    // The model's only job is to READ the numbers exactly as printed — no
    // arithmetic. Discount/tax/tip reconciliation happens deterministically
    // below (reconcileScan), which is far more reliable than asking an LLM
    // to do proportional math and also guarantees the DB's price>=0 constraint
    const prompt = `Kamu adalah AI yang MEMBACA foto bill apapun bentuknya: struk belanja/restoran, invoice, tagihan listrik/air/internet/pulsa, bill langganan, nota, atau tagihan lainnya.
Foto bisa saja miring, sedikit blur, kualitas rendah, atau kertas thermal yang pudar — tetap lakukan yang terbaik untuk membaca semua teks dan angka yang ada.
Mata uang pada bill ini adalah ${cur}.

Tugasmu HANYA membaca angka persis seperti tertulis di bill. JANGAN melakukan pengurangan/penjumlahan/perhitungan sendiri — sistem lain yang akan mengolah angkanya.

Kembalikan HANYA JSON valid dengan format berikut, tidak ada teks lain, tidak ada markdown code block:

{
  "title": "Nama toko/penyedia/perusahaan jika terlihat, atau null",
  "items": [
    { "name": "Nama item/produk", "price": harga_per_unit_seperti_tertulis, "quantity": jumlah_integer }
  ],
  "discount": total_potongan_harga_positif_jika_ada_baris_diskon_atau_null,
  "tax": jumlah_pajak_ppn_positif_jika_ada_baris_terpisah_atau_null,
  "tip": jumlah_service_charge_tip_positif_jika_ada_baris_terpisah_atau_null,
  "total": angka_final_yang_dibayar_seperti_tertulis_atau_null
}

Aturan:
- Baca angka apa adanya sesuai konvensi pemisah ribuan/desimal mata uang ${cur} (mis. untuk IDR, "40.600" berarti 40600; untuk USD, "40.60" berarti 40.6)
- items HARUS lengkap — cantumkan SEMUA baris produk/item yang tertulis di bill, jangan ada yang terlewat walau ada baris diskon/pajak/tip terpisah
- "discount"/"tax"/"tip" HANYA diisi kalau ada baris terpisah eksplisit untuk itu di bill (mis. "Diskon", "PPN", "Pajak", "Service Charge", "Tip"). Isi dengan angka POSITIF (jumlahnya), JANGAN pernah negatif
- Jika bill TIDAK punya rincian item sama sekali (misal tagihan listrik/internet/langganan yang cuma ada satu jumlah), buat SATU item mewakili biaya itu dengan price = total, quantity = 1
- Jika quantity tidak terlihat, asumsikan 1
- Gunakan bahasa Indonesia untuk nama item jika memungkinkan
- Jika gambar sama sekali bukan bill/struk/tagihan/invoice (misal foto random), kembalikan: {"title": null, "items": [], "discount": null, "tax": null, "tip": null, "total": null}`

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