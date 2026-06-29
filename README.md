# 💸 VAULT + 🧾 SLICE — Portfolio Monorepo

Dua web app keren dalam satu monorepo:
- **VAULT** — Money Manager bergaya dark luxury fintech
- **SLICE** — Split Bill dengan AI scan struk (Claude Vision)

---

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Google OAuth |
| Storage | Supabase Storage |
| AI | Claude Vision API |
| Deploy | Vercel |

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Setup Supabase
1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** dan jalankan file `packages/supabase/schema.sql`
3. Pergi ke **Authentication → Providers → Google**
4. Enable Google OAuth (butuh Google Cloud Console credentials)
5. Set Callback URL: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

### 3. Setup environment variables

Copy `.env.example` ke masing-masing app:
```bash
cp .env.example apps/vault/.env.local
cp .env.example apps/slice/.env.local
```

Isi nilai yang benar di kedua file.

### 4. Run development

```bash
# Jalankan VAULT (port 3000)
npm run vault

# Jalankan SLICE (port 3001)
npm run slice

# Jalankan keduanya sekaligus
npm run dev
```

---

## 📁 Struktur Project

```
portfolio/
├── apps/
│   ├── vault/                    # 💸 Money Manager
│   │   ├── src/app/
│   │   │   ├── login/            # Login page
│   │   │   ├── dashboard/        # Main app
│   │   │   │   ├── page.tsx      # Dashboard
│   │   │   │   ├── transactions/ # Transaction list
│   │   │   │   ├── budget/       # Budget manager
│   │   │   │   └── analytics/    # Charts & reports
│   │   │   └── api/              # API routes
│   │   └── src/components/
│   │
│   └── slice/                    # 🧾 Split Bill
│       ├── src/app/
│       │   ├── login/            # Login page
│       │   ├── bills/            # Bills list
│       │   │   ├── [id]/         # Bill detail + split
│       │   │   └── history/      # Settled bills
│       │   └── api/bills/
│       │       ├── route.ts      # CRUD
│       │       └── scan-receipt/ # Claude Vision AI
│       └── src/components/
│
└── packages/
    └── supabase/
        ├── src/types.ts          # Shared DB types
        ├── src/client.ts         # Supabase client factory
        └── schema.sql            # Database schema
```

---

## 🌟 Features

### VAULT — Money Manager
- ✅ Login dengan Google OAuth
- ✅ Dashboard dengan summary bulan ini
- ✅ Tambah transaksi (income/expense)
- ✅ Kategori dengan icon & warna
- ✅ Budget per kategori dengan gauge
- ✅ Analitik: donut chart, trend 6 bulan, top spending
- ✅ Filter transaksi per bulan & tipe
- ✅ Dark mode by default
- ✅ Mobile responsive

### SLICE — Split Bill
- ✅ Login dengan Google OAuth
- ✅ Buat tagihan dengan nama & anggota
- ✅ Upload foto struk → Claude Vision AI scan otomatis
- ✅ Tambah item manual
- ✅ Assign item ke anggota (toggle)
- ✅ Split otomatis per item
- ✅ Kalkulasi siapa bayar ke siapa (minimal transactions)
- ✅ Share via WhatsApp
- ✅ History tagihan yang sudah lunas
- ✅ Mobile responsive (receipt aesthetic)

---

## 🚢 Deploy ke Vercel

```bash
# Deploy VAULT
cd apps/vault
vercel --prod

# Deploy SLICE
cd apps/slice
vercel --prod
```

Set environment variables di Vercel dashboard untuk masing-masing project.

---

## 🔑 API Keys yang Dibutuhkan

| Key | Didapat dari | Dipakai oleh |
|-----|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project Settings | Keduanya |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project Settings | Keduanya |
| `ANTHROPIC_API_KEY` | console.anthropic.com | SLICE only |
